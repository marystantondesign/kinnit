import { useState } from "react";
import { Plus, Sparkles, TriangleAlert, X } from "lucide-react";
import {
  SENTIMENT_LABEL,
  SEVERITIES,
  type AllergySection,
  type ChipSection,
  type DatesSection,
  type FieldsSection,
  type Sentiment,
  type SurveyDef,
  type SurveySection,
} from "../../config/surveys";
import { suggestionsFor } from "../../config/surveySuggestions";
import {
  addAllergy,
  addCustomChip,
  addDate,
  formatMonthDay,
  removeDate,
  setField,
  setNote,
  setSeverity,
  tapChip,
  toggleAllergy,
  updateDate,
  type SectionAnswer,
  type SurveyState,
} from "../../utils/surveyAnswers";
import { AttachmentList } from "./Integrations";
import { AddAnotherChip, Chip, ModeSwitch, SuggestChip } from "./SurveyBits";

// The body of one section in the tap route. Every edit saves immediately.

interface EditorProps<S extends SurveySection> {
  def: SurveyDef;
  section: S;
  state: SurveyState;
  compact?: boolean;
}

export function SectionEditor(props: EditorProps<SurveySection>) {
  const { section } = props;
  switch (section.kind) {
    case "chips":
      return <ChipEditor {...props} section={section} />;
    case "allergies":
      return <AllergyEditor {...props} section={section} />;
    case "dates":
      return <DatesEditor {...props} section={section} />;
    case "fields":
      return <FieldsEditor {...props} section={section} />;
  }
}

export function sectionHint(section: SurveySection, compact = false): string {
  switch (section.kind) {
    case "chips":
      return section.modes.length > 1
        ? compact
          ? "Pick a mode, then tap what fits."
          : "Pick a mode, then tap what fits. Tap again to clear."
        : "Tap what fits. Tap again to clear. Skip anything you like.";
    case "allergies":
      return "Tap anything you're allergic to, then say how careful people need to be.";
    case "dates":
      return "Add a date, a label, who it involves, and how you like it marked.";
    case "fields":
      return "Fill in only what you know. Skip the rest.";
  }
}

/** Every chip to show: listed, added by the person, and anything picked by talking. */
function chipList(section: ChipSection | AllergySection, a: SectionAnswer | undefined): string[] {
  const all = [...section.chips, ...(a?.custom ?? [])];
  for (const k of Object.keys(section.kind === "chips" ? (a?.picks ?? {}) : (a?.allergies ?? {}))) {
    if (!all.includes(k)) all.push(k);
  }
  return all;
}

function NoteBox({ surveyId, sectionId, value }: { surveyId: string; sectionId: string; value: string }) {
  return (
    <label className="block">
      <span className="text-[13px] text-gray-500">Anything else to add?</span>
      <textarea
        value={value}
        onChange={(e) => setNote(surveyId, sectionId, e.target.value)}
        rows={2}
        placeholder="In your own words"
        className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-[14px] leading-5 text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 resize-none"
      />
    </label>
  );
}

// ─── Chips ────────────────────────────────────────────────────────────────────

function ChipEditor({ def, section, state, compact }: EditorProps<ChipSection>) {
  const [mode, setMode] = useState<Sentiment>(section.modes[0]);
  const a = state.sections[section.id];
  const picks = a?.picks ?? {};
  const chips = chipList(section, a);
  const positive = Object.entries(picks)
    .filter(([, m]) => m !== "avoid")
    .map(([label]) => label);
  const suggestions = section.modes.includes("love") || section.modes.includes("like") ? suggestionsFor(positive, chips) : [];
  const addMode: Sentiment = mode === "avoid" ? (section.modes.find((m) => m !== "avoid") ?? mode) : mode;

  return (
    <div className="space-y-5">
      {section.modes.length > 1 && <ModeSwitch modes={section.modes} value={mode} onChange={setMode} full={compact} />}
      <div className="flex flex-wrap gap-2">
        {chips.map((label) => (
          <Chip
            key={label}
            label={label}
            state={picks[label] ?? null}
            pressedLabel={section.modes.length === 1 ? section.singleLabel : undefined}
            onClick={() => tapChip(def.id, section.id, label, mode)}
          />
        ))}
        <AddAnotherChip onAdd={(text) => addCustomChip(def.id, section.id, text, mode, section.chips)} />
      </div>
      {suggestions.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-2">
            <Sparkles size={14} strokeWidth={1.75} aria-hidden />
            {compact ? "Suggested for you" : "Kinnit suggests, based on what you picked"}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <SuggestChip key={s} label={s} onClick={() => addCustomChip(def.id, section.id, s, addMode, section.chips)} />
            ))}
          </div>
        </div>
      )}
      {def.freeText && <NoteBox surveyId={def.id} sectionId={section.id} value={a?.note ?? ""} />}
      <AttachmentList surveyId={def.id} items={state.attachments.filter((x) => x.sectionId === section.id)} />
    </div>
  );
}

// ─── Allergies ────────────────────────────────────────────────────────────────

const SEVERITY_LABEL = { slight: "Slight", moderate: "Moderate", severe: "Severe" } as const;

function AllergyEditor({ def, section, state }: EditorProps<AllergySection>) {
  const a = state.sections[section.id];
  const allergies = a?.allergies ?? {};
  const chips = chipList(section, a);
  const picked = chips.filter((c) => c in allergies);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {chips.map((label) => {
          const on = label in allergies;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => toggleAllergy(def.id, section.id, label)}
              className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[14px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                on ? "bg-red-50 text-red-700 border border-red-100" : "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {on && <TriangleAlert size={15} strokeWidth={2} aria-hidden />}
              {label}
            </button>
          );
        })}
        <AddAnotherChip onAdd={(text) => addAllergy(def.id, section.id, text, null, section.chips)} />
      </div>
      {picked.length > 0 && (
        <div className="space-y-2">
          <p className="text-[13px] text-gray-500">How careful do people need to be?</p>
          {picked.map((label) => (
            <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between rounded-xl border border-gray-200 px-3 py-2">
              <span className="text-[14px] text-gray-900">{label}</span>
              <div role="radiogroup" aria-label={`${label} severity`} className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-gray-100">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={allergies[label] === s}
                    onClick={() => setSeverity(def.id, section.id, label, s)}
                    className={`h-7 px-3 rounded-md text-[13px] transition-colors ${
                      allergies[label] === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {SEVERITY_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dates ────────────────────────────────────────────────────────────────────

const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString("en-US", { month: "long" }));
const daysIn = (m: number) => new Date(2000, m, 0).getDate();
const inputCls =
  "h-9 px-3 rounded-lg border border-gray-200 bg-white text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 min-w-0";

function DatesEditor({ def, section, state }: EditorProps<DatesSection>) {
  const entries = state.sections[section.id]?.dates ?? [];
  const starters = section.starters.filter((s) => !entries.some((e) => e.label.toLowerCase() === s.label.toLowerCase()));
  return (
    <div className="space-y-4">
      {entries.length > 0 && (
        <ul className="space-y-3">
          {entries.map((e) => {
            const [m, d] = e.date ? e.date.split("-").map(Number) : [0, 0];
            const setDate = (month: number, day: number) =>
              updateDate(def.id, section.id, e.id, {
                date: month ? `${String(month).padStart(2, "0")}-${String(Math.min(day || 1, daysIn(month))).padStart(2, "0")}` : null,
              });
            return (
              <li key={e.id} className="rounded-xl border border-gray-200 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={e.label}
                    onChange={(ev) => updateDate(def.id, section.id, e.id, { label: ev.target.value })}
                    aria-label="Label"
                    placeholder="What's the day?"
                    className={`${inputCls} flex-1 font-medium`}
                  />
                  <button
                    type="button"
                    onClick={() => removeDate(def.id, section.id, e.id)}
                    aria-label={`Remove ${e.label || "date"}`}
                    className="size-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1.4fr)] gap-2">
                  <select value={m} onChange={(ev) => setDate(Number(ev.target.value), d)} aria-label="Month" className={inputCls}>
                    <option value={0}>Date varies</option>
                    {MONTH_NAMES.map((name, i) => (
                      <option key={name} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select value={d} disabled={!m} onChange={(ev) => setDate(m, Number(ev.target.value))} aria-label="Day" className={inputCls}>
                    {!m && <option value={0}>Day</option>}
                    {m > 0 &&
                      Array.from({ length: daysIn(m) }, (_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                  </select>
                  <input
                    value={e.who}
                    onChange={(ev) => updateDate(def.id, section.id, e.id, { who: ev.target.value })}
                    aria-label="Who it involves"
                    placeholder="Who it involves"
                    className={`${inputCls} col-span-2 sm:col-span-1`}
                  />
                </div>
                <input
                  value={e.note}
                  onChange={(ev) => updateDate(def.id, section.id, e.id, { note: ev.target.value })}
                  aria-label="Note"
                  placeholder="A note, like “prefers it low-key”"
                  className={`${inputCls} w-full`}
                />
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        {starters.map((s) => (
          <SuggestChip
            key={s.label}
            label={s.label}
            onClick={() => addDate(def.id, section.id, { label: s.label, date: s.date ?? null, who: s.who ?? "", note: "" })}
          />
        ))}
        <button
          type="button"
          onClick={() => addDate(def.id, section.id, { label: "", date: null, who: "", note: "" })}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[14px] border border-dashed border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
        >
          <Plus size={15} strokeWidth={1.75} aria-hidden />
          Add a date
        </button>
      </div>
    </div>
  );
}

// ─── Fields ───────────────────────────────────────────────────────────────────

function FieldsEditor({ def, section, state }: EditorProps<FieldsSection>) {
  const a = state.sections[section.id];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {section.fields.map((f) => (
          <label key={f} className="block">
            <span className="text-[13px] text-gray-500">{f}</span>
            <input
              value={a?.fields?.[f] ?? ""}
              onChange={(e) => setField(def.id, section.id, f, e.target.value)}
              className={`${inputCls} mt-1 w-full`}
            />
          </label>
        ))}
      </div>
      {def.freeText && <NoteBox surveyId={def.id} sectionId={section.id} value={a?.note ?? ""} />}
    </div>
  );
}

// ─── "Your answers so far" ────────────────────────────────────────────────────

export function AnswersSummary({ section, state }: { section: SurveySection; state: SurveyState }) {
  const a = state.sections[section.id];
  const groups: { label: string; values: string[] }[] = [];
  if (section.kind === "chips") {
    for (const m of section.modes) {
      const values = Object.entries(a?.picks ?? {})
        .filter(([, v]) => v === m)
        .map(([k]) => k);
      if (values.length) groups.push({ label: section.modes.length === 1 ? (section.singleLabel ?? SENTIMENT_LABEL[m]) : SENTIMENT_LABEL[m], values });
    }
  } else if (section.kind === "allergies") {
    const values = Object.entries(a?.allergies ?? {}).map(([k, s]) => (s ? `${k}, ${s}` : k));
    if (values.length) groups.push({ label: "Allergies", values });
  } else if (section.kind === "dates") {
    for (const e of a?.dates ?? []) {
      groups.push({
        label: formatMonthDay(e.date),
        values: [[e.label || "Untitled", e.who].filter(Boolean).join(" · ") + (e.note ? ` (${e.note})` : "")],
      });
    }
  } else {
    const values = Object.entries(a?.fields ?? {})
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${k}: ${v}`);
    if (values.length) groups.push({ label: "Sizes", values });
  }
  if (a?.note?.trim()) groups.push({ label: "In your words", values: [a.note.trim()] });
  const attachments = state.attachments.filter((x) => x.sectionId === section.id);
  const links = attachments.filter((x) => x.kind === "link").length;
  const photos = attachments.filter((x) => x.kind === "photo").length;
  const saved = [links && `${links} link${links > 1 ? "s" : ""}`, photos && `${photos} photo${photos > 1 ? "s" : ""}`].filter(Boolean);
  if (saved.length) groups.push({ label: "Saved", values: [saved.join(", ")] });

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5" aria-labelledby="answers-so-far">
      <h2 id="answers-so-far" className="text-[16px] font-semibold text-gray-900">
        Your answers so far
      </h2>
      {groups.length ? (
        <dl className="mt-3 space-y-3">
          {groups.map((g, i) => (
            <div key={`${g.label}-${i}`}>
              <dt className="text-[13px] text-gray-400">{g.label}</dt>
              <dd className="text-[14px] text-gray-900 mt-0.5">{g.values.join(", ")}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-2 text-[14px] text-gray-500">Nothing yet for {section.title.toLowerCase()}. That's fine, skipping is always okay.</p>
      )}
    </section>
  );
}
