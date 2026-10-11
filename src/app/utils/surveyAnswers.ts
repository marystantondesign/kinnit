import { useSyncExternalStore } from "react";
import { getSurvey, type Sentiment, type Severity, type SurveySection } from "../config/surveys";
import { saveSurveyResponse } from "./surveyStorage";

// Answers for the redesigned surveys, saved to localStorage on every change.
// Tapping and talking both write here, so switching routes never loses answers.

export type SurveyStatus = "not-started" | "in-progress" | "completed";

export interface DateEntry {
  id: string;
  /** "MM-DD", or null for days that move (Thanksgiving, Diwali) */
  date: string | null;
  label: string;
  /** Who it involves: "Yours", "Yours and Michael's" */
  who: string;
  note: string;
}

export interface Attachment {
  id: string;
  kind: "link" | "photo";
  /** URL for links; a data URL for photos */
  src: string;
  sectionId: string;
  addedAt: string;
}

export interface SectionAnswer {
  /** Chip label → mode it was tapped in */
  picks?: Record<string, Sentiment>;
  /** Chips the person added with "Add another" (kept visible after clearing) */
  custom?: string[];
  /** Allergen → severity (null until chosen) */
  allergies?: Record<string, Severity | null>;
  dates?: DateEntry[];
  fields?: Record<string, string>;
  note?: string;
}

export interface SurveyState {
  status: SurveyStatus;
  sections: Record<string, SectionAnswer>;
  attachments: Attachment[];
  updatedAt?: string;
  completedAt?: string;
  /** Section the tap route was last on, so Continue picks up there */
  lastSection?: string;
}

const EMPTY: SurveyState = { status: "not-started", sections: {}, attachments: [] };
const key = (id: string) => `kinnit.survey.${id}`;

const cache = new Map<string, SurveyState>();
const listeners = new Set<() => void>();

function read(id: string): SurveyState {
  const hit = cache.get(id);
  if (hit) return hit;
  let state = EMPTY;
  try {
    const raw = localStorage.getItem(key(id));
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as SurveyState) };
  } catch {}
  cache.set(id, state);
  return state;
}

/** Applies a change and saves it. Returns false when the browser refused to store it. */
export function updateSurvey(id: string, fn: (s: SurveyState) => SurveyState): boolean {
  const prev = read(id);
  const next = fn(prev);
  if (next === prev) return true;
  const stamped: SurveyState = {
    ...next,
    status: next.status === "not-started" ? "in-progress" : next.status,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(key(id), JSON.stringify(stamped));
  } catch {
    return false;
  }
  cache.set(id, stamped);
  listeners.forEach((l) => l());
  return true;
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith("kinnit.survey.")) {
      cache.clear();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSurveyState(id: string): SurveyState {
  return useSyncExternalStore(subscribe, () => read(id));
}

export function getSurveyState(id: string): SurveyState {
  return read(id);
}

// ─── Section edits ────────────────────────────────────────────────────────────

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function patchSection(id: string, sectionId: string, fn: (a: SectionAnswer) => SectionAnswer) {
  return updateSurvey(id, (s) => ({ ...s, sections: { ...s.sections, [sectionId]: fn(s.sections[sectionId] ?? {}) } }));
}

/** Tap a chip in a mode. Tapping it again in the same mode clears it. */
export function tapChip(id: string, sectionId: string, label: string, mode: Sentiment) {
  patchSection(id, sectionId, (a) => {
    const picks = { ...(a.picks ?? {}) };
    if (picks[label] === mode) delete picks[label];
    else picks[label] = mode;
    return { ...a, picks };
  });
}

export function setPick(id: string, sectionId: string, label: string, mode: Sentiment) {
  patchSection(id, sectionId, (a) => ({ ...a, picks: { ...(a.picks ?? {}), [label]: mode } }));
}

export function addCustomChip(id: string, sectionId: string, label: string, mode: Sentiment, known: string[]) {
  const clean = label.trim();
  if (!clean) return;
  patchSection(id, sectionId, (a) => {
    const existing = [...known, ...(a.custom ?? [])].find((c) => c.toLowerCase() === clean.toLowerCase());
    const name = existing ?? clean;
    return {
      ...a,
      custom: existing ? a.custom : [...(a.custom ?? []), name],
      picks: { ...(a.picks ?? {}), [name]: mode },
    };
  });
}

export function toggleAllergy(id: string, sectionId: string, allergen: string) {
  patchSection(id, sectionId, (a) => {
    const allergies = { ...(a.allergies ?? {}) };
    if (allergen in allergies) delete allergies[allergen];
    else allergies[allergen] = null;
    return { ...a, allergies };
  });
}

export function addAllergy(id: string, sectionId: string, allergen: string, severity: Severity | null, known: string[]) {
  const clean = allergen.trim();
  if (!clean) return;
  patchSection(id, sectionId, (a) => {
    const name = [...known, ...(a.custom ?? [])].find((c) => c.toLowerCase() === clean.toLowerCase()) ?? clean;
    const isKnown = known.some((k) => k === name);
    return {
      ...a,
      custom: isKnown || (a.custom ?? []).includes(name) ? a.custom : [...(a.custom ?? []), name],
      allergies: { ...(a.allergies ?? {}), [name]: severity ?? a.allergies?.[name] ?? null },
    };
  });
}

export function setSeverity(id: string, sectionId: string, allergen: string, severity: Severity) {
  patchSection(id, sectionId, (a) => ({ ...a, allergies: { ...(a.allergies ?? {}), [allergen]: severity } }));
}

export function addDate(id: string, sectionId: string, entry: Omit<DateEntry, "id">): string {
  const newId = uid();
  patchSection(id, sectionId, (a) => ({ ...a, dates: [...(a.dates ?? []), { ...entry, id: newId }] }));
  return newId;
}

export function updateDate(id: string, sectionId: string, entryId: string, patch: Partial<DateEntry>) {
  patchSection(id, sectionId, (a) => ({
    ...a,
    dates: (a.dates ?? []).map((d) => (d.id === entryId ? { ...d, ...patch } : d)),
  }));
}

export function removeDate(id: string, sectionId: string, entryId: string) {
  patchSection(id, sectionId, (a) => ({ ...a, dates: (a.dates ?? []).filter((d) => d.id !== entryId) }));
}

export function setField(id: string, sectionId: string, field: string, value: string) {
  patchSection(id, sectionId, (a) => ({ ...a, fields: { ...(a.fields ?? {}), [field]: value } }));
}

export function setNote(id: string, sectionId: string, note: string) {
  patchSection(id, sectionId, (a) => ({ ...a, note }));
}

export function addAttachment(id: string, sectionId: string, kind: Attachment["kind"], src: string): boolean {
  return updateSurvey(id, (s) => ({
    ...s,
    attachments: [...s.attachments, { id: uid(), kind, src, sectionId, addedAt: new Date().toISOString() }],
  }));
}

export function removeAttachment(id: string, attachmentId: string) {
  updateSurvey(id, (s) => ({ ...s, attachments: s.attachments.filter((a) => a.id !== attachmentId) }));
}

export function setLastSection(id: string, sectionId: string) {
  const s = read(id);
  if (s.lastSection === sectionId || s.status === "not-started") return;
  updateSurvey(id, (prev) => ({ ...prev, lastSection: sectionId }));
}

/** Marks the survey Completed; About Me and sharing read this. */
export function finishSurvey(id: string) {
  updateSurvey(id, (s) => ({ ...s, status: "completed", completedAt: new Date().toISOString() }));
  saveSurveyResponse(id, read(id).sections);
}

// ─── Reading answers ──────────────────────────────────────────────────────────

/** How many things the person has answered in a section. */
export function answerCount(section: SurveySection, a: SectionAnswer | undefined, attachments: Attachment[] = []): number {
  if (!a) return attachments.filter((x) => x.sectionId === section.id).length;
  const extras = (a.note?.trim() ? 1 : 0) + attachments.filter((x) => x.sectionId === section.id).length;
  switch (section.kind) {
    case "chips":
      return Object.keys(a.picks ?? {}).length + extras;
    case "allergies":
      return Object.keys(a.allergies ?? {}).length + extras;
    case "dates":
      return (a.dates ?? []).length + extras;
    case "fields":
      return Object.values(a.fields ?? {}).filter((v) => v.trim()).length + extras;
  }
}

export function surveyAnswerCount(id: string, state: SurveyState): number {
  const def = getSurvey(id);
  if (!def) return 0;
  return def.sections.reduce((n, sec) => n + answerCount(sec, state.sections[sec.id], state.attachments), 0);
}

/** "Mar 4" for "03-04"; "Date varies" for null. */
export function formatMonthDay(mmdd: string | null): string {
  if (!mmdd) return "Date varies";
  const [m, d] = mmdd.split("-").map(Number);
  return new Date(2000, m - 1, d).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}
