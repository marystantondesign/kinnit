interface ImageOption {
  id: string;
  label: string;
  imageUrl: string;
}

interface ImageSelectionGridProps {
  question: string;
  options: ImageOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  multiSelect?: boolean;
  columns?: number;
}

export function ImageSelectionGrid({
  question,
  options,
  selectedIds,
  onChange,
  multiSelect = true,
  columns = 3,
}: ImageSelectionGridProps) {
  const handleToggle = (id: string) => {
    if (multiSelect) {
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter(selectedId => selectedId !== id));
      } else {
        onChange([...selectedIds, id]);
      }
    } else {
      onChange([id]);
    }
  };

  const gridClass = columns === 2 
    ? 'grid-cols-2' 
    : columns === 4 
    ? 'grid-cols-2 md:grid-cols-4' 
    : 'grid-cols-2 md:grid-cols-3';

  return (
    <div>
      <label className="block text-sm font-medium mb-4">{question}</label>
      <div className={`grid ${gridClass} gap-2 md:gap-4`}>
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => handleToggle(option.id)}
              className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="aspect-square relative">
                <img
                  src={option.imageUrl}
                  alt={option.label}
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3 bg-white">
                <p className="text-sm text-center">{option.label}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}