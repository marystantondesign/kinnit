import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { ReminderModal } from "../components/ReminderModal";
import { Button } from "../components/ui/button";
import { getOpenSurveyRequests } from "../utils/surveyRequests";
import { getAllCreatedOccasions } from "../utils/occasionStorage";
import { getAllCreatedPlans } from "../utils/planStorage";
import {
  getAllCreatedReminders,
  type ReminderData,
} from "../utils/reminderStorage";
import { NewOccasionModal } from "./OccasionsIndex";
import { NewPlanModal } from "./PlansIndex";
import { useTalkToKinnit } from "../components/talk/TalkToKinnit";
import { ItemBadge, ItemDot } from "../components/ItemBadge";
import {
  familyColors,
  occasionIconFor,
  planIconFor,
  reminderIconFor,
  type ItemFamily,
  type ItemLook,
} from "../config/itemTypes";
import { DATA_CHANGED_EVENT } from "../utils/voiceActions";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flag,
  Bell,
  User,
  Search,
  X,
  Clipboard,
  Mic,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimelineItem {
  id: string;
  type: "occasion" | "plan" | "reminder";
  title: string;
  subtext: string;
  date: Date;
  detailPath: string;
  /** Situation icon key; inferred from the title/category when missing */
  icon?: string;
  completed?: boolean;
}

type CreationType = "occasion" | "plan" | "reminder";

interface AttentionItem {
  id: string;
  title: string;
  context: string;
  href: string;
  type: ItemFamily;
}

interface PersonData {
  id: string;
  name: string;
  relationship: string;
  initials: string;
  profileHref: string;
}

interface SearchResult {
  id: string;
  type: "occasion" | "plan" | "reminder" | "person";
  title: string;
  dateLabel: string;
  href: string;
  personIds: string[];
  isFuture: boolean;
}

type TypedResults =
  | { mode: "person"; person: PersonData; upcoming: SearchResult[]; past: SearchResult[] }
  | { mode: "category"; groups: Partial<Record<SearchResult["type"], SearchResult[]>> }
  | null;

// ─── Mock data ────────────────────────────────────────────────────────────────

const BASE_TIMELINE_ITEMS: TimelineItem[] = [
  // Today's items (Oct 2, 2026) — matched to reference image
  { id: "today1", type: "reminder", title: "Call Mom",                   subtext: "Care Reminder",      date: new Date(2026, 9,  2),  detailPath: "/app/reminders/6", completed: true },
  { id: "today2", type: "plan",     title: "Lake House Weekend prep",     subtext: "Plan",               date: new Date(2026, 9,  2),  detailPath: "/app/plans/6"     },
  // Upcoming timeline items
  { id: "r1",     type: "reminder", title: "Send birthday card to Sarah", subtext: "Care Reminder",      date: new Date(2026, 9,  5),  detailPath: "/app/reminders/1" },
  { id: "o1",     type: "occasion", title: "Emma's Follow-up Appointment",subtext: "Illness or Recovery",date: new Date(2026, 9, 15),  detailPath: "/app/occasions/2" },
  { id: "o2",     type: "occasion", title: "James Wilson's Anniversary",  subtext: "Anniversary",        date: new Date(2026, 9, 20),  detailPath: "/app/occasions/4" },
  { id: "o3",     type: "occasion", title: "Michael's Birthday",          subtext: "Birthday",           date: new Date(2026, 10, 3),  detailPath: "/app/occasions/3" },
  { id: "p1",     type: "plan",     title: "Holiday Planning Kickoff",    subtext: "Plan",               date: new Date(2026, 10, 14), detailPath: "/app/plans/1"     },
  { id: "o4",     type: "occasion", title: "Sarah's Birthday",            subtext: "Birthday",           date: new Date(2026, 11, 14), detailPath: "/app/occasions/1" },
  { id: "p2",     type: "plan",     title: "Holiday Gathering Planning",  subtext: "Plan",               date: new Date(2026, 11, 10), detailPath: "/app/plans/2"     },
  // April 18 multi-dot demo — referenced in day sheet image
  { id: "apr18a", type: "reminder", title: "Send birthday card to Sarah", subtext: "Care Reminder",      date: new Date(2026, 3, 18),  detailPath: "/app/reminders/1" },
  { id: "apr18b", type: "plan",     title: "Birthday Dinner Planning",    subtext: "With Sarah, Michael",date: new Date(2026, 3, 18),  detailPath: "/app/plans/1"     },
  { id: "apr18c", type: "occasion", title: "Sarah's Birthday",            subtext: "Turning 32",         date: new Date(2026, 3, 18),  detailPath: "/app/occasions/1" },
];

const RECENT_ACTIVITY = [
  { id: "a1", text: "Note added for Sarah",            meta: "Sep 18" },
  { id: "a2", text: "Birthday Dinner Planning closed", meta: "Sep 14" },
];

const ATTENTION_ITEMS: AttentionItem[] = [
  { id: "at1", title: "Send birthday card to Sarah",     context: "Due in 3 days",   href: "/app/reminders/1", type: "reminder" },
  { id: "at2", title: "David Martinez wants to connect", context: "Pending invite",  href: "/app/people",      type: "people"   },
  { id: "at3", title: "Holiday Planning Kickoff",        context: "Missing details", href: "/app/plans/1",     type: "plan"     },
];

// ─── Search data ──────────────────────────────────────────────────────────────

const PEOPLE: PersonData[] = [
  { id: "1", name: "Sarah Johnson",  relationship: "Friend",   initials: "SJ", profileHref: "/app/people/1" },
  { id: "2", name: "Michael Chen",   relationship: "Partner",  initials: "MC", profileHref: "/app/people/2" },
  { id: "3", name: "Emma Davis",     relationship: "Sister",   initials: "ED", profileHref: "/app/people/3" },
  { id: "4", name: "David Martinez", relationship: "Coworker", initials: "DM", profileHref: "/app/people/4" },
  { id: "5", name: "Lisa Anderson",  relationship: "Friend",   initials: "LA", profileHref: "/app/people/5" },
  { id: "6", name: "James Wilson",   relationship: "Brother",  initials: "JW", profileHref: "/app/people/6" },
];

const SEARCH_DATA: SearchResult[] = [
  { id: "o1",  type: "occasion", title: "Sarah's Birthday",           dateLabel: "Dec 14", href: "/app/occasions/1",  personIds: ["1"],     isFuture: true  },
  { id: "p3",  type: "plan",     title: "Dinner with Sarah",          dateLabel: "Fri",    href: "/app/plans/3",     personIds: ["1"],     isFuture: true  },
  { id: "r1",  type: "reminder", title: "Send birthday card to Sarah",dateLabel: "Apr 8",  href: "/app/reminders/1", personIds: ["1"],     isFuture: false },
  { id: "p1",  type: "plan",     title: "Birthday Dinner Planning",   dateLabel: "Apr 14", href: "/app/plans/1",     personIds: ["1"],     isFuture: false },
  { id: "p4",  type: "plan",     title: "Hiking Trip",                dateLabel: "Aug 2",  href: "/app/plans/2",     personIds: ["1","2"], isFuture: false },
  { id: "o2",  type: "occasion", title: "Emma's Surgery",             dateLabel: "Jun 2",  href: "/app/occasions/2", personIds: ["3"],     isFuture: false },
  { id: "p2",  type: "plan",     title: "Recovery Support Schedule",  dateLabel: "Jun 2",  href: "/app/plans/4",     personIds: ["3"],     isFuture: false },
  { id: "r2",  type: "reminder", title: "Check in with Emma",         dateLabel: "Oct 5",  href: "/app/reminders/2", personIds: ["3"],     isFuture: true  },
  { id: "o3",  type: "occasion", title: "Michael's Birthday",         dateLabel: "Nov 3",  href: "/app/occasions/3", personIds: ["2"],     isFuture: true  },
  { id: "p5",  type: "plan",     title: "Mexico Trip Planning",       dateLabel: "Jul 10", href: "/app/plans/5",     personIds: [],        isFuture: false },
];

function computeResults(query: string): TypedResults {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const person = PEOPLE.find((p) => p.name.toLowerCase().includes(q));
  if (person) {
    const all = SEARCH_DATA.filter((r) => r.personIds.includes(person.id));
    return {
      mode: "person",
      person,
      upcoming: all.filter((r) => r.isFuture),
      past: all.filter((r) => !r.isFuture),
    };
  }
  const matched = SEARCH_DATA.filter((r) => r.title.toLowerCase().includes(q));
  const groups: Partial<Record<SearchResult["type"], SearchResult[]>> = {};
  for (const r of matched) {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type]!.push(r);
  }
  return { mode: "category", groups };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Family + situation icon for a timeline item (see config/itemTypes). */
function lookFor(item: TimelineItem): ItemLook {
  if (item.type === "reminder") return { type: "reminder", icon: reminderIconFor(item.title, item.icon) };
  if (item.type === "plan") return { type: "plan", icon: planIconFor(item.title, item.icon) };
  return { type: "occasion", icon: occasionIconFor(item.subtext, item.title, item.icon) };
}

function fmt(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateInput(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function loadCreatedTimelineItems(): TimelineItem[] {
  const occasions = getAllCreatedOccasions().flatMap((occasion) => {
    const storedDate =
      occasion.timing.mode === "single"
        ? occasion.timing.singleDate
        : occasion.timing.startDate;
    const date = fromDateInput(storedDate);
    if (!date) return [];

    return [{
      id: `created-${occasion.id}`,
      type: "occasion" as const,
      title: occasion.title,
      subtext: occasion.type,
      date,
      detailPath: `/app/occasions/${occasion.id}`,
    }];
  });

  const seenPlanIds = new Set<string>();
  const plans = getAllCreatedPlans().flatMap((plan) => {
    if (seenPlanIds.has(plan.id)) return [];
    seenPlanIds.add(plan.id);

    const storedDate =
      plan.timing.mode === "single"
        ? plan.timing.singleDate
        : plan.timing.startDate;
    const date = fromDateInput(storedDate);
    if (!date) return [];

    return [{
      id: `created-${plan.id}`,
      type: "plan" as const,
      title: plan.title,
      subtext: "Plan",
      date,
      detailPath: `/app/plans/${plan.id}`,
    }];
  });

  const reminders = getAllCreatedReminders().flatMap((reminder) => {
    const date = fromDateInput(reminder.date);
    if (!date) return [];

    return [{
      id: `created-${reminder.id}`,
      type: "reminder" as const,
      title: reminder.action,
      subtext: "Care Reminder",
      date,
      detailPath: "/app/reminders",
    }];
  });

  return [...occasions, ...plans, ...reminders];
}

function reminderToTimelineItem(reminder: ReminderData): TimelineItem | null {
  const date = fromDateInput(reminder.date);
  if (!date) return null;

  return {
    id: `created-${reminder.id}`,
    type: "reminder",
    title: reminder.action,
    subtext: "Care Reminder",
    date,
    detailPath: "/app/reminders",
  };
}

function useDesktopViewport() {
  const [isDesktop, setIsDesktop] = useState(() =>
    window.matchMedia("(min-width: 768px)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateViewport = () => setIsDesktop(mediaQuery.matches);

    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  return isDesktop;
}

function typeLabel(type: SearchResult["type"]) {
  if (type === "occasion") return "Occasion";
  if (type === "plan")     return "Plan";
  if (type === "reminder") return "Reminder";
  return "Person";
}

// ─── Search components ────────────────────────────────────────────────────────

function ResultIcon({ type }: { type: SearchResult["type"] }) {
  return <ItemBadge type={type === "person" ? "people" : type} size="xs" />;
}

function SearchSectionLabel({ label }: { label: string }) {
  return (
    <div className="px-4 pt-3 pb-1">
      <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">{label}</span>
    </div>
  );
}

function SearchResultRow({ r, onClose }: { r: SearchResult; onClose: () => void }) {
  return (
    <Link
      to={r.href}
      onClick={onClose}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors"
    >
      <ResultIcon type={r.type} />
      <span className="text-sm flex-1 truncate text-foreground">{r.title}</span>
      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
        {r.dateLabel} · {typeLabel(r.type)}
      </span>
    </Link>
  );
}

function PersonResultCard({
  person,
  upcoming,
  onClose,
}: {
  person: PersonData;
  upcoming: SearchResult[];
  onClose: () => void;
}) {
  const shown = upcoming.slice(0, 2);
  const firstName = person.name.split(" ")[0];

  return (
    <div>
      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        {/* Profile row */}
        <Link
          to={person.profileHref}
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0 select-none">
            {person.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{person.name}</p>
            <p className="text-xs text-muted-foreground">{person.relationship}</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
        </Link>

        {/* Upcoming items */}
        {shown.length > 0 && (
          <>
            <SearchSectionLabel label="Upcoming" />
            {shown.map((r) => (
              <Link
                key={r.id}
                to={r.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors"
              >
                <ResultIcon type={r.type} />
                <span className="text-sm flex-1 truncate text-foreground">{r.title}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{r.dateLabel}</span>
              </Link>
            ))}
          </>
        )}

      </div>
    </div>
  );
}

function SearchDropdown({ results, onClose }: { results: TypedResults; onClose: () => void }) {
  if (!results) return null;

  // Person result — full profile card
  if (results.mode === "person") {
    return (
      <div className="absolute top-full left-0 mt-1 w-full z-40">
        <PersonResultCard person={results.person} upcoming={results.upcoming} onClose={onClose} />
      </div>
    );
  }

  // Category result — standard dropdown
  const noResults = <div className="px-4 py-3 text-sm text-muted-foreground">No results found.</div>;
  const ORDER: SearchResult["type"][] = ["occasion", "plan", "reminder", "person"];
  const active = ORDER.filter((t) => (results.groups[t]?.length ?? 0) > 0);

  const shell = (children: React.ReactNode) => (
    <div className="absolute top-full left-0 mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-40 overflow-hidden pb-1">
      {children}
    </div>
  );

  if (!active.length) return shell(noResults);
  return shell(
    <>
      {active.map((type, i) => (
        <div key={type} className={i > 0 ? "border-t border-border" : ""}>
          <SearchSectionLabel label={`${typeLabel(type)}s`} />
          {results.groups[type]!.map((r) => <SearchResultRow key={r.id} r={r} onClose={onClose} />)}
        </div>
      ))}
    </>
  );
}

// ─── Today card ───────────────────────────────────────────────────────────────

function TodayCard({ items }: { items: TimelineItem[] }) {
  if (!items.length) return null;

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="border border-border bg-card rounded-lg overflow-hidden mb-5 flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Today · {todayLabel}</p>
      </div>

      {/* Items */}
      {items.map((item) => (
        <Link
          key={item.id}
          to={item.detailPath}
          className={`flex items-center gap-3 px-4 py-3 border-t border-border hover:bg-accent transition-colors ${
            item.completed ? "opacity-60" : ""
          }`}
        >
          <ItemBadge {...lookFor(item)} size="sm" />
          <div className="min-w-0">
            <p className="text-sm text-foreground truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground truncate">{item.subtext}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Mobile search + compact + button row ─────────────────────────────────────

function MobileSearchRow({ onNewReminder }: { onNewReminder: () => void }) {
  const { openTalk } = useTalkToKinnit();
  const [query, setQuery]     = useState("");
  const [open, setOpen]       = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const newRef    = useRef<HTMLDivElement>(null);
  const results   = computeResults(query);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (newRef.current && !newRef.current.contains(e.target as Node)) setNewOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const clearSearch = () => { setQuery(""); setOpen(false); };

  return (
    <div className="flex gap-2 md:hidden mb-5 flex-shrink-0">
      {/* Search input */}
      <div className="relative flex-1" ref={searchRef}>
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search people, occasions..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(!!e.target.value.trim()); }}
          onFocus={() => query.trim() && setOpen(true)}
          className="w-full pl-8 pr-8 py-2.5 text-sm rounded-lg bg-input-background border-0 focus:outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted flex items-center justify-center"
          >
            <X size={9} className="text-muted-foreground" />
          </button>
        )}
        {open && results && <SearchDropdown results={results} onClose={clearSearch} />}
      </div>

      {/* Talk to Kinnit */}
      <button
        type="button"
        onClick={openTalk}
        aria-label="Talk to Kinnit"
        className="w-10 h-10 flex-shrink-0 rounded-lg border border-border bg-card flex items-center justify-center text-foreground hover:bg-accent transition-colors"
      >
        <Mic size={18} />
      </button>

      {/* Compact + button */}
      <div className="relative flex-shrink-0" ref={newRef}>
        <button
          type="button"
          onClick={() => setNewOpen((p) => !p)}
          aria-label="New item"
          className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
        </button>

        {newOpen && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded shadow-md z-20 overflow-hidden">
            <Link
              to="/app/occasions/create"
              onClick={() => setNewOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent"
            >
              <ItemBadge type="occasion" size="xs" />
              New Occasion
            </Link>
            <Link
              to="/app/plans/create"
              onClick={() => setNewOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent"
            >
              <ItemBadge type="plan" size="xs" />
              New Plan
            </Link>
            <button
              type="button"
              onClick={() => { setNewOpen(false); onNewReminder(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent"
            >
              <ItemBadge type="reminder" size="xs" />
              New Reminder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ label, subtitle }: { label: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <p className="text-base font-semibold text-foreground">{label}</p>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ─── Desktop + New dropdown ───────────────────────────────────────────────────

function NewButton({ onNewReminder }: { onNewReminder: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity"
      >
        <Plus size={15} />
        New
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded shadow-md z-20 overflow-hidden">
          <Link to="/app/occasions/create" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent">
            <ItemBadge type="occasion" size="xs" />
            New Occasion
          </Link>
          <Link to="/app/plans/create" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent">
            <ItemBadge type="plan" size="xs" />
            New Plan
          </Link>
          <button
            type="button"
            onClick={() => { setOpen(false); onNewReminder(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent"
          >
            <ItemBadge type="reminder" size="xs" />
            New Reminder
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Timeline column ──────────────────────────────────────────────────────────

function TimelineColumn({ items }: { items: TimelineItem[] }) {
  // Exclude today's items — they're shown in the Today card above
  const today = new Date();
  const upcomingItems = items.filter(
    (item) =>
      !(
        item.date.getDate() === today.getDate() &&
        item.date.getMonth() === today.getMonth() &&
        item.date.getFullYear() === today.getFullYear()
      )
  );

  return (
    <div>
      <SectionHeading label="Timeline" subtitle="Upcoming moments that matter" />

      <div className="relative space-y-2">
        <div className="hidden md:block absolute left-[4px] top-2 bottom-2 w-px bg-border" />

        {upcomingItems.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <ItemDot type={item.type} completed={item.completed} size={10} className="mt-2.5 z-10 ring-2 ring-background bg-background" />
            <Link
              to={item.detailPath}
              className="flex-1 border border-border rounded px-3 py-2 hover:bg-accent flex items-center justify-between gap-3 min-w-0 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm truncate text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.subtext}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{fmt(item.date)}</span>
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-2">Recent activity</p>
        <div className="space-y-1.5">
          {RECENT_ACTIVITY.map((a) => (
            <p key={a.id} className="text-sm text-muted-foreground">
              {a.text}
              <span className="ml-2 text-xs text-muted-foreground/60">·&nbsp;{a.meta}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Day detail overlays ──────────────────────────────────────────────────────

function DayDetailItems({
  items,
  onClose,
}: {
  items: TimelineItem[];
  onClose: () => void;
}) {
  return (
    <>
      {items.map((item, i) => {
        return (
          <Link
            key={item.id}
            to={item.detailPath}
            onClick={onClose}
            className={`flex items-stretch gap-3 py-3 hover:bg-accent -mx-5 px-5 transition-colors ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <div className="w-[3px] rounded-full flex-shrink-0" style={{ background: familyColors(item.type).dot }} />
            <div className="flex-1 min-w-0 py-0.5">
              <p className="text-sm font-medium text-foreground leading-snug">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.subtext}</p>
            </div>
            <ItemBadge {...lookFor(item)} size="sm" className="self-center" />
          </Link>
        );
      })}
    </>
  );
}

function DayAddActions({ onAdd }: { onAdd: (type: CreationType) => void }) {
  const actions = [
    { type: "occasion" as const, label: "Occasion" },
    { type: "plan" as const, label: "Plan" },
    { type: "reminder" as const, label: "Reminder" },
  ];

  return (
    <div className="border-t border-border pt-4 pb-1">
      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">
        Add to this day
      </p>
      <div className="flex gap-2">
        {actions.map(({ type, label }) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAdd(type)}
            className="flex-1 min-w-0 rounded-lg bg-card px-2 text-xs"
          >
            <ItemBadge type={type} size="xs" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function DayDetailSheet({
  items,
  date,
  onClose,
  onAdd,
}: {
  items: TimelineItem[];
  date: Date;
  onClose: () => void;
  onAdd: (type: CreationType) => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-card rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        {/* Header */}
        <div className="px-6 pt-2 pb-3 flex-shrink-0">
          <p className="text-lg font-semibold text-foreground">{dateStr}</p>
          <p className="text-sm text-muted-foreground">
            {items.length > 0
              ? `${items.length} thing${items.length !== 1 ? "s" : ""} on this day`
              : "Nothing scheduled"}
          </p>
        </div>

        <div className="overflow-y-auto px-6 flex-1 mobile-sheet-pb">
          {items.length > 0 ? (
            <DayDetailItems items={items} onClose={onClose} />
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-foreground">Nothing planned for this day yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add something below</p>
            </div>
          )}
          <DayAddActions onAdd={onAdd} />
        </div>
      </div>
    </div>,
    document.body
  );
}

function DayDetailDialog({
  items,
  date,
  onClose,
  onAdd,
}: {
  items: TimelineItem[];
  date: Date;
  onClose: () => void;
  onAdd: (type: CreationType) => void;
}) {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-xl sm:max-w-[440px]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <DialogTitle className="text-base text-foreground">{dateStr}</DialogTitle>
            <DialogDescription className="mt-0.5">
              {items.length > 0
                ? `${items.length} thing${items.length !== 1 ? "s" : ""} on this day`
                : "Nothing scheduled"}
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-full bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Close day details"
            >
              <X size={16} />
            </Button>
          </DialogClose>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {items.length > 0 ? (
            <DayDetailItems items={items} onClose={onClose} />
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-foreground">Nothing planned for this day yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add something below</p>
            </div>
          )}
          <DayAddActions onAdd={onAdd} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Mini calendar ────────────────────────────────────────────────────────────

function MiniCalendar({
  items,
  onAdd,
}: {
  items: TimelineItem[];
  onAdd: (type: CreationType, date: Date) => void;
}) {
  const todayDate = new Date();
  const [view, setView]           = useState(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
  const [calView, setCalView]     = useState<"week" | "month">("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const isDesktop = useDesktopViewport();

  const year  = view.getFullYear();
  const month = view.getMonth();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth    = new Date(year, month + 1, 0).getDate();

  // Map day number → items on that day (preserves duplicates for multi-dot)
  const byDay = new Map<number, TimelineItem[]>();
  for (const item of items) {
    if (item.date.getFullYear() === year && item.date.getMonth() === month) {
      const d = item.date.getDate();
      if (!byDay.has(d)) byDay.set(d, []);
      byDay.get(d)!.push(item);
    }
  }

  const monthLabel = view.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const isToday = (d: number) =>
    d === todayDate.getDate() &&
    month === todayDate.getMonth() &&
    year === todayDate.getFullYear();

  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const handleDayClick = (day: number) => {
    setSelectedDay(new Date(year, month, day));
  };

  const selectedItems = selectedDay
    ? (byDay.get(selectedDay.getDate()) ?? [])
    : [];

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setView(new Date(year, month - 1, 1))}
            className="w-7 h-7 flex items-center justify-center rounded border border-border hover:bg-accent transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={13} className="text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => setView(new Date(year, month + 1, 1))}
            className="w-7 h-7 flex items-center justify-center rounded border border-border hover:bg-accent transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={13} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Week / Month toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden mb-3">
        <button
          type="button"
          onClick={() => setCalView("week")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            calView === "week"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Week
        </button>
        <button
          type="button"
          onClick={() => setCalView("month")}
          className={`flex-1 py-2 text-sm font-medium border-l border-border transition-colors ${
            calView === "month"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Month
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="h-8" />;
          const items = byDay.get(day) ?? [];
          const today = isToday(day);
          const hasItems = items.length > 0;

          return (
            <div
              key={day}
              className="flex flex-col items-center h-8 justify-center cursor-pointer"
              onClick={() => handleDayClick(day)}
            >
              <div
                className={`w-6 h-6 flex items-center justify-center text-[11px] rounded-full transition-colors ${
                  today
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                {day}
              </div>
              {hasItems && (
                <div className="flex gap-px mt-0.5">
                  {items.slice(0, 3).map((item, i) => (
                    <ItemDot key={i} type={item.type} completed={item.completed} size={4} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Day detail overlay: dialog on md+, bottom sheet on phones */}
      {selectedDay && (
        isDesktop ? (
          <DayDetailDialog
            items={selectedItems}
            date={selectedDay}
            onClose={() => setSelectedDay(null)}
            onAdd={(type) => {
              const date = selectedDay;
              setSelectedDay(null);
              onAdd(type, date);
            }}
          />
        ) : (
          <DayDetailSheet
            items={selectedItems}
            date={selectedDay}
            onClose={() => setSelectedDay(null)}
            onAdd={(type) => {
              const date = selectedDay;
              setSelectedDay(null);
              onAdd(type, date);
            }}
          />
        )
      )}
    </div>
  );
}

// ─── Home secondary columns ───────────────────────────────────────────────────

function SurveyRequestSummary({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <Link
      to="/app/about-me"
      className="flex items-center gap-3 border border-border bg-muted/40 px-4 py-3.5 rounded-[var(--request-card-radius)] hover:bg-muted/70 transition-colors"
    >
      <div className="size-10 rounded-lg border border-border bg-card flex items-center justify-center flex-shrink-0">
        <Clipboard size={16} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {count} survey request{count !== 1 ? "s" : ""}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          Friends want to know more about you
        </p>
      </div>
      <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
    </Link>
  );
}

function AttentionColumn({ surveyRequestCount }: { surveyRequestCount: number }) {
  return (
    <div>
      <SectionHeading label="Needs your attention" subtitle="Things waiting on you" />
      <div className="space-y-2.5">
        {ATTENTION_ITEMS.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className="flex items-center gap-3 border border-border bg-card px-4 py-3.5 rounded-[var(--request-card-radius)] hover:bg-accent transition-colors"
          >
            <ItemDot type={item.type} />
            <div className="min-w-0">
              <p className="text-sm text-foreground truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.context}</p>
            </div>
          </Link>
        ))}
        <SurveyRequestSummary count={surveyRequestCount} />
      </div>
    </div>
  );
}

function CalendarColumn({
  items,
  onAdd,
}: {
  items: TimelineItem[];
  onAdd: (type: CreationType, date: Date) => void;
}) {
  return <MiniCalendar items={items} onAdd={onAdd} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function getTodayItems(items: TimelineItem[]): TimelineItem[] {
  const today = new Date();
  return items.filter(
    (item) =>
      item.date.getDate() === today.getDate() &&
      item.date.getMonth() === today.getMonth() &&
      item.date.getFullYear() === today.getFullYear()
  );
}

export function Home() {
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderInitialDate, setReminderInitialDate] = useState("");
  const [occasionOpen, setOccasionOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [creationDate, setCreationDate] = useState("");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(() => [
    ...BASE_TIMELINE_ITEMS,
    ...loadCreatedTimelineItems(),
  ]);
  const { openTalk } = useTalkToKinnit();

  // Pick up items saved from Talk to Kinnit
  useEffect(() => {
    const reload = () => setTimelineItems([...BASE_TIMELINE_ITEMS, ...loadCreatedTimelineItems()]);
    window.addEventListener(DATA_CHANGED_EVENT, reload);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, reload);
  }, []);
  const todayItems = getTodayItems(timelineItems);
  const surveyRequestCount = getOpenSurveyRequests().length;

  const openCreation = (type: CreationType, date: Date) => {
    const dateInput = toDateInput(date);
    setCreationDate(dateInput);

    if (type === "occasion") setOccasionOpen(true);
    if (type === "plan") setPlanOpen(true);
    if (type === "reminder") {
      setReminderInitialDate(dateInput);
      setReminderOpen(true);
    }
  };

  const openReminderWithoutDate = () => {
    setReminderInitialDate("");
    setReminderOpen(true);
  };

  const handleReminderSaved = (reminder: ReminderData) => {
    const item = reminderToTimelineItem(reminder);
    if (item) setTimelineItems((current) => [...current, item]);
  };

  return (
    <div className="px-6 py-5 md:h-full md:flex md:flex-col md:overflow-hidden">

      <NewOccasionModal
        open={occasionOpen}
        onClose={() => setOccasionOpen(false)}
        initialDate={creationDate}
      />
      <NewPlanModal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        initialDate={creationDate}
      />
      <ReminderModal
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        initialDate={reminderInitialDate}
        onSaved={handleReminderSaved}
      />

      {/* Greeting */}
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{getGreeting()}, Mary</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {"Here's what's coming up across your people."}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={openTalk}
            className="flex items-center gap-1.5 px-4 py-2 border border-border bg-card text-foreground text-sm font-medium rounded hover:bg-accent transition-colors"
          >
            <Mic size={15} />
            Talk to Kinnit
          </button>
          <NewButton onNewReminder={openReminderWithoutDate} />
        </div>
      </div>

      {/* Mobile: search + plus button row */}
      <MobileSearchRow onNewReminder={openReminderWithoutDate} />

      {/* Today card (mobile, conditional) */}
      <div className="md:hidden">
        <TodayCard items={todayItems} />
      </div>

      {/* Three-column grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_var(--home-attention-column-width)_var(--home-calendar-column-width)] md:gap-[var(--home-column-gap)] md:flex-1 md:min-h-0">
        <div className="md:overflow-y-auto md:pr-1">
          <TimelineColumn items={timelineItems} />
        </div>
        <div className="order-3 md:order-none md:overflow-y-auto">
          <AttentionColumn surveyRequestCount={surveyRequestCount} />
        </div>
        <div className="order-2 md:order-none md:overflow-y-auto">
          <CalendarColumn items={timelineItems} onAdd={openCreation} />
        </div>
      </div>

    </div>
  );
}
