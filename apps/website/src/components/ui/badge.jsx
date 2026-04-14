import React from 'react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-blue-500 text-primary-foreground shadow',
        secondary: 'border-transparent bg-gray-200 text-secondary-foreground',
        destructive: 'border-transparent bg-red-600 text-destructive-foreground shadow',
        success: 'border-transparent bg-green-600 text-primary-foreground shadow',
        outline: 'text-foreground',
        admin: 'border-transparent bg-red-100 text-red-800',
        commercial: 'border-transparent bg-blue-100 text-blue-800',
        support: 'border-transparent bg-purple-100 text-purple-800',
        viewer: 'border-transparent bg-gray-200 text-gray-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Badge = ({ className, variant, ...props }) => {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
};

export { Badge, badgeVariants };