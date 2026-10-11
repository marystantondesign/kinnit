import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import { getOccasion, type OccasionData } from "../utils/occasionStorage";
import { ItemBadge, itemStripeStyle } from "../components/ItemBadge";
import { familyColors, planIconFor, reminderIconFor } from "../config/itemTypes";
import { getPlan } from "../utils/planStorage";
import { Edit, Share2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityEntry {
  id: string;
  initials: string;
  name: string;
  action: string;
  date: string;
}

interface KeyDate {
  label: string;
  date: string;
}

interface LinkedReminder {
  id: string;
  title: string;
  timing: string;
}

interface PreferenceSection {
  title: string;
  items: string[] | Record<string, string>;
}

// ─── Mock supplementary data ──────────────────────────────────────────────────

const MOCK_OCCASIONS: Record<string, OccasionData> = {
  "1": {
    id: "1", type: "Birthday", title: "Sarah's Birthday",
    people: [{ id: "1", name: "Sarah Johnson", initials: "SJ", role: "Birthday person" }],
    status: "active", timing: { mode: "single" }, context: {}, recurring: true,  relatedPlanIds: [],
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
    date: "Every April 15", recurringText: "Recurring annually",
    notes: "Sarah's birthday is a chance for close friends to gather and celebrate her. She prefers intimate dinners over large parties. Her favorite restaurant is The Garden Bistro and she enjoys outdoor activities.",
    relatedPlans: [{ id: "1", title: "Birthday Dinner Planning", leader: "You", participants: 4, status: "Active" }],
  },
  "2": {
    id: "2", type: "Illness or Recovery", title: "Emma's Surgery",
    people: [{ id: "3", name: "Emma Davis", initials: "ED", role: "Patient" }],
    status: "active", timing: { mode: "range" }, context: {}, recurring: false,  relatedPlanIds: [],
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
    date: "March 20–30, 2026", recurringText: "Situational",
    notes: "Emma is having knee surgery and will need support during her recovery period. She will need rides to physical therapy appointments, help with meals, and quiet company. She values privacy and prefers text messages when she's not feeling well.",
    relatedPlans: [{ id: "4", title: "Recovery Support Schedule", leader: "You", participants: 3, status: "Active" }],
  },
  "3": {
    id: "3", type: "Loss or Grief", title: "Grandmother Memorial Anniversary",
    people: [{ id: "family", name: "Family", initials: "FM", role: "Family group" }],
    status: "active", timing: { mode: "single" }, context: {}, recurring: true,  relatedPlanIds: [],
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
    date: "Every June 5", recurringText: "Recurring annually",
    notes: "An annual gathering to remember and celebrate Grandma Ruth. We usually meet at Riverside Park, the place she loved most, and share stories. Keep the tone reflective but warm.",
    relatedPlans: [],
  },
  "4": {
    id: "4", type: "Anniversary", title: "Alex and Jordan Anniversary",
    people: [
      { id: "alex", name: "Alex Chen", initials: "AC", role: "Couple" },
      { id: "jordan", name: "Jordan Smith", initials: "JS", role: "Couple" },
    ],
    status: "active", timing: { mode: "single" }, context: {}, recurring: true,  relatedPlanIds: [],
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
    date: "Every August 12", recurringText: "Recurring annually",
    notes: "Alex and Jordan's wedding anniversary. They enjoy experiences over material gifts — outdoor adventures, fine dining, and travel. A thoughtful card or shared experience means more to them than a wrapped gift.",
    relatedPlans: [],
  },
  "5": {
    id: "5", type: "Trip or Travel", title: "Group Trip to Mexico",
    people: [
      { id: "you",  name: "You",           initials: "YO", role: "Traveler" },
      { id: "1",   name: "Sarah Johnson",  initials: "SJ", role: "Traveler" },
      { id: "2",   name: "Michael Chen",   initials: "MC", role: "Traveler" },
      { id: "3",   name: "Emma Davis",     initials: "ED", role: "Traveler" },
    ],
    status: "active", timing: { mode: "range" }, context: {}, recurring: false,  relatedPlanIds: [],
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
    date: "December 10–17, 2026", recurringText: "Situational",
    notes: "A group beach trip to Mexico for relaxation and celebration. The group is interested in cultural experiences, local cuisine, and beach activities. Michael Chen is coordinating flights and accommodation.",
    relatedPlans: [{ id: "5", title: "Mexico Trip Planning", leader: "Michael Chen", participants: 4, status: "Draft" }],
  },
  "6": {
    id: "6", type: "Illness or Recovery", title: "Emma's Follow-up Appointment",
    people: [{ id: "3", name: "Emma Davis", initials: "ED", role: "Patient" }],
    status: "active", timing: { mode: "single" }, context: {}, recurring: false,  relatedPlanIds: [],
    createdAt: "2026-09-01", updatedAt: "2026-09-01",
    date: "October 15, 2026", recurringText: "Situational",
    notes: "Post-surgery follow-up with Dr. Patel. Emma may want a ride and company afterwards.",
    relatedPlans: [],
  },
  "7": {
    id: "7", type: "Anniversary", title: "James Wilson's Anniversary",
    people: [{ id: "6", name: "James Wilson", initials: "JW", role: "Celebrating" }],
    status: "active", timing: { mode: "single" }, context: {}, recurring: true,  relatedPlanIds: [],
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
    date: "Every October 20", recurringText: "Recurring annually",
    notes: "James and his wife celebrate with a quiet dinner. A card is always appreciated.",
    relatedPlans: [],
  },
  "8": {
    id: "8", type: "Birthday", title: "Michael's Birthday",
    people: [{ id: "2", name: "Michael Chen", initials: "MC", role: "Birthday person" }],
    status: "active", timing: { mode: "single" }, context: {}, recurring: true,  relatedPlanIds: [],
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
    date: "Every November 3", recurringText: "Recurring annually",
    notes: "Michael prefers experiences over gifts and loves a good brunch.",
    relatedPlans: [],
  },
  "9": {
    id: "9", type: "Illness or Recovery", title: "Emma's Recovery",
    people: [{ id: "3", name: "Emma Davis", initials: "ED", role: "Recovering" }],
    status: "active", timing: { mode: "range" }, context: {}, recurring: false,  relatedPlanIds: [],
    createdAt: "2026-10-01", updatedAt: "2026-10-01",
    date: "October 19–30, 2026", recurringText: "Situational",
    notes: "Emma's second recovery period after the follow-up. Meals and short visits help most.",
    relatedPlans: [{ id: "4", title: "Recovery Support Schedule", leader: "You", participants: 3, status: "Active" }],
  },
};

const MOCK_KEY_DATES: Record<string, KeyDate[]> = {
  "1": [{ label: "Birthday",       date: "April 15, 2026"    }],
  "2": [{ label: "Surgery",        date: "March 20, 2026"    },
        { label: "Recovery ends",  date: "March 30, 2026"    }],
  "3": [{ label: "Anniversary",    date: "June 5, 2026"      }],
  "4": [{ label: "Anniversary",    date: "August 12, 2026"   }],
  "5": [{ label: "Departure",      date: "December 10, 2026" },
        { label: "Return",         date: "December 17, 2026" }],
  "6": [{ label: "Appointment",    date: "October 15, 2026"  }],
  "7": [{ label: "Anniversary",    date: "October 20, 2026"  }],
  "8": [{ label: "Birthday",       date: "November 3, 2026"  }],
  "9": [{ label: "Recovery starts", date: "October 19, 2026" },
        { label: "Recovery ends",  date: "October 30, 2026"  }],
};

const MOCK_REMINDERS: Record<string, LinkedReminder[]> = {
  "1": [{ id: "r1", title: "Send birthday card to Sarah", timing: "Apr 8, 2026"     }],
  "2": [{ id: "r2", title: "Check in with Emma",          timing: "Oct 5, 2026"     },
        { id: "r3", title: "Drive to PT appointment",     timing: "Recurring weekly" }],
  "3": [{ id: "r4", title: "Memorial anniversary reminder", timing: "Jun 5, 2026"   }],
};

const MOCK_ACTIVITY: Record<string, ActivityEntry[]> = {
  "1": [
    { id: "a1", initials: "SJ", name: "Sarah Johnson", action: "updated gift preferences",   date: "Sep 5"  },
    { id: "a2", initials: "MS", name: "You",           action: "linked Birthday Dinner plan", date: "Aug 20" },
  ],
  "2": [
    { id: "a1", initials: "ED", name: "Emma Davis", action: "joined this occasion",        date: "Oct 1"  },
    { id: "a2", initials: "MS", name: "You",         action: "added a note",               date: "Sep 18" },
    { id: "a3", initials: "ED", name: "Emma Davis", action: "updated care preferences",    date: "Sep 15" },
  ],
  "4": [
    { id: "a1", initials: "MS", name: "You", action: "added occasion",       date: "Jan 1"  },
  ],
  "5": [
    { id: "a1", initials: "MC", name: "Michael Chen", action: "created the Mexico Trip plan", date: "Sep 30" },
    { id: "a2", initials: "SJ", name: "Sarah Johnson", action: "joined this occasion",        date: "Sep 28" },
    { id: "a3", initials: "MS", name: "You",           action: "added this occasion",          date: "Sep 25" },
  ],
};

const MOCK_PREFERENCES: Record<string, Record<string, string[]>> = {
  "1": {
    "Gift Preferences":        ["Books (especially fiction and biographies)", "Plants and gardening supplies", "Experiences over material items", "Avoid: Scented candles (allergies)"],
    "Celebration Preferences": ["Prefers intimate gatherings over large parties", "No surprise parties", "Favorite restaurant: The Garden Bistro", "Enjoys outdoor activities"],
    "Food & Drink":            ["Loves Italian and Mediterranean cuisine", "Favorite drink: Rosé wine", "Coffee enthusiast — prefers light roast"],
  },
  "3": {
    "Care Preferences":        ["Appreciates quiet company during recovery", "Prefers text messages over phone calls when unwell", "Comfortable with help for practical tasks", "Values privacy and rest time"],
    "Communication":           ["Best reached via text message", "Available for calls in the evening", "Prefers advance notice for visits"],
    "Food & Drink":            ["Comfort foods: Soup, tea, and toast", "Herbal tea: Chamomile and peppermint"],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRelevantPreferences(
  occasionType: string,
  personId: string
): PreferenceSection[] {
  const prefs = MOCK_PREFERENCES[personId];
  if (!prefs) return [];

  const BY_TYPE: Record<string, string[]> = {
    "Birthday":              ["Gift Preferences", "Celebration Preferences", "Food & Drink"],
    "Anniversary":           ["Gift Preferences", "Celebration Preferences"],
    "Major Milestone":       ["Gift Preferences", "Celebration Preferences"],
    "Gathering or Dinner":   ["Food & Drink"],
    "Illness or Recovery":   ["Care Preferences", "Communication", "Food & Drink"],
    "Breakup or Support":    ["Care Preferences", "Communication"],
    "Loss or Grief":         ["Care Preferences", "Communication"],
    "Trip or Travel":        ["Food & Drink", "Communication"],
  };

  const wanted = BY_TYPE[occasionType] ?? Object.keys(prefs);
  return wanted
    .filter((k) => prefs[k])
    .map((k) => ({ title: k, items: prefs[k] }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">
      {children}
    </p>
  );
}

function ActivitySection({ entries }: { entries: ActivityEntry[] }) {
  if (!entries.length) return null;
  return (
    <section>
      <SectionLabel>Activity</SectionLabel>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground flex-shrink-0 select-none mt-0.5">
              {entry.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">
                <span className="font-medium">{entry.name}</span>{" "}
                <span className="text-muted-foreground">{entry.action}</span>
              </p>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">{entry.date}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function OccasionDetail() {
  const { occasionId } = useParams();
  const [occasion, setOccasion] = useState<OccasionData | undefined>(undefined);
  const [linkedPlans, setLinkedPlans] = useState<any[]>([]);

  useEffect(() => {
    if (!occasionId) return;
    const created = getOccasion(occasionId);
    if (created) {
      setOccasion(created);
      const plans = (created.relatedPlanIds ?? [])
        .map((id: string) => getPlan(id))
        .filter(Boolean);
      setLinkedPlans(plans);
    } else {
      const mock = MOCK_OCCASIONS[occasionId];
      if (mock) {
        setOccasion(mock);
        setLinkedPlans(mock.relatedPlans ?? []);
      }
    }
  }, [occasionId]);

  if (!occasion) {
    return (
      <div className="px-6 py-8 md:px-8">
        <h1 className="text-foreground">Occasion not found</h1>
      </div>
    );
  }

  // Date display
  const dateDisplay = (() => {
    if (occasion.date) return occasion.date;
    if (occasion.timing.mode === "single" && occasion.timing.singleDate)
      return new Date(occasion.timing.singleDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    if (occasion.timing.mode === "range" && occasion.timing.startDate && occasion.timing.endDate)
      return `${new Date(occasion.timing.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${new Date(occasion.timing.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    if (occasion.timing.mode === "ongoing") return "Ongoing";
    return "Date not set";
  })();

  // Supplementary data
  const keyDates     = MOCK_KEY_DATES[occasionId ?? ""] ?? [];
  const reminders    = MOCK_REMINDERS[occasionId ?? ""] ?? [];
  const activity     = MOCK_ACTIVITY[occasionId ?? ""] ?? [];

  // Relevant preferences — only for single named person
  const singlePerson = occasion.people.length === 1 &&
    occasion.people[0].id !== "family" &&
    occasion.people[0].id !== "you"
    ? occasion.people[0]
    : null;
  const preferences = singlePerson
    ? getRelevantPreferences(occasion.type, singlePerson.id)
    : [];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="px-6 py-6 md:px-8 md:py-8">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          {/* Type pill */}
          <span
            className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full leading-tight"
            style={{ background: familyColors("occasion").fill, color: familyColors("occasion").icon }}
          >
            {occasion.type}
          </span>
          {/* Title */}
          <h1 className="text-2xl font-semibold text-foreground mt-2 leading-tight">
            {occasion.title}
          </h1>
          {/* Date + recurrence */}
          <p className="text-sm text-muted-foreground mt-1">
            {dateDisplay} · {occasion.recurring ? "Recurring" : "Situational"}
          </p>
        </div>

        {/* Edit + Share */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent text-foreground transition-colors"
          >
            <Edit size={13} />
            Edit
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent text-foreground transition-colors"
          >
            <Share2 size={13} />
            Share
          </button>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">

        {/* ─ LEFT COLUMN ────────────────────────────────────────────────────── */}
        <div className="w-full md:flex-1 md:min-w-0 space-y-8">

          {/* Description */}
          {occasion.notes && (
            <section>
              <SectionLabel>Description</SectionLabel>
              <p className="text-sm text-foreground leading-relaxed">{occasion.notes}</p>
            </section>
          )}

          {/* People */}
          {occasion.people.length > 0 && (
            <section>
              <SectionLabel>People</SectionLabel>
              <div className="grid grid-cols-3 gap-3">
                {occasion.people.map((person) => (
                  <Link
                    key={person.id}
                    to={`/app/people/${person.id}`}
                    className="border border-border rounded-lg p-3 flex flex-col items-center gap-2 hover:bg-accent transition-colors text-center bg-card"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground select-none">
                      {person.initials ?? person.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="w-full">
                      <p className="text-xs font-medium text-foreground leading-snug truncate">{person.name}</p>
                      {person.role && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{person.role}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Activity — desktop only (mobile renders below right col) */}
          <div className="hidden md:block">
            <ActivitySection entries={activity} />
          </div>
        </div>

        {/* ─ RIGHT COLUMN ───────────────────────────────────────────────────── */}
        <div className="w-full md:w-[360px] md:flex-shrink-0 space-y-6">

          {/* Relevant Preferences */}
          {preferences.length > 0 && (
            <section>
              <SectionLabel>Relevant Preferences</SectionLabel>
              <div className="space-y-3">
                {preferences.map((pref) => (
                  <div key={pref.title} className="border border-border rounded-lg p-4 bg-card">
                    <p className="text-sm font-medium text-foreground mb-2">{pref.title}</p>
                    {Array.isArray(pref.items) ? (
                      <ul className="space-y-1.5">
                        {(pref.items as string[]).map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground leading-snug">
                            · {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="space-y-1.5">
                        {Object.entries(pref.items as Record<string, string>).map(([k, v]) => (
                          <p key={k} className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{k}:</span> {v}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Linked Plans & Reminders */}
          {(linkedPlans.length > 0 || reminders.length > 0) && (
            <section>
              <SectionLabel>Linked Plans &amp; Reminders</SectionLabel>
              <div className="space-y-2">
                {linkedPlans.map((plan: any) => (
                  <Link
                    key={plan.id}
                    to={`/app/plans/${plan.id}`}
                    className="flex items-center gap-3 p-3 border border-border bg-card rounded-lg hover:bg-accent transition-colors"
                    style={itemStripeStyle("plan")}
                  >
                    <ItemBadge type="plan" icon={planIconFor(plan.title)} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{plan.title}</p>
                      {(plan.leader || plan.status) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {plan.leader ? `Led by ${typeof plan.leader === "object" ? plan.leader.name : plan.leader}` : ""}
                          {plan.status ? ` · ${plan.status}` : ""}
                        </p>
                      )}
                    </div>

                  </Link>
                ))}
                {reminders.map((reminder) => (
                  <Link
                    key={reminder.id}
                    to={`/app/reminders/${reminder.id}`}
                    className="flex items-center gap-3 p-3 border border-border bg-card rounded-lg hover:bg-accent transition-colors"
                    style={itemStripeStyle("reminder")}
                  >
                    <ItemBadge type="reminder" icon={reminderIconFor(reminder.title)} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{reminder.timing}</p>
                    </div>

                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Key Dates */}
          {keyDates.length > 0 && (
            <section>
              <SectionLabel>Key Dates</SectionLabel>
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                {keyDates.map((kd, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <p className="text-sm text-foreground">{kd.label}</p>
                    <p className="text-sm text-muted-foreground">{kd.date}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Activity — mobile only, after the right column content */}
      <div className="md:hidden mt-8">
        <ActivitySection entries={activity} />
      </div>

    </div>
  );
}
