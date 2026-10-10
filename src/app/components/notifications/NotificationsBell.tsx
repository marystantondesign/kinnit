import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { Bell, ChevronDown, ChevronRight, Clock, X } from "lucide-react";
import { getEntityAppearance, reminderKind, type EntityKind } from "../../utils/entityAppearance";
import {
  dismissActionItem,
  formatActionDate,
  formatRelativeTime,
  logActivity,
  snoozeActionItem,
  useNotifications,
  type ActionItem,
  type ActivityEntry,
  type SnoozeOption,
} from "../../utils/notificationStore";

// ─── Layout constants ─────────────────────────────────────────────────────────

const DESKTOP_WIDTH = 440;
const MOBILE_GUTTER = 24;
const VIEWPORT_MARGIN = 16;
const MD_BREAKPOINT = 768;
/** How far the panel extends past the bell's center on desktop */
const DESKTOP_OVERHANG = 56;
const GAP_BELOW_TOP_BAR = 8;

// ─── Small pieces ─────────────────────────────────────────────────────────────

function IconBadge({ kind }: { kind: EntityKind }) {
  const { icon: Icon, bgClass, fgClass } = getEntityAppearance(kind);
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${bgClass}`}>
      <Icon size={14} className={fgClass} />
    </div>
  );
}

const primaryBtn =
  "h-8 px-3 rounded-lg bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-800 transition-colors";
const outlineBtn =
  "h-8 px-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-[13px] font-medium hover:bg-gray-50 transition-colors";

const SNOOZE_OPTIONS: { value: SnoozeOption; label: string }[] = [
  { value: "later-today", label: "Later today" },
  { value: "tomorrow",    label: "Tomorrow"    },
  { value: "next-week",   label: "Next week"   },
];

function SnoozeButton({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    // Capture on window so Escape closes only this menu, not the whole panel.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${outlineBtn} flex items-center gap-1.5`}
      >
        <Clock size={14} className="text-gray-700" />
        Snooze
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-md py-1 z-10"
        >
          {SNOOZE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                snoozeActionItem(itemId, o.value);
              }}
              className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  kind,
  title,
  meta,
  actions,
  compact,
}: {
  kind: EntityKind;
  title: ReactNode;
  meta: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <li className={`flex gap-3 ${compact ? "py-3" : "py-3.5"} border-b border-gray-100 last:border-b-0`}>
      <IconBadge kind={kind} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-5 text-gray-900">{title}</p>
        <p className="text-[12px] leading-4 mt-0.5 text-gray-400">{meta}</p>
        {actions && <div className="flex flex-wrap items-center gap-2 mt-2.5">{actions}</div>}
      </div>
    </li>
  );
}

function ActionItemRow({ item, onNavigate }: { item: ActionItem; onNavigate: (to: string) => void }) {
  const date = formatActionDate(item.date);

  switch (item.kind) {
    case "reminder":
      return (
        <Row
          kind={reminderKind(item.title)}
          title={item.title}
          meta={date}
          actions={<SnoozeButton itemId={item.id} />}
        />
      );

    case "survey-request":
      return (
        <Row
          kind="survey-request"
          title={`${item.requesterName} requested your ${item.topic}`}
          meta={date}
          actions={
            <>
              <button type="button" className={primaryBtn} onClick={() => onNavigate(`/app/surveys/${item.surveyId}`)}>
                Take survey
              </button>
              <button type="button" className={outlineBtn} onClick={() => dismissActionItem(item.id)}>
                Dismiss
              </button>
            </>
          }
        />
      );

    case "access-request": {
      const who = item.requesterName ?? "A friend";
      return (
        <Row
          kind="access-request"
          title={`${who} asked for access to ${item.surveyTitle}`}
          meta={date}
          actions={
            <>
              <button
                type="button"
                className={primaryBtn}
                onClick={() => {
                  dismissActionItem(item.id);
                  logActivity("about-me", `Shared ${item.surveyTitle} with ${item.requesterName ?? "a friend"}`);
                }}
              >
                {item.requesterName ? `Share with ${item.requesterName}` : "Share with them"}
              </button>
              <button type="button" className={outlineBtn} onClick={() => dismissActionItem(item.id)}>
                Dismiss
              </button>
            </>
          }
        />
      );
    }

    case "plan-invitation":
      return (
        <Row
          kind="plan-invitation"
          title={
            <>
              {item.inviterName} invited you to <span className="font-semibold">{item.planName}</span>
            </>
          }
          meta={date}
          actions={
            <button type="button" className={outlineBtn} onClick={() => onNavigate(`/app/plans/${item.planId}`)}>
              Review invitation
            </button>
          }
        />
      );
  }
}

function ActivityRow({ entry, now }: { entry: ActivityEntry; now: number }) {
  return <Row compact kind={entry.appearance} title={entry.text} meta={formatRelativeTime(entry.at, now)} />;
}

function FooterLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="-mx-4 -mb-4 mt-1 px-4 py-3.5 border-t border-gray-100 flex items-center justify-between text-[14px] text-gray-900 hover:bg-gray-50 rounded-b-[14px] transition-colors"
    >
      {label}
      <ChevronRight size={16} className="text-gray-400" />
    </Link>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

type Tab = "action" | "timeline";

interface Position {
  top: number;
  left: number;
  width: number;
  caretX: number;
}

function computePosition(button: HTMLElement): Position {
  const vw = window.innerWidth;
  const bell = button.getBoundingClientRect();
  const header = button.closest("header")?.getBoundingClientRect();
  const top = (header?.bottom ?? bell.bottom) + GAP_BELOW_TOP_BAR;
  const bellCenter = bell.left + bell.width / 2;

  let width: number;
  let left: number;
  if (vw < MD_BREAKPOINT) {
    width = vw - MOBILE_GUTTER * 2;
    left = MOBILE_GUTTER;
  } else {
    width = Math.min(DESKTOP_WIDTH, vw - VIEWPORT_MARGIN * 2);
    const right = Math.min(bellCenter + DESKTOP_OVERHANG, vw - VIEWPORT_MARGIN);
    left = Math.max(VIEWPORT_MARGIN, right - width);
  }
  const caretX = Math.min(Math.max(bellCenter - left, 20), width - 20);
  return { top, left, width, caretX };
}

function NotificationsPanel({
  anchor,
  onClose,
  panelRef,
}: {
  anchor: HTMLElement;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const navigate = useNavigate();
  const { actionItems, activity, now } = useNotifications();
  const [tab, setTab] = useState<Tab>("action");
  const [pos, setPos] = useState<Position>(() => computePosition(anchor));

  useLayoutEffect(() => {
    const update = () => setPos(computePosition(anchor));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [anchor]);

  useEffect(() => {
    panelRef.current?.focus();
  }, [panelRef]);

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  const count = actionItems.length;
  const maxHeight = `calc(100dvh - ${pos.top + VIEWPORT_MARGIN}px)`;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      tabIndex={-1}
      className="fixed z-50 focus:outline-none"
      style={{ top: pos.top, left: pos.left, width: pos.width }}
    >
      {/* Caret */}
      <div
        aria-hidden
        className="absolute -top-[6px] w-3 h-3 rotate-45 bg-white border-l border-t border-gray-200"
        style={{ left: pos.caretX - 6 }}
      />

      <div
        className="bg-white border border-gray-200 rounded-[14px] shadow-[0_12px_32px_-8px_rgba(17,24,39,0.18),0_2px_6px_rgba(17,24,39,0.06)] p-4 flex flex-col"
        style={{ maxHeight }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-gray-900">Notifications</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Segmented control */}
        <div role="tablist" className="mt-3 grid grid-cols-2 p-1 bg-gray-100 rounded-lg">
          {([
            ["action", "Action items"],
            ["timeline", "Timeline"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`h-8 rounded-md text-[13px] transition-colors ${
                tab === value ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="mt-3 overflow-y-auto min-h-0 -mx-4 px-4">
          {tab === "action" ? (
            count === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[15px] text-gray-900">You're all caught up</p>
                <p className="text-[13px] text-gray-400 mt-1">Nothing is waiting on you</p>
              </div>
            ) : (
              <>
                <p className="text-[12px] text-gray-500">
                  {count} action item{count === 1 ? "" : "s"}
                </p>
                <ul>
                  {actionItems.map((item) => (
                    <ActionItemRow key={item.id} item={item} onNavigate={go} />
                  ))}
                </ul>
              </>
            )
          ) : (
            <ul>
              {activity.map((entry) => (
                <ActivityRow key={entry.id} entry={entry} now={now} />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {tab === "action" && count > 0 && (
          <FooterLink to="/app/notifications/action-items" label="View all action items" onClick={onClose} />
        )}
        {tab === "timeline" && (
          <FooterLink to="/app/notifications/activity" label="View all activity" onClick={onClose} />
        )}
      </div>
    </div>
  );
}

// ─── Bell ─────────────────────────────────────────────────────────────────────

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { actionItems } = useNotifications();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const hasItems = actionItems.length > 0;

  const close = (returnFocus = false) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  };

  // Close on outside click/tap or Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={hasItems ? "Notifications — action items waiting" : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          open ? "bg-gray-100" : "hover:bg-gray-50"
        }`}
      >
        <Bell
          size={20}
          strokeWidth={2}
          className="text-gray-900"
          fill={hasItems ? "#FBBF24" : "none"}
        />
      </button>
      {open && buttonRef.current && (
        <NotificationsPanel anchor={buttonRef.current} onClose={() => close()} panelRef={panelRef} />
      )}
    </>
  );
}
