import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
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
import { formatSpan, loadOccasions, sortByNext, type OccasionItem } from "../data/trackedItems";
import { toISODate } from "../utils/talkClient";

const TEMPLATES = [
  "Birthday",
  "Anniversary",
  "Gathering or Dinner",
  "Trip or Travel",
  "Major Milestone",
  "Breakup or Support",
  "Illness or Recovery",
  "Loss or Grief",
  "Living Will or End-of-Life",
];


// ─── New Occasion modal ───────────────────────────────────────────────────────

export function NewOccasionModal({
  open,
  onClose,
  initialDate,
}: {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const pick = (type: string) => {
    const params = new URLSearchParams({ type });
    if (initialDate) params.set("date", initialDate);
    onClose();
    navigate(`/app/occasions/create?${params.toString()}`);
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New occasion"
        className="bg-card w-full max-w-[560px] rounded-xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <p className="text-base font-medium text-foreground">New occasion</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose a template, or start from scratch.
          </p>

          {/* Template pills */}
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => pick(type)}
                className="px-3 py-1.5 text-sm border border-border rounded-full bg-card text-foreground hover:bg-accent hover:border-gray-300 transition-colors"
              >
                {type}
              </button>
            ))}
          </div>

          {/* Custom */}
          <button
            type="button"
            onClick={() => pick("Custom Occasion")}
            className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-sm text-muted-foreground hover:border-gray-400 hover:text-foreground hover:bg-accent transition-colors"
          >
            + Custom Occasion
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Filter = "all" | "recurring" | "situational";

const CHIPS: Chip<Filter>[] = [
  { value: "all", label: "All" },
  { value: "recurring", label: "Recurring" },
  { value: "situational", label: "Situational" },
];

function OccasionCard({ o }: { o: OccasionItem }) {
  return (
    <ItemCard
      look={{ type: "occasion", icon: o.icon }}
      title={o.title}
      meta={[o.category, formatSpan(o)]}
      people={o.people}
      href={o.href}
      recurring={o.recurrence === "yearly"}
      done={o.completed}
    />
  );
}

export function OccasionsIndex() {
  const [view, setView] = useStoredView("occasions");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [modal, setModal] = useState<{ open: boolean; date: string }>({ open: false, date: "" });
  const [occasions] = useState(loadOccasions);

  const q = query.trim().toLowerCase();
  const shown = occasions.filter((o) => {
    const matchesSearch = !q || [o.title, o.category, ...o.people].some((s) => s.toLowerCase().includes(q));
    const matchesFilter =
      filter === "all" ||
      (filter === "recurring" && !!o.recurrence) ||
      (filter === "situational" && !o.recurrence);
    return matchesSearch && matchesFilter;
  });

  return (
    <ListPageFrame>
      <NewOccasionModal
        open={modal.open}
        initialDate={modal.date}
        onClose={() => setModal({ open: false, date: "" })}
      />
      <ListPageHeader
        title="Occasions"
        description="Life events and moments you're tracking."
        newLabel="New Occasion"
        onNew={() => setModal({ open: true, date: "" })}
        view={view}
        onViewChange={setView}
      />

      {view === "list" ? (
        <>
          <FilterBar query={query} onQuery={setQuery} placeholder="Search by title or person…" chips={CHIPS} active={filter} onChip={setFilter} />
          <SectionLabel>Your occasions</SectionLabel>
          {shown.length ? (
            <CardGrid>
              {shown.map((o) => (
                <OccasionCard key={o.id} o={o} />
              ))}
            </CardGrid>
          ) : (
            <EmptyNote>No occasions match.</EmptyNote>
          )}
        </>
      ) : (
        <ItemCalendar
          family="occasion"
          items={sortByNext(occasions)}
          renderCard={(o) => <OccasionCard o={o} />}
          addLabel="Add occasion"
          onAdd={(day) => setModal({ open: true, date: toISODate(day) })}
        />
      )}
    </ListPageFrame>
  );
}
