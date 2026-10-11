import { avatarFor } from "../../utils/peopleDirectory";

/** Overlapping initials circles (24px, 6px overlap, white ring), up to three then "+N". */
export function PeopleStack({ names, max = 3 }: { names: string[]; max?: number }) {
  if (!names.length) return null;
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className="flex items-center flex-shrink-0" aria-label={names.map((n) => avatarFor(n).label).join(", ")}>
      {shown.map((name, i) => {
        const a = avatarFor(name);
        return (
          <span
            key={`${name}-${i}`}
            title={a.label}
            className={`size-6 rounded-full ring-2 ring-white flex items-center justify-center text-[9px] font-semibold ${a.className} ${
              i > 0 ? "-ml-1.5" : ""
            }`}
          >
            {a.initials}
          </span>
        );
      })}
      {extra > 0 && (
        <span className="-ml-1.5 size-6 rounded-full ring-2 ring-white bg-gray-100 text-gray-600 flex items-center justify-center text-[9px] font-semibold">
          +{extra}
        </span>
      )}
    </div>
  );
}
