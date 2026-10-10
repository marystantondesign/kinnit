import { useState } from "react";

export interface PrivateNote {
  id: string;
  personId: string;
  date: string;
  text: string;
}

const STORAGE_KEY = "kinnit_private_notes";

const SEED: PrivateNote[] = [
  { id: "seed-1", personId: "1", date: "Nov 14, 2026", text: "She mentioned wanting to learn pottery — could be a great birthday gift angle. Look into local studios." },
  { id: "seed-2", personId: "1", date: "Sep 18, 2026", text: "Seems stressed about her manager situation at work. Check in after December when her review cycle is done." },
  { id: "seed-3", personId: "2", date: "Oct 1, 2026",  text: "He's been training for a half marathon. Something fitness-related would resonate right now." },
];

function readAll(): PrivateNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PrivateNote[];
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
  return SEED;
}

function writeAll(notes: PrivateNote[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function getNotesForPerson(personId: string): PrivateNote[] {
  return readAll().filter((n) => n.personId === personId);
}

export function addNote(personId: string, text: string): PrivateNote {
  const all = readAll();
  const note: PrivateNote = {
    id: `n-${Date.now()}`,
    personId,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    text: text.trim(),
  };
  writeAll([note, ...all]);
  return note;
}

export function usePersonNotes(personId: string) {
  const [notes, setNotes] = useState<PrivateNote[]>(() => getNotesForPerson(personId));

  const add = (text: string) => {
    const note = addNote(personId, text);
    setNotes((prev) => [note, ...prev]);
  };

  return { notes, add };
}
