import { useEffect, useState, useSyncExternalStore } from "react";
import { reminderKind, type EntityKind } from "./entityAppearance";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActionItemBase {
  id: string;
  /** ISO date the item came in / is due */
  date: string;
}

export type ActionItem =
  | (ActionItemBase & { kind: "reminder"; title: string })
  | (ActionItemBase & { kind: "survey-request"; requesterName: string; topic: string; surveyId: string })
  | (ActionItemBase & { kind: "access-request"; requesterName?: string; surveyTitle: string; surveyId: string })
  | (ActionItemBase & { kind: "plan-invitation"; inviterName: string; planName: string; planId: string });

export interface ActivityEntry {
  id: string;
  appearance: EntityKind;
  text: string;
  /** ISO timestamp */
  at: string;
}

export type SnoozeOption = "later-today" | "tomorrow" | "next-week";

// ─── Demo data ────────────────────────────────────────────────────────────────

const SEED_ACTION_ITEMS: ActionItem[] = [
  { id: "ai-sylvia",  kind: "reminder",        date: "2026-10-12", title: "Ask Sylvia how her appointment went" },
  { id: "ai-sarah",   kind: "survey-request",  date: "2026-10-10", requesterName: "Sarah", topic: "food preferences", surveyId: "food-drink" },
  { id: "ai-michael", kind: "access-request",  date: "2026-10-09", requesterName: "Michael", surveyTitle: "Flowers / Plants / Objects", surveyId: "flowers-plants-objects" },
  { id: "ai-emily",   kind: "plan-invitation", date: "2026-10-08", inviterName: "Emily", planName: "Weekend crew", planId: "weekend-crew" },
];

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Seeded timeline, as offsets back from the first time the app loads. */
const SEED_ACTIVITY: { appearance: EntityKind; text: string; ago: number }[] = [
  { appearance: "plan",          text: "Created Hiking next weekend",        ago: 10 * MINUTE },
  { appearance: "occasion",      text: "Added Sylvia's appointment",         ago: 12 * MINUTE },
  { appearance: "private-note",  text: "Added a private note about Emily",   ago: DAY },
  { appearance: "reminder-call", text: "Completed Call Mom",                 ago: DAY + 2 * 60 * MINUTE },
  { appearance: "about-me",      text: "Updated your Gift Preferences",      ago: 2 * DAY },
];

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "kinnit_notifications";

interface StoredState {
  dismissed: string[];
  snoozedUntil: Record<string, string>;
  activity: ActivityEntry[];
}

function seedState(): StoredState {
  const now = Date.now();
  return {
    dismissed: [],
    snoozedUntil: {},
    activity: SEED_ACTIVITY.map((a, i) => ({
      id: `seed-${i}`,
      appearance: a.appearance,
      text: a.text,
      at: new Date(now - a.ago).toISOString(),
    })),
  };
}

function load(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredState;
  } catch {}
  const seeded = seedState();
  save(seeded);
  return seeded;
}

function save(next: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

let state: StoredState | null = null;
const listeners = new Set<() => void>();

function getState(): StoredState {
  if (!state) state = load();
  return state;
}

function update(fn: (s: StoredState) => StoredState) {
  state = fn(getState());
  save(state);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export function dismissActionItem(id: string) {
  update((s) => ({ ...s, dismissed: [...s.dismissed, id] }));
}

export function snoozeActionItem(id: string, option: SnoozeOption) {
  const until = new Date();
  if (option === "later-today") {
    until.setHours(until.getHours() + 3);
  } else {
    until.setDate(until.getDate() + (option === "tomorrow" ? 1 : 7));
    until.setHours(9, 0, 0, 0);
  }
  update((s) => ({ ...s, snoozedUntil: { ...s.snoozedUntil, [id]: until.toISOString() } }));
}

/** Record something the user did, so it shows at the top of the Timeline tab. */
export function logActivity(appearance: EntityKind, text: string) {
  const entry: ActivityEntry = {
    id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    appearance,
    text,
    at: new Date().toISOString(),
  };
  update((s) => ({ ...s, activity: [entry, ...s.activity] }));
}

export function logReminderActivity(verb: string, title: string) {
  logActivity(reminderKind(title), `${verb} ${title}`);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function openActionItems(s: StoredState, now: number): ActionItem[] {
  const dismissed = new Set(s.dismissed);
  return SEED_ACTION_ITEMS.filter((item) => {
    if (dismissed.has(item.id)) return false;
    const until = s.snoozedUntil[item.id];
    return !until || new Date(until).getTime() <= now;
  });
}

export function useNotifications() {
  const s = useSyncExternalStore(subscribe, getState);

  // Re-evaluate once a minute so snoozes expire and relative times stay fresh.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), MINUTE);
    return () => window.clearInterval(t);
  }, []);

  const activity = [...s.activity].sort((a, b) => b.at.localeCompare(a.at));
  return { actionItems: openActionItems(s, now), activity, now };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/** "Oct 12, 2026" */
export function formatActionDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Just now", "10 minutes ago", "3 hours ago", "Yesterday", then "Oct 8". */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso);
  const diff = Math.max(0, now - then.getTime());
  const minutes = Math.floor(diff / MINUTE);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = startOfToday.getTime() - DAY;

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (then.getTime() >= startOfToday.getTime()) {
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (then.getTime() >= startOfYesterday) return "Yesterday";

  const sameYear = then.getFullYear() === new Date(now).getFullYear();
  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
