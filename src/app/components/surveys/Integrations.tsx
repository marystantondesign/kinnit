import { useEffect, useRef, useState } from "react";
import { BookOpen, Image, Link2, ShoppingBag, Store, X } from "lucide-react";
import type { IntegrationTile, SurveyDef } from "../../config/surveys";
import { addAttachment, removeAttachment, type Attachment } from "../../utils/surveyAnswers";
import { IconCircle } from "./SurveyBits";

// "Pull in what you've already saved". Connect buttons are placeholders that
// say "Coming soon"; Paste a link and Add a photo really save with the answer.

const outlineBtn =
  "h-9 px-3.5 rounded-lg border border-gray-200 bg-white text-[14px] text-gray-900 hover:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

const ICONS = { cart: ShoppingBag, board: Image, restaurant: Store, recipe: BookOpen } as const;

/** Shows "Coming soon" on the button for a moment. */
function useComingSoon() {
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    if (!shown) return;
    const t = window.setTimeout(() => setShown(null), 2600);
    return () => window.clearTimeout(t);
  }, [shown]);
  return { shown, show: setShown };
}

export function ConnectButton({ id, className = "", label = "Connect" }: { id: string; className?: string; label?: string }) {
  const { shown, show } = useComingSoon();
  return (
    <>
      <button type="button" onClick={() => show(id)} className={`${outlineBtn} ${className}`}>
        {shown ? "Coming soon" : label}
      </button>
      <span className="sr-only" aria-live="polite">
        {shown ? "Coming soon. Connecting saved items isn't available yet." : ""}
      </span>
    </>
  );
}

function normalizeUrl(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Reads an image and shrinks it so it fits in local storage. */
function shrinkImage(file: File, max = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function LinkAdder({ surveyId, sectionId, onDone }: { surveyId: string; sectionId: string; onDone?: () => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const save = () => {
    const url = normalizeUrl(text);
    if (!url) {
      setError("That doesn't look like a link.");
      return;
    }
    if (!addAttachment(surveyId, sectionId, "link", url)) {
      setError("Couldn't save that link.");
      return;
    }
    setText("");
    setError("");
    onDone?.();
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          autoFocus
          type="url"
          inputMode="url"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="https://"
          aria-label="Link"
          className="flex-1 min-w-0 h-9 px-3 rounded-lg border border-gray-200 text-[14px] outline-none focus:border-gray-400"
        />
        <button type="button" onClick={save} className="h-9 px-3.5 rounded-lg bg-gray-900 text-white text-[14px] hover:bg-gray-800">
          Save
        </button>
      </div>
      {error && <p className="text-[12px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function PhotoButton({
  surveyId,
  sectionId,
  label = "Upload",
  className = "",
  onDone,
}: {
  surveyId: string;
  sectionId: string;
  label?: string;
  className?: string;
  onDone?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setState("busy");
          try {
            const src = await shrinkImage(file);
            const ok = addAttachment(surveyId, sectionId, "photo", src);
            setState(ok ? "idle" : "error");
            if (ok) onDone?.();
          } catch {
            setState("error");
          }
        }}
      />
      <button type="button" disabled={state === "busy"} onClick={() => input.current?.click()} className={`${outlineBtn} ${className}`}>
        {state === "busy" ? "Adding…" : label}
      </button>
      {state === "error" && <p className="text-[12px] text-red-600 mt-1">Couldn't add that photo. Try a smaller one.</p>}
    </>
  );
}

function Tile({ tile, surveyId, sectionId }: { tile: IntegrationTile; surveyId: string; sectionId: string }) {
  const [adding, setAdding] = useState(false);
  const Icon = tile.kind === "connect" ? ICONS[tile.icon] : tile.kind === "link" ? Link2 : Image;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col">
      <IconCircle>
        <Icon size={17} strokeWidth={1.75} />
      </IconCircle>
      <p className="mt-3 text-[15px] text-gray-900">{tile.title}</p>
      <p className="text-[13px] text-gray-400">{tile.detail}</p>
      <div className="mt-3">
        {tile.kind === "connect" ? (
          <ConnectButton id={tile.id} className="w-full text-left" />
        ) : tile.kind === "link" ? (
          adding ? (
            <LinkAdder surveyId={surveyId} sectionId={sectionId} onDone={() => setAdding(false)} />
          ) : (
            <button type="button" onClick={() => setAdding(true)} className={`${outlineBtn} w-full text-left`}>
              Add
            </button>
          )
        ) : (
          <PhotoButton surveyId={surveyId} sectionId={sectionId} className="w-full text-left" />
        )}
      </div>
    </div>
  );
}

/** Overview row: tiles four across on desktop. */
export function IntegrationTiles({ def, sectionId }: { def: SurveyDef; sectionId: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {def.integrations.map((t) => (
        <Tile key={t.id} tile={t} surveyId={def.id} sectionId={sectionId} />
      ))}
    </div>
  );
}

/** Tap route, desktop right column. */
export function BringItInCard({ def, sectionId }: { def: SurveyDef; sectionId: string }) {
  const [adding, setAdding] = useState(false);
  if (!def.bringItIn) return null;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5" aria-labelledby="bring-in">
      <h2 id="bring-in" className="text-[16px] font-semibold text-gray-900">
        {def.bringItIn.title}
      </h2>
      <p className="text-[13px] text-gray-500 mt-0.5">{def.bringItIn.detail}</p>
      <ul className="mt-2 divide-y divide-gray-100">
        {def.integrations.map((t) => (
          <li key={t.id} className="py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] text-gray-900">{t.title}</span>
              {t.kind === "connect" ? (
                <ConnectButton id={t.id} className="h-8 px-3 text-[13px]" />
              ) : t.kind === "link" ? (
                <button type="button" onClick={() => setAdding((a) => !a)} className={`${outlineBtn} h-8 px-3 text-[13px]`}>
                  {adding ? "Cancel" : "Add"}
                </button>
              ) : (
                <PhotoButton surveyId={def.id} sectionId={sectionId} className="h-8 px-3 text-[13px]" />
              )}
            </div>
            {t.kind === "link" && adding && (
              <div className="mt-2">
                <LinkAdder surveyId={def.id} sectionId={sectionId} onDone={() => setAdding(false)} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Tap route, mobile: one compact card. */
export function BringItInMobile({ def, sectionId }: { def: SurveyDef; sectionId: string }) {
  const [adding, setAdding] = useState(false);
  if (!def.bringItIn) return null;
  const canAttach = def.integrations.some((t) => t.kind === "link");
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] text-gray-900">{def.bringItIn.mobileTitle}</p>
          <p className="text-[13px] text-gray-400">{def.bringItIn.mobileDetail}</p>
        </div>
        <ConnectButton id="mobile" />
      </div>
      {canAttach && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {adding ? (
            <LinkAdder surveyId={def.id} sectionId={sectionId} onDone={() => setAdding(false)} />
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => setAdding(true)} className={`${outlineBtn} flex-1`}>
                Paste a link
              </button>
              <PhotoButton surveyId={def.id} sectionId={sectionId} label="Add a photo" className="flex-1 w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Links and photos saved with a section's answers. */
export function AttachmentList({ surveyId, items }: { surveyId: string; items: Attachment[] }) {
  if (!items.length) return null;
  const photos = items.filter((a) => a.kind === "photo");
  const links = items.filter((a) => a.kind === "link");
  return (
    <div className="space-y-2">
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <span key={p.id} className="relative">
              <img src={p.src} alt="Saved photo" className="size-16 rounded-lg object-cover border border-gray-200" />
              <button
                type="button"
                onClick={() => removeAttachment(surveyId, p.id)}
                aria-label="Remove photo"
                className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-gray-900 text-white flex items-center justify-center"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      {links.map((l) => (
        <div key={l.id} className="flex items-center gap-2 text-[13px]">
          <Link2 size={14} strokeWidth={1.75} className="text-gray-400 flex-shrink-0" aria-hidden />
          <a href={l.src} target="_blank" rel="noreferrer noopener" className="truncate text-gray-700 underline underline-offset-2 hover:text-gray-900">
            {hostAndPath(l.src)}
          </a>
          <button type="button" onClick={() => removeAttachment(surveyId, l.id)} aria-label="Remove link" className="text-gray-400 hover:text-gray-700">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function hostAndPath(url: string) {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return url;
  }
}
