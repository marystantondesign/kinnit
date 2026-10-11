import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ItemCard } from "../components/items/ItemCard";
import {
  CardGrid,
  EmptyNote,
  FilterBar,
  ListPageFrame,
  ListPageHeader,
  SectionLabel,
  type Chip,
} from "../components/items/ListPage";
import { formatSpan, loadPlans, type PlanItem } from "../data/trackedItems";

// ─── Templates ───────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: "gathering", label: "Gathering or Event"  },
  { id: "trip",      label: "Trip or Travel"       },
  { id: "support",   label: "Support or Care"      },
  { id: "simple",    label: "Simple Coordination"  },
];


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

const CHIPS: Chip<Filter>[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
];

function PlanCard({ plan }: { plan: PlanItem }) {
  const meta = [
    plan.planFor ? `For ${plan.planFor}` : undefined,
    `Led by ${plan.leader}`,
    plan.planFor ? undefined : formatSpan(plan),
  ];
  return (
    <ItemCard
      look={{ type: "plan", icon: plan.icon }}
      title={plan.title}
      meta={meta}
      people={plan.participants}
      href={plan.href}
      draft={plan.status === "draft"}
      done={plan.status === "completed"}
    />
  );
}

export function PlansIndex() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [modal, setModal] = useState(false);
  const [plans] = useState(loadPlans);

  const q = query.trim().toLowerCase();
  const shown = plans.filter((p) => {
    const matchesSearch =
      !q || [p.title, p.planFor ?? "", p.leader, p.linked ?? "", ...p.participants].some((s) => s.toLowerCase().includes(q));
    return matchesSearch && (filter === "all" || p.status === filter);
  });

  return (
    <ListPageFrame>
      <NewPlanModal open={modal} onClose={() => setModal(false)} />
      <ListPageHeader
        title="Plans"
        description="Coordinate details, people, and next steps."
        newLabel="New Plan"
        onNew={() => setModal(true)}
      />
      <FilterBar query={query} onQuery={setQuery} placeholder="Search by title, person, or occasion…" chips={CHIPS} active={filter} onChip={setFilter} />
      <SectionLabel>Your plans</SectionLabel>
      {shown.length ? (
        <CardGrid>
          {shown.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </CardGrid>
      ) : (
        <EmptyNote>No plans match.</EmptyNote>
      )}
    </ListPageFrame>
  );
}
