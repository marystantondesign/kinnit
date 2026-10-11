import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router";
import {
  Users,
  Calendar,
  Flag,
  Bell,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  User,
  Settings,
  LogOut,
  Home,
} from "lucide-react";
import { NotificationsBell } from "../components/notifications/NotificationsBell";
import { TalkToKinnitProvider } from "../components/talk/TalkToKinnit";
import { ItemBadge } from "../components/ItemBadge";

// ─── Search data ─────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  type: "occasion" | "plan" | "reminder" | "person";
  title: string;
  dateLabel: string;
  href: string;
  personIds: string[];
  isFuture: boolean;
}

interface PersonData {
  id: string;
  name: string;
  relationship: string;
  initials: string;
  profileHref: string;
}

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
  { id: "pr1", type: "person",   title: "Note added",                 dateLabel: "Jul 18", href: "/app/people/1",    personIds: ["1"],     isFuture: false },
  { id: "o2",  type: "occasion", title: "Emma's Surgery",             dateLabel: "Jun 2",  href: "/app/occasions/2", personIds: ["3"],     isFuture: false },
  { id: "p2",  type: "plan",     title: "Recovery Support Schedule",  dateLabel: "Jun 2",  href: "/app/plans/4",     personIds: ["3"],     isFuture: false },
  { id: "r2",  type: "reminder", title: "Check in with Emma",         dateLabel: "Oct 5",  href: "/app/reminders/2", personIds: ["3"],     isFuture: true  },
  { id: "o3",  type: "occasion", title: "Michael's Birthday",         dateLabel: "Nov 3",  href: "/app/occasions/3", personIds: ["2"],     isFuture: true  },
  { id: "p5",  type: "plan",     title: "Mexico Trip Planning",       dateLabel: "Jul 10", href: "/app/plans/5",     personIds: [],        isFuture: false },
];

type TypedResults =
  | { mode: "person"; person: PersonData; upcoming: SearchResult[]; past: SearchResult[] }
  | { mode: "category"; groups: Partial<Record<SearchResult["type"], SearchResult[]>> }
  | null;

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

// ─── Search UI ────────────────────────────────────────────────────────────────

function typeLabel(type: SearchResult["type"]) {
  if (type === "occasion") return "Occasion";
  if (type === "plan")     return "Plan";
  if (type === "reminder") return "Reminder";
  return "Person";
}

function ResultIcon({ type }: { type: SearchResult["type"] }) {
  return <ItemBadge type={type === "person" ? "people" : type} size="xs" />;
}

function ResultRow({ r, onClose }: { r: SearchResult; onClose: () => void }) {
  return (
    <Link
      to={r.href}
      onClick={onClose}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
    >
      <ResultIcon type={r.type} />
      <span className="text-sm flex-1 truncate">{r.title}</span>
      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
        {r.dateLabel} · {typeLabel(r.type)}
      </span>
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-4 pt-3 pb-1">
      <span className="text-[11px] font-medium tracking-widest text-gray-400 uppercase">
        {label}
      </span>
    </div>
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
    <div className="absolute top-full left-0 mt-1 w-full z-40">
      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-md">
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

        {/* Upcoming */}
        {shown.length > 0 && (
          <>
            <div className="px-4 pt-3 pb-1">
              <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">Upcoming</span>
            </div>
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

  // Person result — profile card
  if (results.mode === "person") {
    return <PersonResultCard person={results.person} upcoming={results.upcoming} onClose={onClose} />;
  }

  // Category result — standard grouped dropdown
  const noResults = <div className="px-4 py-3 text-sm text-muted-foreground">No results found.</div>;
  const ORDER: SearchResult["type"][] = ["occasion", "plan", "reminder", "person"];
  const active = ORDER.filter((t) => (results.groups[t]?.length ?? 0) > 0);

  const shell = (children: React.ReactNode) => (
    <div className="absolute top-full left-0 mt-1 w-full bg-card border border-border rounded shadow-md z-40 overflow-hidden pb-1">
      {children}
    </div>
  );

  if (!active.length) return shell(noResults);
  return shell(
    <>
      {active.map((type, i) => (
        <div key={type} className={i > 0 ? "border-t border-border" : ""}>
          <SectionLabel label={`${typeLabel(type)}s`} />
          {results.groups[type]!.map((r) => <ResultRow key={r.id} r={r} onClose={onClose} />)}
        </div>
      ))}
    </>
  );
}

// ─── Shared nav link style ────────────────────────────────────────────────────

// Active tab = darker, semibold text. The outline is only for keyboard focus.
const navFocus = "outline-none focus-visible:ring-2 focus-visible:ring-ring";

const topNavClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${navFocus} ${
    isActive
      ? "text-gray-900 font-semibold"
      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
  }`;

const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-1 px-3 py-2 rounded text-xs ${navFocus} ${
    isActive ? "text-gray-900 font-semibold" : "text-gray-500"
  }`;

// ─── Layout ───────────────────────────────────────────────────────────────────

export function MainLayout() {
  // No tab bar inside a survey (its own sticky bar takes the bottom).
  const inSurvey = /^\/app\/about-me\/[^/]+\/(answer|talk)$/.test(useLocation().pathname);
  const [query, setQuery]             = useState("");
  const [searchOpen, setSearchOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef  = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const results = computeResults(query);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSearchOpen(!!value.trim());
  };

  const clearSearch = () => {
    setQuery("");
    setSearchOpen(false);
  };

  return (
    <TalkToKinnitProvider>
    <div className="flex flex-col h-screen">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header
        className="bg-white border-b border-gray-200 flex-shrink-0 z-30"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* ── Mobile top bar (< md) ─────────────────────────────────────── */}
        <div className="md:hidden h-[54px] flex items-center justify-between px-6">
          {/* Wordmark */}
          <Link
            to="/app"
            className="text-[18px] font-bold text-gray-900 select-none hover:opacity-80 transition-opacity"
          >
            Kinnit
          </Link>

          <div className="flex items-center gap-2">
            <NotificationsBell />

            {/* Avatar — navigates to About Me */}
            <Link
              to="/app/about-me"
              aria-label="About Me"
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground select-none hover:opacity-80 transition-opacity"
            >
              MS
            </Link>
          </div>
        </div>

        {/* ── Desktop top bar (≥ md) ─────────────────────────────────────── */}
        <div className="hidden md:flex h-[60px] items-center px-6 gap-5">

          {/* Wordmark — home link */}
          <Link
            to="/app"
            className="text-[22px] font-bold text-gray-900 select-none flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            Kinnit
          </Link>

          {/* Primary nav */}
          <nav className="flex items-center gap-0.5">
            <NavLink to="/app/people" className={topNavClass}>
              <Users size={16} className="flex-shrink-0" />
              <span>People</span>
            </NavLink>
            <NavLink to="/app/occasions" className={topNavClass}>
              <Calendar size={16} className="flex-shrink-0" />
              <span>Occasions</span>
            </NavLink>
            <NavLink to="/app/plans" className={topNavClass}>
              <Flag size={16} className="flex-shrink-0" />
              <span>Plans</span>
            </NavLink>
            <NavLink to="/app/reminders" className={topNavClass}>
              <Bell size={16} className="flex-shrink-0" />
              <span>Reminders</span>
            </NavLink>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search ── ~400px, clears with × when active */}
          <div className="relative w-[400px] flex-shrink-0" ref={searchRef}>
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search people, occasions, plans, reminders..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => query.trim() && setSearchOpen(true)}
              className={`w-full pl-9 py-1.5 text-sm rounded border transition-colors focus:outline-none ${
                query
                  ? "pr-8 bg-white border-gray-900"
                  : "pr-3 bg-gray-50 border-gray-200 focus:bg-white focus:border-gray-300"
              }`}
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400 transition-colors"
              >
                <X size={9} className="text-white" />
              </button>
            )}
            {searchOpen && results && (
              <SearchDropdown results={results} onClose={clearSearch} />
            )}
          </div>

          {/* Notifications bell — directly left of the avatar */}
          <NotificationsBell />

          {/* Profile: avatar (Link → About Me) + chevron (button → dropdown) */}
          <div className="relative flex-shrink-0 flex items-center gap-1" ref={profileRef}>
            {/* Avatar — navigates to About Me */}
            <Link
              to="/app/about-me"
              aria-label="About Me"
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 select-none hover:opacity-80 transition-opacity"
            >
              MS
            </Link>

            {/* Chevron — opens dropdown only */}
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center focus:outline-none p-0.5"
              aria-label="Open profile menu"
            >
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded shadow-md z-40 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <span className="text-xs text-gray-400">Mary Stanton</span>
                </div>
                <Link
                  to="/app/about-me"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User size={16} className="text-gray-500 flex-shrink-0" />
                  About Me
                </Link>
                <Link
                  to="/app/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings size={16} className="text-gray-500 flex-shrink-0" />
                  Settings
                </Link>
                <div className="border-t border-gray-100" />
                <button
                  type="button"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <LogOut size={16} className="text-gray-500 flex-shrink-0" />
                  Log out
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── Content — full width, no sidebar ──────────────────────────────── */}
      <main className={`flex-1 overflow-y-auto ${inSurvey ? "" : "mobile-scroll-pb"}`}>
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav className={`${inSurvey ? "hidden" : "md:hidden"} fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pt-1 z-10 mobile-nav-pb`}>
        <div className="flex items-center justify-around">
          <NavLink to="/app" end className={mobileNavClass}>
            <Home size={20} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/app/people" className={mobileNavClass}>
            <Users size={20} />
            <span>People</span>
          </NavLink>
          <NavLink to="/app/occasions" className={mobileNavClass}>
            <Calendar size={20} />
            <span>Occasions</span>
          </NavLink>
          <NavLink to="/app/plans" className={mobileNavClass}>
            <Flag size={20} />
            <span>Plans</span>
          </NavLink>
          <NavLink to="/app/reminders" className={mobileNavClass}>
            <Bell size={20} />
            <span>Reminders</span>
          </NavLink>
        </div>
      </nav>

    </div>
    </TalkToKinnitProvider>
  );
}
