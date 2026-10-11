import { useState } from "react";
import { useParams, Link } from "react-router";
import { Search, Plus, X } from "lucide-react";
import { usePersonNotes, type PrivateNote } from "../utils/noteStore";

// ─── Person lookup ────────────────────────────────────────────────────────────

interface PersonData {
  id: string;
  name: string;
  initials: string;
  relationship: string;
}

const PEOPLE: Record<string, PersonData> = {
  "1": { id: "1", name: "Sarah Johnson",  initials: "SJ", relationship: "Friend"   },
  "2": { id: "2", name: "Michael Chen",   initials: "MC", relationship: "Partner"  },
  "3": { id: "3", name: "Emma Davis",     initials: "ED", relationship: "Sister"   },
  "4": { id: "4", name: "David Martinez", initials: "DM", relationship: "Coworker" },
  "5": { id: "5", name: "Lisa Anderson",  initials: "LA", relationship: "Friend"   },
  "6": { id: "6", name: "James Wilson",   initials: "JW", relationship: "Brother"  },
  "13": { id: "13", name: "Sylvia Park",   initials: "SP", relationship: "Friend"   },
  "14": { id: "14", name: "John Walker",   initials: "JW", relationship: "Friend"   },
  "15": { id: "15", name: "Leah Kim",      initials: "LK", relationship: "Friend"   },
  "16": { id: "16", name: "Chris Morgan",  initials: "CM", relationship: "Friend"   },
};

// ─── Category data ────────────────────────────────────────────────────────────

interface CategoryEntry {
  id: string;
  title: string;
  completed: boolean;
  content?: string;
}

// Default incomplete template (all 9 categories, none filled)
const CATEGORY_TITLES: { id: string; title: string }[] = [
  { id: "important-dates",   title: "Important Dates"            },
  { id: "food-drink",        title: "Food & Drink Preferences"   },
  { id: "allergies",         title: "Allergies / Restrictions"   },
  { id: "gift-preferences",  title: "Gift Preferences"           },
  { id: "flowers-plants",    title: "Flowers, Plants & Objects"  },
  { id: "celebration",       title: "Celebration Preferences"    },
  { id: "care",              title: "Care Preferences"           },
  { id: "sizes",             title: "Sizes"                      },
  { id: "communication",     title: "Communication Preferences"  },
];

const PERSON_CATEGORIES: Record<string, CategoryEntry[]> = {
  "1": [
    { id: "important-dates",  title: "Important Dates",           completed: true,  content: "Birthday: December 14. Adopted cat Biscuit: March 2019. Work anniversary: August 2021." },
    { id: "food-drink",       title: "Food & Drink Preferences",  completed: true,  content: "Vegetarian. Loves Thai and Japanese. Oat milk in coffee. Hates cilantro and anything overly sweet." },
    { id: "allergies",        title: "Allergies / Restrictions",  completed: true,  content: "No known allergies. Prefers to avoid shellfish. Lactose-sensitive but not strict about it." },
    { id: "gift-preferences", title: "Gift Preferences",          completed: true,  content: "Experiences over things. Favorite stores: REI, local bookshops. Avoid candles and generic spa sets." },
    { id: "flowers-plants",   title: "Flowers, Plants & Objects", completed: false  },
    { id: "celebration",      title: "Celebration Preferences",   completed: true,  content: "Low-key gatherings with close friends. Dislikes surprise parties. Loves a long brunch over a big dinner." },
    { id: "care",             title: "Care Preferences",          completed: true,  content: "Needs space initially, then appreciates check-ins. Practical help over emotional processing." },
    { id: "sizes",            title: "Sizes",                     completed: false  },
    { id: "communication",    title: "Communication Preferences", completed: true,  content: "Prefers texts over calls. Responds within a day. Voice memos for long things. Hates being put on the spot." },
  ],
  "2": [
    { id: "important-dates",  title: "Important Dates",           completed: true,  content: "Birthday: November 3. Parents' anniversary: October 15. Started his company: January 2022." },
    { id: "food-drink",       title: "Food & Drink Preferences",  completed: true,  content: "Omnivore. Loves BBQ and Korean food. Black coffee only. Allergic to tree nuts — always check labels." },
    { id: "allergies",        title: "Allergies / Restrictions",  completed: true,  content: "Tree nuts — severe. Always check ingredient labels before gifting food." },
    { id: "gift-preferences", title: "Gift Preferences",          completed: true,  content: "Tech gadgets, cooking equipment, or experiences. No clothing unless he picks it himself." },
    { id: "flowers-plants",   title: "Flowers, Plants & Objects", completed: false  },
    { id: "celebration",      title: "Celebration Preferences",   completed: false  },
    { id: "care",             title: "Care Preferences",          completed: true,  content: "Appreciates direct communication. Doesn't like fuss. Prefers to talk about solutions, not feelings." },
    { id: "sizes",            title: "Sizes",                     completed: false  },
    { id: "communication",    title: "Communication Preferences", completed: false  },
  ],
  "3": [
    { id: "important-dates",  title: "Important Dates",           completed: true,  content: "Birthday: April 22. Moved to Portland: September 2023. Dog's birthday (Mochi): July 4." },
    { id: "food-drink",       title: "Food & Drink Preferences",  completed: true,  content: "Mostly plant-based. Loves Ethiopian and Mediterranean. Sparkling water fanatic. No alcohol." },
    { id: "allergies",        title: "Allergies / Restrictions",  completed: true,  content: "Gluten-sensitive. Avoids alcohol. Reads labels carefully for hidden gluten." },
    { id: "gift-preferences", title: "Gift Preferences",          completed: false  },
    { id: "flowers-plants",   title: "Flowers, Plants & Objects", completed: true,  content: "Loves succulents and air plants. Favorite flowers: sunflowers and wildflowers. No cut flowers — prefers potted." },
    { id: "celebration",      title: "Celebration Preferences",   completed: true,  content: "Outdoors when possible. Meaningful over festive. Likes small groups, dislikes big crowds." },
    { id: "care",             title: "Care Preferences",          completed: false  },
    { id: "sizes",            title: "Sizes",                     completed: false  },
    { id: "communication",    title: "Communication Preferences", completed: true,  content: "Prefers voice notes for emotional things, texts for logistics. Doesn't use social media." },
  ],
};

function getCategories(personId: string): CategoryEntry[] {
  if (PERSON_CATEGORIES[personId]) return PERSON_CATEGORIES[personId];
  // Default: first 3 complete, rest incomplete
  return CATEGORY_TITLES.map((c, i) => ({
    ...c,
    completed: i < 3,
    content: i < 3 ? "No details available." : undefined,
  }));
}

// ─── Request state ────────────────────────────────────────────────────────────

type RequestStep = "idle" | "confirming" | "sent";

interface RequestFormState {
  step: RequestStep;
  isAnonymous: boolean;
}

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({
  entry,
  form,
  onStartRequest,
  onToggleAnonymous,
  onSendRequest,
  onCancelRequest,
}: {
  entry: CategoryEntry;
  form: RequestFormState;
  onStartRequest: () => void;
  onToggleAnonymous: (v: boolean) => void;
  onSendRequest: () => void;
  onCancelRequest: () => void;
}) {
  if (entry.completed) {
    return (
      <div className="border border-gray-200 rounded p-4 bg-white flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-800">{entry.title}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{entry.content}</p>
      </div>
    );
  }

  // Incomplete card
  return (
    <div className="border border-dashed border-gray-300 rounded p-4 bg-white flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-400">{entry.title}</p>
      <p className="text-sm text-gray-400">Hasn't completed this yet.</p>

      {form.step === "idle" && (
        <button
          type="button"
          onClick={onStartRequest}
          className="self-start mt-1 px-2.5 py-1 text-xs border border-gray-300 rounded-full text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          Request
        </button>
      )}

      {form.step === "confirming" && (
        <div className="mt-1 space-y-2">
          <p className="text-xs text-gray-500">Send as:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onToggleAnonymous(false)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                !form.isAnonymous
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-300 text-gray-500 hover:border-gray-400"
              }`}
            >
              Named
            </button>
            <button
              type="button"
              onClick={() => onToggleAnonymous(true)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                form.isAnonymous
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-300 text-gray-500 hover:border-gray-400"
              }`}
            >
              Anonymous
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={onSendRequest}
              className="px-3 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Send request
            </button>
            <button
              type="button"
              onClick={onCancelRequest}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {form.step === "sent" && (
        <p className="text-xs text-green-600 mt-1">Request sent ✓</p>
      )}
    </div>
  );
}

// ─── Note card ────────────────────────────────────────────────────────────────

function NoteCard({ note }: { note: PrivateNote }) {
  return (
    <div className="border border-gray-200 rounded p-4 bg-white flex flex-col gap-2">
      <p className="text-xs text-gray-400">{note.date}</p>
      <p className="text-sm text-gray-700 leading-relaxed">{note.text}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PersonDetail() {
  const { personId } = useParams<{ personId: string }>();
  const person = personId ? PEOPLE[personId] : undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const [requestForms, setRequestForms] = useState<Record<string, RequestFormState>>({});
  const { notes, add: addPersonNote } = usePersonNotes(personId ?? "");
  const [addingNote, setAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");

  if (!person) {
    return (
      <div className="px-6 py-8 md:px-8">
        <Link to="/app/people" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to People
        </Link>
        <h1>Person not found</h1>
      </div>
    );
  }

  const categories = getCategories(personId!);
  const completedCount = categories.filter((c) => c.completed).length;
  const totalCount = categories.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const q = searchQuery.trim().toLowerCase();

  const filteredCategories = q
    ? categories.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.content && c.content.toLowerCase().includes(q))
      )
    : categories;

  const filteredNotes = q
    ? notes.filter((n) => n.text.toLowerCase().includes(q) || n.date.toLowerCase().includes(q))
    : notes;

  const getForm = (id: string): RequestFormState =>
    requestForms[id] ?? { step: "idle", isAnonymous: false };

  const setForm = (id: string, patch: Partial<RequestFormState>) =>
    setRequestForms((prev) => ({
      ...prev,
      [id]: { ...getForm(id), ...patch },
    }));

  const handleSaveNote = () => {
    if (!newNoteText.trim()) return;
    addPersonNote(newNoteText.trim());
    setNewNoteText("");
    setAddingNote(false);
  };

  return (
    <div className="px-6 py-8 md:px-8">

      {/* ── Existing header — unchanged ── */}
      <Link to="/app/people" className="text-gray-600 hover:text-gray-900 mb-4 inline-block text-sm">
        ← Back to People
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl select-none">
          {person.initials}
        </div>
        <div>
          <h1 className="mb-1">{person.name}</h1>
          <p className="text-gray-600">{person.relationship}</p>
        </div>
      </div>

      {/* ── Scoped search ── */}
      <div className="relative mb-8">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder={`Search ${person.name.split(" ")[0]}'s details… try "allergy" or "loves"`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
            className="absolute left-[calc(var(--spacing)*9+1px)] right-auto top-1/2 -translate-y-1/2"
            style={{ left: `calc(100% - 2rem)`, maxWidth: "28rem" }}
          >
            <X size={14} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* ── What they've shared ── */}
      <section className="mb-10">
        <h2 className="mb-0.5">What {person.name.split(" ")[0]} has shared</h2>
        <p className="text-sm text-gray-500 mb-5">
          From their own About Me, visible because they've chosen to share it with you.
        </p>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 max-w-xs h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {completedCount} of {totalCount} categories completed
          </span>
        </div>

        {filteredCategories.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No categories match your search.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {filteredCategories.map((entry) => {
              const form = getForm(entry.id);
              return (
                <CategoryCard
                  key={entry.id}
                  entry={entry}
                  form={form}
                  onStartRequest={() => setForm(entry.id, { step: "confirming" })}
                  onToggleAnonymous={(v) => setForm(entry.id, { isAnonymous: v })}
                  onSendRequest={() => setForm(entry.id, { step: "sent" })}
                  onCancelRequest={() => setForm(entry.id, { step: "idle" })}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* ── Private notes ── */}
      <section>
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="mb-0.5">Your private notes</h2>
            <p className="text-sm text-gray-500">
              Only visible to you — {person.name.split(" ")[0]} can't see this section.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setAddingNote(true); setNewNoteText(""); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <Plus size={14} />
            Add note
          </button>
        </div>

        {/* Composer */}
        {addingNote && (
          <div className="mt-4 mb-4 border border-gray-200 rounded p-4 bg-white space-y-3">
            <textarea
              autoFocus
              rows={3}
              placeholder="Write a note about this person…"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded px-3 py-2 resize-none placeholder:text-gray-400 focus:outline-none focus:border-gray-300"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={!newNoteText.trim()}
                className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setAddingNote(false)}
                className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          {filteredNotes.length === 0 && !addingNote && (
            <p className="text-sm text-gray-400 italic">
              {q ? "No notes match your search." : "No notes yet."}
            </p>
          )}
          {filteredNotes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
