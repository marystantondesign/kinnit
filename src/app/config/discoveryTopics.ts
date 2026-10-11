import {
  BookOpen,
  ChefHat,
  Mountain,
  Music,
  Palette,
  Sprout,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// ─── Discovery topics → artwork ───────────────────────────────────────────────
//
// Each discovery has a topic. The topic decides the collage artwork, so the
// card never hard-codes any one subject. Images show the TOPIC (a trail, an
// instrument), never the people named in the discovery or a specific place.
//
// Topics need 0–3 images: 3 → full collage, 1–2 → smaller collage,
// 0 → icon treatment. Failed loads are dropped at runtime the same way.
//
// SAMPLE: every image below is a placeholder illustration from
// public/discoveries/sample/. Replace with approved photos when available.

export interface TopicImage {
  src: string;
  /** Describes the image itself, e.g. "A dirt trail through a forest" */
  alt: string;
}

export interface DiscoveryTopic {
  label: string;
  /** Fallback when there are no usable images */
  icon: LucideIcon;
  images: TopicImage[];
  /** True while the images are prototype placeholders */
  sample?: boolean;
}

const S = "/discoveries/sample";

export const DISCOVERY_TOPICS: Record<string, DiscoveryTopic> = {
  hiking: {
    label: "Hiking",
    icon: Mountain,
    sample: true,
    images: [
      { src: `${S}/hiking-trail.svg`, alt: "A dirt trail winding through a forest" },
      { src: `${S}/hiking-boots.svg`, alt: "A pair of hiking boots" },
      { src: `${S}/hiking-hillside.svg`, alt: "Rolling green hills at sunset" },
    ],
  },
  cooking: {
    label: "Cooking",
    icon: ChefHat,
    sample: true,
    images: [
      { src: `${S}/cooking-ingredients.svg`, alt: "Tomatoes, herbs and garlic on a cutting board" },
      { src: `${S}/cooking-prep.svg`, alt: "A steaming pot on the stove" },
      { src: `${S}/cooking-dish.svg`, alt: "A bowl of noodles with herbs" },
    ],
  },
  music: {
    label: "Music",
    icon: Music,
    sample: true,
    images: [
      { src: `${S}/music-instruments.svg`, alt: "An acoustic guitar" },
      { src: `${S}/music-records.svg`, alt: "A vinyl record and its sleeve" },
      { src: `${S}/music-concert.svg`, alt: "Stage lights over a concert crowd" },
    ],
  },
  art: {
    label: "Art",
    icon: Palette,
    sample: true,
    images: [
      { src: `${S}/art-materials.svg`, alt: "A paint palette and brush" },
      { src: `${S}/art-studio.svg`, alt: "A painting on an easel in a studio" },
      { src: `${S}/art-gallery.svg`, alt: "Framed paintings on a gallery wall" },
    ],
  },
  gardening: {
    label: "Gardening",
    icon: Sprout,
    sample: true,
    images: [{ src: `${S}/gardening-plant.svg`, alt: "A tomato plant in a terracotta pot" }],
  },
  reading: {
    label: "Reading",
    icon: BookOpen,
    images: [],
  },
};

const FALLBACK_TOPIC: DiscoveryTopic = { label: "Discovery", icon: Sparkles, images: [] };

export function getDiscoveryTopic(topic: string): DiscoveryTopic {
  return DISCOVERY_TOPICS[topic] ?? FALLBACK_TOPIC;
}
