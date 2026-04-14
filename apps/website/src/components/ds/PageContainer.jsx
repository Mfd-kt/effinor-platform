import React from 'react';
import { cn } from '@/lib/utils';

const maxWidthClass = {
  site: 'mx-auto w-full max-w-effinorSite px-4 sm:px-6',
  content: 'mx-auto w-full max-w-effinorContent px-4 sm:px-6',
  readable: 'mx-auto w-full max-w-effinorReadable px-4 sm:px-6',
  hero: 'mx-auto w-full max-w-effinorHero px-4 sm:px-6',
  /** Container Tailwind (padding + breakpoints du theme) */
  container: 'container mx-auto',
  none: 'mx-auto w-full px-4 sm:px-6',
};

/**
 * Largeur de page marketing alignée sur les tokens Tailwind `max-w-effinor*`.
 */
export function PageContainer({
  children,
  className,
  maxWidth = 'site',
  as: Comp = 'div',
}) {
  const base = maxWidthClass[maxWidth] ?? maxWidthClass.site;
  return <Comp className={cn(base, className)}>{children}</Comp>;
}
