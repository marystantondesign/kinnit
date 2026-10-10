interface CheckboxOption {
  id: string;
  label: string;
}

interface CheckboxListQuestionProps {
  question: string;
  options: CheckboxOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  otherText?: string;
  onOtherChange?: (text: string) => void;
  showOther?: boolean;
}

export function CheckboxListQuestion({
  question,
  options,
  selectedIds,
  onChange,
  otherText = "",
  onOtherChange,
  showOther = false,
}: CheckboxListQuestionProps) {
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-3">{question}</label>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.id}
            className="flex items-start gap-3 p-3 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(option.id)}
              onChange={() => handleToggle(option.id)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm flex-1">{option.label}</span>
          </label>
        ))}
        {showOther && (
          <div className="pt-2">
            <input
              type="text"
              value={otherText}
              onChange={(e) => onOtherChange?.(e.target.value)}
              placeholder="Other (please specify)"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
