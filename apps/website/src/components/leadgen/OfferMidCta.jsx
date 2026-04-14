import React from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { EffinorButton } from '@/components/ds';
import { buildLeadFormHrefForPage } from '@/lib/leadFormDestination';

/**
 * Bandeau CTA intermédiaire (pages offres) — même design system, micro-copy conversion.
 */
const OfferMidCta = ({
  title = 'Besoin d’un arbitrage chiffré pour votre bâtiment ?',
  subtitle = 'Étude gratuite · Sans engagement · Réponse rapide sous réception des éléments',
  primaryLabel = 'Demander une étude gratuite',
  secondaryLabel = 'Être rappelé',
  onPrimary,
  onSecondary,
}) => {
  const { pathname } = useLocation();
  const primaryTo = buildLeadFormHrefForPage(pathname, { cta: 'mid' });
  const secondaryTo = buildLeadFormHrefForPage(pathname, { cta: 'mid_callback' });

  return (
  <div className="rounded-2xl border border-[var(--secondary-500)]/25 bg-gradient-to-br from-[var(--secondary-500)]/8 to-slate-50/80 p-5 md:p-7 text-center shadow-sm">
    <p className="text-base font-semibold text-gray-900 md:text-lg">{title}</p>
    {subtitle ? <p className="mt-2 text-xs md:text-sm text-gray-600">{subtitle}</p> : null}
    <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
      <EffinorButton
        to={primaryTo}
        variant="primary"
        size="md"
        className="rounded-lg justify-center"
        onClick={onPrimary}
      >
        {primaryLabel}
        <ArrowRight className="h-4 w-4" />
      </EffinorButton>
      <EffinorButton
        to={secondaryTo}
        variant="outline"
        size="md"
        className="rounded-lg justify-center border-gray-300"
        onClick={onSecondary}
      >
        {secondaryLabel}
      </EffinorButton>
    </div>
  </div>
  );
};

export default OfferMidCta;
