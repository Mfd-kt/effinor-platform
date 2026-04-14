import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Building2 } from 'lucide-react';
import { surfaceCardVariants } from '@/components/ds/SurfaceCard';
import BlogImage from '@/components/blog/BlogImage';
import { EffinorButton } from '@/components/ds/EffinorButton';
import { cn } from '@/lib/utils';
import { trackCtaStudy } from '@/lib/effinorAnalytics';
import { buildLeadFormHref, inferProjectFromRealisationCategory } from '@/lib/leadFormDestination';

export function RealisationCard({ realisation }) {
  const { title, slug, excerpt, category, sector, city, coverImage } = realisation;

  const studyHref = buildLeadFormHref({
    source: 'realisations',
    project: inferProjectFromRealisationCategory(category),
    cta: 'card',
    page: '/realisations',
    slug: slug || '',
    category: category || '',
  });

  return (
    <article
      className={cn(surfaceCardVariants({ variant: 'elevated' }), 'group flex flex-col overflow-hidden')}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 sm:aspect-video">
        <BlogImage
          coverImage={coverImage}
          title={title}
          category={category}
          variant="card"
          imgClassName="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {category ? (
          <span className="absolute left-3 top-3 rounded-full bg-primary-900/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {category}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {sector ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary-500/10 px-2 py-0.5 font-medium text-secondary-800">
              <Building2 className="h-3 w-3" />
              {sector}
            </span>
          ) : null}
          {city ? (
            <span className="inline-flex items-center gap-1 text-gray-600">
              <MapPin className="h-3 w-3" />
              {city}
            </span>
          ) : null}
        </div>

        <h2 className="line-clamp-2 text-lg font-bold leading-snug text-gray-900 group-hover:text-primary-700">
          <Link to={`/realisations/${slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2">
            {title}
          </Link>
        </h2>

        {excerpt ? (
          <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">{excerpt}</p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
          <EffinorButton to={`/realisations/${slug}`} variant="outline" size="sm" className="flex-1 sm:flex-1">
            Voir la réalisation
            <ArrowRight className="h-4 w-4" />
          </EffinorButton>
          <EffinorButton
            to={studyHref}
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() =>
              trackCtaStudy({ effinor_source: 'realisations', effinor_cta_location: 'realisation_card' })
            }
          >
            Étudier mon site
          </EffinorButton>
        </div>
      </div>
    </article>
  );
}

export default RealisationCard;
