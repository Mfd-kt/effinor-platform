import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';
import { CTASection } from '@/components/ds/CTASection';
import { EffinorButton } from '@/components/ds/EffinorButton';
import { trackCtaStudy, trackCtaCallback } from '@/lib/effinorAnalytics';
import { buildLeadFormHref, inferProjectFromRealisationCategory, LEAD_FORM_PATH } from '@/lib/leadFormDestination';

const BY_CATEGORY = {
  pac: {
    title: 'Vous avez un site comparable à optimiser en chauffage ?',
    description:
      'Décrivez votre bâtiment : nous revenons avec une faisabilité, un ordre de grandeur et les leviers CEE possibles.',
    button_label: 'Demander une étude gratuite',
  },
  'pompe à chaleur': {
    title: 'Vous avez un site comparable à optimiser en chauffage ?',
    description:
      'Décrivez votre bâtiment : nous revenons avec une faisabilité, un ordre de grandeur et les leviers CEE possibles.',
    button_label: 'Demander une étude gratuite',
  },
  déstratification: {
    title: 'Un entrepôt ou hall à stratification à traiter ?',
    description:
      'Nous analysons votre volume, vos usages et le potentiel de récupération de chaleur avant toute décision.',
    button_label: 'Parler à un expert',
  },
  destratification: {
    title: 'Un entrepôt ou hall à stratification à traiter ?',
    description:
      'Nous analysons votre volume, vos usages et le potentiel de récupération de chaleur avant toute décision.',
    button_label: 'Parler à un expert',
  },
  cee: {
    title: 'Votre projet est-il éligible aux CEE ?',
    description:
      'Nous vérifions l’éligibilité et vous aidons à structurer le dossier pour sécuriser le financement.',
    button_label: 'Vérifier mon éligibilité',
  },
};

const GLOBAL_DEFAULT = {
  title: 'Un bâtiment similaire à optimiser ?',
  description:
    'Réponse sous 24 h ouvrées — étude adaptée à votre site — sans engagement.',
  button_label: 'Demander une étude gratuite',
};

export function RealisationCTA({ cta = {}, category = '', sector = '', slug = '' }) {
  const { pathname } = useLocation();
  const key = (category || '').toLowerCase();
  const fallback = BY_CATEGORY[key] || GLOBAL_DEFAULT;

  const title       = cta.title        || fallback.title;
  const description = cta.description  || fallback.description;
  const btnLabel    = cta.button_label || fallback.button_label;
  const customLink  = cta.button_link;

  const source = sector ? `realisation_${String(sector).slice(0, 24)}` : 'realisation_detail';
  const project = inferProjectFromRealisationCategory(category);

  const btnHref = useMemo(() => {
    if (
      customLink &&
      customLink !== '/contact' &&
      customLink !== LEAD_FORM_PATH &&
      !customLink.startsWith('/contact?') &&
      !customLink.startsWith(`${LEAD_FORM_PATH}?`)
    ) {
      return customLink;
    }
    return buildLeadFormHref({
      source,
      project,
      cta: 'realisation_bottom',
      page: pathname,
      slug: slug || '',
      category: category || '',
    });
  }, [customLink, source, project, pathname, slug, category]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="my-8 md:my-10"
    >
      <CTASection
        variant="darkGradient"
        className="rounded-2xl shadow-xl"
        maxWidth="none"
        innerClassName="!py-8 md:!py-10 max-w-2xl mx-auto px-4 sm:px-6"
        title={title}
        description={description}
        footer={
          <>
            ✔ Projets industriels & tertiaires &nbsp;·&nbsp; ✔ Étude terrain &nbsp;·&nbsp; ✔ Accompagnement CEE
          </>
        }
      >
        <div className="flex w-full flex-col justify-center gap-4 sm:flex-row">
          <EffinorButton
            to={btnHref}
            variant="onDarkSolid"
            size="md"
            className="rounded-xl text-sm"
            onClick={() =>
              trackCtaStudy({ effinor_source: source, effinor_cta_location: 'realisation_bottom' })
            }
          >
            {btnLabel}
            <ArrowRight className="h-4 w-4" />
          </EffinorButton>
          <EffinorButton
            href="tel:+33978455063"
            variant="inverse"
            size="md"
            className="rounded-xl text-sm"
            onClick={() =>
              trackCtaCallback({ effinor_source: source, effinor_cta_location: 'realisation_bottom' })
            }
          >
            <Phone className="h-4 w-4" />
            09 78 45 50 63
          </EffinorButton>
        </div>
      </CTASection>
    </motion.div>
  );
}

export default RealisationCTA;
