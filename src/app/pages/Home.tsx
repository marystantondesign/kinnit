import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { ReminderModal } from "../components/ReminderModal";
import { NewOccasionModal } from "./OccasionsIndex";
import { NewPlanModal } from "./PlansIndex";
import { useTalkToKinnit } from "../components/talk/TalkToKinnit";
import { ItemBadge } from "../components/ItemBadge";
import { DATA_CHANGED_EVENT } from "../utils/voiceActions";
import { loadDashboardEntries } from "../data/dashboard";
import {
  BirthdaysPanel,
  CalendarPanel,
  ComingUpPanel,
  TodayPanel,
} from "../components/home/DashboardModules";
import { DiscoveryCard } from "../components/discoveries/DiscoveryCard";
import { Plus, ChevronDown, ChevronRight, Search, X, Mic } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CreationType = "occasion" | "plan" | "reminder";

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
function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
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
        className="flex items-center gap-1.5 px-3.5 h-9 bg-primary text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity"
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Home() {
  const { openTalk } = useTalkToKinnit();
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderInitialDate, setReminderInitialDate] = useState("");
  const [occasionOpen, setOccasionOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [creationDate, setCreationDate] = useState("");
  const [entries, setEntries] = useState(loadDashboardEntries);

  // Pick up items saved elsewhere (Talk to Kinnit, the New menu)
  useEffect(() => {
    const reload = () => setEntries(loadDashboardEntries());
    window.addEventListener(DATA_CHANGED_EVENT, reload);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, reload);
  }, []);

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

  return (
    <div className="px-6 md:px-8 py-4 md:py-3 max-w-[1440px]">
      <NewOccasionModal open={occasionOpen} onClose={() => setOccasionOpen(false)} initialDate={creationDate} />
      <NewPlanModal open={planOpen} onClose={() => setPlanOpen(false)} initialDate={creationDate} />
      <ReminderModal
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        initialDate={reminderInitialDate}
        onSaved={() => setEntries(loadDashboardEntries())}
      />

      {/* Greeting */}
      <div className="flex items-center justify-between gap-4 mb-2.5">
        <div className="md:flex md:items-baseline md:gap-3">
          <h1 className="text-xl font-semibold text-foreground leading-tight">{getGreeting()}, Mary</h1>
          <p className="text-[13px] text-muted-foreground">{"Here's what's coming up across your people."}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={openTalk}
            className="flex items-center gap-1.5 px-3.5 h-9 border border-border bg-card text-foreground text-sm font-medium rounded hover:bg-accent transition-colors"
          >
            <Mic size={15} />
            Talk to Kinnit
          </button>
          <NewButton onNewReminder={openReminderWithoutDate} />
        </div>
      </div>

      {/* Mobile: search + talk + new */}
      <MobileSearchRow onNewReminder={openReminderWithoutDate} />

      {/* Two columns on desktop (≈44 / 56); stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,44fr)_minmax(0,56fr)] gap-4 items-start">
        <div className="space-y-3 min-w-0">
          <TodayPanel entries={entries} />
          <ComingUpPanel entries={entries} />
          <BirthdaysPanel />
        </div>
        <div className="space-y-3 min-w-0">
          <CalendarPanel entries={entries} onAdd={openCreation} />
          <DiscoveryCard />
        </div>
      </div>
    </div>
  );
}
