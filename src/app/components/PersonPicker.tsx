import { useState, useRef, useEffect } from "react";

const mockPeople = [
  { id: "1", name: "Sarah Johnson", initials: "SJ" },
  { id: "2", name: "Michael Chen", initials: "MC" },
  { id: "3", name: "Emma Davis", initials: "ED" },
  { id: "4", name: "David Martinez", initials: "DM" },
  { id: "5", name: "Lisa Anderson", initials: "LA" },
  { id: "6", name: "James Wilson", initials: "JW" },
];

interface PersonPickerProps {
  value: string | null;
  onChange: (personId: string | null) => void;
}

export function PersonPicker({ value, onChange }: PersonPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedPerson = mockPeople.find((p) => p.id === value) ?? null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {selectedPerson ? (
        <div className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0">
              {selectedPerson.initials}
            </div>
            <span className="text-sm">{selectedPerson.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Change
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-left text-gray-500 hover:bg-gray-50"
        >
          + Select a person
        </button>
      )}

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded border border-gray-200 bg-white shadow-sm">
          <div className="max-h-52 overflow-y-auto py-1">
            {mockPeople.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => {
                  onChange(person.id);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 text-left"
              >
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0">
                  {person.initials}
                </div>
                <span className="text-sm">{person.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
