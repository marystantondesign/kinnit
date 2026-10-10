import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { getAllCreatedOccasions, type OccasionData } from "../utils/occasionStorage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Occasion {
  id: string;
  type: string;
  title: string;
  people: string;
  date?: string;
  recurring: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_OCCASIONS: Occasion[] = [
  { id: "1", type: "Birthday",            title: "Sarah's Birthday",                people: "Sarah Johnson",             date: "Apr 15",    recurring: true  },
  { id: "2", type: "Illness or Recovery", title: "Emma's Surgery",                  people: "Emma Davis",                date: "Mar 20–30", recurring: false },
  { id: "3", type: "Loss or Grief",       title: "Grandmother Memorial Anniversary",people: "Family",                   date: "Jun 5",     recurring: true  },
  { id: "4", type: "Anniversary",         title: "Alex and Jordan Anniversary",     people: "Alex Chen, Jordan Smith",   date: "Aug 12",    recurring: true  },
  { id: "5", type: "Trip or Travel",      title: "Group Trip to Mexico",            people: "You, Sarah, Michael, Emma", date: "Dec 10–17", recurring: false },
];

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractInitials(peopleStr: string): string[] {
  return peopleStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((name) => {
      const words = name.trim().split(" ").filter(Boolean);
      if (words.length >= 2)
        return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
      return (words[0]?.[0] ?? "?").toUpperCase();
    });
}

function formatStoredDate(o: OccasionData): string | undefined {
  if (o.timing.mode === "single" && o.timing.singleDate) {
    const d = new Date(o.timing.singleDate);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (o.timing.mode === "range" && o.timing.startDate && o.timing.endDate) {
    const s = new Date(o.timing.startDate);
    const e = new Date(o.timing.endDate);
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  if (o.timing.mode === "ongoing") return "Ongoing";
  return undefined;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function OccasionCard({ o }: { o: Occasion }) {
  const initials = extractInitials(o.people);
  return (
    <Link
      to={`/app/occasions/${o.id}`}
      className="flex flex-col gap-2 p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors border-l-[3px] border-l-blue-400"
    >
      {/* Type tag + date */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full whitespace-nowrap leading-tight shrink-0">
          {o.type}
        </span>
        {o.date && (
          <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
            {o.date}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug">
        {o.title}
      </p>

      {/* People + recurring badge */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
        <div className="flex items-center gap-1">
          {initials.map((init, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground shrink-0"
            >
              {init}
            </div>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {o.recurring ? "Recurring" : "Situational"}
        </span>
      </div>
    </Link>
  );
}

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

const FILTER_OPTS: { value: Filter; label: string }[] = [
  { value: "all",         label: "All"         },
  { value: "recurring",   label: "Recurring"   },
  { value: "situational", label: "Situational" },
];

export function OccasionsIndex() {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<Filter>("all");
  const [created, setCreated] = useState<OccasionData[]>([]);
  const [modal, setModal]     = useState(false);

  useEffect(() => { setCreated(getAllCreatedOccasions()); }, []);

  const all: Occasion[] = [
    ...MOCK_OCCASIONS,
    ...created.map((o) => ({
      id:        o.id,
      type:      o.type,
      title:     o.title,
      people:    o.people.map((p) => p.name).join(", ") || "No people selected",
      date:      formatStoredDate(o),
      recurring: o.recurring,
    })),
  ];

  const shown = all.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = o.title.toLowerCase().includes(q) || o.people.toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "recurring"   &&  o.recurring) ||
      (filter === "situational" && !o.recurring);
    return matchSearch && matchFilter;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden px-6 md:px-8 py-6">
      <NewOccasionModal open={modal} onClose={() => setModal(false)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-1 shrink-0">
        <h1>Occasions</h1>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
        >
          <Plus size={15} />
          New Occasion
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-5 shrink-0">
        Life events and moments you're tracking.
      </p>

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5 shrink-0">
        <input
          type="text"
          placeholder="Search by title or person..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-72 px-3 py-2 border border-border rounded text-sm placeholder:text-muted-foreground bg-input-background focus:outline-none focus:border-gray-300 transition-colors"
        />
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mb-0.5 scrollbar-none">
          {FILTER_OPTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                filter === opt.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-card border-border text-foreground hover:bg-accent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section label */}
      <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-3 shrink-0">
        Your Occasions
      </p>

      {/* Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto mobile-inner-scroll-pb">
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No occasions match your search.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4 items-start">
            {shown.map((o) => (
              <OccasionCard key={o.id} o={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
