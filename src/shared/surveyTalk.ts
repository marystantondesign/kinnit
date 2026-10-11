import { z } from "zod";
import { MAX_TRANSCRIPT_CHARS } from "./talk";

// ─── Talk to Kinnit inside a survey: request/response contract ───────────────
// The survey's section schema travels with the transcript so answers come back
// in the survey's shape. Shared by api/parse-survey.ts and the browser client.

export { MAX_TRANSCRIPT_CHARS };

export interface SurveyTalkSection {
  id: string;
  title: string;
  kind: "chips" | "allergies" | "dates" | "fields";
  /** chips: which of love / like / avoid this section takes */
  modes?: ("love" | "like" | "avoid")[];
  /** chips and allergies: the listed options (answers may go beyond them) */
  options?: string[];
  /** fields: the field names */
  fields?: string[];
}

export interface ParseSurveyRequest {
  surveyId: string;
  surveyTitle: string;
  transcript: string;
  /** The area the person tapped, if any */
  focusSection: string | null;
  sections: SurveyTalkSection[];
  /** For "who it involves" on dates */
  people: { name: string; relationship?: string }[];
}

export const HeardAnswerSchema = z.object({
  sectionId: z.string().describe("id of the section this answer belongs to"),
  kind: z.enum(["pick", "allergy", "date", "field"]).describe("pick for chips sections, allergy, date, or field"),
  label: z
    .string()
    .describe("pick: the option, using the listed spelling when it matches; allergy: the allergen; date: a short label like \"Birthday\"; field: the value, e.g. \"8.5\""),
  sentiment: z.enum(["love", "like", "avoid"]).nullable().describe("pick only: must be one of the section's modes"),
  severity: z.enum(["slight", "moderate", "severe"]).nullable().describe("allergy only, when said"),
  date: z.string().nullable().describe("date only: MM-DD, or null when the day moves each year or was not said"),
  who: z.string().nullable().describe("date only: who it involves, e.g. \"Yours\", \"Yours and Michael's\", \"Emma's\""),
  note: z.string().nullable().describe("date only: how they like it marked, in a few words, e.g. \"Prefers birthdays low-key\""),
  field: z.string().nullable().describe("field only: which field, e.g. \"Shoes\""),
});

export const SurveyParseResultSchema = z.object({ answers: z.array(HeardAnswerSchema) });

export type HeardAnswer = z.infer<typeof HeardAnswerSchema>;

export type ParseSurveyResponse = { ok: true; answers: HeardAnswer[] } | { ok: false; error: string };
