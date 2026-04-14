import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Building2, MapPin } from 'lucide-react';
import BlogImage from '@/components/blog/BlogImage';
import { EffinorButton } from '@/components/ds/EffinorButton';
import { surfaceCardVariants } from '@/components/ds/SurfaceCard';
import { cn } from '@/lib/utils';
import { buildLeadFormHref, buildLeadFormHrefForPage } from '@/lib/leadFormDestination';
import { trackCtaStudy } from '@/lib/effinorAnalytics';

/** Aperçu homepage — objets réalisation Airtable (title, slug, coverImage, category, …). */
const HomeRealisationsPreview = ({ title, subtitle, realisations = [], formCtaHref }) => {
  const { pathname } = useLocation();
  const formHomeRealisations =
    formCtaHref || buildLeadFormHref({ source: 'home', project: 'home', cta: 'realisations', page: '/' });
  const formEmptyState = buildLeadFormHrefForPage(pathname, { cta: 'home_realisations_empty' });
  const list = (realisations || []).filter((r) => r?.slug && r?.title).slice(0, 3);
  const hasData = list.length > 0;

  return (
    <section className="border-y border-gray-100 bg-gray-50 py-8 md:py-12" aria-labelledby="home-realisations-heading">
      <div className="container mx-auto max-w-7xl px-3 md:px-4">
        <div className="mx-auto max-w-[95%] sm:max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl">
          <header className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2
                id="home-realisations-heading"
                className="text-xl font-bold text-gray-900 md:text-2xl lg:text-3xl"
              >
                {title || 'Quelques réalisations terrain'}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-600 md:text-base">
                {subtitle ||
                  'PAC, déstratification, équilibrage : des projets concrets pour des bâtiments professionnels et collectifs — avec un œil sur le confort, la facture et les leviers CEE.'}
              </p>
            </div>
            <Link
              to="/realisations"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              Voir toutes les réalisations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </header>

          {hasData ? (
            <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {list.map((r) => (
                <article
                  key={r.id || r.slug}
                  className={cn(
                    surfaceCardVariants({ variant: 'elevated' }),
                    'flex flex-col overflow-hidden transition-shadow hover:shadow-lg',
                  )}
                >
                  <Link to={`/realisations/${r.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-gray-100">
                    <BlogImage
                      coverImage={r.coverImage}
                      title={r.title}
                      category={r.category}
                      variant="card"
                      imgClassName="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {r.category ? (
                      <span className="absolute left-3 top-3 rounded-full bg-primary-900/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {r.category}
                      </span>
                    ) : null}
                  </Link>
                  <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      {r.sector ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary-500/10 px-2 py-0.5 font-medium text-secondary-800">
                          <Building2 className="h-3 w-3" />
                          {r.sector}
                        </span>
                      ) : null}
                      {r.city ? (
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {r.city}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-900">
                      <Link
                        to={`/realisations/${r.slug}`}
                        className="hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2"
                      >
                        {r.title}
                      </Link>
                    </h3>
                    {r.excerpt ? (
                      <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-gray-600">{r.excerpt}</p>
                    ) : null}
                    <EffinorButton
                      to={`/realisations/${r.slug}`}
                      variant="outline"
                      size="sm"
                      className="mt-1 w-full sm:w-auto"
                    >
                      Voir la réalisation
                      <ArrowRight className="h-4 w-4" />
                    </EffinorButton>
                  </div>
                </article>
              ))}
            </div>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <EffinorButton
                  to={formHomeRealisations}
                  variant="primary"
                  size="md"
                  className="rounded-lg"
                  onClick={() =>
                    trackCtaStudy({ effinor_source: 'home', effinor_cta_location: 'home_realisations_block' })
                  }
                >
                  Analyse sur un bâtiment comparable
                  <ArrowRight className="h-4 w-4" />
                </EffinorButton>
                <Link to="/realisations" className="text-sm font-medium text-primary-700 hover:underline">
                  Voir toutes les réalisations
                </Link>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
              <p className="text-sm text-gray-600">
                Les études de cas publiées dans Airtable apparaîtront ici automatiquement.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                En attendant, explorez le{' '}
                <Link to="/blog" className="font-medium text-primary-700 hover:underline">
                  blog
                </Link>{' '}
                ou{' '}
                <Link to={formEmptyState} className="font-medium text-primary-700 hover:underline">
                  demandez une étude gratuite
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeRealisationsPreview;
