import { z } from "zod";

// ─── Talk to Kinnit: request/response contract ────────────────────────────────
// Shared by the server function (api/parse-talk.ts) and the browser client.

export const MAX_TRANSCRIPT_CHARS = 4000;

export interface TalkContextPerson {
  name: string;
  relationship?: string;
  /** "MM-DD" when on file */
  birthday?: string;
}

export interface TalkContextEntry {
  id: string;
  title: string;
  /** YYYY-MM-DD when known */
  date?: string;
}

export interface ParseTalkRequest {
  transcript: string;
  /** YYYY-MM-DD in the user's time zone */
  today: string;
  weekday: string;
  people: TalkContextPerson[];
  occasions: TalkContextEntry[];
  plans: TalkContextEntry[];
}

// ─── Model output schema (structured outputs) ─────────────────────────────────

const Level = z.enum(["high", "low"]);

export const TalkPersonSchema = z.object({
  name: z.string().describe("Name as it appears in People when matched, otherwise as spoken"),
  heardAs: z
    .string()
    .nullable()
    .describe("The transcribed word when it was corrected to a People name (e.g. \"yeah\" → Leah); null when it matched exactly"),
  inPeople: z.boolean().describe("True only when this name is in the user's People list"),
  role: z.enum(["with", "for", "about"]).describe("with = doing it together; for = the person it is for; about = the subject"),
});

export const TalkItemSchema = z.object({
  type: z.enum(["reminder", "plan", "occasion", "note"]),
  title: z.string().describe("Short, human title (2–6 words). Never a copy of the spoken words."),
  detail: z.string().nullable().describe("Optional extra line, e.g. \"Ask about her dog\""),
  date: z.string().nullable().describe("YYYY-MM-DD resolved against today, or null when no date was said"),
  recurrence: z.enum(["yearly"]).nullable().describe("yearly for birthdays and anniversaries, otherwise null"),
  people: z.array(TalkPersonSchema),
  linkedTo: z
    .object({
      kind: z.enum(["occasion", "plan"]),
      id: z.string().nullable().describe("ID of an existing occasion/plan, or null when it is another item in this list"),
      title: z.string(),
    })
    .nullable(),
  invite: z.boolean().describe("Plans only: true when the user said \"me and [name]\" or \"we\""),
  confidence: z.object({ type: Level, date: Level, people: Level }),
  missing: z.array(z.enum(["date", "person", "title"])),
});

export const TalkResultSchema = z.object({
  items: z.array(TalkItemSchema),
});

export type TalkPerson = z.infer<typeof TalkPersonSchema>;
export type TalkItem = z.infer<typeof TalkItemSchema>;
export type TalkResult = z.infer<typeof TalkResultSchema>;

export type ParseTalkResponse =
  | { ok: true; items: TalkItem[] }
  | { ok: false; error: string };
