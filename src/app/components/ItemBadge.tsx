import type { CSSProperties } from "react";
import {
  ITEM_ICON_STROKE,
  familyColors,
  getItemIcon,
  type ItemFamily,
  type ItemLook,
} from "../config/itemTypes";

// The only way item icons are drawn. Colors and icons come from config/itemTypes.

const SIZES = {
  xs: { box: 20, icon: 12 },
  sm: { box: 28, icon: 16 },
  lg: { box: 40, icon: 22 },
} as const;

export type ItemBadgeProps = ItemLook & {
  /** sm = 28px circle / 16px icon, lg = 40px / 22px. xs (20px) is for menus. */
  size?: keyof typeof SIZES;
  className?: string;
};

export function ItemBadge({ type, icon, size = "sm", className = "" }: ItemBadgeProps) {
  const Icon = getItemIcon(type, icon);
  const { box, icon: glyph } = SIZES[size];
  const colors = familyColors(type);
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full flex-shrink-0 ${className}`}
      style={{ width: box, height: box, background: colors.fill, color: colors.icon }}
    >
      <Icon size={glyph} strokeWidth={ITEM_ICON_STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </span>
  );
}

/** Small round dot in the family's dot color. Completed items get a hollow dot. */
export function ItemDot({
  type,
  completed = false,
  size = 8,
  className = "",
}: {
  type: ItemFamily;
  completed?: boolean;
  size?: number;
  className?: string;
}) {
  const { dot } = familyColors(type);
  return (
    <span
      aria-hidden
      className={`inline-block rounded-full flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: completed ? "transparent" : dot,
        boxShadow: completed ? `inset 0 0 0 1.5px ${dot}` : undefined,
      }}
    />
  );
}

/** Left stripe for agenda and calendar items, in the family's dot color. */
export function itemStripeStyle(type: ItemFamily, width = 3): CSSProperties {
  return { boxShadow: `inset ${width}px 0 0 0 ${familyColors(type).dot}` };
}
