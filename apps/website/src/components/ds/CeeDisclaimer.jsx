import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Mention prudente sur le financement CEE (éligibilité, fiches, étude).
 * variant boxed : encadré ; inline : une ligne sous un CTA.
 */
export function CeeDisclaimer({ className = '', variant = 'inline' }) {
  const text = (
    <>
      Toute aide CEE dépend de l&apos;éligibilité du projet, des fiches en vigueur et d&apos;une analyse — pas d&apos;engagement sur un montant sans étude.{' '}
      <Link to="/cee" className="font-medium text-primary-700 underline decoration-primary-400/60 underline-offset-2 hover:text-primary-800">
        En savoir plus sur les CEE
      </Link>
    </>
  );

  if (variant === 'boxed') {
    return (
      <aside
        className={cn(
          'rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-left text-xs leading-relaxed text-amber-950/90 md:text-sm',
          className,
        )}
        role="note"
      >
        {text}
      </aside>
    );
  }

  return (
    <p className={cn('text-xs leading-relaxed text-white/60 md:text-sm [&_a]:text-secondary-300 [&_a]:hover:text-white', className)} role="note">
      {text}
    </p>
  );
}

export default CeeDisclaimer;
