import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  MAX_TRANSCRIPT_CHARS,
  TalkResultSchema,
  type ParseTalkRequest,
  type ParseTalkResponse,
  type TalkItem,
} from "../shared/talk";

// ─── Talk to Kinnit: transcript → structured items (server only) ─────────────

export const TALK_MODEL = "claude-haiku-5-5";

const SYSTEM_PROMPT = `You turn what a Kinnit user said out loud into items for their personal relationship app. Kinnit helps people keep track of the people they care about. The transcript came from speech-to-text, so expect filler words, run-on sentences, and misheard names.

Return every distinct thing the user wants to track as its own item. One intent per item: a message with two requests produces two items. Ignore filler and small talk.

Item types:
- reminder: something the user should do or remember to do. The title is the action ("Call Leah back"). Anything extra goes in detail ("Ask about her dog"). "Make a note that I should remember to call someone" is a reminder, not a note.
- note: a fact about a person ("Allergic to peanuts"), kept privately on that person's profile. The person goes in people with role "about".
- plan: something the user is organizing, usually with other people ("Chris's birthday", "Hiking next weekend").
- occasion: a date that matters on its own, like a birthday, anniversary, or appointment ("Sylvia's appointment").

Titles are short and human, 2–6 words, in the style of a calendar entry. Never copy the spoken sentence into the title.

Dates: resolve relative dates against today's date and weekday ("Thursday" is the next Thursday on or after today; "next weekend" is the Saturday of the following weekend; "October 22nd" is the next October 22). Use YYYY-MM-DD. If no date was said for an item, date is null and "date" goes in missing. Never invent a date.

People: match names against the user's People list and use the name exactly as it appears there. Speech-to-text mishears names, so a word that does not fit the sentence as spoken may be a People name that does fit (for example "me and yeah need to plan" most likely means "me and Leah" when Leah is in People). When you correct a word like that, put the transcribed word in heardAs and set confidence.people to "low". If a name is not in People, keep it as spoken with inPeople false.

Plans: "me and [name]" or "we" means the plan is with that person: add them with role "with" and set invite true. The person a plan is for gets role "for". If a plan is for someone's birthday or anniversary and that occasion is in the user's existing occasions, set linkedTo to it with its id. If it is not, also return an occasion item for the birthday (recurrence "yearly", same date) and set the plan's linkedTo to that new occasion with id null and the same title.

Reminders that follow up on an occasion in this message or in existing occasions set linkedTo to it.

Do not invent details. Include only what was said or can be safely inferred, and mark uncertain fields with confidence "low". If nothing in the transcript is worth tracking, return an empty items list.`;

function buildUserMessage(req: ParseTalkRequest): string {
  const context = {
    today: req.today,
    weekday: req.weekday,
    people: req.people,
    existingOccasions: req.occasions,
    existingPlans: req.plans,
  };
  return `<context>
${JSON.stringify(context, null, 2)}
</context>

<transcript>
${req.transcript}
</transcript>`;
}

// ─── Request validation ───────────────────────────────────────────────────────

const EntrySchema = z.object({ id: z.string().max(100), title: z.string().max(200), date: z.string().max(10).optional() });

export const ParseTalkRequestSchema = z.object({
  transcript: z.string().min(1),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekday: z.string().max(12),
  people: z
    .array(z.object({ name: z.string().max(100), relationship: z.string().max(50).optional(), birthday: z.string().max(5).optional() }))
    .max(500),
  occasions: z.array(EntrySchema).max(500),
  plans: z.array(EntrySchema).max(500),
});

// ─── Output checks beyond the schema ─────────────────────────────────────────

function isRealDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

/** Applies the rules the UI relies on, whatever the model returned. */
export function sanitizeItems(items: TalkItem[], req: ParseTalkRequest): TalkItem[] {
  const peopleNames = new Map(req.people.map((p) => [p.name.toLowerCase(), p.name]));
  const firstNames = new Map(req.people.map((p) => [p.name.split(" ")[0].toLowerCase(), p.name]));
  const knownIds = new Set([...req.occasions, ...req.plans].map((e) => e.id));
  const transcript = norm(req.transcript);

  return items.flatMap((raw) => {
    const title = raw.title.trim();
    // Never create an item from raw transcript text.
    if (!title || title.length > 80 || (norm(title).length > 30 && transcript.includes(norm(title)))) return [];

    const date = raw.date && isRealDate(raw.date) ? raw.date : null;

    const people = raw.people.map((p) => {
      const match = peopleNames.get(p.name.toLowerCase()) ?? firstNames.get(p.name.toLowerCase());
      return { ...p, name: match ?? p.name, inPeople: Boolean(match) };
    });

    const linkedTo =
      raw.linkedTo && raw.linkedTo.id && !knownIds.has(raw.linkedTo.id)
        ? { ...raw.linkedTo, id: null }
        : raw.linkedTo;

    const missing = new Set(raw.missing);
    if (!date && (raw.type === "reminder" || raw.type === "plan" || raw.type === "occasion")) missing.add("date");
    if (date) missing.delete("date");
    if (raw.type === "note" && !people.length) missing.add("person");

    const invite = raw.type === "plan" && raw.invite && people.some((p) => p.role === "with" && p.inPeople);

    return [{ ...raw, title, date, people, linkedTo, invite, missing: [...missing] }];
  });
}

// ─── Model call ───────────────────────────────────────────────────────────────

export async function parseTalk(req: ParseTalkRequest, client: Anthropic): Promise<ParseTalkResponse> {
  if (req.transcript.length > MAX_TRANSCRIPT_CHARS) {
    return { ok: false, error: "transcript_too_long" };
  }

  const response = await client.messages.parse({
    model: TALK_MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: zodOutputFormat(TalkResultSchema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(req) }],
  });

  if (response.stop_reason === "refusal") return { ok: false, error: "refused" };
  if (response.stop_reason === "max_tokens") return { ok: false, error: "truncated" };

  const parsed = TalkResultSchema.safeParse(response.parsed_output);
  if (!parsed.success) return { ok: false, error: "invalid_output" };

  return { ok: true, items: sanitizeItems(parsed.data.items, req) };
}
