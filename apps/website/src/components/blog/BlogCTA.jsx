import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';
import { CTASection } from '@/components/ds/CTASection';
import { EffinorButton } from '@/components/ds/EffinorButton';
import { buildLeadFormHref, inferProjectFromBlogCategory, LEAD_FORM_PATH } from '@/lib/leadFormDestination';

/** Fallbacks par catégorie d'article */
const CATEGORY_DEFAULTS = {
  pac: {
    title:        'Vous envisagez une pompe à chaleur pour votre bâtiment ?',
    description:  'Obtenez une étude personnalisée gratuite et identifiez les économies possibles selon la configuration de votre site.',
    button_label: 'Obtenir mon étude gratuite',
  },
  'pompe à chaleur': {
    title:        'Vous envisagez une pompe à chaleur pour votre bâtiment ?',
    description:  'Obtenez une étude personnalisée gratuite et identifiez les économies possibles selon la configuration de votre site.',
    button_label: 'Obtenir mon étude gratuite',
  },
  déstratification: {
    title:        'Vérifiez si votre site est adapté à la déstratification',
    description:  'Nos experts analysent votre bâtiment et vous indiquent le potentiel de réduction des coûts de chauffage.',
    button_label: 'Analyser mon bâtiment',
  },
  destratification: {
    title:        'Vérifiez si votre site est adapté à la déstratification',
    description:  'Nos experts analysent votre bâtiment et vous indiquent le potentiel de réduction des coûts de chauffage.',
    button_label: 'Analyser mon bâtiment',
  },
  équilibrage: {
    title:        'Améliorez la répartition de chaleur dans votre bâtiment',
    description:  'Un diagnostic terrain pour identifier les déséquilibres et proposer des ajustements mesurables.',
    button_label: 'Demander une étude',
  },
  equilibrage: {
    title:        'Améliorez la répartition de chaleur dans votre bâtiment',
    description:  'Un diagnostic terrain pour identifier les déséquilibres et proposer des ajustements mesurables.',
    button_label: 'Demander une étude',
  },
  cee: {
    title:        'Votre projet est-il éligible aux CEE ?',
    description:  'Effinor étudie votre dossier et vous accompagne dans les démarches de financement CEE.',
    button_label: 'Vérifier mon éligibilité',
  },
};

const GLOBAL_DEFAULT = {
  title:        'Parlez de votre projet à un expert',
  description:  'Réponse sous 24 h ouvrées — étude adaptée à votre bâtiment — sans engagement.',
  button_label: 'Demander une étude',
};

const BlogCTA = ({ cta = {}, category = '', slug = '' }) => {
  const { pathname } = useLocation();
  const fallback = CATEGORY_DEFAULTS[category?.toLowerCase()] || GLOBAL_DEFAULT;

  const title       = cta.title        || fallback.title;
  const description = cta.description  || fallback.description;
  const btnLabel    = cta.button_label || fallback.button_label;
  const customLink  = cta.button_link;

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
    const project = inferProjectFromBlogCategory(category);
    return buildLeadFormHref({
      source: 'blog',
      project,
      cta: 'article_inline',
      page: pathname,
      slug: slug || '',
      category: category || '',
    });
  }, [customLink, category, pathname, slug]);

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
            ✔ Réponse sous 24 h &nbsp;·&nbsp; ✔ Étude technique réelle &nbsp;·&nbsp; ✔ Sans engagement
          </>
        }
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
          <EffinorButton to={btnHref} variant="onDarkSolid" size="md" className="rounded-xl text-sm">
            {btnLabel}
            <ArrowRight className="h-4 w-4" />
          </EffinorButton>
          <EffinorButton href="tel:+33978455063" variant="inverse" size="md" className="rounded-xl text-sm">
            <Phone className="h-4 w-4" />
            09 78 45 50 63
          </EffinorButton>
        </div>
      </CTASection>
    </motion.div>
  );
};

export default BlogCTA;
