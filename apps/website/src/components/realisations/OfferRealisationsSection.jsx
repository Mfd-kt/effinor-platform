import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageContainer } from '@/components/ds/PageContainer';
import { RealisationCard } from '@/components/realisations/RealisationCard';
import { getPublicRealisations } from '@/lib/api/realisations';
import { realisationMatchesCategoryTokens } from '@/lib/realisationCategoryMatch';

/**
 * Bandeau « réalisations liées » pour pages offres (PAC, déstrat, équilibrage…).
 * Ne s’affiche pas si aucune réalisation ne correspond aux tokens ou si Airtable est vide.
 */
export function OfferRealisationsSection({
  categoryTokens,
  title = 'Réalisations sur cette thématique',
  limit = 2,
  analyticsSource = 'offer',
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const tokensKey = Array.isArray(categoryTokens) ? categoryTokens.join('|') : '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPublicRealisations()
      .then((res) => {
        if (cancelled || !res.success || !res.data?.length) {
          setItems([]);
          return;
        }
        const matched = res.data.filter((r) =>
          realisationMatchesCategoryTokens(r.category, categoryTokens),
        );
        setItems(matched.slice(0, limit));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tokensKey, limit]);

  if (loading || !items.length) return null;

  return (
    <section id="realisations-terrain" className="scroll-mt-24 border-y border-gray-100 bg-slate-50/80 py-10 md:py-12">
      <PageContainer maxWidth="hero" className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="heading-section text-gray-900">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Exemples de projets publiés — dimensions, contexte et résultats à titre illustratif.
            </p>
          </div>
          <Link
            to="/realisations"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800"
          >
            Toutes les réalisations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div
          className={`grid gap-6 ${items.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}
          data-effinor-source={analyticsSource}
        >
          {items.map((r) => (
            <RealisationCard key={r.slug} realisation={r} />
          ))}
        </div>
      </PageContainer>
    </section>
  );
}

export default OfferRealisationsSection;
