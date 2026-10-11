import type { ItemLook } from "../config/itemTypes";
import { PEOPLE_DIRECTORY, type DirectoryPerson } from "../utils/peopleDirectory";
import type { CalendarEntry } from "../components/items/CalendarGrid";
import {
  loadOccasions,
  loadPlans,
  loadReminders,
  nextOccurrence,
  occursOn,
  startOfDay,
} from "./trackedItems";

// Data for the Home dashboard, built from the same reminders, plans and
// occasions as their list pages.

export interface DashboardEntry extends CalendarEntry {
  look: ItemLook;
  /** Secondary line: "Care Reminder", "Plan", or the occasion category */
  subtitle: string;
  href: string;
}

export function loadDashboardEntries(): DashboardEntry[] {
  return [
    ...loadReminders().map((r) => ({
      ...r,
      family: "reminder" as const,
      look: { type: "reminder" as const, icon: r.icon },
      subtitle: "Care Reminder",
    })),
    ...loadPlans().map((p) => ({
      ...p,
      family: "plan" as const,
      look: { type: "plan" as const, icon: p.icon },
      subtitle: "Plan",
      completed: p.status === "completed",
    })),
    ...loadOccasions().map((o) => ({
      ...o,
      family: "occasion" as const,
      look: { type: "occasion" as const, icon: o.icon },
      subtitle: o.category,
    })),
  ];
}

/** Things on a given day, with timed items first in time order. */
export function entriesOn(entries: DashboardEntry[], day: Date): DashboardEntry[] {
  const toMinutes = (t?: string) => {
    const m = t?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return 24 * 60;
    return ((Number(m[1]) % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(m[2]);
  };
  return entries.filter((e) => occursOn(e, day)).sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
}

/** Upcoming open items after today, soonest first, each with its next date. */
export function comingUp(entries: DashboardEntry[], count = 4, now: Date = new Date()) {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return entries
    .filter((e) => !e.completed)
    .map((e) => ({ entry: e, date: nextOccurrence(e, tomorrow) }))
    .filter((x): x is { entry: DashboardEntry; date: Date } => !!x.date)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count);
}

export type BirthdayRange = 1 | 3 | 6 | 12;

/** People with a birthday on file within the next N months. */
export function upcomingBirthdays(months: BirthdayRange, now: Date = new Date()) {
  const today = startOfDay(now);
  const limit = new Date(today.getFullYear(), today.getMonth() + months, today.getDate());
  return PEOPLE_DIRECTORY.flatMap((p: DirectoryPerson) => {
    if (!p.birthday) return [];
    const [m, d] = p.birthday.split("-").map(Number);
    let next = new Date(today.getFullYear(), m - 1, d);
    if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
    return next <= limit ? [{ person: p, date: next }] : [];
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
}
