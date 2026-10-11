import { useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ItemDot } from "../ItemBadge";
import { familyColors, type ItemFamily } from "../../config/itemTypes";
import { isSpan, occursOn, parseISO, sameDay, startOfDay, type Scheduled } from "../../data/trackedItems";

// The Week/Month calendar grid shared by Home and the Reminders/Occasions pages.
// Dots and bands use each item's family colors; the panel keeps the same
// footprint in Week and Month.

export type CalendarEntry = Scheduled & { title: string; family: ItemFamily };

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type Mode = "week" | "month";

export function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function startOfWeek(d: Date) {
  return addDays(startOfDay(d), -d.getDay());
}

export function CalendarGrid({
  entries,
  selected,
  onSelect,
  accent,
  compact = false,
}: {
  entries: CalendarEntry[];
  selected: Date;
  onSelect: (d: Date) => void;
  /** Family color for the selected-day outline; neutral when omitted (mixed types). */
  accent?: ItemFamily;
  compact?: boolean;
}) {
  const today = startOfDay(new Date());
  const [mode, setMode] = useState<Mode>("month");
  const [cursor, setCursor] = useState(selected);
  const ring = accent ? familyColors(accent).dot : "#111827";

  const pointItems = entries.filter((i) => !isSpan(i));
  const spanItems = entries.filter(isSpan);

  const move = (dir: 1 | -1) =>
    setCursor((c) => (mode === "month" ? new Date(c.getFullYear(), c.getMonth() + dir, 1) : addDays(c, 7 * dir)));

  const weekStart = startOfWeek(cursor);
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthRows = Math.ceil((monthStart.getDay() + new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()) / 7);
  // Week view takes the same height as the month it sits in.
  const footprint = compact ? 14 + monthRows * 37 : undefined;
  const heading =
    mode === "month"
      ? cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : (() => {
          const end = addDays(weekStart, 6);
          const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return `${fmt(weekStart)} – ${fmt(end)}, ${end.getFullYear()}`;
        })();

  const dayButton = (day: Date, inMonth: boolean) => {
    const isToday = sameDay(day, today);
    const isSelected = sameDay(day, selected);
    const dots = pointItems.filter((i) => occursOn(i, day));
    return (
      <button
        key={day.toISOString()}
        type="button"
        onClick={() => onSelect(day)}
        aria-label={day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        aria-pressed={isSelected}
        tabIndex={inMonth ? 0 : -1}
        className={`relative z-10 flex flex-col items-center ${compact ? "gap-0.5 pb-[5px]" : "gap-1 py-1.5"} rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          inMonth ? "" : "invisible"
        }`}
      >
        <span
          className={`${compact ? "size-[26px] text-[13px]" : "size-9 text-sm"} rounded-full flex items-center justify-center transition-colors ${
            isToday ? "bg-gray-900 text-white font-semibold" : "text-gray-900 hover:bg-gray-100"
          }`}
          style={isSelected && !isToday ? { boxShadow: `inset 0 0 0 1.5px ${ring}` } : undefined}
        >
          {day.getDate()}
        </span>
        <span className={`${compact ? "h-1" : "h-1.5"} flex items-center gap-0.5`}>
          {dots.slice(0, 3).map((i) => (
            <ItemDot key={`${i.family}-${i.id}`} type={i.family} completed={i.completed} size={compact ? 4 : 6} />
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
          key={`${item.family}-${item.id}-${rowStart.toISOString()}`}
          aria-hidden
          className={compact ? "absolute top-0 h-[26px] rounded-full" : "absolute top-0.5 bottom-0.5 rounded-xl"}
          style={{
            left: `${(from / 7) * 100}%`,
            width: `${((to - from + 1) / 7) * 100}%`,
            background: familyColors(item.family).fill,
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
        <div className={`grid grid-cols-7 text-center ${compact ? "text-[11px] leading-[14px]" : "text-xs mb-1"} text-gray-400`}>
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
    <div className="grid grid-cols-1 md:grid-cols-7 gap-1.5 md:items-stretch">
      {Array.from({ length: 7 }, (_, c) => {
        const day = addDays(weekStart, c);
        const onDay = entries.filter((i) => occursOn(i, day));
        const isSelected = sameDay(day, selected);
        const isToday = sameDay(day, today);
        return (
          <button
            key={c}
            type="button"
            onClick={() => onSelect(day)}
            aria-pressed={isSelected}
            className={`text-left rounded-xl border border-gray-200 ${
              compact ? "p-2 min-h-[40px] md:min-h-[72px]" : "p-2.5 min-h-[56px] md:min-h-[96px]"
            } flex md:flex-col gap-2 md:gap-1 hover:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            style={isSelected ? { borderColor: ring, boxShadow: `inset 0 0 0 0.5px ${ring}` } : undefined}
          >
            <span className="flex items-center gap-1.5 w-16 md:w-auto flex-shrink-0">
              <span className="text-xs text-gray-500">{WEEKDAY_NAMES[c]}</span>
              <span
                className={`text-sm font-semibold ${
                  isToday ? "size-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs" : "text-gray-900"
                }`}
              >
                {day.getDate()}
              </span>
            </span>
            <span className="flex-1 min-w-0 space-y-1">
              {onDay.map((i) => (
                <span key={`${i.family}-${i.id}`} className="flex items-start gap-1.5 min-w-0">
                  <ItemDot type={i.family} completed={i.completed} size={6} className="mt-[5px]" />
                  <span className={`text-xs leading-4 break-words min-w-0 ${i.completed ? "text-gray-400" : "text-gray-700"}`}>{i.title}</span>
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );

  const arrowClass = `${compact ? "size-7" : "size-8"} rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 outline-none focus-visible:ring-2 focus-visible:ring-ring`;

  const arrows = (
    <>
      <button type="button" onClick={() => move(-1)} aria-label={mode === "month" ? "Previous month" : "Previous week"} className={arrowClass}>
        <ChevronLeft size={16} />
      </button>
      <button type="button" onClick={() => move(1)} aria-label={mode === "month" ? "Next month" : "Next week"} className={arrowClass}>
        <ChevronRight size={16} />
      </button>
    </>
  );

  return (
    <div>
      <div className={`flex items-center justify-between gap-3 ${compact ? "mb-1" : "mb-3"}`}>
        <h2 className={`${compact ? "text-[15px]" : "text-base md:text-lg"} font-semibold text-gray-900`}>{heading}</h2>
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
                className={`${compact ? "h-7 px-2.5 text-xs" : "h-8 px-3 md:px-4 text-sm"} rounded-lg border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  mode === m ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {m === "week" ? "Week" : "Month"}
              </button>
            ))}
          </div>
          <span className="hidden sm:contents">{arrows}</span>
        </div>
      </div>
      {/* Same footprint in Week and Month */}
      <div className={mode === "week" ? "" : compact ? "md:min-h-[var(--cal-h)]" : "md:min-h-[22rem]"} style={footprint ? ({ "--cal-h": `${footprint}px` } as CSSProperties) : undefined}>{mode === "month" ? monthGrid() : weekGrid()}</div>
      <div className="flex sm:hidden justify-between mt-2">{arrows}</div>
    </div>
  );
}
