import { useMemo, useState, type ReactNode } from "react";
import { ItemIcon } from "../ItemBadge";
import type { ItemFamily } from "../../config/itemTypes";
import { nextUp, occursOn, startOfDay, type Scheduled } from "../../data/trackedItems";
import { CalendarGrid } from "./CalendarGrid";
import { SectionLabel } from "./ListPage";

// Calendar view for one item type: the shared Week/Month grid, the selected
// day's items, and a "Next up" column on desktop.

interface Props<T extends Scheduled & { title: string }> {
  family: ItemFamily;
  items: T[];
  renderCard: (item: T) => ReactNode;
  /** "Add reminder" / "Add occasion" */
  addLabel: string;
  onAdd: (day: Date) => void;
}

export function ItemCalendar<T extends Scheduled & { title: string }>({ family, items, renderCard, addLabel, onAdd }: Props<T>) {
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const entries = useMemo(() => items.map((i) => ({ ...i, family })), [items, family]);
  const dayItems = items.filter((i) => occursOn(i, selected));
  const upcoming = useMemo(() => nextUp(items, 4), [items]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8 items-start">
      <div className="md:rounded-2xl md:border md:border-gray-200 md:p-6">
        <div className="rounded-2xl border border-gray-200 p-4 md:border-0 md:p-0 md:rounded-none">
          <CalendarGrid entries={entries} selected={selected} onSelect={setSelected} accent={family} />
        </div>
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
