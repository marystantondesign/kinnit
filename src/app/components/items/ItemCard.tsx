import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";
import { Check, Link2, Repeat } from "lucide-react";
import { ItemBadge } from "../ItemBadge";
import { PeopleStack } from "./PeopleStack";
import type { ItemLook } from "../../config/itemTypes";

// The one compact card used by the Reminders, Plans and Occasions pages.

export interface ItemCardProps {
  look: ItemLook;
  title: string;
  /** Meta line parts, joined with " · " */
  meta: ReactNode[];
  /** Name of the linked item (third line) */
  linked?: string;
  people?: string[];
  href?: string;
  recurring?: boolean;
  done?: boolean;
  draft?: boolean;
}

export function ItemCard({ look, title, meta, linked, people = [], href, recurring, done, draft }: ItemCardProps) {
  const parts: ReactNode[] = [...meta.filter(Boolean)];
  if (recurring) {
    parts.push(
      <span className="inline-flex items-center gap-1">
        <Repeat size={12} strokeWidth={1.75} aria-hidden />
        Recurring
      </span>,
    );
  }
  if (done) {
    parts.push(
      <span className="inline-flex items-center gap-1">
        <Check size={12} strokeWidth={1.75} aria-hidden />
        Done
      </span>,
    );
  }

  const body = (
    <>
      <ItemBadge {...look} size="lg" />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-5 font-medium text-gray-900 line-clamp-2">{title}</p>
        {parts.length > 0 && (
          <p className="text-[12px] leading-4 text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-1">
            {parts.map((part, i) => (
              <Fragment key={i}>
                {i > 0 && <span aria-hidden>·</span>}
                <span>{part}</span>
              </Fragment>
            ))}
          </p>
        )}
        {draft && (
          <span className="inline-block mt-1 text-[11px] leading-4 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Draft</span>
        )}
        {linked && (
          <p className="text-[12px] leading-4 text-gray-400 mt-0.5 flex items-center gap-1 min-w-0">
            <Link2 size={12} strokeWidth={1.75} className="flex-shrink-0" aria-hidden />
            <span className="truncate">{linked}</span>
          </p>
        )}
      </div>
      <PeopleStack names={people} />
    </>
  );

  const className = `flex items-center gap-3 min-h-[76px] py-3 px-[14px] rounded-[12px] border border-gray-200 bg-white transition-colors ${
    done ? "opacity-60" : ""
  } ${href ? "hover:bg-gray-50" : ""}`;

  return href ? (
    <Link to={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
