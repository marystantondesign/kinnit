import { findPersonByFirstName } from "./peopleDirectory";

// ─── Talk to Kinnit: transcript → draft items ────────────────────────────────
//
// A local, rule-based reader for spoken notes like:
//   "Sylvia has an appointment Thursday. Remind me to ask her about it Friday.
//    Let's start a hiking plan for next weekend with John and Sylvia.
//    She's also allergic to peanuts."
// It recognizes occasions, reminders, plans, and private notes about people.
// This is a stand-in for a language-model backend; the output shape (DraftItem)
// is what the review UI and the save step rely on.

export type DraftType = "occasion" | "reminder" | "plan" | "note";

export interface DraftPerson {
  /** Directory ID when the person is known */
  id?: string;
  name: string;
}

export interface DraftItem {
  /** Stable key so edits/unchecks survive re-reading the conversation */
  key: string;
  type: DraftType;
  /** Title; for notes, the note text */
  title: string;
  /** YYYY-MM-DD */
  date?: string;
  people: DraftPerson[];
  /** Reminder → occasion link */
  linkedOccasionKey?: string;
  linkedOccasionTitle?: string;
  /** Occasion type for saving, e.g. "Birthday" */
  occasionType?: string;
}

// ─── Dates ────────────────────────────────────────────────────────────────────

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTH_ABBR = MONTHS.map((m) => m.slice(0, 3));

const DAY_REF_SOURCE = [
  "today", "tonight", "tomorrow",
  "this weekend", "next weekend", "next week",
  `(?:this |next )?(?:${WEEKDAYS.join("|")})`,
  `(?:${MONTHS.join("|")}|${MONTH_ABBR.join("|")})\\.? \\d{1,2}(?:st|nd|rd|th)?`,
].join("|");

const DAY_REF = new RegExp(`\\b(?:on |for |this coming )?(${DAY_REF_SOURCE})\\b`, "i");

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function resolveDayRef(ref: string, today: Date): Date | null {
  const r = ref.toLowerCase().replace(/\.$/, "");
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dow = base.getDay();

  if (r === "today" || r === "tonight") return base;
  if (r === "tomorrow") return addDays(base, 1);

  // Saturday of the current weekend (today if Sat, yesterday if Sun)
  const thisSaturday = dow === 6 ? base : dow === 0 ? addDays(base, -1) : addDays(base, 6 - dow);
  if (r === "this weekend") return dow === 0 ? base : thisSaturday;
  if (r === "next weekend") return addDays(thisSaturday, 7);
  if (r === "next week") return addDays(base, ((8 - dow) % 7) || 7); // next Monday

  const wd = r.match(new RegExp(`^(this |next )?(${WEEKDAYS.join("|")})$`));
  if (wd) {
    const target = WEEKDAYS.indexOf(wd[2]);
    if (wd[1] === "next ") {
      const nextMonday = addDays(base, ((8 - dow) % 7) || 7);
      return addDays(nextMonday, (target + 6) % 7);
    }
    const offset = (target - dow + 7) % 7;
    return addDays(base, offset);
  }

  const md = r.match(/^([a-z]+)\.? (\d{1,2})/);
  if (md) {
    let month = MONTHS.indexOf(md[1]);
    if (month < 0) month = MONTH_ABBR.indexOf(md[1]);
    if (month < 0) return null;
    let d = new Date(base.getFullYear(), month, Number(md[2]));
    if (d < base) d = new Date(base.getFullYear() + 1, month, Number(md[2]));
    return d;
  }
  return null;
}

/** Finds a date phrase, returning the date and the sentence with the phrase removed. */
function extractDate(text: string, today: Date) {
  const m = text.match(DAY_REF);
  if (!m) return { date: undefined, phrase: undefined, rest: text };
  const date = resolveDayRef(m[1], today);
  const rest = (text.slice(0, m.index) + text.slice((m.index ?? 0) + m[0].length)).replace(/\s{2,}/g, " ").trim();
  return { date: date ? toISODate(date) : undefined, phrase: m[1].toLowerCase(), rest };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRONOUNS = /^(she|he|they|her|him|them)$/i;

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function clean(s: string) {
  return s.replace(/[.!?,;]+$/, "").trim();
}

function toPerson(name: string): DraftPerson {
  const known = findPersonByFirstName(name);
  return known ? { id: known.id, name: known.firstName } : { name: cap(name) };
}

function splitNames(list: string): DraftPerson[] {
  return list
    .split(/,\s*|\s+and\s+|\s*&\s*/i)
    .map((n) => n.trim().replace(/^me$/i, ""))
    .filter((n) => /^[A-Z][a-z]+$/.test(n))
    .map(toPerson);
}

function occasionTypeFor(noun: string): string {
  if (/birthday/i.test(noun)) return "Birthday";
  if (/anniversary/i.test(noun)) return "Anniversary";
  if (/surgery|appointment|procedure|treatment|doctor|scan|therapy/i.test(noun)) return "Illness or Recovery";
  if (/trip|flight|vacation|travel/i.test(noun)) return "Trip or Travel";
  if (/funeral|memorial/i.test(noun)) return "Loss or Grief";
  return "Other";
}

const NOTE_FACT =
  /^(allergic to .+|(?:vegetarian|vegan|pescatarian|gluten[- ]free|lactose intolerant|sober|pregnant)\b.*|(?:loves|likes|hates|prefers|doesn't like|does not like|can't eat|cannot eat|doesn't eat|is into|into|training for|learning) .+)$/i;

// ─── Parser ───────────────────────────────────────────────────────────────────

export function parseConversation(messages: string[], today: Date = new Date()): DraftItem[] {
  const items: DraftItem[] = [];
  let lastPerson: DraftPerson | undefined;
  let lastOccasion: DraftItem | undefined;

  const resolve = (word: string): DraftPerson | undefined =>
    PRONOUNS.test(word) ? lastPerson : toPerson(word);

  const add = (item: Omit<DraftItem, "key">) => {
    const who = item.type === "note" ? `${item.people[0]?.name ?? ""}:` : "";
    const key = `${item.type}:${who}${item.title.toLowerCase()}`;
    if (items.some((i) => i.key === key)) return undefined;
    const full = { ...item, key };
    items.push(full);
    return full;
  };

  const sentences = messages
    .join(" ")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const raw of sentences) {
    const sentence = clean(raw);
    const { date, phrase, rest } = extractDate(sentence, today);

    // Reminder: "Remind me to ask her about it Friday"
    const rem = rest.match(/\bremind me (?:to )?(.+)$/i);
    if (rem) {
      let action = clean(rem[1]);
      let person: DraftPerson | undefined;
      action = action.replace(/\b(her|him|them|[A-Z][a-z]+)\b/g, (w) => {
        const p = PRONOUNS.test(w) ? lastPerson : findPersonByFirstName(w) ? toPerson(w) : undefined;
        if (p) person = p;
        return PRONOUNS.test(w) && p ? p.name : w;
      });
      const aboutIt = /\babout (it|that|the [a-z]+)$/i.test(action);
      const linked = aboutIt && lastOccasion ? lastOccasion : undefined;
      if (linked && person && /^ask\b/i.test(action)) action = `ask ${person.name} how it went`;
      add({
        type: "reminder",
        title: cap(action),
        date,
        people: person ? [person] : [],
        linkedOccasionKey: linked?.key,
        linkedOccasionTitle: linked?.title,
      });
      if (person) lastPerson = person;
      continue;
    }

    // Plan: "Let's start a hiking plan for next weekend with John and Sylvia"
    const plan =
      rest.match(/\b(?:start|create|make|set up|begin)\s+(?:a|an|the)\s+(.+?)\s+plan\b(.*)$/i) ??
      rest.match(/\bplan\s+(?:a|an)\s+([a-z]+(?: (?!with\b|for\b|on\b|at\b)[a-z]+)?)\b(.*)$/i);
    if (plan) {
      const withMatch = plan[2].match(/\bwith\s+(.+)$/i);
      const people = withMatch ? splitNames(clean(withMatch[1])) : [];
      const title = cap(`${plan[1].trim()}${phrase ? ` ${phrase}` : ""}`);
      add({ type: "plan", title, date, people });
      if (people.length) lastPerson = people[people.length - 1];
      continue;
    }

    // Occasion: "Sylvia has an appointment Thursday"
    const occ = rest.match(/^([A-Za-z]+)\s+(?:has|have|is having|has got|'s got)\s+(?:an?|her|his|their|a big)\s+(.+)$/i);
    if (occ) {
      const person = resolve(occ[1]);
      if (person) {
        const noun = clean(occ[2]);
        const created = add({
          type: "occasion",
          title: `${person.name}'s ${noun}`,
          date,
          people: [person],
          occasionType: occasionTypeFor(noun),
        });
        if (created) lastOccasion = created;
        lastPerson = person;
        continue;
      }
    }

    // Note: "She's also allergic to peanuts"
    const note = sentence.match(/^([A-Za-z]+)(?:'s|’s|\s+is|\s+are|'re)?\s+(?:also\s+|really\s+|actually\s+)*(.+)$/i);
    if (note && NOTE_FACT.test(note[2])) {
      const person = resolve(note[1]);
      if (person) {
        const fact = clean(note[2]).replace(/^is /i, "");
        add({ type: "note", title: cap(fact), people: [person] });
        lastPerson = person;
        continue;
      }
    }

    // Otherwise remember who was mentioned, for pronouns later on.
    const mentioned = [...sentence.matchAll(/\b([A-Z][a-z]+)\b/g)]
      .map((m) => findPersonByFirstName(m[1]))
      .filter(Boolean);
    if (mentioned.length) {
      const p = mentioned[mentioned.length - 1]!;
      lastPerson = { id: p.id, name: p.firstName };
    }
  }

  return items;
}
