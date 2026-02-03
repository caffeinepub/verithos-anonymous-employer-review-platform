import React from 'react';
import { Star } from 'lucide-react';

interface RatingDisplayProps {
  rating: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  reviewCount?: number;
}

export default function RatingDisplay({ 
  rating, 
  label, 
  showValue = true, 
  size = 'md',
  className = '',
  reviewCount
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const roundedRating = Math.round(rating * 10) / 10;

  const getReviewCountText = (count: number) => {
    if (count === 1) {
      return 'на база 1 мнение';
    }
    return `на база ${count} мнения`;
  };

  return (
    <div className={`rating-category-container ${className}`}>
      {label && (
        <div className="rating-category-label-container">
          <span className={`rating-category-label ${textSizeClasses[size]}`}>
            {label}
          </span>
          {reviewCount && reviewCount > 0 && (
            <span className="text-xs text-gray-500 mt-1 block">
              {getReviewCountText(reviewCount)}
            </span>
          )}
        </div>
      )}
      <div className="rating-category-stars">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`${sizeClasses[size]} ${
                star <= rating
                  ? 'text-amber-500 fill-current'
                  : star - 0.5 <= rating
                  ? 'text-amber-500 fill-current opacity-50'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        {showValue && (
          <span className={`text-gray-600 ${textSizeClasses[size]} ml-1 font-medium`}>
            {roundedRating > 0 ? roundedRating.toFixed(1) : 'Няма'}
          </span>
        )}
      </div>
    </div>
  );
}
