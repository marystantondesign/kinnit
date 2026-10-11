import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Calendar,
  Check,
  Info,
  Link2,
  Loader2,
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
import { parseTranscript, toISODate, type DraftItem } from "../../utils/talkClient";
import { commitDraftItems } from "../../utils/voiceActions";
import { PEOPLE_DIRECTORY, displayName } from "../../utils/peopleDirectory";
import type { TalkItem, TalkPerson } from "../../../shared/talk";
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

/** What the user changed on a card; applied on top of the parsed item. */
interface ItemOverride {
  checked?: boolean;
  deleted?: boolean;
  title?: string;
  detail?: string | null;
  date?: string;
  invite?: boolean;
  people?: TalkPerson[];
}

interface ParseState {
  loading: boolean;
  items: DraftItem[];
  error: string | null;
}

type Phase = "listening" | "review";

const KIND_FOR: Record<TalkItem["type"], EntityKind> = {
  occasion: "occasion",
  reminder: "reminder",
  plan: "plan",
  note: "private-note",
};

function typeLabel(item: DraftItem) {
  if (item.type === "note") {
    const about = item.people.find((p) => p.role === "about") ?? item.people[0];
    return `Note about ${about ? displayName(about.name) : "someone"}`;
  }
  return item.type.charAt(0).toUpperCase() + item.type.slice(1);
}

function formatDate(iso?: string | null) {
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

/** Items other than notes need a date before they can be added. */
function needsDate(item: DraftItem) {
  return item.type !== "note" && !item.date;
}

/** People on a plan who can get an invitation (in People, doing it with the user). */
function invitees(item: DraftItem) {
  return item.type === "plan" ? item.people.filter((p) => p.role === "with" && p.inPeople) : [];
}

function quickDate(choice: "today" | "tomorrow" | "weekend"): string {
  const d = new Date();
  if (choice === "tomorrow") d.setDate(d.getDate() + 1);
  if (choice === "weekend") {
    const dow = d.getDay(); // Saturday of this weekend; Sunday stays Sunday
    if (dow !== 0) d.setDate(d.getDate() + (6 - dow));
  }
  return toISODate(d);
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
  const [parse, setParse] = useState<ParseState>({ loading: false, items: [], error: null });

  // Re-read the whole conversation whenever it changes.
  useEffect(() => {
    if (!messages.length) {
      setParse({ loading: false, items: [], error: null });
      return;
    }
    const controller = new AbortController();
    setParse((prev) => ({ ...prev, loading: true, error: null }));
    parseTranscript(messages.map((m) => m.text), controller.signal)
      .then((result) => {
        if (result.ok && result.items.length) {
          setParse({ loading: false, items: result.items, error: null });
        } else {
          if (!result.ok) console.warn("Talk to Kinnit: parse failed:", result.error);
          setParse({ loading: false, items: [], error: result.ok ? "nothing_found" : result.error });
        }
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") setParse({ loading: false, items: [], error: "network" });
      });
    return () => controller.abort();
  }, [messages]);

  const visible: DraftItem[] = parse.items
    .filter((d) => !overrides[d.key]?.deleted)
    .map((d) => {
      const o = overrides[d.key] ?? {};
      return {
        ...d,
        title: o.title ?? d.title,
        detail: o.detail !== undefined ? o.detail : d.detail,
        date: o.date ?? d.date,
        people: o.people ?? d.people,
      };
    });
  const isChecked = (key: string) => overrides[key]?.checked !== false;
  const inviteChoice = (item: DraftItem) => overrides[item.key]?.invite ?? item.invite;
  const selected = visible.filter((d) => isChecked(d.key));
  const incomplete = selected.filter(needsDate);

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

  /** Replaces the conversation with an edited version (after a failed read). */
  const replaceConversation = (text: string) => {
    const t = text.trim();
    if (t) setMessages([{ text: t, at: messages[0]?.at ?? new Date() }]);
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
    if (incomplete.length || parse.loading) return;
    commitDraftItems(selected.map((item) => ({ ...item, sendInvites: inviteChoice(item) })));
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
          parse={parse}
          items={visible}
          isChecked={isChecked}
          inviteChoice={inviteChoice}
          selectedCount={selected.length}
          incomplete={incomplete}
          onToggle={(key) => updateOverride(key, { checked: !isChecked(key) })}
          onPatch={(key, patch) => updateOverride(key, patch)}
          onDelete={(key) => updateOverride(key, { deleted: true })}
          onAdd={addSelected}
          onCancel={reset}
          onTellMore={addMessage}
          onRetry={replaceConversation}
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
  parse: ParseState;
  items: DraftItem[];
  isChecked: (key: string) => boolean;
  inviteChoice: (item: DraftItem) => boolean;
  selectedCount: number;
  incomplete: DraftItem[];
  onToggle: (key: string) => void;
  onPatch: (key: string, patch: ItemOverride) => void;
  onDelete: (key: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  onTellMore: (text: string) => void;
  onRetry: (text: string) => void;
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

const COULDNT_PARSE = "I couldn't pick anything out of that. Try rephrasing, or edit the text.";

function incompleteMessage(incomplete: DraftItem[]) {
  if (incomplete.length === 1) return `Choose a date for the ${incomplete[0].type} to continue.`;
  return `Choose dates for ${incomplete.length} items to continue.`;
}

function ReviewView({
  messages,
  parse,
  items,
  isChecked,
  inviteChoice,
  selectedCount,
  incomplete,
  onToggle,
  onPatch,
  onDelete,
  onAdd,
  onCancel,
  onTellMore,
  onRetry,
  onListenAgain,
  isDesktop,
}: PanelProps & { isDesktop: boolean }) {
  const [more, setMore] = useState("");
  const [retryText, setRetryText] = useState("");
  const failed = !parse.loading && parse.error !== null;

  // Prefill the edit box with what was said whenever a read fails.
  useEffect(() => {
    if (failed) setRetryText(messages.map((m) => m.text).join(" "));
  }, [failed, messages]);

  const addDisabled = selectedCount === 0 || incomplete.length > 0 || parse.loading;

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

      {failed ? (
        <div className="mt-6">
          <p className="text-[15px] text-gray-900">{COULDNT_PARSE}</p>
          <textarea
            value={retryText}
            onChange={(e) => setRetryText(e.target.value)}
            rows={4}
            aria-label="Edit what you said"
            className="mt-3 w-full rounded-xl border border-gray-200 p-4 text-[15px] leading-6 text-gray-900 resize-none focus:outline-none focus:border-gray-400"
          />
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => onRetry(retryText)}
              disabled={!retryText.trim()}
              className="flex-1 h-12 rounded-xl bg-gray-900 text-white text-[15px] font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 h-12 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-baseline justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Here's what I picked up</h3>
            {parse.loading && items.length > 0 && (
              <span className="flex items-center gap-1.5 text-[13px] text-gray-500">
                <Loader2 size={13} className="animate-spin" />
                Updating
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Nothing is saved until you confirm.</p>

          <div className="mt-3 space-y-2.5">
            {parse.loading && items.length === 0 ? (
              <div className="rounded-xl border border-gray-200 px-4 py-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                Reading what you said…
              </div>
            ) : (
              items.map((item) => (
                <DraftCard
                  key={item.key}
                  item={item}
                  checked={isChecked(item.key)}
                  invite={inviteChoice(item)}
                  showDelete={isDesktop}
                  onToggle={() => onToggle(item.key)}
                  onPatch={(patch) => onPatch(item.key, patch)}
                  onDelete={() => onDelete(item.key)}
                />
              ))
            )}
          </div>

          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={onAdd}
              disabled={addDisabled}
              className="flex-1 h-12 rounded-xl text-[15px] font-medium transition-colors bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
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
          {incomplete.length > 0 && (
            <p className="mt-2 text-sm text-amber-800" role="status">
              {incompleteMessage(incomplete)}
            </p>
          )}
        </>
      )}

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

// ─── Card ─────────────────────────────────────────────────────────────────────

function Sep() {
  return <span className="text-gray-300">|</span>;
}

/** Keeps a separator together with the segment after it, so wrapping never strands one. */
function Seg({ first, children }: { first?: boolean; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      {!first && <Sep />}
      <span className="flex items-center gap-1.5">{children}</span>
    </span>
  );
}

const chip =
  "h-8 px-3.5 rounded-full border border-gray-200 bg-white text-[13px] text-gray-900 hover:bg-gray-50 transition-colors";

function WhenChips({ onPick }: { onPick: (iso: string) => void }) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Calendar size={14} className="text-gray-500" />
      <span className="h-8 px-3.5 rounded-full border border-dashed border-amber-400 bg-amber-50 text-[13px] text-amber-800 flex items-center">
        When?
      </span>
      <button type="button" className={chip} onClick={() => onPick(quickDate("today"))}>Today</button>
      <button type="button" className={chip} onClick={() => onPick(quickDate("tomorrow"))}>Tomorrow</button>
      <button type="button" className={chip} onClick={() => onPick(quickDate("weekend"))}>This weekend</button>
      {picking ? (
        <input
          type="date"
          autoFocus
          min={toISODate(new Date())}
          aria-label="Pick a date"
          onChange={(e) => e.target.value && onPick(e.target.value)}
          className="h-8 px-2.5 rounded-full border border-gray-300 text-[13px] text-gray-900 focus:outline-none"
        />
      ) : (
        <button type="button" className={chip} onClick={() => setPicking(true)}>Pick a date</button>
      )}
    </div>
  );
}

function HeardAs({ person, onChange }: { person: TalkPerson; onChange: (name: string | null) => void }) {
  const [changing, setChanging] = useState(false);
  if (!person.heardAs) return null;
  if (changing) {
    return (
      <div className="mt-2 flex items-center gap-2 text-[13px] text-gray-500">
        <span>{`“${person.heardAs}” is`}</span>
        <select
          autoFocus
          defaultValue={person.name}
          onChange={(e) => {
            onChange(e.target.value || null);
            setChanging(false);
          }}
          className="h-8 rounded-lg border border-gray-200 px-2 text-[13px] text-gray-900 bg-white"
        >
          {PEOPLE_DIRECTORY.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
          <option value="">Not someone in People</option>
        </select>
      </div>
    );
  }
  return (
    <p className="mt-2 text-[13px] text-gray-400">
      {`I heard “${person.heardAs}” and matched it to ${displayName(person.name)}. `}
      <button type="button" onClick={() => setChanging(true)} className="text-[13px] underline text-gray-700 hover:text-gray-900">
        Change
      </button>
    </p>
  );
}

function DraftCard({
  item,
  checked,
  invite,
  showDelete,
  onToggle,
  onPatch,
  onDelete,
}: {
  item: DraftItem;
  checked: boolean;
  invite: boolean;
  showDelete: boolean;
  onToggle: () => void;
  onPatch: (patch: ItemOverride) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [detail, setDetail] = useState(item.detail ?? "");
  const [date, setDate] = useState(item.date ?? "");
  const { dotClass } = getEntityAppearance(KIND_FOR[item.type]);
  const waitingOnDate = checked && needsDate(item);
  const canInvite = invitees(item);
  const names = (role: TalkPerson["role"]) =>
    joinNames(item.people.filter((p) => p.role === role).map((p) => displayName(p.name)));

  const startEdit = () => {
    setTitle(item.title);
    setDetail(item.detail ?? "");
    setDate(item.date ?? "");
    setEditing(true);
  };

  const replacePerson = (index: number, name: string | null) => {
    const people = item.people.map((p, i) => {
      if (i !== index) return p;
      return name
        ? { ...p, name, inPeople: true, heardAs: null }
        : { ...p, name: p.heardAs ?? p.name, inPeople: false, heardAs: null };
    });
    onPatch({ people });
  };

  const dateSeg = (
    <Seg first>
      <Calendar size={13} />
      {formatDate(item.date)}
      {item.recurrence === "yearly" && <span className="text-gray-400">· Every year</span>}
    </Seg>
  );

  const details = (() => {
    switch (item.type) {
      case "reminder":
        return dateSeg;
      case "plan":
        return (
          <>
            {dateSeg}
            {names("with") && <Seg><User size={13} />With {names("with")}</Seg>}
            {names("for") && <Seg><User size={13} />For {names("for")}</Seg>}
          </>
        );
      case "occasion": {
        const who = joinNames(item.people.map((p) => displayName(p.name)));
        return (
          <>
            {dateSeg}
            {who && <Seg><User size={13} />{who}</Seg>}
          </>
        );
      }
      case "note":
        return <Seg first><Lock size={13} />Only visible to you</Seg>;
    }
  })();

  return (
    <div
      className={`relative rounded-xl border p-4 flex gap-3 transition-colors ${
        waitingOnDate ? "border-amber-300" : "border-gray-200"
      } ${checked ? "" : "opacity-60"}`}
    >
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
              aria-label="Title"
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[15px] focus:outline-none focus:border-gray-400"
            />
            {(item.type === "reminder" || item.type === "plan") && (
              <input
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Details (optional)"
                aria-label="Details"
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400"
              />
            )}
            {item.type !== "note" && (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Date"
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400"
              />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onPatch({
                    title: title.trim() || item.title,
                    detail: detail.trim() || null,
                    ...(date ? { date } : {}),
                  });
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
            {item.detail && <p className="text-[14px] text-gray-500">{item.detail}</p>}

            {needsDate(item) ? (
              <WhenChips onPick={(iso) => onPatch({ date: iso })} />
            ) : (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[13px] text-gray-500">{details}</div>
            )}

            {item.type !== "note" && needsDate(item) && item.type !== "reminder" && (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-[13px] text-gray-500">
                {item.type === "plan" && names("with") && <Seg first><User size={13} />With {names("with")}</Seg>}
                {item.type === "plan" && names("for") && <Seg first={!names("with")}><User size={13} />For {names("for")}</Seg>}
              </div>
            )}

            {item.linkedTo && (
              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-gray-500">
                <Link2 size={13} />
                Linked to {item.linkedTo.title}
              </p>
            )}

            {canInvite.length > 0 && (
              <div className="mt-3 rounded-xl bg-gray-100 p-3">
                <p className="text-[15px] text-gray-900">Plan this together?</p>
                <p className="text-[13px] text-gray-500">
                  {invite
                    ? `${joinNames(canInvite.map((p) => displayName(p.name)))} will get an invitation when you add it.`
                    : "No invitation will be sent."}
                </p>
                <div role="radiogroup" aria-label="Plan this together?" className="mt-2.5 grid grid-cols-2 p-1 bg-gray-200/70 rounded-lg">
                  {[
                    { value: true, label: `Invite ${canInvite.length === 1 ? displayName(canInvite[0].name) : "them"}` },
                    { value: false, label: "Just me" },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      role="radio"
                      aria-checked={invite === opt.value}
                      onClick={() => onPatch({ invite: opt.value })}
                      className={`h-9 rounded-md text-[14px] transition-colors ${
                        invite === opt.value ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {item.people.map((p, i) => (
              <HeardAs key={i} person={p} onChange={(name) => replacePerson(i, name)} />
            ))}
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
