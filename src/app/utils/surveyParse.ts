import { getSurvey, type SurveyDef, type SurveySection } from "../config/surveys";
import { PEOPLE_DIRECTORY } from "./peopleDirectory";
import {
  addAllergy,
  addCustomChip,
  addDate,
  getSurveyState,
  setField,
  updateDate,
} from "./surveyAnswers";
import {
  MAX_TRANSCRIPT_CHARS,
  type HeardAnswer,
  type ParseSurveyRequest,
  type ParseSurveyResponse,
} from "../../shared/surveyTalk";

// ─── Talk to Kinnit inside a survey: transcript → answers ────────────────────
// Uses POST /api/parse-survey (Claude) when it's configured. Until then, or if
// it fails, a small built-in parser keeps the panel working.

export interface HeardItem extends HeardAnswer {
  /** Stable across re-parses so checks and edits stick */
  key: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export function heardKey(a: HeardAnswer): string {
  return `${a.sectionId}:${a.kind}:${a.field ? `${norm(a.field)}:` : ""}${norm(a.label)}`;
}

function withKeys(answers: HeardAnswer[]): HeardItem[] {
  const seen = new Set<string>();
  return answers.flatMap((a) => {
    const key = heardKey(a);
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ ...a, key }];
  });
}

function buildRequest(def: SurveyDef, transcript: string, focus: string | null): ParseSurveyRequest {
  return {
    surveyId: def.id,
    surveyTitle: def.title,
    transcript,
    focusSection: focus,
    sections: def.sections.map((s) => ({
      id: s.id,
      title: s.title,
      kind: s.kind,
      ...(s.kind === "chips" ? { modes: s.modes, options: s.chips } : {}),
      ...(s.kind === "allergies" ? { options: s.chips } : {}),
      ...(s.kind === "dates" ? { options: s.starters.map((x) => x.label) } : {}),
      ...(s.kind === "fields" ? { fields: s.fields } : {}),
    })),
    people: PEOPLE_DIRECTORY.map(({ name, relationship }) => ({ name, relationship })),
  };
}

// Once the server says AI parsing isn't set up, stop asking for this session.
let aiUnavailable = false;

export async function parseSurveyTalk(
  surveyId: string,
  transcript: string,
  focus: string | null,
  signal?: AbortSignal,
): Promise<{ items: HeardItem[]; source: "ai" | "local" }> {
  const def = getSurvey(surveyId);
  const text = transcript.trim();
  if (!def || !text) return { items: [], source: "local" };
  const local = () => ({ items: withKeys(localParse(def, text, focus)), source: "local" as const });
  if (aiUnavailable || text.length > MAX_TRANSCRIPT_CHARS) return local();

  try {
    const res = await fetch("/api/parse-survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequest(def, text, focus)),
      signal,
    });
    const data = (await res.json()) as ParseSurveyResponse;
    if (data.ok) return { items: withKeys(data.answers), source: "ai" };
    if (data.error === "not_configured") aiUnavailable = true;
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    aiUnavailable = true;
  }
  return local();
}

// ─── Saving confirmed answers ─────────────────────────────────────────────────

export function applyHeard(surveyId: string, items: HeardItem[]) {
  const def = getSurvey(surveyId);
  if (!def) return;
  for (const item of items) {
    const section = def.sections.find((s) => s.id === item.sectionId);
    if (!section) continue;
    if (item.kind === "pick" && section.kind === "chips") {
      addCustomChip(surveyId, section.id, item.label, item.sentiment ?? section.modes[0], section.chips);
    } else if (item.kind === "allergy" && section.kind === "allergies") {
      addAllergy(surveyId, section.id, item.label, item.severity, section.chips);
    } else if (item.kind === "date" && section.kind === "dates") {
      const existing = (getSurveyState(surveyId).sections[section.id]?.dates ?? []).find(
        (d) => norm(d.label) === norm(item.label) && d.date === item.date,
      );
      if (existing) {
        if (item.note) updateDate(surveyId, section.id, existing.id, { note: item.note });
      } else {
        addDate(surveyId, section.id, { date: item.date, label: item.label, who: item.who ?? "", note: item.note ?? "" });
      }
    } else if (item.kind === "field" && section.kind === "fields" && item.field) {
      setField(surveyId, section.id, item.field, item.label);
    }
  }
}

// ─── Built-in parser ──────────────────────────────────────────────────────────
// Deliberately simple: listed options, sentiment words, allergies with a
// severity, month-day dates, and sizes. Claude handles everything else.

const AVOID = /\b(don'?t|do not|doesn'?t|not a fan|not really into|hate|can'?t stand|dislike|avoid|never|rather not|skip|no more|not for me|allergic)\b/;
const LOVE = /\b(love|loves|adore|favou?rite|obsessed|especially|really like|can'?t get enough|the best)\b/;
const LIKE = /\b(like|likes|enjoy|enjoys|into|fan of|happy with|fine with|i'?d take)\b/;

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const DAY_RE = "(\\d{1,2})(?:st|nd|rd|th)?";

const ALIASES: Record<string, string[]> = {
  "Peanuts": ["peanut"],
  "Tree nuts": ["tree nut", "almond", "walnut", "cashew", "pecan"],
  "Shellfish": ["shrimp", "crab", "lobster"],
  "Eggs": ["egg"],
  "Milk": ["dairy", "lactose"],
  "Wheat": ["gluten"],
  "American BBQ": ["bbq", "barbecue", "barbeque"],
  "Persian": ["iranian"],
  "Oat milk latte": ["oat latte", "oat milk"],
  "Sparkling wine": ["champagne", "prosecco"],
  "Black coffee": ["coffee black"],
  "Games and puzzles": ["puzzles", "board games"],
};

interface Vocab {
  label: string;
  section: SurveySection;
  pattern: RegExp;
  length: number;
}

function variants(label: string): string[] {
  const base = norm(label).replace(/^(a|an|the|some|something) /, "");
  const out = new Set([norm(label), base]);
  if (base.endsWith("s")) out.add(base.slice(0, -1));
  else out.add(`${base}s`);
  for (const a of ALIASES[label] ?? []) out.add(a);
  return [...out].filter(Boolean);
}

function buildVocab(def: SurveyDef): Vocab[] {
  const list: Vocab[] = [];
  for (const section of def.sections) {
    const labels =
      section.kind === "chips" || section.kind === "allergies"
        ? section.chips
        : section.kind === "dates"
          ? section.starters.map((s) => s.label)
          : [];
    for (const label of labels) {
      for (const v of variants(label)) {
        list.push({ label, section, pattern: new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`), length: v.length });
      }
    }
  }
  return list.sort((a, b) => b.length - a.length);
}

function sentimentOf(clause: string): HeardAnswer["sentiment"] {
  if (AVOID.test(clause)) return "avoid";
  if (LOVE.test(clause)) return "love";
  if (LIKE.test(clause)) return "like";
  return null;
}

/** A chips section that takes this sentiment: the matched one, or a single-mode one ("Please don't"). */
function placeFor(def: SurveyDef, section: SurveySection, sentiment: HeardAnswer["sentiment"]) {
  if (section.kind !== "chips") return null;
  const s = sentiment ?? (section.modes.includes("like") ? "like" : section.modes[0]);
  if (section.modes.includes(s)) return { section, sentiment: s };
  const single = def.sections.find((x) => x.kind === "chips" && x.modes.length === 1 && x.modes[0] === s);
  if (single) return { section: single, sentiment: s };
  return { section, sentiment: section.modes[0] };
}

const STOP = new Set(["it", "that", "them", "this", "things", "everything", "anything", "much", "food", "stuff", "you", "a lot", "lot", "too", "also", "as well", "it too", "them too"]);
const FREE_RE =
  /\b(?:love|adore|really like|like|enjoy|hate|dislike|can'?t stand|not a fan of|don'?t (?:really )?(?:like|want|eat|drink)|please don'?t (?:get|buy|give) me|no more)\s+(.+)$/;

function cleanPhrase(p: string): string[] {
  return p
    .split(/\band\b|\bor\b|&/)
    .map((x) =>
      x
        .replace(/^(the|a|an|some|any|my|getting|eating|drinking|having)\s+/, "")
        .replace(/(\s+(food|stuff|very much|so much|much|a lot|especially|either|too|also|as well|anymore|at all))+$/g, "")
        .trim(),
    )
    .filter((x) => x && !STOP.has(x) && x.split(" ").length <= 4 && x.length <= 30);
}

/** Lowercase, punctuation out, contractions back ("don t" → "don't"). */
const clean = (text: string) => ` ${norm(text.replace(/’/g, "'"))} `.replace(/ (s|t|d|ll|re|ve|m) /g, "'$1 ").trim();

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function partnerName(): string | undefined {
  return PEOPLE_DIRECTORY.find((p) => /partner|husband|wife|spouse/i.test(p.relationship))?.firstName;
}

export function localParse(def: SurveyDef, transcript: string, focus: string | null): HeardAnswer[] {
  const vocab = buildVocab(def);
  const out: HeardAnswer[] = [];
  const blank = { sentiment: null, severity: null, date: null, who: null, note: null, field: null } as const;
  const focusSection = def.sections.find((s) => s.id === focus);
  const fallback = def.sections.find((s) => s.id === def.fallbackSection)!;
  const freeHome = focusSection?.kind === "chips" ? focusSection : fallback;
  const allergySection = def.sections.find((s) => s.kind === "allergies");
  const dateSections = def.sections.filter((s) => s.kind === "dates");
  const fieldsSection = def.sections.find((s) => s.kind === "fields");

  const push = (a: HeardAnswer) => {
    const i = out.findIndex((o) => heardKey(o) === heardKey(a));
    if (i >= 0) out[i] = a;
    else out.push(a);
  };

  for (const sentenceRaw of transcript.split(/[!?;\n]+|\.(?=\s|$)/)) {
    const sentence = clean(sentenceRaw);
    if (!sentence) continue;

    // Dates
    if (dateSections.length) {
      const found: HeardAnswer[] = [];
      const re = new RegExp(`${MONTH_RE}\\s+${DAY_RE}|${DAY_RE}\\s+of\\s+${MONTH_RE}`, "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(sentence))) {
        const monthWord = m[1] ?? m[4];
        const day = Number(m[2] ?? m[3]);
        const month = MONTHS.findIndex((x) => x.startsWith(monthWord.slice(0, 3))) + 1;
        if (!month || day < 1 || day > 31) continue;
        const before = sentence.slice(Math.max(0, m.index - 60), m.index);
        const scope = `${before} ${sentence.slice(m.index, m.index + 40)}`;
        const named = PEOPLE_DIRECTORY.find((p) => new RegExp(`\\b${p.firstName.toLowerCase()}\\b`).test(before));
        let sectionId = focusSection?.kind === "dates" ? focusSection.id : dateSections[0].id;
        let label = "Important day";
        let who = "";
        if (/birthday/.test(scope)) {
          sectionId = "birthdays";
          label = "Birthday";
        } else if (/anniversary/.test(scope)) {
          sectionId = /passed|died|loss|lost/.test(scope) ? "hard" : "anniversaries";
          label = /wedding/.test(scope) ? "Wedding anniversary" : /dating|first date/.test(scope) ? "Dating anniversary" : sectionId === "hard" ? "Anniversary of a loss" : "Anniversary";
        } else if (/passed|died|loss|lost/.test(scope)) {
          sectionId = "hard";
          label = "Anniversary of a loss";
        }
        if (/\bmy\b/.test(before.split(/\band\b/).pop() ?? "")) who = "Yours";
        if (/\bour\b/.test(before.split(/\band\b/).pop() ?? "")) {
          const partner = named?.firstName ?? partnerName();
          who = partner ? `Yours and ${partner}'s` : "Yours";
        } else if (named) who = `${named.firstName}'s`;
        if (!dateSections.some((s) => s.id === sectionId)) sectionId = dateSections[0].id;
        found.push({
          ...blank,
          sectionId,
          kind: "date",
          label,
          date: `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          who: who || null,
        });
      }
      // Holidays and observances named without a date
      for (const v of vocab) {
        if (v.section.kind !== "dates" || !v.pattern.test(sentence)) continue;
        if (found.some((f) => norm(f.label) === norm(v.label))) continue;
        const starter = v.section.starters.find((s) => s.label === v.label);
        if (!starter || /birthday|anniversary|loss|tough/i.test(starter.label)) continue;
        found.push({ ...blank, sectionId: v.section.id, kind: "date", label: v.label, date: starter.date ?? null });
      }
      if (found.length) {
        const last = found[found.length - 1];
        const thing = last.label.toLowerCase().includes("birthday") ? "birthdays" : last.label.toLowerCase();
        if (/(big )?fuss|low ?key|quiet|no party|nothing big/.test(sentence)) last.note = `Prefers ${thing} low-key`;
        else if (/big party|all out|big celebration/.test(sentence)) last.note = `Loves a big celebration`;
        found.forEach(push);
        continue;
      }
    }

    // Allergies
    if (allergySection && /allerg|can'?t (eat|have)|anaphyla/.test(sentence)) {
      const severity = /slight|mild|minor|little/.test(sentence)
        ? "slight"
        : /moderate|medium/.test(sentence)
          ? "moderate"
          : /severe|serious|bad|deadly|anaphyla|epipen/.test(sentence)
            ? "severe"
            : null;
      const hits = vocab.filter((v) => v.section.id === allergySection.id && v.pattern.test(sentence));
      const labels = [...new Set(hits.map((h) => h.label))];
      if (!labels.length) {
        const m = /allergic to (.+)$/.exec(sentence);
        if (m) labels.push(...cleanPhrase(m[1]).map(titleCase));
      }
      for (const label of labels) push({ ...blank, sectionId: allergySection.id, kind: "allergy", label, severity });
      if (labels.length) continue;
    }

    // Sizes
    if (fieldsSection?.kind === "fields") {
      for (const field of fieldsSection.fields) {
        const f = field.toLowerCase().replace(/s$/, "");
        const m =
          new RegExp(`\\b${f}s?\\s+(?:size\\s+)?(?:is\\s+|are\\s+)?(?:a\\s+)?(\\d+(?: \\d)?|xx?s|xx?l|small|medium|large|s|m|l)\\b`).exec(sentence) ??
          new RegExp(`\\b(?:size\\s+)?(\\d+(?: \\d)?|xx?s|xx?l|small|medium|large)\\s+(?:in\\s+)?${f}s?\\b`).exec(sentence);
        if (m) push({ ...blank, sectionId: fieldsSection.id, kind: "field", field, label: titleCase(m[1].replace(" ", ".")) });
      }
    }

    // Preferences
    if (!def.sections.some((s) => s.kind === "chips")) continue;
    let carried: HeardAnswer["sentiment"] = null;
    for (const clause of sentenceRaw.split(/,|\bbut\b|\bthough\b|\bhowever\b|\bexcept\b/i)) {
      const c = clean(clause);
      if (!c) continue;
      // "I take my coffee as an oat flat white"
      const coffee = def.sections.find((x) => x.id === "coffee");
      const how = coffee && /\b(?:take|have|drink|order|get) (?:my )?(?:coffee|tea)(?: as| with| like)?(?: an?)? (.+)$/.exec(c);
      if (coffee && how) {
        for (const phrase of cleanPhrase(how[1])) {
          const known = vocab.find((v) => v.section.id === coffee.id && (v.pattern.test(phrase) || v.pattern.test(`${phrase} coffee`)));
          push({ ...blank, sectionId: coffee.id, kind: "pick", label: known?.label ?? titleCase(phrase), sentiment: "like" });
        }
        carried = null;
        continue;
      }
      const own = sentimentOf(c);
      const sentiment: HeardAnswer["sentiment"] = own ?? carried;
      carried = sentiment;
      let rest = c;
      const matched = new Set<string>();
      for (const v of vocab) {
        if (v.section.kind !== "chips" || !v.pattern.test(rest)) continue;
        rest = rest.replace(v.pattern, " ");
        if (matched.has(v.label)) continue;
        matched.add(v.label);
        const place = placeFor(def, v.section, sentiment);
        if (place) push({ ...blank, sectionId: place.section.id, kind: "pick", label: v.label, sentiment: place.sentiment });
      }
      const free = FREE_RE.exec(rest.replace(/\s+/g, " ").trim());
      if (free && sentiment) {
        for (const phrase of cleanPhrase(free[1])) {
          const label = titleCase(phrase);
          if ([...matched].some((m) => norm(m) === norm(label))) continue;
          const place = placeFor(def, freeHome, sentiment);
          if (place) push({ ...blank, sectionId: place.section.id, kind: "pick", label, sentiment: place.sentiment });
        }
      }
    }
  }
  return out;
}
