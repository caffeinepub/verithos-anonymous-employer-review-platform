import React from 'react';
import { Star } from 'lucide-react';

interface RatingInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
  hint?: string;
}

export default function RatingInput({ label, value, onChange, required = false, hint }: RatingInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`p-1 rounded transition-colors ${
              rating <= value
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            <Star
              className={`w-6 h-6 ${
                rating <= value ? 'fill-current' : ''
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {value > 0 ? `${value}/5` : 'Не е оценено'}
        </span>
      </div>
      {hint && (
        <p className="text-xs text-gray-500 italic leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}
