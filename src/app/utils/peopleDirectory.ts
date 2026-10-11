// Lightweight lookup of the user's people, used to recognize names in
// Talk to Kinnit transcripts. IDs match the People list and profile pages.

export interface DirectoryPerson {
  id: string;
  name: string;
  firstName: string;
}

const NAMES: [id: string, name: string][] = [
  ["1",  "Sarah Johnson"],
  ["2",  "Michael Chen"],
  ["3",  "Emma Davis"],
  ["4",  "David Martinez"],
  ["5",  "Lisa Anderson"],
  ["6",  "James Wilson"],
  ["7",  "Jen Zambrano"],
  ["8",  "Tom Becker"],
  ["9",  "Priya Patel"],
  ["10", "Elena Garcia"],
  ["11", "Marco Rossi"],
  ["12", "Aiko Tanaka"],
  ["13", "Sylvia Park"],
  ["14", "John Walker"],
];

export const PEOPLE_DIRECTORY: DirectoryPerson[] = NAMES.map(([id, name]) => ({
  id,
  name,
  firstName: name.split(" ")[0],
}));

export function findPersonByFirstName(firstName: string): DirectoryPerson | undefined {
  const q = firstName.toLowerCase();
  return PEOPLE_DIRECTORY.find((p) => p.firstName.toLowerCase() === q);
}
