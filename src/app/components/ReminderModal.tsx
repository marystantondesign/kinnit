import { reminderIconFor } from "../config/itemTypes";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckSquare, UserRound, Mic, Plus } from "lucide-react";
import { addNote } from "../utils/noteStore";
import { saveReminder, type ReminderData } from "../utils/reminderStorage";

// ─── Shared people list ───────────────────────────────────────────────────────

const MODAL_PEOPLE = [
  { id: "1", name: "Sarah Johnson",  initials: "SJ" },
  { id: "2", name: "Michael Chen",   initials: "MC" },
  { id: "3", name: "Emma Davis",     initials: "ED" },
  { id: "4", name: "David Martinez", initials: "DM" },
  { id: "5", name: "Lisa Anderson",  initials: "LA" },
  { id: "6", name: "James Wilson",   initials: "JW" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

type TimingValue = "" | "on-date" | "1-day-before" | "1-week-before" | "custom";

const TIMING_CHIPS: { value: TimingValue; label: string }[] = [
  { value: "on-date",       label: "On this date"  },
  { value: "1-day-before",  label: "1 day before"  },
  { value: "1-week-before", label: "1 week before" },
  { value: "custom",        label: "Custom"        },
];

const TIMING_CHIPS_SHORT: { value: TimingValue; label: string }[] = [
  { value: "on-date",       label: "On this date" },
  { value: "1-day-before",  label: "1 day before" },
];

const RECURRENCE_CHIPS = [
  { value: "once",    label: "Once"    },
  { value: "weekly",  label: "Weekly"  },
  { value: "monthly", label: "Monthly" },
  { value: "yearly",  label: "Yearly"  },
];

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
            value === opt.value
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {children}
    </div>
  );
}

function AIPlaceholderRow() {
  return (
    <div className="flex items-center gap-3 pt-4 mt-2 border-t border-gray-100">
      <Mic size={16} className="text-gray-400 flex-shrink-0" />
      <p className="flex-1 text-sm text-muted-foreground">Fill this in by talking instead</p>
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
        Coming soon
      </span>
      {/* Disabled toggle */}
      <div
        className="w-9 h-5 bg-muted rounded-full flex-shrink-0 cursor-not-allowed opacity-50 relative"
        aria-disabled="true"
      >
        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalType = "task" | "note";

export interface ReminderModalProps {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
  onSaved?: (reminder: ReminderData) => void;
}

export function ReminderModal({ open, onClose, initialDate = "", onSaved }: ReminderModalProps) {
  const [modalType, setModalType] = useState<ModalType>("task");

  // Task form state (kept here so we can access it for save)
  const [action, setAction] = useState("");
  const [forMe, setForMe] = useState(true);
  const [forPeopleIds, setForPeopleIds] = useState<string[]>([]);
  const [showPersonPicker, setShowPersonPicker] = useState(false);
  const [date, setDate] = useState("");
  const [remindTiming, setRemindTiming] = useState<TimingValue>("");
  const [recurrence, setRecurrence] = useState("once");
  const [taskNotes, setTaskNotes] = useState("");

  // Note form state
  const [notePersonId, setNotePersonId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [followUp, setFollowUp] = useState(false);
  const [followUpAction, setFollowUpAction] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTiming, setFollowUpTiming] = useState<TimingValue>("");

  // Reset on open
  useEffect(() => {
    if (open) {
      setModalType("task");
      setAction(""); setForMe(true); setForPeopleIds([]); setShowPersonPicker(false);
      setDate(initialDate); setRemindTiming(""); setRecurrence("once"); setTaskNotes("");
      setNotePersonId(null); setNoteText(""); setFollowUp(false);
      setFollowUpAction(""); setFollowUpDate(""); setFollowUpTiming("");
    }
  }, [open, initialDate]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const notePerson = MODAL_PEOPLE.find((p) => p.id === notePersonId) ?? null;
  const noteFirstName = notePerson?.name.split(" ")[0] ?? "them";

  const canSave =
    modalType === "task"
      ? action.trim().length > 0
      : notePersonId !== null && noteText.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    if (modalType === "note" && notePersonId) {
      addNote(notePersonId, noteText.trim());
    } else if (modalType === "task") {
      const reminder: ReminderData = {
        id: `reminder-${Date.now()}`,
        action: action.trim(),
        kind: reminderIconFor(action.trim()),
        personName: MODAL_PEOPLE.find((p) => p.id === forPeopleIds[0])?.name,
        date,
        notes: taskNotes.trim() || undefined,
        recurrence,
        createdAt: new Date().toISOString(),
      };
      saveReminder(reminder);
      onSaved?.(reminder);
    }
    onClose();
  };

  const addablePeople = MODAL_PEOPLE.filter((p) => !forPeopleIds.includes(p.id));

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-card w-full max-w-[580px] max-h-[88vh] rounded-xl shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="New reminder"
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <p className="text-base font-medium text-foreground">New reminder</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Type choice */}
          <div className="grid grid-cols-2 gap-3">
            {([
              { type: "task" as const, icon: <CheckSquare size={18} />, title: "Something to do",         sub: "A task or follow-up to remember"     },
              { type: "note" as const, icon: <UserRound  size={18} />, title: "Something about someone",  sub: "A detail to save about a person"     },
            ] as const).map(({ type, icon, title, sub }) => {
              const active = modalType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setModalType(type)}
                  className={`text-left p-3.5 rounded-lg border-2 transition-colors ${
                    active ? "border-gray-900 bg-white" : "border-border bg-white hover:border-gray-300"
                  }`}
                >
                  <div className={`mb-2 ${active ? "text-gray-900" : "text-muted-foreground"}`}>
                    {icon}
                  </div>
                  <p className={`text-sm font-medium leading-tight ${active ? "text-gray-900" : "text-muted-foreground"}`}>
                    {title}
                  </p>
                  <p className={`text-xs mt-0.5 ${active ? "text-gray-500" : "text-muted-foreground"}`}>
                    {sub}
                  </p>
                </button>
              );
            })}
          </div>

          {/* ── Task form ── */}
          {modalType === "task" && (
            <div className="space-y-5">

              <FieldBlock label="What do you want to remember to do?">
                <input
                  autoFocus
                  type="text"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="e.g., Send birthday card to Sarah, Pick up dry cleaning…"
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-400 bg-input-background"
                />
              </FieldBlock>

              <FieldBlock label="Who's this for?">
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setForMe((v) => !v)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      forMe ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Me
                  </button>

                  {forPeopleIds.map((id) => {
                    const p = MODAL_PEOPLE.find((x) => x.id === id);
                    if (!p) return null;
                    return (
                      <span key={id} className="flex items-center gap-1 pl-2 pr-1 py-1 text-sm rounded-full border border-gray-200 bg-gray-100">
                        <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-medium text-gray-600">
                          {p.initials}
                        </div>
                        <span className="text-gray-700 ml-0.5">{p.name.split(" ")[0]}</span>
                        <button
                          type="button"
                          onClick={() => setForPeopleIds((prev) => prev.filter((x) => x !== id))}
                          className="ml-0.5 p-0.5 rounded-full hover:bg-gray-200 text-gray-500"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    );
                  })}

                  {addablePeople.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPersonPicker((v) => !v)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <Plus size={13} />
                      Add a person
                    </button>
                  )}
                </div>

                {showPersonPicker && addablePeople.length > 0 && (
                  <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-100 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {addablePeople.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setForPeopleIds((prev) => [...prev, p.id]);
                            setShowPersonPicker(false);
                          }}
                          className="flex items-center gap-1.5 pl-1 pr-3 py-1 text-sm border border-gray-200 rounded-full bg-white hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                            {p.initials}
                          </div>
                          {p.name.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => setShowPersonPicker(false)} className="text-xs text-muted-foreground hover:text-foreground">
                      Cancel
                    </button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-1">
                  "Me" means a personal task. Add a person if it involves someone specific.
                </p>
              </FieldBlock>

              <FieldBlock label="What date is this about?">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setRemindTiming(""); }}
                  className="px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 bg-input-background"
                />
              </FieldBlock>

              {date && (
                <FieldBlock label="Remind me">
                  <ChipRow options={TIMING_CHIPS} value={remindTiming} onChange={setRemindTiming} />
                </FieldBlock>
              )}

              <FieldBlock label="Does this repeat?">
                <ChipRow options={RECURRENCE_CHIPS} value={recurrence} onChange={setRecurrence} />
              </FieldBlock>

              <FieldBlock label="Notes (optional)">
                <textarea
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  rows={3}
                  placeholder="Anything helpful to remember when this reminder fires…"
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm placeholder:text-gray-400 resize-none focus:outline-none focus:border-gray-400 bg-input-background"
                />
              </FieldBlock>

              <AIPlaceholderRow />
            </div>
          )}

          {/* ── Note form ── */}
          {modalType === "note" && (
            <div className="space-y-5">

              <FieldBlock label="Who's this about?">
                <div className="flex flex-wrap gap-2">
                  {MODAL_PEOPLE.map((p) => {
                    const active = notePersonId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setNotePersonId(p.id)}
                        className={`flex items-center gap-1.5 pl-1 pr-3 py-1 text-sm rounded-full border transition-colors ${
                          active ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 ${
                          active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                        }`}>
                          {p.initials}
                        </div>
                        {p.name.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </FieldBlock>

              <FieldBlock label={`What do you want to remember about ${noteFirstName}?`}>
                <textarea
                  autoFocus={modalType === "note"}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  placeholder="e.g., Mentioned wanting to try pottery, nervous about the job interview next month…"
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm placeholder:text-gray-400 resize-none focus:outline-none focus:border-gray-400 bg-input-background"
                />
                <p className="text-xs text-muted-foreground">
                  Only visible to you — {notePerson ? `${notePerson.name.split(" ")[0]} will` : "they will"} never see this.
                </p>
              </FieldBlock>

              {/* Follow-up */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={followUp}
                    onChange={(e) => setFollowUp(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-gray-900 cursor-pointer"
                  />
                  <span className="text-sm text-foreground">Also remind me to follow up on this.</span>
                </label>

                {followUp && (
                  <div className="ml-7 pl-3 border-l-2 border-gray-100 space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">What do you want to do?</p>
                      <input
                        type="text"
                        value={followUpAction}
                        onChange={(e) => setFollowUpAction(e.target.value)}
                        placeholder={`e.g., Check in with ${noteFirstName} about this`}
                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-400 bg-input-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">When?</p>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => { setFollowUpDate(e.target.value); setFollowUpTiming(""); }}
                        className="px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 bg-input-background"
                      />
                    </div>
                    {followUpDate && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Remind me</p>
                        <ChipRow options={TIMING_CHIPS_SHORT} value={followUpTiming} onChange={setFollowUpTiming} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <AIPlaceholderRow />
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
