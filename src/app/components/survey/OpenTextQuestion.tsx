interface OpenTextQuestionProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function OpenTextQuestion({
  question,
  value,
  onChange,
  placeholder = "",
  rows = 4,
}: OpenTextQuestionProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{question}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    </div>
  );
}
