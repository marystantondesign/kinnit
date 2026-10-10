interface TileOption {
  id: string;
  label: string;
  description?: string;
}

interface IllustratedSelectionTilesProps {
  question: string;
  options: TileOption[];
  selectedId: string;
  onChange: (id: string) => void;
}

export function IllustratedSelectionTiles({
  question,
  options,
  selectedId,
  onChange,
}: IllustratedSelectionTilesProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-4">{question}</label>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={`p-4 text-left border-2 rounded-lg transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-blue-600' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <div className="w-3 h-3 bg-blue-600 rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-600">{option.description}</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
