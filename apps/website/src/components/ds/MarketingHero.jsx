import React from 'react';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/ds/PageContainer';

/**
 * Hero marketing réutilisable (offres, blog, contact, etc.).
 * Combine fond + contexte sombre + hiérarchie typo DS.
 *
 * @param {'home'|'page'|'blog'|'article'} titleVariant — classe heading-hero | heading-page
 * @param {'center'|'left'} align
 */
export function MarketingHero({
  children,
  className,
  innerClassName,
  titleVariant = 'page',
  align = 'center',
  eyebrow,
  title,
  description,
  actions,
  /** Contenu au-dessus du titre (ex. fil d’Ariane) */
  beforeTitle,
  maxWidth = 'hero',
  as: Comp = 'header',
  ...rest
}) {
  const titleCls =
    titleVariant === 'home'
      ? 'heading-hero'
      : titleVariant === 'blog'
        ? cn('heading-page', 'text-4xl sm:text-5xl md:text-6xl')
        : titleVariant === 'article'
          ? cn('heading-page', 'text-3xl sm:text-4xl md:text-5xl')
          : 'heading-page';

  const alignCls =
    align === 'center' ? 'text-center flex flex-col items-center' : 'text-left';

  return (
    <Comp className={cn(className)} {...rest}>
      <PageContainer maxWidth={maxWidth} className={cn(alignCls, innerClassName)}>
        {beforeTitle}
        {eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
        {title != null ? <h1 className={cn(titleCls, 'mb-4')}>{title}</h1> : null}
        {description ? (
          <p
            className={cn(
              'text-body max-w-2xl',
              align === 'center' && 'mx-auto',
              'mb-5 md:mb-6',
            )}
          >
            {description}
          </p>
        ) : null}
        {actions ? <div className={cn('flex flex-col sm:flex-row gap-3', align === 'center' && 'justify-center')}>{actions}</div> : null}
        {children}
      </PageContainer>
    </Comp>
  );
}
