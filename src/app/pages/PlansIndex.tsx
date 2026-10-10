import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  id: string;
  name: string;
  initials: string;
}

interface Plan {
  id: string;
  title: string;
  status: "active" | "completed" | "draft";
  linkedOccasion?: string | { id: string; title: string };
  leader: Participant;
  planFor: string;
  participants: Participant[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const P: Record<string, Participant> = {
  you:     { id: "you", name: "You",           initials: "YO" },
  sarah:   { id: "1",   name: "Sarah Johnson", initials: "SJ" },
  michael: { id: "2",   name: "Michael Chen",  initials: "MC" },
  emma:    { id: "3",   name: "Emma Davis",    initials: "ED" },
};

const MOCK_PLANS: Plan[] = [
  {
    id: "1",
    title: "Birthday Dinner Planning",
    status: "active",
    linkedOccasion: "Sarah's Birthday",
    leader: P.you,
    planFor: "Sarah Johnson",
    participants: [P.you, P.michael],
  },
  {
    id: "4",
    title: "Recovery Support Schedule",
    status: "active",
    linkedOccasion: "Emma's Surgery",
    leader: P.you,
    planFor: "Emma Davis",
    participants: [P.you, P.sarah, P.michael],
  },
  {
    id: "5",
    title: "Mexico Trip Planning",
    status: "draft",
    linkedOccasion: "Group Trip to Mexico",
    leader: P.michael,
    planFor: "Group",
    participants: [P.you, P.michael, P.sarah, P.emma],
  },
];

// ─── Templates ───────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: "gathering", label: "Gathering or Event"  },
  { id: "trip",      label: "Trip or Travel"       },
  { id: "support",   label: "Support or Care"      },
  { id: "simple",    label: "Simple Coordination"  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusPill(status: Plan["status"]) {
  if (status === "active")    return "bg-green-50 text-green-700";
  if (status === "completed") return "bg-blue-50 text-blue-600";
  return                             "bg-muted text-muted-foreground";
}

function statusBorder(status: Plan["status"]) {
  if (status === "active")    return "border-l-green-500";
  if (status === "completed") return "border-l-blue-400";
  return                             "border-l-gray-300";
}

function statusLabel(status: Plan["status"]) {
  if (status === "active")    return "Active";
  if (status === "completed") return "Completed";
  return                             "Draft";
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Link
      to={`/app/plans/${plan.id}`}
      className={`flex flex-col gap-2 p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors border-l-[3px] ${statusBorder(plan.status)}`}
    >
      {/* Status pill */}
      <div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full leading-tight ${statusPill(plan.status)}`}>
          {statusLabel(plan.status)}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug">
        {plan.title}
      </p>

      {/* Meta line */}
      <p className="text-xs text-muted-foreground truncate">
        Led by {plan.leader.name} · For {plan.planFor}
      </p>

      {/* Participant stack */}
      <div className="flex items-center mt-auto pt-1">
        {plan.participants.slice(0, 5).map((participant, i) => (
          <div
            key={participant.id}
            title={participant.name}
            className={`w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-medium text-muted-foreground shrink-0 ${i > 0 ? "-ml-2" : ""}`}
          >
            {participant.initials}
          </div>
        ))}
        {plan.participants.length > 5 && (
          <div className="-ml-2 w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-medium text-muted-foreground">
            +{plan.participants.length - 5}
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── New Plan modal ───────────────────────────────────────────────────────────

export function NewPlanModal({
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

  const pick = (templateId: string) => {
    const params = new URLSearchParams({ template: templateId });
    if (initialDate) params.set("date", initialDate);
    onClose();
    navigate(`/app/plans/create?${params.toString()}`);
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New plan"
        className="bg-card w-full max-w-[560px] rounded-xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <p className="text-base font-medium text-foreground">New plan</p>
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
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pick(t.id)}
                className="px-3 py-1.5 text-sm border border-border rounded-full bg-card text-foreground hover:bg-accent hover:border-gray-300 transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Blank plan */}
          <button
            type="button"
            onClick={() => pick("blank")}
            className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-sm text-muted-foreground hover:border-gray-400 hover:text-foreground hover:bg-accent transition-colors"
          >
            + Blank Plan
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Filter = "all" | "active" | "draft" | "completed";

const FILTER_OPTS: { value: Filter; label: string }[] = [
  { value: "all",       label: "All"       },
  { value: "active",    label: "Active"    },
  { value: "draft",     label: "Draft"     },
  { value: "completed", label: "Completed" },
];

export function PlansIndex() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [plans, setPlans]   = useState<Plan[]>(MOCK_PLANS);
  const [modal, setModal]   = useState(false);

  // Load plans created via the create flow from sessionStorage
  useEffect(() => {
    const json = sessionStorage.getItem("created-plans");
    if (!json) return;
    try {
      const ids: string[] = JSON.parse(json);
      const loaded: Plan[] = ids.flatMap((id) => {
        const raw = sessionStorage.getItem(`plan-${id}`);
        return raw ? [JSON.parse(raw) as Plan] : [];
      });
      if (loaded.length) setPlans([...loaded, ...MOCK_PLANS]);
    } catch {}
  }, []);

  const shown = plans.filter((p) => {
    const q = search.toLowerCase();
    const occ = typeof p.linkedOccasion === "string"
      ? p.linkedOccasion
      : p.linkedOccasion?.title ?? "";
    const matchSearch =
      p.title.toLowerCase().includes(q) ||
      p.planFor.toLowerCase().includes(q) ||
      occ.toLowerCase().includes(q);
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden px-6 md:px-8 py-6">
      <NewPlanModal open={modal} onClose={() => setModal(false)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-1 shrink-0">
        <h1>Plans</h1>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
        >
          <Plus size={15} />
          New Plan
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-5 shrink-0">
        Coordinate details, people, and next steps.
      </p>

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5 shrink-0">
        <input
          type="text"
          placeholder="Search by title, person, or related occasion..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80 px-3 py-2 border border-border rounded text-sm placeholder:text-muted-foreground bg-input-background focus:outline-none focus:border-gray-300 transition-colors"
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
        Your Plans
      </p>

      {/* Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto mobile-inner-scroll-pb">
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No plans match your search.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4 items-start">
            {shown.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
