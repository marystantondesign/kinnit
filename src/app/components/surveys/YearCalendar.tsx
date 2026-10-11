// Twelve small months, four across, behind the talk panel for Important dates.
// Dates just heard are filled dark circles; saved ones get a light ring.

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function YearCalendar({ year, heard, saved }: { year: number; heard: Set<string>; saved: Set<string> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-6">
      {Array.from({ length: 12 }, (_, m) => {
        const first = new Date(year, m, 1);
        const days = new Date(year, m + 1, 0).getDate();
        const name = first.toLocaleDateString("en-US", { month: "long" });
        return (
          <div key={m}>
            <p className="text-[14px] font-semibold text-gray-900 mb-1.5">{name}</p>
            <div className="grid grid-cols-7 text-center text-[11px] leading-5 text-gray-400" aria-hidden>
              {WEEKDAYS.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center text-[12px] text-gray-800">
              {Array.from({ length: first.getDay() }, (_, i) => (
                <span key={`b${i}`} />
              ))}
              {Array.from({ length: days }, (_, i) => {
                const key = `${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                const isHeard = heard.has(key);
                const isSaved = !isHeard && saved.has(key);
                return (
                  <span key={key} className="h-6 flex items-center justify-center">
                    <span
                      className={`size-6 rounded-full flex items-center justify-center ${
                        isHeard ? "bg-gray-900 text-white font-semibold" : isSaved ? "ring-[1.5px] ring-gray-400 font-medium" : ""
                      }`}
                      aria-label={isHeard ? `${name} ${i + 1}, just heard` : isSaved ? `${name} ${i + 1}, saved` : undefined}
                    >
                      {i + 1}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
