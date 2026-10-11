// Lightweight lookup of the user's people, used by Talk to Kinnit to give the
// parser context and to resolve names. IDs match the People list and profiles.

export interface DirectoryPerson {
  id: string;
  name: string;
  firstName: string;
  relationship: string;
  /** "MM-DD" when on file */
  birthday?: string;
}

const PEOPLE: Omit<DirectoryPerson, "firstName">[] = [
  { id: "1",  name: "Sarah Johnson",  relationship: "Friend",   birthday: "12-14" },
  { id: "2",  name: "Michael Chen",   relationship: "Partner",  birthday: "11-03" },
  { id: "3",  name: "Emma Davis",     relationship: "Sister" },
  { id: "4",  name: "David Martinez", relationship: "Coworker" },
  { id: "5",  name: "Lisa Anderson",  relationship: "Friend" },
  { id: "6",  name: "James Wilson",   relationship: "Brother" },
  { id: "7",  name: "Jen Zambrano",   relationship: "Friend" },
  { id: "8",  name: "Tom Becker",     relationship: "Neighbor" },
  { id: "9",  name: "Priya Patel",    relationship: "Friend" },
  { id: "10", name: "Elena Garcia",   relationship: "Friend" },
  { id: "11", name: "Marco Rossi",    relationship: "Friend" },
  { id: "12", name: "Aiko Tanaka",    relationship: "Friend" },
  { id: "13", name: "Sylvia Park",    relationship: "Friend" },
  { id: "14", name: "John Walker",    relationship: "Friend" },
  { id: "15", name: "Leah Kim",       relationship: "Friend" },
  { id: "16", name: "Chris Morgan",   relationship: "Friend",   birthday: "10-22" },
];

export const PEOPLE_DIRECTORY: DirectoryPerson[] = PEOPLE.map((p) => ({
  ...p,
  firstName: p.name.split(" ")[0],
}));

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
