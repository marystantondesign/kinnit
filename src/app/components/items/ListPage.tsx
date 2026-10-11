import { useState, type ReactNode } from "react";
import { CalendarDays, List, Plus, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

// Shared page controls for the Reminders, Plans and Occasions pages.
// Search and chips match the People page.

export type ListView = "list" | "calendar";

/** List/Calendar choice, remembered per page. */
export function useStoredView(page: string): [ListView, (v: ListView) => void] {
  const key = `kinnit.view.${page}`;
  const [view, setView] = useState<ListView>(() => {
    try {
      return localStorage.getItem(key) === "calendar" ? "calendar" : "list";
    } catch {
      return "list";
    }
  });
  const update = (v: ListView) => {
    setView(v);
    try {
      localStorage.setItem(key, v);
    } catch {}
  };
  return [view, update];
}

function ViewToggle({ view, onChange, className = "" }: { view: ListView; onChange: (v: ListView) => void; className?: string }) {
  const opts: { value: ListView; label: string; icon: typeof List }[] = [
    { value: "list", label: "List", icon: List },
    { value: "calendar", label: "Calendar", icon: CalendarDays },
  ];
  return (
    <div role="radiogroup" aria-label="View" className={`grid grid-cols-2 p-1 rounded-lg border border-border bg-card ${className}`}>
      {opts.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={view === value}
          onClick={() => onChange(value)}
          className={`h-8 px-3.5 rounded-md text-sm flex items-center justify-center gap-1.5 transition-colors ${
            view === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}

export function ListPageHeader({
  title,
  description,
  newLabel,
  onNew,
  view,
  onViewChange,
}: {
  title: string;
  description: string;
  newLabel: string;
  onNew: () => void;
  view?: ListView;
  onViewChange?: (v: ListView) => void;
}) {
  const hasToggle = view !== undefined && onViewChange !== undefined;
  return (
    <div className="mb-5">
      <div className="flex items-center md:items-start justify-between gap-4">
        <div className="min-w-0">
          <h1>{title}</h1>
          <p className="hidden md:block text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {hasToggle && <ViewToggle view={view} onChange={onViewChange} className="hidden md:grid" />}
          <Button type="button" onClick={onNew}>
            <Plus size={15} />
            <span className="md:hidden">New</span>
            <span className="hidden md:inline">{newLabel}</span>
          </Button>
        </div>
      </div>
      {hasToggle && <ViewToggle view={view} onChange={onViewChange} className="md:hidden mt-4 w-full" />}
    </div>
  );
}

export interface Chip<T extends string> {
  value: T;
  label: string;
}

export function FilterBar<T extends string>({
  query,
  onQuery,
  placeholder,
  chips,
  active,
  onChip,
}: {
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
  chips: Chip<T>[];
  active: T;
  onChip: (v: T) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
      <div className="relative w-full md:w-[var(--people-search-width)] flex-shrink-0">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input value={query} onChange={(e) => onQuery(e.target.value)} placeholder={placeholder} className="pl-9" aria-label="Search" />
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5 -mb-0.5 -mx-6 px-6 md:mx-0 md:px-0">
        {chips.map((chip) => (
          <Button
            key={chip.value}
            type="button"
            variant={active === chip.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChip(chip.value)}
            className="rounded-full flex-shrink-0"
            aria-pressed={active === chip.value}
          >
            {chip.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">{children}</p>;
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{children}</div>;
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

/** Standard page frame: 24px side padding on mobile. */
export function ListPageFrame({ children }: { children: ReactNode }) {
  return <div className="px-6 md:px-10 py-6 md:py-8 max-w-[1400px]">{children}</div>;
}
