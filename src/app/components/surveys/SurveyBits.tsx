import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft, Check, Heart, Lock, Plus, Users, X } from "lucide-react";
import { SENTIMENT_LABEL, type Sentiment } from "../../config/surveys";
import type { SurveyStatus } from "../../utils/surveyAnswers";

// Small pieces shared by the survey overview, tap route, and talk route.

export function BackLink({ to = "/app/about-me", label = "About Me" }: { to?: string; label?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-[15px] text-gray-600 hover:text-gray-900 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft size={18} strokeWidth={1.75} />
      {label}
    </Link>
  );
}

const STATUS_LABEL: Record<SurveyStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

export function StatusPill({ status }: { status: SurveyStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[13px] ${
        status === "completed" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
      }`}
    >
      {status === "completed" && <Check size={13} strokeWidth={2} />}
      {STATUS_LABEL[status]}
    </span>
  );
}

export function SharingLine({ completed, summary }: { completed: boolean; summary: string }) {
  const Icon = completed ? Users : Lock;
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-600">
      <Icon size={15} strokeWidth={1.75} aria-hidden />
      {completed ? summary : "Only you can see this"}
    </span>
  );
}

export function ProgressBar({ value, total, label }: { value: number; total: number; label: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={value}
        aria-label="Survey progress"
        className="h-1.5 flex-1 md:flex-none md:w-[260px] rounded-full bg-gray-100 overflow-hidden"
      >
        <div className="h-full rounded-full bg-gray-900 transition-[width] duration-300" style={{ width: `${(value / total) * 100}%` }} />
      </div>
      <span className="text-[13px] text-gray-500 whitespace-nowrap">{label}</span>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="text-[12px] font-semibold tracking-[0.08em] text-gray-500 uppercase mb-3">{children}</h2>;
}

export function IconCircle({ children, dark = false, size = "md" }: { children: ReactNode; dark?: boolean; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "size-12" : size === "sm" ? "size-8" : "size-9";
  return (
    <span
      aria-hidden
      className={`${box} rounded-full flex items-center justify-center flex-shrink-0 ${
        dark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-700"
      }`}
    >
      {children}
    </span>
  );
}

export const TagOptional = () => (
  <span className="text-[11px] leading-4 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Optional</span>
);

// ─── Chips ────────────────────────────────────────────────────────────────────

export const MODE_ICON: Record<Sentiment, typeof Heart> = { love: Heart, like: Check, avoid: X };

const chipBase =
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[14px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

/** A chip in its picked state: filled dark with a heart, outlined with a check, or gray struck through. */
export function Chip({
  label,
  state,
  onClick,
  pressedLabel,
}: {
  label: string;
  state: Sentiment | null;
  onClick: () => void;
  pressedLabel?: string;
}) {
  const Icon = state ? MODE_ICON[state] : null;
  const look =
    state === "love"
      ? "bg-gray-900 text-white border border-gray-900"
      : state === "like"
        ? "bg-white text-gray-900 border-[1.5px] border-gray-900"
        : state === "avoid"
          ? "bg-gray-100 text-gray-400 border border-gray-100 line-through decoration-gray-400"
          : "bg-white text-gray-800 border border-gray-200 hover:border-gray-300 hover:bg-gray-50";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!state}
      aria-label={state ? `${label}, ${pressedLabel ?? SENTIMENT_LABEL[state]}` : label}
      className={`${chipBase} ${look}`}
    >
      {Icon && <Icon size={15} strokeWidth={2} className={state === "love" ? "fill-white" : ""} aria-hidden />}
      {label}
    </button>
  );
}

/** Dashed chip that adds on tap (suggestions). */
export function SuggestChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Add ${label}`}
      className={`${chipBase} border border-dashed border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50`}
    >
      <Plus size={15} strokeWidth={1.75} aria-hidden />
      {label}
    </button>
  );
}

/** Dashed "Add another" chip that turns into a text field. */
export function AddAnotherChip({ onAdd, placeholder = "Type and press Enter" }: { onAdd: (text: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const submit = () => {
    if (text.trim()) onAdd(text.trim());
    setText("");
    setOpen(false);
  };
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${chipBase} border border-dashed border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50`}
      >
        <Plus size={15} strokeWidth={1.75} aria-hidden />
        Add another
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 h-9 pl-3.5 pr-1 rounded-full border border-gray-400 bg-white">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setText("");
            setOpen(false);
          }
        }}
        onBlur={submit}
        aria-label="Add another"
        placeholder={placeholder}
        className="w-44 bg-transparent text-[14px] text-gray-900 placeholder:text-gray-400 outline-none"
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={submit}
        aria-label="Add"
        className="size-7 rounded-full bg-gray-900 text-white flex items-center justify-center"
      >
        <Check size={14} />
      </button>
    </span>
  );
}

export function ModeSwitch({
  modes,
  value,
  onChange,
  full = false,
}: {
  modes: Sentiment[];
  value: Sentiment;
  onChange: (m: Sentiment) => void;
  full?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Mode"
      className={`${full ? "grid w-full" : "inline-grid"} p-1 rounded-xl border border-gray-200 bg-white`}
      style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0, 1fr))` }}
    >
      {modes.map((m) => {
        const Icon = MODE_ICON[m];
        const on = value === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(m)}
            className={`h-9 ${full ? "px-2" : "px-4"} rounded-lg text-[14px] whitespace-nowrap inline-flex items-center justify-center gap-1.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              on ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Icon size={15} strokeWidth={2} className={on && m === "love" ? "fill-white" : ""} aria-hidden />
            {SENTIMENT_LABEL[m]}
          </button>
        );
      })}
    </div>
  );
}
