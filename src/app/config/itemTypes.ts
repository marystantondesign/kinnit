import {
  Activity,
  Bell,
  Bookmark,
  Cake,
  Calendar,
  CalendarCheck,
  CircleCheck,
  ClipboardList,
  DollarSign,
  Eye,
  Feather,
  FileText,
  Flag,
  Gift,
  Heart,
  House,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Moon,
  Mountain,
  Music,
  Pencil,
  Phone,
  Share2,
  Shield,
  Sparkles,
  Star,
  User,
  UserPlus,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";

// ─── Item types: color and icon ───────────────────────────────────────────────
//
// The single source of truth for how every kind of thing in Kinnit looks.
// Color says WHAT KIND of thing it is; the icon says THE SITUATION.
// (Figma: Kinnit › DS › "Item types: color and icon")
//
// Rules
//   1. One color family per kind of thing.
//   2. Use the most specific icon for the situation; otherwise the family's
//      general icon.
//   3. Never use one family's color for a different kind of thing.
//
// Colors are exposed as CSS variables (--item-<family>-fill / -icon / -dot) by
// installItemTypeStyles(), so a family can be restyled here in one place.

export type ItemFamily =
  | "reminder"
  | "plan"
  | "occasion"
  | "request"
  | "discovery"
  | "legacy"
  | "people";

export interface FamilyColors {
  /** Soft background tint (badges, bands) */
  fill: string;
  /** Icon stroke color */
  icon: string;
  /** Saturated accent (calendar dots, left stripes) */
  dot: string;
}

export const ITEM_FAMILIES: Record<ItemFamily, { label: string; colors: FamilyColors }> = {
  reminder:  { label: "Reminder",  colors: { fill: "#fffbeb", icon: "#b45309", dot: "#f59e0b" } }, // amber
  plan:      { label: "Plan",      colors: { fill: "#f0fdf4", icon: "#15803d", dot: "#16a34a" } }, // green
  occasion:  { label: "Occasion",  colors: { fill: "#eff6ff", icon: "#1d4ed8", dot: "#2563eb" } }, // blue
  request:   { label: "Request",   colors: { fill: "#f5f3ff", icon: "#6d28d9", dot: "#7c3aed" } }, // violet
  discovery: { label: "Discovery", colors: { fill: "#fff1f2", icon: "#be123c", dot: "#e11d48" } }, // coral
  // PROVISIONAL: Legacy's color is not final yet.
  legacy:    { label: "Legacy",    colors: { fill: "#fdf4ff", icon: "#a21caf", dot: "#c026d3" } }, // plum
  people:    { label: "People",    colors: { fill: "#f3f4f6", icon: "#374151", dot: "#6b7280" } }, // neutral gray
};

// ─── Situation → icon ─────────────────────────────────────────────────────────

export const ITEM_ICONS = {
  reminder: { call: Phone, text: MessageSquare, card: Mail, gift: Gift, general: Bell },
  plan: { general: Flag, dinner: Utensils, trip: MapPin, gathering: House, outdoors: Mountain, invite: Users },
  occasion: {
    general: Calendar,
    birthday: Cake,
    anniversary: Heart,
    appointment: CalendarCheck,
    celebration: Star,
    remembrance: Moon,
  },
  request: { "fill-out": ClipboardList, access: Eye, completed: CircleCheck },
  discovery: { general: Sparkles, saved: Bookmark, music: Music },
  legacy: { general: Feather, will: FileText, healthcare: Activity, financial: DollarSign, decisions: Shield },
  people: { person: User, connect: UserPlus, group: Users, note: Pencil, private: Lock, share: Share2 },
} satisfies Record<ItemFamily, Record<string, LucideIcon>>;

export type ItemIconKey<F extends ItemFamily = ItemFamily> = keyof (typeof ITEM_ICONS)[F] & string;

/** The fallback icon when nothing more specific fits. */
export const DEFAULT_ICON: { [F in ItemFamily]: ItemIconKey<F> } = {
  reminder: "general",
  plan: "general",
  occasion: "general",
  request: "fill-out",
  discovery: "general",
  legacy: "general",
  people: "person",
};

/** A family plus a situation icon: everything needed to draw an item. */
export type ItemLook = { [F in ItemFamily]: { type: F; icon?: ItemIconKey<F> } }[ItemFamily];

/** All icons render with this stroke. */
export const ITEM_ICON_STROKE = 1.5;

export function getItemIcon(type: ItemFamily, icon?: string): LucideIcon {
  const set = ITEM_ICONS[type] as Record<string, LucideIcon>;
  return (icon && set[icon]) || set[DEFAULT_ICON[type]];
}

// ─── CSS variables ────────────────────────────────────────────────────────────

export function familyVar(type: ItemFamily, part: keyof FamilyColors): string {
  return `var(--item-${type}-${part})`;
}

/** { fill, icon, dot } as CSS variable references, for inline styles. */
export function familyColors(type: ItemFamily): FamilyColors {
  return { fill: familyVar(type, "fill"), icon: familyVar(type, "icon"), dot: familyVar(type, "dot") };
}

/** Writes the family colors to :root as CSS variables. Call once at startup. */
export function installItemTypeStyles(doc: Document = document) {
  const lines = (Object.keys(ITEM_FAMILIES) as ItemFamily[]).flatMap((family) => {
    const { colors } = ITEM_FAMILIES[family];
    return (Object.keys(colors) as (keyof FamilyColors)[]).map(
      (part) => `  --item-${family}-${part}: ${colors[part]};`,
    );
  });
  let style = doc.getElementById("kinnit-item-types") as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement("style");
    style.id = "kinnit-item-types";
    doc.head.prepend(style);
  }
  style.textContent = `:root {\n${lines.join("\n")}\n}`;
}

// ─── Choosing the icon (defaults when an item has no stored kind) ─────────────

const has = (text: string | undefined, re: RegExp) => !!text && re.test(text);

export function reminderIconFor(title: string, stored?: string): ItemIconKey<"reminder"> {
  if (stored && stored in ITEM_ICONS.reminder) return stored as ItemIconKey<"reminder">;
  if (has(title, /\b(gift|present|buy|flowers?)\b/i)) return "gift";
  if (has(title, /\b(card|letter|note to|thank[- ]you note|write)\b/i)) return "card";
  if (has(title, /\b(text|message|check in|dm)\b/i)) return "text";
  if (has(title, /\b(call|phone|ring|ask)\b/i)) return "call";
  return "general";
}

export function planIconFor(text: string, stored?: string): ItemIconKey<"plan"> {
  if (stored && stored in ITEM_ICONS.plan) return stored as ItemIconKey<"plan">;
  if (has(text, /\b(dinner|lunch|brunch|breakfast|meal|restaurant|eat)\b/i)) return "dinner";
  if (has(text, /\b(trip|travel|vacation|flight|getaway|visit)\b/i)) return "trip";
  if (has(text, /\b(hik(e|ing)|camp(ing)?|outdoors?|picnic|beach|park)\b/i)) return "outdoors";
  if (has(text, /\b(party|gathering|host(ing)?|house|weekend|potluck|get-together)\b/i)) return "gathering";
  return "general";
}

/** Occasion category (e.g. "Birthday", "Loss or Grief") → icon. */
export function occasionIconFor(category: string | undefined, title?: string, stored?: string): ItemIconKey<"occasion"> {
  if (stored && stored in ITEM_ICONS.occasion) return stored as ItemIconKey<"occasion">;
  const text = `${category ?? ""} ${title ?? ""}`;
  if (has(text, /birthday/i)) return "birthday";
  if (has(text, /memorial|loss|grief|remembrance|funeral/i)) return "remembrance";
  if (has(text, /anniversary/i)) return "anniversary";
  if (has(text, /appointment|illness|recovery|surgery|doctor|follow-up/i)) return "appointment";
  if (has(text, /celebration|milestone|graduation|promotion|wedding/i)) return "celebration";
  return "general";
}
