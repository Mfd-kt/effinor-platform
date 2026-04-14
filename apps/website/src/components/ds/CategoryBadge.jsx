import React from 'react';
import { cn } from '@/lib/utils';

const CATEGORY_TONES = {
  pac: 'bg-blue-100 text-blue-700',
  'pompe à chaleur': 'bg-blue-100 text-blue-700',
  déstratification: 'bg-orange-100 text-orange-700',
  destratification: 'bg-orange-100 text-orange-700',
  équilibrage: 'bg-teal-100 text-teal-700',
  equilibrage: 'bg-teal-100 text-teal-700',
  cee: 'bg-green-100 text-green-700',
  général: 'bg-gray-100 text-gray-600',
};

/** Classes Tailwind pour une catégorie blog (filtres, pastilles). */
export function categoryBadgeTone(category) {
  if (!category) return 'bg-gray-100 text-gray-600';
  return CATEGORY_TONES[category.toLowerCase()] || 'bg-primary-50 text-primary-700';
}

export function CategoryBadge({ category, className, ...props }) {
  if (category == null || category === '') return null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        categoryBadgeTone(category),
        className,
      )}
      {...props}
    >
      {category}
    </span>
  );
}
