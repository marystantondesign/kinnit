import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { ItemBadge, ItemDot } from "../ItemBadge";
import { CalendarGrid } from "../items/CalendarGrid";
import { avatarFor } from "../../utils/peopleDirectory";
import { startOfDay } from "../../data/trackedItems";
import {
  comingUp,
  entriesOn,
  upcomingBirthdays,
  type BirthdayRange,
  type DashboardEntry,
} from "../../data/dashboard";
import type { ItemFamily } from "../../config/itemTypes";

// Home dashboard modules. Dots and badges come from config/itemTypes.

export function Panel({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-gray-200 bg-white p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const fullDate = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

/** Row used in Today and the calendar's day list: dot, title, subtitle, optional time. */
function EntryRow({ e, chevron = false }: { e: DashboardEntry; chevron?: boolean }) {
  return (
    <Link
      to={e.href}
      className={`flex items-center gap-3 py-2.5 rounded-lg -mx-2 px-2 hover:bg-black/[0.03] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        e.completed ? "opacity-60" : ""
      }`}
    >
      <ItemDot type={e.family} completed={e.completed} size={10} />
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] text-gray-900 truncate">{e.title}</span>
        <span className="block text-[13px] text-gray-500 truncate">{e.subtitle}</span>
      </span>
      {e.time && <span className="text-[13px] text-gray-500 flex-shrink-0">{e.time}</span>}
      {chevron && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" aria-hidden />}
    </Link>
  );
}

// ─── Today ────────────────────────────────────────────────────────────────────

export function TodayPanel({ entries }: { entries: DashboardEntry[] }) {
  const today = startOfDay(new Date());
  const items = entriesOn(entries, today);
  return (
    <section
      className="rounded-2xl border p-5"
      style={{ background: "var(--surface-warm)", borderColor: "var(--surface-warm-border)" }}
      aria-labelledby="today-heading"
    >
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h2 id="today-heading" className="text-lg font-semibold text-gray-900">Today</h2>
        <span className="text-sm text-gray-500">{fullDate(today)}</span>
      </div>
      {items.length ? (
        <div className="divide-y divide-black/5">
          {items.map((e) => (
            <EntryRow key={`${e.family}-${e.id}`} e={e} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600 py-2">Nothing scheduled today.</p>
      )}
    </section>
  );
}

// ─── Coming up ────────────────────────────────────────────────────────────────

function DateBlock({ date }: { date: Date }) {
  return (
    <span className="w-11 flex-shrink-0 rounded-lg border border-gray-200 bg-white text-center py-1 leading-none" aria-hidden>
      <span className="block text-[10px] tracking-wide text-gray-500 uppercase">{date.toLocaleDateString("en-US", { month: "short" })}</span>
      <span className="block text-[17px] font-semibold text-gray-900 my-0.5">{date.getDate()}</span>
      <span className="block text-[10px] tracking-wide text-gray-500 uppercase">{date.toLocaleDateString("en-US", { weekday: "short" })}</span>
    </span>
  );
}

export function ComingUpPanel({ entries }: { entries: DashboardEntry[] }) {
  const rows = comingUp(entries, 4);
  return (
    <Panel title="Coming up">
      {rows.length ? (
        <ul className="divide-y divide-gray-100">
          {rows.map(({ entry: e, date }) => (
            <li key={`${e.family}-${e.id}`}>
              <Link
                to={e.href}
                aria-label={`${e.title}, ${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
                className="flex items-center gap-3 py-2.5 rounded-lg -mx-2 px-2 hover:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <DateBlock date={date} />
                <ItemDot type={e.family} size={10} />
                <span className="min-w-0">
                  <span className="block text-[15px] text-gray-900 truncate">{e.title}</span>
                  <span className="block text-[13px] text-gray-500 truncate">{e.subtitle}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">Nothing coming up.</p>
      )}
    </Panel>
  );
}

// ─── Upcoming birthdays ───────────────────────────────────────────────────────

const RANGES: { value: BirthdayRange; label: string }[] = [
  { value: 1, label: "Next month" },
  { value: 3, label: "Next 3 months" },
  { value: 6, label: "Next 6 months" },
  { value: 12, label: "Next 12 months" },
];

export function BirthdaysPanel() {
  const [range, setRange] = useState<BirthdayRange>(3);
  const rows = upcomingBirthdays(range);
  return (
    <Panel
      title="Upcoming birthdays"
      action={
        <select
          value={range}
          onChange={(e) => setRange(Number(e.target.value) as BirthdayRange)}
          aria-label="Birthday range"
          className="h-9 rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-sm text-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      }
    >
      {rows.length ? (
        <ul className="divide-y divide-gray-100">
          {rows.map(({ person, date }) => {
            const a = avatarFor(person.name);
            return (
              <li key={person.id}>
                <Link
                  to={`/app/people/${person.id}`}
                  className="flex items-center gap-3 py-2 rounded-lg -mx-2 px-2 hover:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className={`size-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${a.className}`} aria-hidden>
                    {a.initials}
                  </span>
                  <span className="flex-1 min-w-0 text-[15px] text-gray-900 truncate">{person.firstName}</span>
                  <span className="text-right leading-tight flex-shrink-0">
                    <span className="block text-[13px] text-gray-700">{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span className="block text-xs text-gray-400">{date.toLocaleDateString("en-US", { weekday: "short" })}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No birthdays in this range.</p>
      )}
    </Panel>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

const ADD_TYPES: { type: ItemFamily & ("occasion" | "plan" | "reminder"); label: string }[] = [
  { type: "occasion", label: "Occasion" },
  { type: "plan", label: "Plan" },
  { type: "reminder", label: "Reminder" },
];

export function CalendarPanel({
  entries,
  onAdd,
}: {
  entries: DashboardEntry[];
  onAdd: (type: "occasion" | "plan" | "reminder", day: Date) => void;
}) {
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const dayItems = useMemo(() => entriesOn(entries, selected), [entries, selected]);
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5" aria-label="Calendar">
      <CalendarGrid entries={entries} selected={selected} onSelect={setSelected} compact />
      <div className="mt-3 pt-4 border-t border-gray-100">
        <h3 className="text-[15px] font-semibold text-gray-900">{fullDate(selected)}</h3>
        {dayItems.length ? (
          <div className="divide-y divide-gray-100 mt-1">
            {dayItems.map((e) => (
              <EntryRow key={`${e.family}-${e.id}`} e={e} chevron />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-1">Nothing on this day.</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase mr-1">Add</span>
          {ADD_TYPES.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => onAdd(type, selected)}
              className="h-8 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 inline-flex items-center gap-1.5 hover:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ItemBadge type={type} size="xs" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
