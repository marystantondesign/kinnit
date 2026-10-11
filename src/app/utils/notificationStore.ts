import { useEffect, useState, useSyncExternalStore } from "react";
import { reminderIconFor, type ItemLook } from "../config/itemTypes";

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
  look: ItemLook;
  text: string;
  /** ISO timestamp */
  at: string;
}

/** Something shared between the user and someone else (Shared tab). */
export interface ShareEntry {
  id: string;
  /** "with-you": someone shared with the user; "by-you": the user shared with someone */
  direction: "with-you" | "by-you";
  /** Who shared, or who it was shared with */
  person: string;
  /** What was shared, e.g. "Food & Drink preferences" */
  what: string;
  /** Where View goes (shares with the user only) */
  href?: string;
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
const SEED_ACTIVITY: { look: ItemLook; text: string; ago: number }[] = [
  { look: { type: "plan", icon: "outdoors" },        text: "Created Hiking next weekend",      ago: 10 * MINUTE },
  { look: { type: "occasion", icon: "appointment" }, text: "Added Sylvia's appointment",       ago: 12 * MINUTE },
  { look: { type: "people", icon: "note" },          text: "Added a private note about Emily", ago: DAY },
  { look: { type: "reminder", icon: "call" },        text: "Completed Call Mom",               ago: DAY + 2 * 60 * MINUTE },
  { look: { type: "people", icon: "person" },        text: "Updated your Gift Preferences",    ago: 2 * DAY },
];

/** Seeded shares, as offsets back from the first time the app loads. */
const SEED_SHARES: (Omit<ShareEntry, "id" | "at"> & { ago: number; seen?: boolean })[] = [
  { direction: "with-you", person: "Sarah",   what: "Food & Drink preferences", href: "/app/people/1/food-drink",       ago: 2 * 60 * MINUTE },
  { direction: "with-you", person: "Emma",    what: "Gift Preferences",         href: "/app/people/3/gift-preferences", ago: DAY + 3 * 60 * MINUTE },
  { direction: "by-you",   person: "Michael", what: "Gift Preferences",                                                 ago: 3 * DAY },
  { direction: "with-you", person: "Michael", what: "Important Dates",          href: "/app/people/2/important-dates",  ago: 4 * DAY, seen: true },
  { direction: "by-you",   person: "Sarah",   what: "Allergies",                                                        ago: 5 * DAY },
];

function seedShares(now: number): Pick<StoredState, "shares" | "sharesSeen"> {
  const shares = SEED_SHARES.map(({ ago, seen: _seen, ...rest }, i) => ({
    ...rest,
    id: `share-${i}`,
    at: new Date(now - ago).toISOString(),
  }));
  return { shares, sharesSeen: SEED_SHARES.flatMap((x, i) => (x.seen ? [`share-${i}`] : [])) };
}

/** Entries saved before the item-type config used named appearances. */
const LEGACY_LOOKS: Record<string, ItemLook> = {
  "plan": { type: "plan" },
  "plan-invitation": { type: "plan", icon: "invite" },
  "occasion": { type: "occasion" },
  "reminder": { type: "reminder" },
  "reminder-call": { type: "reminder", icon: "call" },
  "private-note": { type: "people", icon: "note" },
  "about-me": { type: "people", icon: "person" },
  "survey-request": { type: "request", icon: "fill-out" },
  "access-request": { type: "request", icon: "access" },
};

function migrate(s: StoredState): StoredState {
  return {
    ...s,
    // State saved before the Shared tab existed
    ...(s.shares ? {} : seedShares(Date.now())),
    activity: s.activity.map((a) => {
      const legacy = (a as ActivityEntry & { appearance?: string }).appearance;
      return a.look ? a : { ...a, look: LEGACY_LOOKS[legacy ?? ""] ?? { type: "people" } };
    }),
  };
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "kinnit_notifications";

interface StoredState {
  dismissed: string[];
  snoozedUntil: Record<string, string>;
  activity: ActivityEntry[];
  shares: ShareEntry[];
  /** Shares with the user that they've viewed */
  sharesSeen: string[];
}

function seedState(): StoredState {
  const now = Date.now();
  return {
    dismissed: [],
    snoozedUntil: {},
    activity: SEED_ACTIVITY.map((a, i) => ({
      id: `seed-${i}`,
      look: a.look,
      text: a.text,
      at: new Date(now - a.ago).toISOString(),
    })),
    ...seedShares(now),
  };
}

function load(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw) as StoredState);
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
export function logActivity(look: ItemLook, text: string) {
  const entry: ActivityEntry = {
    id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    look,
    text,
    at: new Date().toISOString(),
  };
  update((s) => ({ ...s, activity: [entry, ...s.activity] }));
}

/** The user shared something with someone: shows under "You shared" and in Timeline. */
export function recordShare(person: string, what: string) {
  const entry: ShareEntry = {
    id: `share-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    direction: "by-you",
    person,
    what,
    at: new Date().toISOString(),
  };
  update((s) => ({ ...s, shares: [entry, ...s.shares] }));
  logActivity({ type: "people", icon: "share" }, `Shared ${what} with ${person}`);
}

export function markShareSeen(id: string) {
  update((s) => (s.sharesSeen.includes(id) ? s : { ...s, sharesSeen: [...s.sharesSeen, id] }));
}

/** Hides a share with the user (shares by the user stay as a record). */
export function dismissShare(id: string) {
  update((s) => ({ ...s, dismissed: [...s.dismissed, id], sharesSeen: [...s.sharesSeen, id] }));
}

export function logReminderActivity(verb: string, title: string) {
  logActivity({ type: "reminder", icon: reminderIconFor(title) }, `${verb} ${title}`);
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
  const dismissed = new Set(s.dismissed);
  const shares = [...s.shares].filter((x) => !dismissed.has(x.id)).sort((a, b) => b.at.localeCompare(a.at));
  const seen = new Set(s.sharesSeen);
  const unseenShares = shares.filter((x) => x.direction === "with-you" && !seen.has(x.id)).length;
  return { actionItems: openActionItems(s, now), activity, shares, isShareSeen: (id: string) => seen.has(id), unseenShares, now };
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
