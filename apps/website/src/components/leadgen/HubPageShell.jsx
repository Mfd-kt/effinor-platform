import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SEOStandardMeta from '@/components/SEOStandardMeta';
import { inferEffinorSourceFromPath, trackCtaCallback, trackCtaStudy } from '@/lib/effinorAnalytics';
import { buildLeadFormHrefForPage, LEAD_FORM_PATH } from '@/lib/leadFormDestination';

/**
 * Coque commune pour les pages hub PAC / déstratification (lead-gen CEE).
 */
const HubPageShell = ({
  title,
  description,
  keywords = '',
  children,
  ctaLabel = 'Vérifier mon éligibilité CEE',
  ctaTo = '/contact',
}) => {
  const location = useLocation();
  const src = inferEffinorSourceFromPath(location.pathname);

  const primaryHref = useMemo(() => {
    if (ctaTo && ctaTo !== '/contact' && ctaTo !== LEAD_FORM_PATH && !ctaTo.startsWith(`${LEAD_FORM_PATH}?`)) {
      return ctaTo;
    }
    return buildLeadFormHrefForPage(location.pathname, { cta: 'hub_shell' });
  }, [ctaTo, location.pathname]);

  const rappelHref = useMemo(
    () => buildLeadFormHrefForPage(location.pathname, { cta: 'callback' }),
    [location.pathname],
  );

  return (
    <>
      <SEOStandardMeta
        title={title}
        description={description}
        pathname={location.pathname}
        keywords={keywords}
      />
      <div className="bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 py-10 md:py-14 max-w-4xl">
          {children}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={primaryHref}
              onClick={() => trackCtaStudy({ effinor_source: src, effinor_cta_location: 'hub_shell' })}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--secondary-500)] text-white font-semibold px-6 py-3 hover:bg-[var(--secondary-600)] transition-colors"
            >
              {ctaLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to={rappelHref}
              onClick={() => trackCtaCallback({ effinor_source: src, effinor_cta_location: 'hub_shell' })}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white font-semibold px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              Être rappelé
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default HubPageShell;
