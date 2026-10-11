import { useState } from "react";
import { Sparkles } from "lucide-react";
import { getDiscoveryTopic } from "../../config/discoveryTopics";
import { familyColors } from "../../config/itemTypes";

// Two or three topic images as a compact collage: rounded, slightly rotated,
// gently overlapping. Adapts to fewer images and to failed loads; with none
// left it falls back to the topic's icon.

// Positions for 3 / 2 / 1 images (percent of the collage box).
const LAYOUTS: Record<number, { left: string; top: string; width: string; height: string; rotate: number; z: number }[]> = {
  3: [
    { left: "0%", top: "8%", width: "56%", height: "84%", rotate: -4, z: 1 },
    { left: "46%", top: "0%", width: "50%", height: "50%", rotate: 4, z: 2 },
    { left: "50%", top: "50%", width: "48%", height: "48%", rotate: -2, z: 3 },
  ],
  2: [
    { left: "2%", top: "6%", width: "58%", height: "84%", rotate: -4, z: 1 },
    { left: "42%", top: "14%", width: "56%", height: "80%", rotate: 3, z: 2 },
  ],
  1: [{ left: "12%", top: "6%", width: "76%", height: "88%", rotate: -3, z: 1 }],
};

export function DiscoveryCollage({ topic }: { topic: string }) {
  const t = getDiscoveryTopic(topic);
  const [failed, setFailed] = useState<string[]>([]);
  const images = t.images.filter((img) => !failed.includes(img.src)).slice(0, 3);
  const colors = familyColors("discovery");

  if (!images.length) {
    const Icon = t.icon;
    return (
      <div className="relative h-full w-full flex items-center justify-center" aria-hidden>
        <div className="relative size-24 md:size-28 rounded-full flex items-center justify-center" style={{ background: colors.fill }}>
          <Icon size={44} strokeWidth={1.5} style={{ color: colors.icon }} />
          <Sparkles size={18} strokeWidth={1.5} className="absolute -top-1 -right-2" style={{ color: colors.dot }} />
          <Sparkles size={12} strokeWidth={1.5} className="absolute bottom-1 -left-3" style={{ color: colors.dot }} />
        </div>
      </div>
    );
  }

  const layout = LAYOUTS[images.length];
  return (
    <div className="relative h-full w-full">
      {images.map((img, i) => {
        const pos = layout[i];
        return (
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setFailed((f) => [...f, img.src])}
            className="absolute object-cover rounded-xl ring-[3px] ring-white shadow-[0_6px_18px_-6px_rgba(17,24,39,0.35)] bg-white select-none"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              height: pos.height,
              transform: `rotate(${pos.rotate}deg)`,
              zIndex: pos.z,
            }}
          />
        );
      })}
    </div>
  );
}
