import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Calendar,
  Check,
  Info,
  Link2,
  Lock,
  Mic,
  Minus,
  Pause,
  Pencil,
  Play,
  Square,
  Trash2,
  User,
  X,
} from "lucide-react";
import { getEntityAppearance, type EntityKind } from "../../utils/entityAppearance";
import { parseConversation, type DraftItem, type DraftType } from "../../utils/voiceParser";
import { commitDraftItems } from "../../utils/voiceActions";
import { useSpeechCapture, type CaptureStatus } from "./useSpeechCapture";

// ─── Context ──────────────────────────────────────────────────────────────────

interface TalkContextValue {
  openTalk: () => void;
}

const TalkContext = createContext<TalkContextValue>({ openTalk: () => {} });

export function useTalkToKinnit() {
  return useContext(TalkContext);
}

// ─── Types & helpers ──────────────────────────────────────────────────────────

const USER_NAME = "Mary";

interface Message {
  text: string;
  at: Date;
}

interface ItemOverride {
  checked?: boolean;
  deleted?: boolean;
  title?: string;
  date?: string;
}

type Phase = "listening" | "review";

const KIND_FOR: Record<DraftType, EntityKind> = {
  occasion: "occasion",
  reminder: "reminder",
  plan: "plan",
  note: "private-note",
};

function typeLabel(item: DraftItem) {
  if (item.type === "note") return `Note about ${item.people[0]?.name ?? "someone"}`;
  return item.type.charAt(0).toUpperCase() + item.type.slice(1);
}

function formatDate(iso?: string) {
  if (!iso) return "No date";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function useIsDesktop() {
  const query = "(min-width: 768px)";
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

// ─── Provider (owns the session so minimize keeps it alive) ───────────────────

export function TalkToKinnitProvider({ children }: { children: ReactNode }) {
  const capture = useSpeechCapture();
  const [active, setActive] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [phase, setPhase] = useState<Phase>("listening");
  const [messages, setMessages] = useState<Message[]>([]);
  const [overrides, setOverrides] = useState<Record<string, ItemOverride>>({});

  const drafts = useMemo(() => parseConversation(messages.map((m) => m.text)), [messages]);
  const visible = drafts
    .filter((d) => !overrides[d.key]?.deleted)
    .map((d) => ({
      ...d,
      title: overrides[d.key]?.title ?? d.title,
      date: overrides[d.key]?.date ?? d.date,
    }));
  const isChecked = (key: string) => overrides[key]?.checked !== false;
  const selected = visible.filter((d) => isChecked(d.key));

  const reset = () => {
    capture.stop();
    setActive(false);
    setMinimized(false);
    setPhase("listening");
    setMessages([]);
    setOverrides({});
  };

  const openTalk = () => {
    if (active) {
      setMinimized(false);
      return;
    }
    setActive(true);
    setMinimized(false);
    setPhase("listening");
    capture.start();
  };

  const addMessage = (text: string) => {
    const t = text.trim();
    if (t) setMessages((prev) => [...prev, { text: t, at: new Date() }]);
  };

  const finishListening = (typed?: string) => {
    const spoken = capture.stop();
    addMessage(typed ?? spoken);
    setPhase("review");
  };

  const listenAgain = () => {
    setPhase("listening");
    capture.start();
  };

  const updateOverride = (key: string, patch: ItemOverride) =>
    setOverrides((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const addSelected = () => {
    commitDraftItems(selected);
    reset();
  };

  return (
    <TalkContext.Provider value={{ openTalk }}>
      {children}
      {active && !minimized && (
        <TalkPanel
          phase={phase}
          status={capture.status}
          transcript={capture.transcript}
          levels={capture.levels}
          onEditTranscript={capture.setTranscript}
          onPause={capture.pause}
          onResume={capture.resume}
          onStop={() => finishListening()}
          onSubmitTyped={(text) => finishListening(text)}
          messages={messages}
          items={visible}
          isChecked={isChecked}
          selectedCount={selected.length}
          onToggle={(key) => updateOverride(key, { checked: !isChecked(key) })}
          onEdit={(key, patch) => updateOverride(key, patch)}
          onDelete={(key) => updateOverride(key, { deleted: true })}
          onAdd={addSelected}
          onCancel={reset}
          onTellMore={addMessage}
          onListenAgain={listenAgain}
          onMinimize={() => setMinimized(true)}
          onClose={reset}
        />
      )}
      {active && minimized && (
        <MinimizedPill listening={capture.status === "listening"} onOpen={() => setMinimized(false)} />
      )}
    </TalkContext.Provider>
  );
}

// ─── Panel shell ──────────────────────────────────────────────────────────────

interface PanelProps {
  phase: Phase;
  status: CaptureStatus;
  transcript: string;
  levels: number[];
  onEditTranscript: (text: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSubmitTyped: (text: string) => void;
  messages: Message[];
  items: DraftItem[];
  isChecked: (key: string) => boolean;
  selectedCount: number;
  onToggle: (key: string) => void;
  onEdit: (key: string, patch: ItemOverride) => void;
  onDelete: (key: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  onTellMore: (text: string) => void;
  onListenAgain: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

function TalkPanel(props: PanelProps) {
  const isDesktop = useIsDesktop();
  const { onMinimize, onClose } = props;

  const iconBtn =
    "w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors";

  const body =
    props.phase === "listening" ? (
      <ListeningView {...props} isDesktop={isDesktop} />
    ) : (
      <ReviewView {...props} isDesktop={isDesktop} />
    );

  if (isDesktop) {
    return (
      <aside
        role="dialog"
        aria-label="Talk to Kinnit"
        className="fixed top-0 right-0 bottom-0 z-[45] w-[440px] bg-white flex flex-col shadow-[-12px_0_32px_-12px_rgba(17,24,39,0.18)] animate-in slide-in-from-right duration-300"
      >
        <header className="flex items-center gap-3 px-6 pt-5 pb-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
            <Mic size={18} className="text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 flex-1">Talk to Kinnit</h2>
          <button type="button" onClick={onMinimize} aria-label="Minimize" className={iconBtn}>
            <Minus size={18} />
          </button>
          <button type="button" onClick={onClose} aria-label="Close" className={`${iconBtn} bg-gray-100 hover:bg-gray-200`}>
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{body}</div>
      </aside>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Talk to Kinnit"
      className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <header className="flex items-center justify-between px-6 pt-4 flex-shrink-0">
        <button type="button" onClick={onClose} aria-label="Close" className={`${iconBtn} bg-gray-100 hover:bg-gray-200`}>
          <X size={18} />
        </button>
        <button type="button" onClick={onMinimize} aria-label="Minimize" className={iconBtn}>
          <Minus size={18} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center mt-1 mb-4">Talk to Kinnit</h2>
        {body}
      </div>
    </div>
  );
}

// On desktop the pill sits above the fixed "Give Feedback?" button (App.tsx).
function MinimizedPill({ listening, onOpen }: { listening: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed z-40 right-4 md:right-6 bottom-[calc(env(safe-area-inset-bottom)+76px)] md:bottom-[84px] flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium shadow-lg hover:bg-gray-800 transition-colors animate-in fade-in zoom-in-95"
    >
      <Mic size={16} />
      Talk to Kinnit
      {listening && (
        <span className="flex items-center gap-1.5 text-xs text-gray-300 font-normal">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Listening
        </span>
      )}
    </button>
  );
}

// ─── Listening ────────────────────────────────────────────────────────────────

const BAR_SHAPE = [0.3, 0.5, 0.75, 0.9, 1, 0.9, 0.75, 0.5, 0.3];

function Waveform({ levels, active, size }: { levels: number[]; active: boolean; size: "lg" | "md" }) {
  const max = size === "lg" ? 52 : 48;
  return (
    <div className="flex items-center gap-[5px]" aria-hidden>
      {BAR_SHAPE.map((shape, i) => {
        const level = active ? 0.35 + 0.65 * (levels[i] ?? 0) : 0.35;
        const h = Math.max(8, Math.round(max * shape * level));
        return (
          <span
            key={i}
            className="w-[4px] rounded-full bg-gray-900 transition-[height] duration-100"
            style={{ height: h }}
          />
        );
      })}
    </div>
  );
}

function RoundButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="w-16 h-16 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-900 hover:bg-gray-50 transition-colors"
      >
        {children}
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}

function ListeningView({
  status,
  transcript,
  levels,
  onEditTranscript,
  onPause,
  onResume,
  onStop,
  onSubmitTyped,
  messages,
  isDesktop,
}: PanelProps & { isDesktop: boolean }) {
  const [editing, setEditing] = useState(false);
  const [typed, setTyped] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      const el = textRef.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  const cantListen = status === "denied" || status === "unsupported";
  const intro = messages.length
    ? "Go ahead, I'm listening."
    : "Tell me what's on your mind. I'll help you keep track of what matters.";

  if (cantListen) {
    return (
      <div className="flex flex-col items-center text-center pt-6">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Mic size={24} className="text-gray-500" />
        </div>
        <p className="text-base font-semibold text-gray-900">
          {status === "denied" ? "I can't hear you right now" : "Voice isn't available in this browser"}
        </p>
        <p className="text-sm text-gray-500 mt-1.5 max-w-[320px]">
          {status === "denied"
            ? "Microphone access is turned off. You can allow it in your browser settings, or just type below."
            : "No problem, you can type instead and I'll pick out what matters."}
        </p>
        <textarea
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          rows={5}
          autoFocus
          placeholder="Sylvia has an appointment Thursday. Remind me to ask her about it Friday..."
          className="mt-6 w-full rounded-xl border border-gray-200 p-4 text-[15px] leading-6 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none"
        />
        <button
          type="button"
          disabled={!typed.trim()}
          onClick={() => onSubmitTyped(typed)}
          className="mt-3 w-full h-11 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
        <InfoLine />
      </div>
    );
  }

  const listening = status === "listening";
  const paused = status === "paused" || editing;

  return (
    <div className="flex flex-col items-center text-center">
      <p className={`text-[15px] text-gray-500 max-w-[340px] ${isDesktop ? "mt-1" : ""}`}>{intro}</p>

      <div
        className={`mt-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center ${
          isDesktop ? "w-[212px] h-[212px]" : "w-[172px] h-[172px]"
        }`}
      >
        <div
          className={`rounded-full bg-gray-100 flex items-center justify-center ${
            isDesktop ? "w-[140px] h-[140px]" : "w-[112px] h-[112px]"
          }`}
        >
          <Waveform levels={levels} active={listening && !editing} size={isDesktop ? "lg" : "md"} />
        </div>
      </div>

      <p className="mt-5 text-lg font-semibold text-gray-900" aria-live="polite">
        {status === "requesting" ? "Starting…" : paused ? "Paused" : "Listening…"}
      </p>

      {/* Live transcript */}
      <div className="relative mt-4 w-full rounded-xl border border-gray-200 text-left">
        {editing ? (
          <textarea
            ref={textRef}
            value={transcript}
            onChange={(e) => onEditTranscript(e.target.value)}
            rows={4}
            className="block w-full p-4 pr-11 rounded-xl text-[15px] leading-6 text-gray-900 resize-none focus:outline-none"
          />
        ) : (
          <p className="p-4 pr-11 min-h-[88px] text-[15px] leading-6 text-gray-900">
            {transcript || <span className="text-gray-400">Start talking…</span>}
            {listening && <span className="inline-block w-px h-5 ml-0.5 align-middle bg-gray-900 animate-pulse" />}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            if (!editing) onPause();
            setEditing((e) => !e);
          }}
          aria-label={editing ? "Done editing" : "Edit transcript"}
          className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100"
        >
          {editing ? <Check size={15} /> : <Pencil size={15} />}
        </button>
      </div>

      <div className="mt-6 flex items-start gap-10">
        {paused ? (
          <RoundButton
            label="Resume"
            onClick={() => {
              setEditing(false);
              onResume();
            }}
          >
            <Play size={20} className="fill-gray-900" />
          </RoundButton>
        ) : (
          <RoundButton label="Pause" onClick={onPause}>
            <Pause size={20} className="fill-gray-900" />
          </RoundButton>
        )}
        <RoundButton label="Stop" onClick={onStop}>
          <Square size={16} className="fill-gray-900" />
        </RoundButton>
      </div>

      <InfoLine />
    </div>
  );
}

function InfoLine() {
  return (
    <p className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
      <Info size={15} className="flex-shrink-0" />
      {"You'll review everything before it's added."}
    </p>
  );
}

// ─── Review ───────────────────────────────────────────────────────────────────

function ReviewView({
  messages,
  items,
  isChecked,
  selectedCount,
  onToggle,
  onEdit,
  onDelete,
  onAdd,
  onCancel,
  onTellMore,
  onListenAgain,
  isDesktop,
}: PanelProps & { isDesktop: boolean }) {
  const [more, setMore] = useState("");

  return (
    <div>
      <div className="space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="rounded-2xl bg-gray-100 px-4 pt-3.5 pb-2.5">
            <p className="text-[15px] leading-6 text-gray-900">{m.text}</p>
            <p className="text-xs text-gray-400 text-right mt-1.5">
              {USER_NAME} · {formatTime(m.at)}
            </p>
          </div>
        ))}
      </div>

      <h3 className="mt-6 text-lg font-semibold text-gray-900">Here's what I picked up</h3>
      <p className="text-sm text-gray-500">Nothing is saved until you confirm.</p>

      <div className="mt-3 space-y-2.5">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center">
            <p className="text-sm text-gray-900">I didn't catch anything to add yet.</p>
            <p className="text-[13px] text-gray-500 mt-1">
              Try something like "Remind me to call Mom on Sunday."
            </p>
          </div>
        ) : (
          items.map((item) => (
            <DraftCard
              key={item.key}
              item={item}
              checked={isChecked(item.key)}
              showDelete={isDesktop}
              onToggle={() => onToggle(item.key)}
              onEdit={(patch) => onEdit(item.key, patch)}
              onDelete={() => onDelete(item.key)}
            />
          ))
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={onAdd}
          disabled={selectedCount === 0}
          className="flex-1 h-12 rounded-xl bg-gray-900 text-white text-[15px] font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Add {selectedCount} selected item{selectedCount === 1 ? "" : "s"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 h-12 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form
        className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 pl-4 pr-2 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          onTellMore(more);
          setMore("");
        }}
      >
        <input
          value={more}
          onChange={(e) => setMore(e.target.value)}
          placeholder="Tell me more or ask a question…"
          className="flex-1 min-w-0 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
        />
        <button
          type="button"
          onClick={onListenAgain}
          aria-label="Speak"
          className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 hover:bg-gray-800 transition-colors"
        >
          <Mic size={18} className="text-white" />
        </button>
      </form>
    </div>
  );
}

function Sep() {
  return <span className="text-gray-300">|</span>;
}

function DraftCard({
  item,
  checked,
  showDelete,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: DraftItem;
  checked: boolean;
  showDelete: boolean;
  onToggle: () => void;
  onEdit: (patch: ItemOverride) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [date, setDate] = useState(item.date ?? "");
  const { dotClass } = getEntityAppearance(KIND_FOR[item.type]);
  const names = item.people.map((p) => p.name);

  const startEdit = () => {
    setTitle(item.title);
    setDate(item.date ?? "");
    setEditing(true);
  };

  const details = (() => {
    switch (item.type) {
      case "occasion":
      case "plan":
        return (
          <>
            <span className="flex items-center gap-1.5"><Calendar size={13} />{formatDate(item.date)}</span>
            {names.length > 0 && (
              <span className="flex items-center gap-2.5">
                <Sep />
                <span className="flex items-center gap-1.5"><User size={13} />{joinNames(names)}</span>
              </span>
            )}
          </>
        );
      case "reminder":
        return (
          <>
            <span className="flex items-center gap-1.5"><Calendar size={13} />{formatDate(item.date)}</span>
            {item.linkedOccasionTitle && (
              <span className="flex items-center gap-2.5">
                <Sep />
                <Link2 size={13} aria-label="Linked" />
              </span>
            )}
          </>
        );
      case "note":
        return <span className="flex items-center gap-1.5"><Lock size={13} />Only visible to you</span>;
    }
  })();

  return (
    <div className={`relative rounded-xl border border-gray-200 p-4 flex gap-3 transition-opacity ${checked ? "" : "opacity-60"}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={`Include ${item.title}`}
        onClick={onToggle}
        className={`mt-0.5 w-5 h-5 rounded-[5px] flex items-center justify-center flex-shrink-0 border transition-colors ${
          checked ? "bg-gray-900 border-gray-900" : "bg-white border-gray-300"
        }`}
      >
        {checked && <Check size={14} strokeWidth={3} className="text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`flex items-center gap-1.5 text-[13px] text-gray-500 ${showDelete ? "pr-20" : "pr-10"}`}>
          <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          {typeLabel(item)}
        </p>

        {editing ? (
          <div className="mt-1.5 space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[15px] focus:outline-none focus:border-gray-400"
            />
            {item.type !== "note" && (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400"
              />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit({ title: title.trim() || item.title, date: date || undefined });
                  setEditing(false);
                }}
                className="h-8 px-3 rounded-lg bg-gray-900 text-white text-[13px] font-medium"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="h-8 px-3 rounded-lg border border-gray-200 text-[13px]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className={`text-[15px] font-medium text-gray-900 mt-0.5 ${showDelete ? "pr-14" : "pr-6"}`}>{item.title}</p>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[13px] text-gray-500">{details}</div>
            {item.type === "reminder" && item.linkedOccasionTitle && (
              <p className="text-[13px] text-gray-500 mt-1">Linked to {item.linkedOccasionTitle}</p>
            )}
          </>
        )}
      </div>

      {!editing && (
        <div className="absolute top-3 right-3 flex items-start gap-1">
          <button
            type="button"
            onClick={startEdit}
            aria-label={`Edit ${item.title}`}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100"
          >
            <Pencil size={15} />
          </button>
          {showDelete && (
            <>
              <span className="w-px h-4 bg-gray-200 mt-2" />
              <button
                type="button"
                onClick={onDelete}
                aria-label={`Remove ${item.title}`}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
