import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Check, Mic, Minus, Pause, Pencil, Play, Square, TriangleAlert, X } from "lucide-react";
import { SENTIMENT_LABEL, type Sentiment, type SurveyDef, type SurveySection } from "../../config/surveys";
import { Waveform } from "../../components/talk/TalkToKinnit";
import { useSpeechCapture } from "../../components/talk/useSpeechCapture";
import { YearCalendar } from "../../components/surveys/YearCalendar";
import { BackLink, MODE_ICON } from "../../components/surveys/SurveyBits";
import { applyHeard, parseSurveyTalk, type HeardItem } from "../../utils/surveyParse";
import { finishSurvey, formatMonthDay, useSurveyState, type SurveyState } from "../../utils/surveyAnswers";
import type { HeardAnswer } from "../../../shared/surveyTalk";

// Talk route: Talk to Kinnit, specific to one survey. Nothing is saved until
// the person confirms. Unconfirmed talk is kept for the session, so switching
// to tapping and back never loses it.

function useIsWide() {
  const query = "(min-width: 1024px)";
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setWide(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return wide;
}

interface Draft {
  text: string;
  off: string[];
  edits: Record<string, Partial<HeardAnswer>>;
}
const draftKey = (id: string) => `kinnit.surveyTalk.${id}`;
function loadDraft(id: string): Draft {
  try {
    const raw = sessionStorage.getItem(draftKey(id));
    if (raw) return JSON.parse(raw) as Draft;
  } catch {}
  return { text: "", off: [], edits: {} };
}
function saveDraft(id: string, d: Draft) {
  try {
    if (!d.text && !d.off.length && !Object.keys(d.edits).length) sessionStorage.removeItem(draftKey(id));
    else sessionStorage.setItem(draftKey(id), JSON.stringify(d));
  } catch {}
}

const join = (a: string, b: string) => [a.trim(), b.trim()].filter(Boolean).join(" ");
const noteKey = (key: string) => `${key}#note`;

/** One row in "Heard so far": an answer, or the note riding on a date. */
interface HeardRow {
  key: string;
  item: HeardItem;
  isNote: boolean;
}

function rowsFor(items: HeardItem[]): HeardRow[] {
  return items.flatMap((item) => [
    { key: item.key, item, isNote: false },
    ...(item.kind === "date" && item.note ? [{ key: noteKey(item.key), item, isNote: true }] : []),
  ]);
}

function sectionOf(def: SurveyDef, id: string) {
  return def.sections.find((s) => s.id === id);
}

function modeLabel(section: SurveySection | undefined, m: Sentiment) {
  return section?.kind === "chips" && section.modes.length === 1 ? (section.singleLabel ?? SENTIMENT_LABEL[m]) : SENTIMENT_LABEL[m];
}

function describe(def: SurveyDef, row: HeardRow): { title: string; sub: string } {
  const { item } = row;
  const section = sectionOf(def, item.sectionId);
  if (row.isNote) {
    const whose = !item.who || item.who === "Yours" ? "your" : item.who;
    return { title: item.note!, sub: `Note on ${whose} ${item.label.toLowerCase()}` };
  }
  switch (item.kind) {
    case "date":
      return {
        title: item.date ? `${item.label}, ${formatMonthDay(item.date)}` : item.label,
        sub: [item.who, item.date ? null : "Date varies", section?.title].filter(Boolean).slice(0, 2).join(" · "),
      };
    case "pick":
      return { title: item.label, sub: `${modeLabel(section, item.sentiment ?? "like")} · ${section?.title ?? ""}` };
    case "allergy":
      return { title: item.severity ? `${item.label}, ${item.severity}` : item.label, sub: "Allergy" };
    case "field":
      return { title: `${item.field}: ${item.label}`, sub: section?.title ?? "" };
  }
}

function RowIcon({ def, row }: { def: SurveyDef; row: HeardRow }) {
  const { item } = row;
  let Icon = sectionOf(def, item.sectionId)?.icon ?? Check;
  if (row.isNote) Icon = Pencil;
  else if (item.kind === "pick") Icon = MODE_ICON[item.sentiment ?? "like"];
  else if (item.kind === "allergy") Icon = TriangleAlert;
  return (
    <span className="size-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0" aria-hidden>
      <Icon size={18} strokeWidth={1.75} />
    </span>
  );
}

// ─── Editing one heard answer ─────────────────────────────────────────────────

const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString("en-US", { month: "long" }));
const field = "h-9 px-2.5 rounded-lg border border-gray-200 bg-white text-[14px] outline-none focus:border-gray-400 min-w-0";

function RowEditor({
  def,
  row,
  onPatch,
  onDone,
}: {
  def: SurveyDef;
  row: HeardRow;
  onPatch: (p: Partial<HeardAnswer>) => void;
  onDone: () => void;
}) {
  const { item } = row;
  const section = sectionOf(def, item.sectionId);
  const [m, d] = item.date ? item.date.split("-").map(Number) : [0, 0];
  return (
    <div className="mt-2 space-y-2">
      {row.isNote ? (
        <input autoFocus value={item.note ?? ""} onChange={(e) => onPatch({ note: e.target.value })} aria-label="Note" className={`${field} w-full`} />
      ) : (
        <input autoFocus value={item.label} onChange={(e) => onPatch({ label: e.target.value })} aria-label="Answer" className={`${field} w-full`} />
      )}
      {!row.isNote && item.kind === "pick" && section?.kind === "chips" && section.modes.length > 1 && (
        <select value={item.sentiment ?? "like"} onChange={(e) => onPatch({ sentiment: e.target.value as Sentiment })} aria-label="How you feel" className={`${field} w-full`}>
          {section.modes.map((mode) => (
            <option key={mode} value={mode}>
              {SENTIMENT_LABEL[mode]}
            </option>
          ))}
        </select>
      )}
      {!row.isNote && item.kind === "allergy" && (
        <select
          value={item.severity ?? ""}
          onChange={(e) => onPatch({ severity: (e.target.value || null) as HeardAnswer["severity"] })}
          aria-label="Severity"
          className={`${field} w-full`}
        >
          <option value="">Severity not said</option>
          <option value="slight">Slight</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
        </select>
      )}
      {!row.isNote && item.kind === "date" && (
        <div className="grid grid-cols-2 gap-2">
          <select
            value={m}
            onChange={(e) => {
              const month = Number(e.target.value);
              onPatch({ date: month ? `${String(month).padStart(2, "0")}-${String(d || 1).padStart(2, "0")}` : null });
            }}
            aria-label="Month"
            className={field}
          >
            <option value={0}>Date varies</option>
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={31}
            disabled={!m}
            value={d || ""}
            onChange={(e) => {
              const day = Math.min(31, Math.max(1, Number(e.target.value) || 1));
              onPatch({ date: `${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}` });
            }}
            aria-label="Day"
            className={field}
          />
          <input
            value={item.who ?? ""}
            onChange={(e) => onPatch({ who: e.target.value })}
            placeholder="Who it involves"
            aria-label="Who it involves"
            className={`${field} col-span-2`}
          />
        </div>
      )}
      <button type="button" onClick={onDone} className="h-8 px-3 rounded-lg bg-gray-900 text-white text-[13px]">
        Done
      </button>
    </div>
  );
}

// ─── Backdrop visuals (desktop) ───────────────────────────────────────────────

function AnswersBoard({ def, state, heard }: { def: SurveyDef; state: SurveyState; heard: HeardItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {def.sections.map((s) => {
        const a = state.sections[s.id];
        const saved: { label: string; mode?: Sentiment }[] =
          s.kind === "chips"
            ? Object.entries(a?.picks ?? {}).map(([label, mode]) => ({ label, mode }))
            : s.kind === "allergies"
              ? Object.entries(a?.allergies ?? {}).map(([k, v]) => ({ label: v ? `${k}, ${v}` : k }))
              : s.kind === "fields"
                ? Object.entries(a?.fields ?? {})
                    .filter(([, v]) => v.trim())
                    .map(([k, v]) => ({ label: `${k}: ${v}` }))
                : [];
        const just = heard.filter((h) => h.sectionId === s.id);
        const Icon = s.icon;
        return (
          <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-gray-900">
              <Icon size={16} strokeWidth={1.75} className="text-gray-500" aria-hidden />
              {s.title}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 min-h-[28px]">
              {just.map((h) => {
                const I = h.kind === "pick" ? MODE_ICON[h.sentiment ?? "like"] : h.kind === "allergy" ? TriangleAlert : null;
                return (
                  <span key={h.key} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-gray-900 text-white text-[13px]">
                    {I && <I size={12} strokeWidth={2} className={h.sentiment === "love" ? "fill-white" : ""} aria-hidden />}
                    {h.kind === "field" ? `${h.field}: ${h.label}` : h.label}
                  </span>
                );
              })}
              {saved.map((x) => {
                const I = x.mode ? MODE_ICON[x.mode] : null;
                return (
                  <span
                    key={x.label}
                    className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-gray-200 text-[13px] ${
                      x.mode === "avoid" ? "text-gray-400 line-through" : "text-gray-700"
                    }`}
                  >
                    {I && <I size={12} strokeWidth={2} aria-hidden />}
                    {x.label}
                  </span>
                );
              })}
              {!just.length && !saved.length && <span className="text-[13px] text-gray-400">{s.prompt}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SurveyTalk({ def }: { def: SurveyDef }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const wide = useIsWide();
  const state = useSurveyState(def.id);
  const capture = useSpeechCapture();
  const base = `/app/about-me/${def.id}`;

  const initial = useMemo(() => loadDraft(def.id), [def.id]);
  const [draft, setDraft] = useState(initial.text);
  const [spoken, setSpoken] = useState(initial.text); // text before this capture started
  const [off, setOff] = useState<Set<string>>(() => new Set(initial.off));
  const [edits, setEdits] = useState<Record<string, Partial<HeardAnswer>>>(initial.edits);
  const [items, setItems] = useState<HeardItem[]>([]);
  const [focus, setFocus] = useState<string | null>(params.get("section"));
  const [editing, setEditing] = useState<string | null>(null);
  const [added, setAdded] = useState<number | null>(null);
  const [minimized, setMinimized] = useState(false);

  const live = capture.status === "listening" || capture.status === "paused" || capture.status === "requesting";
  const cantListen = capture.status === "denied" || capture.status === "unsupported";

  // Start listening as soon as the panel opens.
  useEffect(() => {
    capture.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The capture's transcript continues whatever was said before.
  useEffect(() => {
    if (live) setDraft(join(spoken, capture.transcript));
  }, [capture.transcript, live, spoken]);

  useEffect(() => saveDraft(def.id, { text: draft, off: [...off], edits }), [def.id, draft, off, edits]);

  // Re-read the whole conversation as it grows.
  useEffect(() => {
    if (!draft.trim()) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const r = await parseSurveyTalk(def.id, draft, focus, ctrl.signal);
        setItems(r.items);
      } catch {}
    }, 500);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [def.id, draft, focus]);

  const view = items.map((i) => ({ ...i, ...edits[i.key] }));
  const rows = rowsFor(view);
  const chosen = rows.filter((r) => !off.has(r.key));
  const count = chosen.length;

  const toggle = (key: string) =>
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const keepTalking = () => {
    if (!live && !cantListen) {
      setSpoken(draft);
      capture.start();
    }
  };

  const confirm = () => {
    const toSave = view
      .filter((i) => !off.has(i.key))
      .map((i) => (i.kind === "date" && off.has(noteKey(i.key)) ? { ...i, note: null } : i));
    applyHeard(def.id, toSave);
    setAdded(count);
    setOff(new Set());
    setEdits({});
    setItems([]);
    setEditing(null);
    setSpoken("");
    setDraft("");
    capture.setTranscript("");
  };

  const done = () => {
    if (live) capture.stop();
    if (count) confirm();
  };

  const close = () => {
    capture.stop();
    navigate(base);
  };
  const switchToTapping = () => {
    capture.stop();
    navigate(`${base}/answer${focus ? `?section=${focus}` : ""}`);
  };
  const finish = () => {
    capture.stop();
    finishSurvey(def.id);
    navigate(base);
  };

  const area = focus ? sectionOf(def, focus) : undefined;
  const statusText = capture.status === "requesting" ? "Starting…" : capture.status === "paused" ? "Paused" : live ? "Listening…" : "Stopped";

  // ── Shared panel pieces ──

  const areaChips = (
    <div className={`flex flex-wrap gap-2 ${wide ? "" : "justify-center"}`}>
      {def.talkAreas.map((a) => {
        const on = focus === a.sectionId;
        return (
          <button
            key={a.sectionId}
            type="button"
            aria-pressed={on}
            onClick={() => setFocus(on ? null : a.sectionId)}
            className={`h-10 px-4 rounded-full text-[14px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              on ? "bg-gray-900 text-white" : "border border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100"
            }`}
          >
            {a.label}
          </button>
        );
      })}
    </div>
  );

  const ask = area && (
    <p className="rounded-2xl bg-gray-900 text-white px-4 py-3 text-[15px] leading-6" aria-live="polite">
      {area.ask}
    </p>
  );

  const transcriptBox =
    cantListen || !live ? (
      <div>
        {cantListen && (
          <p className="text-[13px] text-gray-500 mb-2">
            {capture.status === "denied"
              ? "Microphone access is off. You can type instead, and Kinnit will pick out the answers."
              : "Voice isn't available in this browser. Type instead, and Kinnit will pick out the answers."}
          </p>
        )}
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setSpoken(e.target.value);
          }}
          rows={4}
          aria-label={cantListen ? "Type your answers" : "What you said"}
          placeholder={cantListen ? "I love Japanese food, sushi especially. I have a slight peanut allergy…" : "Nothing yet"}
          className="w-full rounded-2xl bg-gray-50 border border-gray-100 p-4 text-[15px] leading-6 text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 resize-none"
        />
      </div>
    ) : (
      <p className="rounded-2xl bg-gray-50 p-4 min-h-[84px] text-[15px] leading-6 text-gray-900" aria-live="polite">
        {draft || <span className="text-gray-400">Start talking…</span>}
        {capture.status === "listening" && <span className="inline-block w-px h-5 ml-0.5 align-middle bg-gray-900 animate-pulse" />}
      </p>
    );

  const success = added !== null && (
    <div className="rounded-2xl border border-gray-200 p-4" role="status">
      <p className="flex items-center gap-2 text-[15px] font-medium text-gray-900">
        <span className="size-6 rounded-full bg-gray-900 text-white flex items-center justify-center">
          <Check size={14} strokeWidth={2.5} />
        </span>
        Added {added} to {def.title}
      </p>
      <p className="text-[13px] text-gray-500 mt-1">Keep talking, or finish if that covers it.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={finish} className="h-10 px-4 rounded-xl bg-gray-900 text-white text-[14px] font-medium hover:bg-gray-800">
          Finish
        </button>
        <Link to={`${base}/answer`} onClick={() => capture.stop()} className="h-10 px-4 rounded-xl border border-gray-200 text-[14px] text-gray-900 inline-flex items-center hover:bg-gray-50">
          Review answers
        </Link>
      </div>
    </div>
  );

  // ── Desktop: cards with checkboxes ──

  const heardCards = rows.length > 0 && (
    <div>
      <h3 className="text-[12px] font-semibold tracking-[0.08em] text-gray-500 uppercase mb-2">Heard so far</h3>
      <ul className="space-y-2.5">
        {rows.map((row) => {
          const checked = !off.has(row.key);
          const { title, sub } = describe(def, row);
          const isEditing = editing === row.key;
          return (
            <li key={row.key} className={`rounded-2xl border border-gray-200 px-4 py-3 ${checked ? "" : "opacity-60"}`}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  aria-label={`Include ${title}`}
                  onClick={() => toggle(row.key)}
                  className={`size-6 rounded-md flex items-center justify-center flex-shrink-0 ${checked ? "bg-gray-900 text-white" : "border-[1.5px] border-gray-300"}`}
                >
                  {checked && <Check size={15} strokeWidth={3} />}
                </button>
                <RowIcon def={def} row={row} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] leading-5 text-gray-900 break-words">{title}</p>
                  <p className="text-[13px] leading-[18px] text-gray-500 break-words">{sub}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(isEditing ? null : row.key)}
                  aria-label={`Edit ${title}`}
                  className="size-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100"
                >
                  <Pencil size={16} strokeWidth={1.75} />
                </button>
              </div>
              {isEditing && (
                <RowEditor
                  def={def}
                  row={row}
                  onPatch={(p) => setEdits((e) => ({ ...e, [row.item.key]: { ...e[row.item.key], ...p } }))}
                  onDone={() => setEditing(null)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );

  // ── Mobile: grouped chips ──

  const groups = useMemo(() => {
    const out: { label: string; rows: HeardRow[] }[] = [];
    const add = (label: string, row: HeardRow) => {
      const g = out.find((x) => x.label === label);
      if (g) g.rows.push(row);
      else out.push({ label, rows: [row] });
    };
    for (const row of rows) {
      const { item } = row;
      if (row.isNote) add("Notes", row);
      else if (item.kind === "pick") add(modeLabel(sectionOf(def, item.sectionId), item.sentiment ?? "like"), row);
      else if (item.kind === "allergy") add("Allergies", row);
      else if (item.kind === "date") add(sectionOf(def, item.sectionId)?.title ?? "Dates", row);
      else add("Sizes", row);
    }
    return out;
  }, [rows, def]);

  const heardChips = rows.length > 0 && (
    <div>
      <h3 className="text-[12px] font-semibold tracking-[0.08em] text-gray-500 uppercase mb-2">Heard so far</h3>
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="text-[13px] text-gray-500 mb-1.5">{g.label}</p>
            <div className="flex flex-wrap gap-2">
              {g.rows.map((row) => {
                const on = !off.has(row.key);
                const { item } = row;
                const allergy = !row.isNote && item.kind === "allergy";
                const sentiment = !row.isNote && item.kind === "pick" ? (item.sentiment ?? "like") : null;
                const I = allergy ? TriangleAlert : sentiment ? MODE_ICON[sentiment] : null;
                const label = describe(def, row).title;
                const look = !on
                  ? "border border-dashed border-gray-300 text-gray-400"
                  : allergy
                    ? "bg-red-50 text-red-700"
                    : sentiment === "avoid"
                      ? "bg-gray-100 text-gray-400 line-through"
                      : sentiment === "like"
                        ? "border-[1.5px] border-gray-900 text-gray-900"
                        : "bg-gray-900 text-white";
                return (
                  <button
                    key={row.key}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${on ? "Remove" : "Include"} ${label}`}
                    onClick={() => toggle(row.key)}
                    className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[15px] ${look}`}
                  >
                    {I && <I size={15} strokeWidth={2} className={on && sentiment === "love" ? "fill-white" : ""} aria-hidden />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const roundBtn =
    "size-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-900 hover:bg-gray-50 transition-colors";

  // ── Panels ──

  const desktopPanel = (
    <aside
      role="dialog"
      aria-label={`Talk to Kinnit: ${def.title}`}
      className="fixed top-0 right-0 bottom-0 z-[45] w-[440px] bg-white flex flex-col shadow-[-12px_0_32px_-12px_rgba(17,24,39,0.18)] animate-in slide-in-from-right duration-300"
    >
      <header className="flex items-center gap-3 px-6 pt-5 pb-3 flex-shrink-0">
        <span className="size-11 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0" aria-hidden>
          <Mic size={19} className="text-white" />
        </span>
        <h2 className="text-[20px] font-semibold text-gray-900 flex-1 truncate">{def.title}</h2>
        <button type="button" onClick={() => setMinimized(true)} aria-label="Minimize" className="size-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100">
          <Minus size={18} />
        </button>
        <button type="button" onClick={close} aria-label="Close" className="size-10 rounded-full flex items-center justify-center text-gray-600 bg-gray-100 hover:bg-gray-200">
          <X size={18} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
        <p className="text-[15px] leading-6 text-gray-600">{def.talkIntro}</p>
        {areaChips}
        {ask}
        {!cantListen && (
          <div className="rounded-2xl border border-gray-200 px-4 py-3 flex items-center gap-4">
            <Waveform levels={capture.levels} active={capture.status === "listening"} size="sm" />
            <span className="flex-1 text-[15px] font-semibold text-gray-900" aria-live="polite">
              {statusText}
            </span>
            {live ? (
              <>
                {capture.status === "paused" ? (
                  <button type="button" onClick={capture.resume} aria-label="Resume" className={roundBtn}>
                    <Play size={16} className="fill-gray-900" />
                  </button>
                ) : (
                  <button type="button" onClick={capture.pause} aria-label="Pause" className={roundBtn}>
                    <Pause size={16} className="fill-gray-900" />
                  </button>
                )}
                <button type="button" onClick={() => capture.stop()} aria-label="Stop" className={roundBtn}>
                  <Square size={14} className="fill-gray-900" />
                </button>
              </>
            ) : (
              <button type="button" onClick={keepTalking} className="h-10 px-4 rounded-full border border-gray-200 text-[14px] text-gray-900 inline-flex items-center gap-1.5 hover:bg-gray-50">
                <Mic size={15} />
                Talk again
              </button>
            )}
          </div>
        )}
        {transcriptBox}
        {success}
        {heardCards}
        {rows.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!count}
              onClick={confirm}
              className="flex-1 h-12 rounded-xl bg-gray-900 text-white text-[15px] font-medium hover:bg-gray-800 disabled:opacity-40"
            >
              Add {count} to {def.title}
            </button>
            <button type="button" onClick={keepTalking} className="h-12 px-4 rounded-xl border border-gray-200 text-[15px] text-gray-900 hover:bg-gray-50">
              Keep talking
            </button>
          </div>
        )}
        <p className="text-center">
          <button type="button" onClick={switchToTapping} className="text-[14px] text-gray-600 underline underline-offset-4 hover:text-gray-900">
            Switch to tapping
          </button>
        </p>
      </div>
    </aside>
  );

  const mobilePanel = (
    <div
      role="dialog"
      aria-label={`Talk to Kinnit: ${def.title}`}
      className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <header className="flex items-center justify-between px-6 pt-4 flex-shrink-0">
        <button type="button" onClick={close} aria-label="Close" className="size-10 rounded-full flex items-center justify-center text-gray-600 bg-gray-100 hover:bg-gray-200">
          <X size={18} />
        </button>
        <button type="button" onClick={() => setMinimized(true)} aria-label="Minimize" className="size-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100">
          <Minus size={18} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
        <div className="text-center">
          <h2 className="text-[26px] font-bold text-gray-900">{def.title}</h2>
          <p className="text-[15px] leading-6 text-gray-500 mt-1">{def.talkIntro}</p>
        </div>
        {areaChips}
        {ask}
        {!cantListen && (
          <div className="flex flex-col items-center">
            <div className="size-[150px] rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
              <div className="size-[100px] rounded-full bg-gray-100 flex items-center justify-center">
                <Waveform levels={capture.levels} active={capture.status === "listening"} size="md" />
              </div>
            </div>
            <p className="mt-3 text-[18px] font-semibold text-gray-900" aria-live="polite">
              {statusText}
            </p>
          </div>
        )}
        {transcriptBox}
        {success}
        {heardChips}
      </div>
      <footer className="flex-shrink-0 border-t border-gray-100 px-6 pt-3 pb-3 flex flex-col items-center gap-2">
        <div className="flex items-start gap-8">
          {live ? (
            capture.status === "paused" ? (
              <RoundLabeled label="Resume" onClick={capture.resume}>
                <Play size={20} className="fill-gray-900" />
              </RoundLabeled>
            ) : (
              <RoundLabeled label="Pause" onClick={capture.pause}>
                <Pause size={20} className="fill-gray-900" />
              </RoundLabeled>
            )
          ) : (
            !cantListen && (
              <RoundLabeled label="Talk" onClick={keepTalking}>
                <Mic size={20} />
              </RoundLabeled>
            )
          )}
          <RoundLabeled label={count ? "Done" : "Stop"} onClick={done}>
            {count ? <Check size={22} strokeWidth={2.5} /> : <Square size={18} className="fill-gray-900" />}
          </RoundLabeled>
        </div>
        <button type="button" onClick={switchToTapping} className="text-[15px] text-gray-600 underline underline-offset-4">
          Switch to tapping
        </button>
      </footer>
    </div>
  );

  // ── Backdrop (desktop) ──

  const heardDates = new Set(view.filter((i) => i.kind === "date" && i.date && !off.has(i.key)).map((i) => i.date!));
  const savedDates = new Set(
    Object.values(state.sections).flatMap((a) => (a.dates ?? []).map((d) => d.date).filter((d): d is string => !!d)),
  );
  const isDates = def.sections.every((s) => s.kind === "dates");

  return (
    <>
      <div className={`px-6 lg:px-10 py-6 lg:py-8 ${wide && !minimized ? "lg:pr-[480px]" : ""}`}>
        <BackLink />
        <h1 className="mt-4 text-[30px] lg:text-[34px] leading-tight font-bold text-gray-900">{def.title}</h1>
        <p className="text-[16px] text-gray-500 mt-1">{def.talkBackdrop}</p>
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 lg:p-8">
          {isDates ? (
            <YearCalendar year={new Date().getFullYear()} heard={heardDates} saved={savedDates} />
          ) : (
            <AnswersBoard def={def} state={state} heard={view.filter((i) => !off.has(i.key))} />
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-gray-500">
          <span className="inline-flex items-center gap-2">
            <span className="size-4 rounded-full bg-gray-900" aria-hidden />
            Just heard
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-4 rounded-full ring-[1.5px] ring-gray-400" aria-hidden />
            Saved
          </span>
          <span className="inline-flex items-center gap-2">Nothing is saved until you confirm</span>
        </div>
      </div>

      {minimized ? (
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="fixed z-40 right-4 md:right-6 bottom-[calc(env(safe-area-inset-bottom)+20px)] md:bottom-[84px] flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium shadow-lg hover:bg-gray-800"
        >
          <Mic size={16} />
          {def.title}
          {capture.status === "listening" && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-label="Listening" />}
        </button>
      ) : wide ? (
        desktopPanel
      ) : (
        mobilePanel
      )}
    </>
  );
}

function RoundLabeled({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="size-14 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-900 hover:bg-gray-50"
      >
        {children}
      </button>
      <span className="text-[14px] text-gray-700">{label}</span>
    </div>
  );
}
