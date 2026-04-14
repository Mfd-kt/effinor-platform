import React from 'react';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/ds/PageContainer';

/**
 * Bloc CTA marketing unifié (fond sombre ou clair, double action, micro-réassurance).
 */
export function CTASection({
  variant = 'dark',
  title,
  description,
  children,
  footer,
  className,
  innerClassName,
  maxWidth = 'site',
}) {
  const isDark = variant === 'dark' || variant === 'darkGradient';

  return (
    <section
      className={cn(
        variant === 'dark' && 'bg-primary-900 text-white effinor-dark-context',
        variant === 'darkGradient' &&
          'bg-gradient-to-br from-primary-900 to-primary-700 text-white effinor-dark-context',
        variant === 'light' && 'bg-white border border-gray-200 text-gray-900',
        className,
      )}
      aria-label="Appel à l'action"
    >
      <PageContainer
        maxWidth={maxWidth}
        className={cn('py-8 md:py-10 lg:py-12 text-center', innerClassName)}
      >
        {title != null && (
          <h2
            className={cn(
              'heading-section md:text-2xl lg:text-3xl mb-3',
              isDark && 'text-white',
              variant === 'light' && 'text-gray-900',
            )}
          >
            {title}
          </h2>
        )}
        {description != null && (
          <p
            className={cn(
              'text-sm md:text-base max-w-2xl mx-auto mb-6 md:mb-8 leading-relaxed',
              isDark && 'text-white/80',
              variant === 'light' && 'text-gray-600',
            )}
          >
            {description}
          </p>
        )}
        {children}
        {footer != null ? (
          <div
            className={cn(
              'mt-5 text-xs',
              isDark && 'text-white/50',
              variant === 'light' && 'text-gray-500',
            )}
          >
            {footer}
          </div>
        ) : null}
      </PageContainer>
    </section>
  );
}
