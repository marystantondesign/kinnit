import { useState } from "react";
import { Ban, Bookmark, BookmarkCheck, RotateCcw } from "lucide-react";
import { getDiscoveryTopic } from "../config/discoveryTopics";
import { familyColors } from "../config/itemTypes";
import { useDiscoveries } from "../data/discoveries/useDiscoveries";
import type { Discovery } from "../data/discoveries/types";
import { PeopleStack } from "../components/items/PeopleStack";
import { ListPageFrame, SectionLabel } from "../components/items/ListPage";
import { Button } from "../components/ui/button";

type Tab = "available" | "saved" | "hidden";

function Thumb({ topic }: { topic: string }) {
  const t = getDiscoveryTopic(topic);
  const [failed, setFailed] = useState(false);
  const img = t.images[0];
  if (img && !failed) {
    return (
      <img
        src={img.src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-14 rounded-xl object-cover flex-shrink-0 ring-1 ring-black/5"
      />
    );
  }
  const Icon = t.icon;
  const c = familyColors("discovery");
  return (
    <span className="size-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.fill, color: c.icon }} aria-hidden>
      <Icon size={24} strokeWidth={1.5} />
    </span>
  );
}

function Row({
  d,
  saved,
  hidden,
  onSave,
  onHide,
}: {
  d: Discovery;
  saved: boolean;
  hidden: boolean;
  onSave: () => void;
  onHide: () => void;
}) {
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Thumb topic={d.topic} />
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-gray-900">{d.statement}</p>
          <p className="text-xs text-gray-500 mt-0.5">{d.basis}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:flex-shrink-0">
        <PeopleStack names={d.people} />
        {!hidden && (
          <Button type="button" variant="outline" size="sm" aria-pressed={saved} onClick={onSave}>
            {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            {saved ? "Saved" : "Save"}
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" onClick={onHide}>
          {hidden ? <RotateCcw size={15} /> : <Ban size={15} />}
          {hidden ? "Show again" : "Don't show again"}
        </Button>
      </div>
    </li>
  );
}

export function Discoveries() {
  const { loading, all, state, isSaved, setSaved, setDismissed } = useDiscoveries();
  const [tab, setTab] = useState<Tab>("available");

  const hidden = all.filter((d) => state.dismissed.includes(d.id));
  const available = all.filter((d) => !state.dismissed.includes(d.id));
  const saved = available.filter((d) => isSaved(d.id));
  const lists: Record<Tab, Discovery[]> = { available, saved, hidden };
  const shown = lists[tab];

  const tabs: { value: Tab; label: string }[] = [
    { value: "available", label: `Available ${available.length}` },
    { value: "saved", label: `Saved ${saved.length}` },
    { value: "hidden", label: `Hidden ${hidden.length}` },
  ];

  const empty: Record<Tab, string> = {
    available: "Nothing to discover yet. Discoveries appear when you and your people share things you enjoy.",
    saved: "Save a discovery to keep it here.",
    hidden: "Discoveries you choose not to see again show up here.",
  };

  return (
    <ListPageFrame>
      <div className="mb-5">
        <h1>Discoveries</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Things you and your people have in common, from what you've entered and what they've shared with you.
        </p>
      </div>

      <div role="tablist" aria-label="Discoveries" className="flex gap-2 mb-6 overflow-x-auto scrollbar-none -mx-6 px-6 md:mx-0 md:px-0">
        {tabs.map((t) => (
          <Button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            variant={tab === t.value ? "default" : "outline"}
            size="sm"
            className="rounded-full flex-shrink-0"
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <SectionLabel>{tab === "available" ? "Available" : tab === "saved" ? "Saved" : "Hidden"}</SectionLabel>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : shown.length ? (
        <ul className="space-y-3 max-w-4xl">
          {shown.map((d) => (
            <Row
              key={d.id}
              d={d}
              saved={isSaved(d.id)}
              hidden={tab === "hidden"}
              onSave={() => setSaved(d.id, !isSaved(d.id))}
              onHide={() => setDismissed(d.id, tab !== "hidden")}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">{empty[tab]}</p>
      )}
    </ListPageFrame>
  );
}
