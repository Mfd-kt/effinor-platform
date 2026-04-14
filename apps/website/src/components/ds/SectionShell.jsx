import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Enveloppe de section avec padding vertical cohérent (classes DS).
 * @param {'default'|'sm'|'lg'} padding — section-padding | section-padding-sm | section-padding-lg
 */
export function SectionShell({
  children,
  className,
  as: Comp = 'section',
  padding = 'default',
  id,
  ...rest
}) {
  const pad =
    padding === 'sm'
      ? 'section-padding-sm'
      : padding === 'lg'
        ? 'section-padding-lg'
        : 'section-padding';

  return (
    <Comp id={id} className={cn(pad, className)} {...rest}>
      {children}
    </Comp>
  );
}
