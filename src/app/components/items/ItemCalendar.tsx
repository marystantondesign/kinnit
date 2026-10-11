import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ItemDot, ItemIcon } from "../ItemBadge";
import { familyColors, type ItemFamily } from "../../config/itemTypes";
import {
  isSpan,
  nextUp,
  occursOn,
  parseISO,
  sameDay,
  startOfDay,
  type Scheduled,
} from "../../data/trackedItems";
import { SectionLabel } from "./ListPage";

// Calendar view for one item type: Week/Month grid (same as Home), the
// selected day's items, and a "Next up" column on desktop.

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type Mode = "week" | "month";

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function startOfWeek(d: Date) {
  return addDays(startOfDay(d), -d.getDay());
}

interface Props<T extends Scheduled & { title: string }> {
  family: ItemFamily;
  items: T[];
  renderCard: (item: T) => ReactNode;
  /** "Add reminder" / "Add occasion" */
  addLabel: string;
  onAdd: (day: Date) => void;
}

export function ItemCalendar<T extends Scheduled & { title: string }>({ family, items, renderCard, addLabel, onAdd }: Props<T>) {
  const today = startOfDay(new Date());
  const [mode, setMode] = useState<Mode>("month");
  const [cursor, setCursor] = useState(today); // any day inside the visible month/week
  const [selected, setSelected] = useState(today);
  const colors = familyColors(family);

  const pointItems = items.filter((i) => !isSpan(i));
  const spanItems = items.filter(isSpan);
  const dayItems = items.filter((i) => occursOn(i, selected));
  const upcoming = useMemo(() => nextUp(items, 4), [items]);

  const move = (dir: 1 | -1) => {
    setCursor((c) =>
      mode === "month" ? new Date(c.getFullYear(), c.getMonth() + dir, 1) : addDays(c, 7 * dir),
    );
  };

  const weekStart = startOfWeek(cursor);
  const heading =
    mode === "month"
      ? cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : (() => {
          const end = addDays(weekStart, 6);
          const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return `${fmt(weekStart)} – ${fmt(end)}, ${end.getFullYear()}`;
        })();

  const dayButton = (day: Date, inMonth = true) => {
    const isToday = sameDay(day, today);
    const isSelected = sameDay(day, selected);
    const dots = pointItems.filter((i) => occursOn(i, day));
    return (
      <button
        key={day.toISOString()}
        type="button"
        onClick={() => setSelected(day)}
        aria-label={day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        aria-pressed={isSelected}
        className={`relative z-10 flex flex-col items-center gap-1 py-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          inMonth ? "" : "invisible"
        }`}
      >
        <span
          className={`size-9 rounded-full flex items-center justify-center text-sm transition-colors ${
            isToday ? "bg-gray-900 text-white font-semibold" : "text-gray-900 hover:bg-gray-100"
          }`}
          style={isSelected && !isToday ? { boxShadow: `inset 0 0 0 1.5px ${colors.dot}` } : undefined}
        >
          {day.getDate()}
        </span>
        <span className="h-1.5 flex items-center gap-0.5">
          {dots.slice(0, 3).map((i) => (
            <ItemDot key={i.id} type={family} completed={i.completed} size={6} />
          ))}
        </span>
      </button>
    );
  };

  /** Soft bands for multi-day items across one week row, rounded at every segment end. */
  const bands = (rowStart: Date) =>
    spanItems.flatMap((item) => {
      const s = parseISO(item.start!);
      const e = parseISO(item.end!);
      const rowEnd = addDays(rowStart, 6);
      if (e < rowStart || s > rowEnd) return [];
      const from = s < rowStart ? 0 : s.getDay();
      const to = e > rowEnd ? 6 : e.getDay();
      return [
        <span
          key={`${item.id}-${rowStart.toISOString()}`}
          aria-hidden
          className="absolute top-0.5 bottom-0.5 rounded-xl"
          style={{
            left: `${(from / 7) * 100}%`,
            width: `${((to - from + 1) / 7) * 100}%`,
            background: colors.fill,
          }}
        />,
      ];
    });

  const monthGrid = () => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const rows = Math.ceil((first.getDay() + lastDay.getDate()) / 7);
    return (
      <div>
        <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-1">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        {Array.from({ length: rows }, (_, r) => {
          const rowStart = addDays(gridStart, r * 7);
          return (
            <div key={r} className="relative grid grid-cols-7">
              {bands(rowStart)}
              {Array.from({ length: 7 }, (_, c) => {
                const day = addDays(rowStart, c);
                return dayButton(day, day.getMonth() === cursor.getMonth());
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const weekGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {Array.from({ length: 7 }, (_, c) => {
        const day = addDays(weekStart, c);
        const onDay = items.filter((i) => occursOn(i, day));
        const isSelected = sameDay(day, selected);
        const isToday = sameDay(day, today);
        return (
          <button
            key={c}
            type="button"
            onClick={() => setSelected(day)}
            aria-pressed={isSelected}
            className="text-left rounded-xl border border-gray-200 p-2.5 min-h-[72px] md:min-h-[120px] flex md:flex-col gap-2 md:gap-1.5 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={isSelected ? { borderColor: colors.dot, boxShadow: `inset 0 0 0 0.5px ${colors.dot}` } : undefined}
          >
            <span className="flex md:flex-col items-baseline md:items-start gap-1.5 md:gap-0 w-16 md:w-auto flex-shrink-0">
              <span className="text-xs text-gray-500">{WEEKDAY_NAMES[c]}</span>
              <span
                className={`text-sm font-semibold ${
                  isToday ? "md:size-7 md:rounded-full md:bg-gray-900 md:text-white md:flex md:items-center md:justify-center" : "text-gray-900"
                }`}
              >
                {day.getDate()}
              </span>
            </span>
            <span className="flex-1 min-w-0 space-y-1">
              {onDay.map((i) => (
                <span key={i.id} className="flex items-center gap-1.5 min-w-0">
                  <ItemDot type={family} completed={i.completed} size={6} />
                  <span className={`text-xs truncate ${i.completed ? "text-gray-400" : "text-gray-700"}`}>
                    {i.title}
                  </span>
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );

  const selectedSection = (
    <div className="mt-5 md:mt-6 md:pt-5 md:border-t md:border-gray-100">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-3">
        {selected.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
      </h3>
      {dayItems.length > 0 ? (
        <div className="space-y-3 mb-3">{dayItems.map((i) => <div key={i.id}>{renderCard(i)}</div>)}</div>
      ) : (
        <p className="text-sm text-gray-500 mb-3">Nothing on this day.</p>
      )}
      <button
        type="button"
        onClick={() => onAdd(selected)}
        className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <ItemIcon type={family} size={15} />
        {addLabel}
      </button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8 items-start">
      <div className="md:rounded-2xl md:border md:border-gray-200 md:p-6">
        <div className="rounded-2xl border border-gray-200 p-4 md:border-0 md:p-0 md:rounded-none">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">{heading}</h2>
            <div className="flex items-center gap-2">
              <div role="radiogroup" aria-label="Calendar range" className="flex gap-1">
                {(["week", "month"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={mode === m}
                    onClick={() => {
                      setMode(m);
                      setCursor(selected);
                    }}
                    className={`h-8 px-3 md:px-4 rounded-lg text-sm border transition-colors ${
                      mode === m ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {m === "week" ? "Week" : "Month"}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => move(-1)} aria-label="Previous" className="hidden md:flex size-8 rounded-lg border border-gray-200 items-center justify-center text-gray-600 hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={() => move(1)} aria-label="Next" className="hidden md:flex size-8 rounded-lg border border-gray-200 items-center justify-center text-gray-600 hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          {mode === "month" ? monthGrid() : weekGrid()}
          <div className="flex md:hidden justify-between mt-2">
            <button type="button" onClick={() => move(-1)} aria-label="Previous" className="size-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Next" className="size-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        {selectedSection}
      </div>

      <aside className="hidden lg:block">
        <SectionLabel>Next up</SectionLabel>
        <div className="space-y-3">
          {upcoming.length ? upcoming.map((i) => <div key={i.id}>{renderCard(i)}</div>) : <p className="text-sm text-gray-500">Nothing coming up.</p>}
        </div>
      </aside>
    </div>
  );
}
