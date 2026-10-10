interface SliderOption {
  value: number;
  label: string;
}

interface SliderPreferenceQuestionProps {
  question: string;
  value: number;
  onChange: (value: number) => void;
  options: SliderOption[];
}

export function SliderPreferenceQuestion({
  question,
  value,
  onChange,
  options,
}: SliderPreferenceQuestionProps) {
  const getCurrentLabel = () => {
    const option = options.find(opt => opt.value === value);
    return option?.label || '';
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-4">{question}</label>
      <div className="space-y-4">
        <div className="flex justify-center">
          <span className="text-lg font-medium text-blue-700">
            {getCurrentLabel()}
          </span>
        </div>
        <input
          type="range"
          min={Math.min(...options.map(o => o.value))}
          max={Math.max(...options.map(o => o.value))}
          step="1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 px-1">
          {options.map((option) => (
            <span key={option.value} className="text-center" style={{ flex: 1 }}>
              {option.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
