import { useState } from "react";
import { ReminderModal } from "../components/ReminderModal";
import { ItemCard } from "../components/items/ItemCard";
import { ItemCalendar } from "../components/items/ItemCalendar";
import {
  CardGrid,
  EmptyNote,
  FilterBar,
  ListPageFrame,
  ListPageHeader,
  SectionLabel,
  useStoredView,
  type Chip,
} from "../components/items/ListPage";
import {
  formatSpan,
  loadReminders,
  nextOccurrence,
  sortByNext,
  type ReminderItem,
} from "../data/trackedItems";
import { toISODate } from "../utils/talkClient";

type Filter = "all" | "upcoming" | "recurring" | "completed";

const CHIPS: Chip<Filter>[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "recurring", label: "Recurring" },
  { value: "completed", label: "Completed" },
];

function ReminderCard({ r }: { r: ReminderItem }) {
  return (
    <ItemCard
      look={{ type: "reminder", icon: r.icon }}
      title={r.title}
      meta={[r.about, formatSpan(r)]}
      linked={r.linked}
      people={r.people}
      href={r.href}
      recurring={!!r.recurrence}
      done={r.completed}
    />
  );
}

export function RemindersIndex() {
  const [view, setView] = useStoredView("reminders");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [modal, setModal] = useState<{ open: boolean; date: string }>({ open: false, date: "" });
  const [reminders, setReminders] = useState(loadReminders);

  const q = query.trim().toLowerCase();
  const shown = sortByNext(
    reminders.filter((r) => {
      const matchesSearch =
        !q || [r.title, r.about, r.linked ?? "", ...r.people].some((s) => s.toLowerCase().includes(q));
      const matchesFilter =
        filter === "all" ||
        (filter === "upcoming" && !r.completed && !!nextOccurrence(r)) ||
        (filter === "recurring" && !!r.recurrence) ||
        (filter === "completed" && !!r.completed);
      return matchesSearch && matchesFilter;
    }),
  );

  return (
    <ListPageFrame>
      <ReminderModal
        open={modal.open}
        initialDate={modal.date}
        onClose={() => setModal({ open: false, date: "" })}
        onSaved={() => setReminders(loadReminders())}
      />

      <ListPageHeader
        title="Reminders"
        description="Small actions to support or celebrate someone."
        newLabel="New Reminder"
        onNew={() => setModal({ open: true, date: "" })}
        view={view}
        onViewChange={setView}
      />

      {view === "list" ? (
        <>
          <FilterBar query={query} onQuery={setQuery} placeholder="Search by person or action…" chips={CHIPS} active={filter} onChip={setFilter} />
          <SectionLabel>{filter === "completed" ? "Completed" : "Coming up"}</SectionLabel>
          {shown.length ? (
            <CardGrid>
              {shown.map((r) => (
                <ReminderCard key={r.id} r={r} />
              ))}
            </CardGrid>
          ) : (
            <EmptyNote>No reminders match.</EmptyNote>
          )}
        </>
      ) : (
        <ItemCalendar
          family="reminder"
          items={reminders}
          renderCard={(r) => <ReminderCard r={r} />}
          addLabel="Add reminder"
          onAdd={(day) => setModal({ open: true, date: toISODate(day) })}
        />
      )}
    </ListPageFrame>
  );
}
