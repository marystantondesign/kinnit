import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  MAX_TRANSCRIPT_CHARS,
  SurveyParseResultSchema,
  type HeardAnswer,
  type ParseSurveyRequest,
  type ParseSurveyResponse,
} from "../shared/surveyTalk";
import { TALK_MODEL } from "./parseTalk";

// ─── Survey talk: transcript → answers in the survey's shape (server only) ───

const SYSTEM_PROMPT = `You turn what a Kinnit user said out loud into answers for one of their About Me surveys. The people they love read these answers to celebrate and care for them well. The transcript came from speech-to-text, so expect filler words, run-on sentences, and misheard words.

You get the survey's sections. Return each distinct thing the person said as its own answer in the section it belongs to:
- chips sections (kind "pick"): one answer per thing they like or dislike. Use the listed option's exact spelling when it matches ("japanese food" → "Japanese"); otherwise a short name in Title case ("Chicken teriyaki"). sentiment is love for strong enthusiasm ("love", "favorite", "especially", "obsessed"), like for milder liking, avoid for dislikes or "please don't". The sentiment must be one the section takes; a section with a single mode always uses that mode. Specific dishes and places go in the dishes section rather than cuisines.
- allergies sections (kind "allergy"): the allergen, using the listed spelling when it matches ("peanut" → "Peanuts"), and severity slight, moderate, or severe only when they said how bad it is ("mild" → slight, "serious" or "deadly" → severe).
- dates sections (kind "date"): a short label ("Birthday", "Wedding anniversary"), the date as MM-DD (null if the day moves each year or was not said), who it involves ("Yours" for the user's own, "Yours and Michael's" for a shared one when the partner is named or is the user's partner in People, "Emma's" for someone else's), and a note for how they like it marked ("I don't like a big fuss" → "Prefers birthdays low-key"). Put each date in the matching section: birthdays, anniversaries, holidays, hard days (losses, difficult anniversaries), or cultural and religious days.
- fields sections (kind "field"): field is the field name, label is the value ("size 8.5 shoes" → field "Shoes", label "8.5").

When the person was answering the focus section and it is unclear where an answer goes, use the focus section. Use only section ids from the list. Do not invent answers or details; leave a field null when it was not said. If nothing fits the survey, return an empty list.`;

function buildUserMessage(req: ParseSurveyRequest): string {
  const context = {
    survey: req.surveyTitle,
    focusSection: req.focusSection,
    sections: req.sections,
    people: req.people,
  };
  return `<context>
${JSON.stringify(context, null, 2)}
</context>

<transcript>
${req.transcript}
</transcript>`;
}

// ─── Request validation ───────────────────────────────────────────────────────

const Mode = z.enum(["love", "like", "avoid"]);

export const ParseSurveyRequestSchema = z.object({
  surveyId: z.string().max(60),
  surveyTitle: z.string().max(100),
  transcript: z.string().min(1),
  focusSection: z.string().max(60).nullable(),
  sections: z
    .array(
      z.object({
        id: z.string().max(60),
        title: z.string().max(100),
        kind: z.enum(["chips", "allergies", "dates", "fields"]),
        modes: z.array(Mode).max(3).optional(),
        options: z.array(z.string().max(60)).max(80).optional(),
        fields: z.array(z.string().max(40)).max(20).optional(),
      }),
    )
    .min(1)
    .max(20),
  people: z.array(z.object({ name: z.string().max(100), relationship: z.string().max(50).optional() })).max(500),
});

// ─── Output checks beyond the schema ─────────────────────────────────────────

const KIND_FOR: Record<string, HeardAnswer["kind"]> = { chips: "pick", allergies: "allergy", dates: "date", fields: "field" };

function isMonthDay(s: string): boolean {
  const m = /^(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const d = new Date(Date.UTC(2000, month - 1, day));
  return d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

/** Keeps answers inside the survey's shape, whatever the model returned. */
export function sanitizeAnswers(answers: HeardAnswer[], req: ParseSurveyRequest): HeardAnswer[] {
  const sections = new Map(req.sections.map((s) => [s.id, s]));
  return answers.flatMap((raw): HeardAnswer[] => {
    const section = sections.get(raw.sectionId);
    const label = raw.label.trim();
    if (!section || !label || label.length > 80) return [];
    const kind = KIND_FOR[section.kind];
    const known = [...(section.options ?? []), ...(section.fields ?? [])];
    const spelled = known.find((o) => o.toLowerCase() === label.toLowerCase()) ?? label;

    if (kind === "pick") {
      const modes = section.modes ?? ["love", "like", "avoid"];
      const sentiment = raw.sentiment && modes.includes(raw.sentiment) ? raw.sentiment : modes.length === 1 ? modes[0] : "like";
      return [{ ...raw, kind, label: spelled, sentiment, severity: null, date: null, who: null, note: null, field: null }];
    }
    if (kind === "allergy") {
      return [{ ...raw, kind, label: spelled, sentiment: null, date: null, who: null, note: null, field: null }];
    }
    if (kind === "date") {
      const date = raw.date && isMonthDay(raw.date) ? raw.date : null;
      return [{ ...raw, kind, label, sentiment: null, severity: null, date, field: null }];
    }
    const field = section.fields?.find((f) => f.toLowerCase() === (raw.field ?? "").toLowerCase());
    if (!field) return [];
    return [{ ...raw, kind, label, field, sentiment: null, severity: null, date: null, who: null, note: null }];
  });
}

// ─── Model call ───────────────────────────────────────────────────────────────

export async function parseSurvey(req: ParseSurveyRequest, client: Anthropic): Promise<ParseSurveyResponse> {
  if (req.transcript.length > MAX_TRANSCRIPT_CHARS) return { ok: false, error: "transcript_too_long" };

  const response = await client.messages.parse({
    model: TALK_MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: zodOutputFormat(SurveyParseResultSchema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(req) }],
  });

  if (response.stop_reason === "refusal") return { ok: false, error: "refused" };
  if (response.stop_reason === "max_tokens") return { ok: false, error: "truncated" };

  const parsed = SurveyParseResultSchema.safeParse(response.parsed_output);
  if (!parsed.success) return { ok: false, error: "invalid_output" };

  return { ok: true, answers: sanitizeAnswers(parsed.data.answers, req) };
}
