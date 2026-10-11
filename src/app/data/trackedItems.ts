import { getAllCreatedOccasions } from "../utils/occasionStorage";
import { getAllCreatedPlans } from "../utils/planStorage";
import { getAllCreatedReminders } from "../utils/reminderStorage";
import {
  occasionIconFor,
  planIconFor,
  reminderIconFor,
  type ItemIconKey,
} from "../config/itemTypes";

// Reminders, plans and occasions as the list pages and calendars show them.
// Demo data plus anything created in this session.

export type Recurrence = "weekly" | "yearly";

/** Anything that can sit on a calendar. Dates are local, YYYY-MM-DD. */
export interface Scheduled {
  id: string;
  start?: string;
  end?: string;
  recurrence?: Recurrence;
  completed?: boolean;
}

export interface ReminderItem extends Scheduled {
  title: string;
  icon: ItemIconKey<"reminder">;
  /** Who it's about, as shown on the meta line ("Sarah Johnson", "Family") */
  about: string;
  people: string[];
  linked?: string;
  href: string;
}

export interface PlanItem extends Scheduled {
  title: string;
  icon: ItemIconKey<"plan">;
  status: "active" | "draft" | "completed";
  planFor?: string;
  leader: string;
  participants: string[];
  linked?: string;
  href: string;
}

export interface OccasionItem extends Scheduled {
  title: string;
  icon: ItemIconKey<"occasion">;
  category: string;
  people: string[];
  href: string;
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_REMINDERS: Omit<ReminderItem, "icon">[] = [
  { id: "1", title: "Send birthday card", about: "Sarah Johnson", people: ["Sarah Johnson"], start: "2026-10-13", linked: "Sarah's Birthday", href: "/app/reminders/1" },
  { id: "2", title: "Check in weekly", about: "Emma Davis", people: ["Emma Davis"], start: "2026-10-12", recurrence: "weekly", linked: "Emma's Surgery", href: "/app/reminders/2" },
  { id: "6", title: "Call James about the trip", about: "James Wilson", people: ["James Wilson"], start: "2026-10-14", href: "/app/reminders/6" },
  { id: "7", title: "Gift for Priya", about: "Priya Patel", people: ["Priya Patel"], start: "2026-10-28", linked: "Priya's Birthday", href: "/app/reminders/7" },
  { id: "3", title: "Memorial anniversary reminder", about: "Family", people: ["James Wilson", "Emma Davis"], start: "2026-06-05", recurrence: "yearly", linked: "Grandmother Memorial Anniversary", href: "/app/reminders/3" },
  { id: "8", title: "Thank-you note to Lisa", about: "Lisa Anderson", people: ["Lisa Anderson"], start: "2026-10-06", completed: true, href: "/app/reminders/8" },
];

const DEMO_PLANS: Omit<PlanItem, "icon">[] = [
  { id: "1", title: "Birthday Dinner Planning", status: "active", planFor: "Sarah Johnson", leader: "you", participants: ["You", "Michael Chen"], start: "2026-04-15", linked: "Sarah's Birthday", href: "/app/plans/1" },
  { id: "4", title: "Recovery Support Schedule", status: "active", planFor: "Emma Davis", leader: "you", participants: ["You", "Sarah Johnson", "Michael Chen"], linked: "Emma's Surgery", href: "/app/plans/4" },
  { id: "5", title: "Mexico Trip Planning", status: "draft", planFor: "a group", leader: "Michael Chen", participants: ["You", "Michael Chen", "Sarah Johnson", "Emma Davis"], linked: "Group Trip to Mexico", href: "/app/plans/5" },
  { id: "6", title: "Lake House Weekend prep", status: "active", leader: "you", participants: ["You", "James Wilson", "Lisa Anderson"], start: "2026-10-10", href: "/app/plans/6" },
  { id: "holiday-kickoff", title: "Holiday Planning Kickoff", status: "draft", leader: "you", participants: ["You", "Michael Chen"], start: "2026-11-14", href: "/app/plans/holiday-kickoff" },
];

const DEMO_OCCASIONS: Omit<OccasionItem, "icon">[] = [
  { id: "1", title: "Sarah's Birthday", category: "Birthday", people: ["Sarah Johnson"], start: "2026-04-15", recurrence: "yearly", href: "/app/occasions/1" },
  { id: "2", title: "Emma's Surgery", category: "Illness or recovery", people: ["Emma Davis"], start: "2026-03-20", end: "2026-03-30", href: "/app/occasions/2" },
  { id: "3", title: "Grandmother Memorial Anniversary", category: "Loss or grief", people: ["James Wilson", "Emma Davis"], start: "2026-06-05", recurrence: "yearly", href: "/app/occasions/3" },
  { id: "4", title: "Alex and Jordan Anniversary", category: "Anniversary", people: ["Alex Chen", "Jordan Smith"], start: "2026-08-12", recurrence: "yearly", href: "/app/occasions/4" },
  { id: "5", title: "Group Trip to Mexico", category: "Trip or travel", people: ["You", "Sarah Johnson", "Michael Chen", "Emma Davis"], start: "2026-12-10", end: "2026-12-17", href: "/app/occasions/5" },
  { id: "6", title: "Emma's Follow-up Appointment", category: "Illness or recovery", people: ["Emma Davis"], start: "2026-10-15", href: "/app/occasions/6" },
  { id: "7", title: "James Wilson's Anniversary", category: "Anniversary", people: ["James Wilson"], start: "2026-10-20", recurrence: "yearly", href: "/app/occasions/7" },
  { id: "8", title: "Michael's Birthday", category: "Birthday", people: ["Michael Chen"], start: "2026-11-03", recurrence: "yearly", href: "/app/occasions/8" },
  { id: "9", title: "Emma's Recovery", category: "Illness or recovery", people: ["Emma Davis"], start: "2026-10-19", end: "2026-10-30", href: "/app/occasions/9" },
];

// ─── Loaders (demo + created this session) ────────────────────────────────────

const sentenceCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

export function loadReminders(): ReminderItem[] {
  const created: ReminderItem[] = getAllCreatedReminders().map((r) => ({
    id: r.id,
    title: r.action,
    about: r.personName ?? "",
    people: r.personName ? [r.personName] : [],
    start: r.date || undefined,
    recurrence: r.recurrence === "weekly" || r.recurrence === "yearly" ? r.recurrence : undefined,
    completed: r.completed,
    linked: r.notes?.match(/^Linked to (.+)$/m)?.[1],
    icon: reminderIconFor(r.action, r.kind),
    href: "/app/reminders",
  }));
  return [...DEMO_REMINDERS.map((r) => ({ ...r, icon: reminderIconFor(r.title) })), ...created];
}

export function loadPlans(): PlanItem[] {
  const created: PlanItem[] = getAllCreatedPlans().map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    planFor: p.planFor && p.planFor !== "Group" ? p.planFor : undefined,
    leader: p.leader.id === "you" ? "you" : p.leader.name,
    participants: p.participants.map((x) => x.name),
    start: p.timing.singleDate ?? p.timing.startDate,
    end: p.timing.mode === "range" ? p.timing.endDate : undefined,
    icon: planIconFor(p.title, p.kind),
    href: `/app/plans/${p.id}`,
  }));
  return [...created, ...DEMO_PLANS.map((p) => ({ ...p, icon: planIconFor(p.title) }))];
}

export function loadOccasions(): OccasionItem[] {
  const created: OccasionItem[] = getAllCreatedOccasions().map((o) => ({
    id: o.id,
    title: o.title,
    category: sentenceCase(o.type),
    people: o.people.map((p) => p.name),
    start: o.timing.singleDate ?? o.timing.startDate,
    end: o.timing.mode === "range" ? o.timing.endDate : undefined,
    recurrence: o.recurring ? "yearly" : undefined,
    icon: occasionIconFor(o.type, o.title, o.kind),
    href: `/app/occasions/${o.id}`,
  }));
  return [...DEMO_OCCASIONS.map((o) => ({ ...o, icon: occasionIconFor(o.category, o.title) })), ...created];
}

// ─── Dates ────────────────────────────────────────────────────────────────────

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const DAY_MS = 86_400_000;
const dayIndex = (d: Date) => Math.round(startOfDay(d).getTime() / DAY_MS);

export const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** "Oct 13", "Oct 19–30", "Oct 28 – Nov 2" */
export function formatSpan(item: Scheduled): string | undefined {
  if (!item.start) return undefined;
  const s = parseISO(item.start);
  if (!item.end) return shortDate(s);
  const e = parseISO(item.end);
  if (s.getMonth() === e.getMonth()) return `${shortDate(s)}–${e.getDate()}`;
  return `${shortDate(s)} – ${shortDate(e)}`;
}

/** Whether a multi-day span covers the day. */
export function isSpan(item: Scheduled) {
  return !!(item.start && item.end && item.end !== item.start);
}

/** Does the item happen on this day (including repeats)? */
export function occursOn(item: Scheduled, day: Date): boolean {
  if (!item.start) return false;
  const s = parseISO(item.start);
  if (item.end) {
    const e = parseISO(item.end);
    return dayIndex(day) >= dayIndex(s) && dayIndex(day) <= dayIndex(e);
  }
  if (item.recurrence === "weekly") {
    const diff = dayIndex(day) - dayIndex(s);
    return diff >= 0 && diff % 7 === 0;
  }
  if (item.recurrence === "yearly") return day.getMonth() === s.getMonth() && day.getDate() === s.getDate();
  return sameDay(s, day);
}

/** The next day (on or after `from`) the item happens, if any. */
export function nextOccurrence(item: Scheduled, from: Date = new Date()): Date | undefined {
  if (!item.start) return undefined;
  const today = startOfDay(from);
  const s = parseISO(item.start);
  if (item.end) {
    const e = parseISO(item.end);
    if (e < today) return undefined;
    return s > today ? s : today;
  }
  if (item.recurrence === "weekly") {
    if (s >= today) return s;
    const weeks = Math.ceil((dayIndex(today) - dayIndex(s)) / 7);
    return new Date(s.getFullYear(), s.getMonth(), s.getDate() + weeks * 7);
  }
  if (item.recurrence === "yearly") {
    const thisYear = new Date(today.getFullYear(), s.getMonth(), s.getDate());
    return thisYear >= today ? thisYear : new Date(today.getFullYear() + 1, s.getMonth(), s.getDate());
  }
  return s >= today ? s : undefined;
}

/** Open items first by next date, then undated, then completed. */
export function sortByNext<T extends Scheduled>(items: T[], from: Date = new Date()): T[] {
  const key = (i: T) => {
    if (i.completed) return Number.MAX_SAFE_INTEGER;
    const n = nextOccurrence(i, from);
    return n ? n.getTime() : Number.MAX_SAFE_INTEGER - 1;
  };
  return [...items].sort((a, b) => key(a) - key(b));
}

/** The next few open items, soonest first. */
export function nextUp<T extends Scheduled>(items: T[], count = 4, from: Date = new Date()): T[] {
  return sortByNext(items.filter((i) => !i.completed && nextOccurrence(i, from)), from).slice(0, count);
}
