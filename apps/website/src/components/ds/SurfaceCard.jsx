import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const surfaceCardVariants = cva(
  'rounded-2xl overflow-hidden transition-shadow duration-300',
  {
    variants: {
      variant: {
        elevated:
          'bg-white border border-gray-100 shadow-sm hover:shadow-lg',
        bordered: 'bg-white border border-gray-200 shadow-sm',
        flat: 'bg-white border border-gray-100',
      },
    },
    defaultVariants: {
      variant: 'elevated',
    },
  },
);

/**
 * Surface carte marketing (blog, offres, blocs contenu).
 */
export function SurfaceCard({ variant, className, as: Comp = 'div', ...props }) {
  return <Comp className={cn(surfaceCardVariants({ variant }), className)} {...props} />;
}
