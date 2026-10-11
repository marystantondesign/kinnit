import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight, Ban, Bookmark, BookmarkCheck, Shuffle, Sparkles } from "lucide-react";
import { DISCOVERY_SURFACES, familyColors } from "../../config/itemTypes";
import { avatarFor } from "../../utils/peopleDirectory";
import { pickNext, useDiscoveries } from "../../data/discoveries/useDiscoveries";
import { DiscoveryCollage } from "./DiscoveryCollage";

// Dashboard Discoveries module: one discovery at a time on a small "deck".
// Tapping the card shows another eligible discovery (nothing is saved or
// dismissed by rotating). Save / Don't show again / View all sit underneath,
// outside the tappable surface.

function Avatars({ names }: { names: string[] }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {names.map((name) => {
        const a = avatarFor(name);
        return (
          <span
            key={name}
            title={a.label}
            className={`size-8 rounded-full ring-2 ring-white flex items-center justify-center text-[11px] font-semibold ${a.className}`}
          >
            {a.initials}
          </span>
        );
      })}
    </div>
  );
}

/** Peach face with lavender and pink cards peeking out behind it. */
function Deck({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute inset-0 rounded-[22px] translate-x-2 -translate-y-2 rotate-[1.5deg]"
        style={{ background: DISCOVERY_SURFACES.backLavender }}
      />
      <div
        aria-hidden
        className="absolute inset-0 rounded-[22px] -translate-x-1 -translate-y-1 -rotate-[1deg]"
        style={{ background: DISCOVERY_SURFACES.backPink }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

const faceStyle = { background: DISCOVERY_SURFACES.face, borderColor: DISCOVERY_SURFACES.faceBorder };

function Message({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  const colors = familyColors("discovery");
  return (
    <Deck>
      <div className="rounded-[20px] border px-5 py-6 flex items-center gap-4 min-h-[148px]" style={faceStyle}>
        <span className="size-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: colors.fill, color: colors.icon }}>
          <Sparkles size={20} strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-[15px] font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-600 mt-0.5">{body}</p>
          {action}
        </div>
      </div>
    </Deck>
  );
}

export function DiscoveryCard() {
  const { loading, error, all, eligible, isSaved, setSaved, setDismissed } = useDiscoveries();
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Keep a valid current discovery as the eligible list changes.
  useEffect(() => {
    if (loading) return;
    if (!currentId || !eligible.some((d) => d.id === currentId)) {
      setCurrentId(eligible[0]?.id ?? null);
    }
  }, [loading, eligible, currentId]);

  const current = eligible.find((d) => d.id === currentId) ?? null;
  const canRotate = eligible.length > 1;

  const rotate = () => {
    if (!canRotate) return;
    setCurrentId(pickNext(eligible, currentId)?.id ?? null);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      rotate();
    }
  };

  const dismissCurrent = () => {
    if (!current) return;
    const next = pickNext(
      eligible.filter((d) => d.id !== current.id),
      null,
    );
    setDismissed(current.id, true);
    setCurrentId(next?.id ?? null);
  };

  let body: ReactNode;
  if (loading) {
    body = (
      <Deck>
        <div className="rounded-[20px] border min-h-[188px] animate-pulse motion-reduce:animate-none" style={faceStyle} aria-label="Loading discoveries" />
      </Deck>
    );
  } else if (error) {
    body = <Message title="Discoveries aren't available right now" body="Please try again in a little while." />;
  } else if (!all.length) {
    body = (
      <Message
        title="Nothing to discover yet"
        body="Discoveries appear when you and your people share things you enjoy."
      />
    );
  } else if (!current) {
    body = (
      <Message
        title="You've hidden every discovery"
        body="You can bring any of them back."
        action={
          <Link to="/app/discoveries" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-gray-900 underline underline-offset-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring">
            View all discoveries
          </Link>
        }
      />
    );
  } else {
    const saved = isSaved(current.id);
    body = (
      <>
        <Deck>
          <div
            role={canRotate ? "button" : undefined}
            tabIndex={canRotate ? 0 : undefined}
            aria-label={canRotate ? `${current.statement} Show another discovery.` : undefined}
            onClick={rotate}
            onKeyDown={canRotate ? onKey : undefined}
            className={`rounded-[20px] border overflow-hidden grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              canRotate ? "cursor-pointer" : ""
            }`}
            style={faceStyle}
          >
            {/* Text stays on the solid surface */}
            <div className="order-2 sm:order-1 px-5 pb-5 sm:py-5 flex flex-col justify-center gap-3">
              <Avatars names={current.people} />
              <div aria-live="polite">
                <p
                  key={current.id}
                  className="text-[19px] leading-snug font-semibold text-gray-900 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
                >
                  {current.statement}
                </p>
              </div>
              <p className="flex items-center gap-1.5 text-[13px] text-gray-600">
                <Shuffle size={14} strokeWidth={1.75} aria-hidden />
                {canRotate ? "Tap for another discovery" : "That's your only discovery for now"}
              </p>
            </div>
            <div
              key={`art-${current.id}`}
              className="order-1 sm:order-2 h-[150px] sm:h-auto sm:min-h-[188px] m-4 sm:my-4 sm:ml-0 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
            >
              <DiscoveryCollage topic={current.topic} />
            </div>
          </div>
        </Deck>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSaved(current.id, !saved)}
            aria-pressed={saved}
            className={`h-10 px-4 rounded-lg text-sm font-medium inline-flex items-center gap-2 border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              saved ? "bg-white text-gray-900 border-gray-300 hover:bg-gray-50" : "bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
            }`}
          >
            {saved ? <BookmarkCheck size={16} strokeWidth={1.75} /> : <Bookmark size={16} strokeWidth={1.75} />}
            {saved ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            onClick={dismissCurrent}
            className="h-10 px-4 rounded-lg text-sm inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Ban size={16} strokeWidth={1.75} />
            Don't show again
          </button>
          <Link
            to="/app/discoveries"
            className="ml-auto h-10 px-1 inline-flex items-center gap-1 text-sm font-medium text-gray-900 hover:underline underline-offset-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all discoveries
            <ArrowRight size={15} strokeWidth={1.75} />
          </Link>
        </div>
      </>
    );
  }

  return (
    <section aria-labelledby="discoveries-heading" className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 id="discoveries-heading" className="text-lg font-semibold text-gray-900 mb-4">
        Discoveries
      </h2>
      {body}
    </section>
  );
}
