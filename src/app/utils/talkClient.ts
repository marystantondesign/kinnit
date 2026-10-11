import { PEOPLE_DIRECTORY } from "./peopleDirectory";
import { getAllCreatedOccasions } from "./occasionStorage";
import { getAllPlans } from "./planStorage";
import {
  MAX_TRANSCRIPT_CHARS,
  type ParseTalkRequest,
  type ParseTalkResponse,
  type TalkContextEntry,
  type TalkItem,
} from "../../shared/talk";

// ─── Talk to Kinnit: browser client for POST /api/parse-talk ─────────────────

export interface DraftItem extends TalkItem {
  /** Stable key so edits/unchecks survive re-reading the conversation */
  key: string;
}

export type ParseOutcome =
  | { ok: true; items: DraftItem[] }
  | { ok: false; error: string };

// Demo occasions that exist as pages in the app (OccasionDetail mock data).
const DEMO_OCCASIONS: TalkContextEntry[] = [
  { id: "1", title: "Sarah's Birthday", date: "2026-12-14" },
  { id: "2", title: "Emma's Surgery", date: "2026-06-02" },
  { id: "3", title: "Grandmother Memorial Anniversary" },
  { id: "4", title: "Alex and Jordan Anniversary" },
  { id: "5", title: "Group Trip to Mexico" },
];

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

function buildRequest(transcript: string, now: Date): ParseTalkRequest {
  const occasions: TalkContextEntry[] = [
    ...DEMO_OCCASIONS,
    ...getAllCreatedOccasions().map((o) => ({
      id: o.id,
      title: o.title,
      date: o.timing.singleDate ?? o.timing.startDate,
    })),
  ];
  const plans: TalkContextEntry[] = getAllPlans().map((p) => ({
    id: p.id,
    title: p.title,
    date: p.timing.singleDate ?? p.timing.startDate,
  }));

  return {
    transcript,
    today: toISODate(now),
    weekday: now.toLocaleDateString("en-US", { weekday: "long" }),
    people: PEOPLE_DIRECTORY.map(({ name, relationship, birthday }) => ({ name, relationship, birthday })),
    occasions,
    plans,
  };
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export async function parseTranscript(
  messages: string[],
  signal?: AbortSignal,
  now: Date = new Date(),
): Promise<ParseOutcome> {
  const transcript = messages.join("\n").trim();
  if (!transcript) return { ok: false, error: "empty" };
  if (transcript.length > MAX_TRANSCRIPT_CHARS) return { ok: false, error: "transcript_too_long" };

  let data: ParseTalkResponse;
  try {
    const res = await fetch("/api/parse-talk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequest(transcript, now)),
      signal,
    });
    data = (await res.json()) as ParseTalkResponse;
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    return { ok: false, error: "network" };
  }

  if (!data?.ok || !Array.isArray(data.items)) return { ok: false, error: data?.ok === false ? data.error : "invalid" };

  const seen = new Map<string, number>();
  const items = data.items.map((item) => {
    const base = `${item.type}:${norm(item.title)}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return { ...item, key: n ? `${base}#${n}` : base };
  });
  return { ok: true, items };
}
