// Lightweight lookup of the user's people, used by Talk to Kinnit to give the
// parser context and to resolve names. IDs match the People list and profiles.

export interface DirectoryPerson {
  id: string;
  name: string;
  firstName: string;
  relationship: string;
  /** "MM-DD" when on file */
  birthday?: string;
  /** Initials circle colors (person identity, not an item type) */
  avatarClass: string;
}

const PEOPLE: Omit<DirectoryPerson, "firstName">[] = [
  { id: "1",  name: "Sarah Johnson",  relationship: "Friend",   birthday: "04-15" , avatarClass: "bg-amber-100 text-amber-700" },
  { id: "2",  name: "Michael Chen",   relationship: "Partner",  birthday: "11-03" , avatarClass: "bg-blue-100 text-blue-700" },
  { id: "3",  name: "Emma Davis",     relationship: "Sister" , avatarClass: "bg-violet-100 text-violet-700" },
  { id: "4",  name: "David Martinez", relationship: "Coworker" , avatarClass: "bg-cyan-100 text-cyan-700" },
  { id: "5",  name: "Lisa Anderson",  relationship: "Friend" , avatarClass: "bg-orange-100 text-orange-700" },
  { id: "6",  name: "James Wilson",   relationship: "Brother" , avatarClass: "bg-emerald-100 text-emerald-700" },
  { id: "7",  name: "Jen Zambrano",   relationship: "Friend" , avatarClass: "bg-pink-100 text-pink-700" },
  { id: "8",  name: "Tom Becker",     relationship: "Neighbor" , avatarClass: "bg-slate-200 text-slate-600" },
  { id: "9",  name: "Priya Patel",    relationship: "Friend" , avatarClass: "bg-purple-100 text-purple-700" },
  { id: "10", name: "Elena Garcia",   relationship: "Friend" , avatarClass: "bg-rose-100 text-rose-700" },
  { id: "11", name: "Marco Rossi",    relationship: "Friend" , avatarClass: "bg-red-100 text-red-700" },
  { id: "12", name: "Aiko Tanaka",    relationship: "Friend" , avatarClass: "bg-lime-100 text-lime-700" },
  { id: "13", name: "Sylvia Park",    relationship: "Friend",   birthday: "11-18" , avatarClass: "bg-purple-100 text-purple-700" },
  { id: "14", name: "John Walker",    relationship: "Friend",   birthday: "12-22" , avatarClass: "bg-emerald-100 text-emerald-700" },
  { id: "15", name: "Leah Kim",       relationship: "Friend" , avatarClass: "bg-sky-100 text-sky-700" },
  { id: "16", name: "Chris Morgan",   relationship: "Friend",   birthday: "10-22" , avatarClass: "bg-yellow-100 text-yellow-700" },
];

export const PEOPLE_DIRECTORY: DirectoryPerson[] = PEOPLE.map((p) => ({
  ...p,
  firstName: p.name.split(" ")[0],
}));

// People who aren't in the directory (or the user) get a stable color from this
// palette, so the same name always looks the same.
const FALLBACK_AVATARS = [
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-orange-100 text-orange-700",
];
export const SELF_AVATAR_CLASS = "bg-gray-200 text-gray-600";
export const SELF = { name: "Mary Stanton", initials: "MS" };

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2)).toUpperCase();
}

/** Initials + colors for anyone named on an item ("You" is the user). */
export function avatarFor(name: string): { initials: string; className: string; label: string } {
  if (/^(you|me|mary( stanton)?)$/i.test(name.trim())) {
    return { initials: SELF.initials, className: SELF_AVATAR_CLASS, label: "You" };
  }
  const known = findPerson(name);
  if (known) return { initials: initialsOf(known.name), className: known.avatarClass, label: known.name };
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return { initials: initialsOf(name), className: FALLBACK_AVATARS[hash % FALLBACK_AVATARS.length], label: name };
}

export function avatarClassFor(id: string): string {
  return PEOPLE_DIRECTORY.find((p) => p.id === id)?.avatarClass ?? SELF_AVATAR_CLASS;
}

/** Matches a full name or a first name, case-insensitively. */
export function findPerson(name: string): DirectoryPerson | undefined {
  const q = name.trim().toLowerCase();
  return (
    PEOPLE_DIRECTORY.find((p) => p.name.toLowerCase() === q) ??
    PEOPLE_DIRECTORY.find((p) => p.firstName.toLowerCase() === q)
  );
}

/** First name for people in the directory, the name as given otherwise. */
export function displayName(name: string): string {
  return findPerson(name)?.firstName ?? name;
}
