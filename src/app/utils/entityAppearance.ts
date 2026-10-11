import {
  Bell,
  Calendar,
  ClipboardList,
  Flag,
  KeyRound,
  Pencil,
  Phone,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

// ─── Central icon + color mapping ─────────────────────────────────────────────
//
// Every "kind of thing" in the app maps to one icon and one tint here.
// This mapping is PROVISIONAL — the full icon/color system will be defined in
// a follow-up. Change values here and every notification row picks them up.
//
// Fixed across the app: reminders → amber, plans → green, occasions → blue.

export type EntityKind =
  | "reminder"          // generic reminder
  | "reminder-call"     // reminder to call / text / check in with someone
  | "survey-request"    // someone asked you to fill out a survey
  | "access-request"    // someone asked for access to one of your surveys
  | "plan-invitation"   // you were invited to a plan
  | "plan"
  | "occasion"
  | "private-note"
  | "about-me";         // update to your own About Me

export interface EntityAppearance {
  icon: LucideIcon;
  /** Soft background tint for the round icon badge */
  bgClass: string;
  /** Glyph color */
  fgClass: string;
  /** Small solid dot used next to type labels */
  dotClass: string;
}

const TINTS = {
  amber:  { bgClass: "bg-amber-50",  fgClass: "text-amber-600",  dotClass: "bg-amber-500"  },
  green:  { bgClass: "bg-green-50",  fgClass: "text-green-600",  dotClass: "bg-green-500"  },
  blue:   { bgClass: "bg-blue-50",   fgClass: "text-blue-600",   dotClass: "bg-blue-500"   },
  violet: { bgClass: "bg-violet-50", fgClass: "text-violet-600", dotClass: "bg-violet-500" },
  gray:   { bgClass: "bg-gray-100",  fgClass: "text-gray-600",   dotClass: "bg-gray-500"   },
} as const;

export const ENTITY_APPEARANCE: Record<EntityKind, EntityAppearance> = {
  "reminder":        { icon: Bell,          ...TINTS.amber  },
  "reminder-call":   { icon: Phone,         ...TINTS.amber  },
  "survey-request":  { icon: ClipboardList, ...TINTS.violet },
  "access-request":  { icon: KeyRound,      ...TINTS.violet },
  "plan-invitation": { icon: Users,         ...TINTS.green  },
  "plan":            { icon: Flag,          ...TINTS.green  },
  "occasion":        { icon: Calendar,      ...TINTS.blue   },
  "private-note":    { icon: Pencil,        ...TINTS.gray   },
  "about-me":        { icon: User,          ...TINTS.gray   },
};

export function getEntityAppearance(kind: EntityKind): EntityAppearance {
  return ENTITY_APPEARANCE[kind];
}

/** Reminders about calling, texting, or checking in with someone use the phone icon. */
export function reminderKind(title: string): EntityKind {
  return /\b(call|text|phone|ask|check in)\b/i.test(title) ? "reminder-call" : "reminder";
}
