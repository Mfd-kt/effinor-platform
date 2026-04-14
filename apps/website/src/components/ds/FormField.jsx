import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Groupe label + control + aide + erreur (formulaires marketing).
 */
export function FormField({
  id,
  label,
  error,
  hint,
  children,
  required,
  className,
  labelClassName,
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label != null && (
        <label
          htmlFor={id}
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium text-gray-700',
            labelClassName,
          )}
        >
          {label}
          {required ? <span className="text-red-400">*</span> : null}
        </label>
      )}
      {children}
      {hint != null ? <p className="text-xs text-gray-500">{hint}</p> : null}
      {error != null ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
