import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { trackCtaStudy, trackPhoneClick } from '@/lib/effinorAnalytics';
import { EffinorButton } from '@/components/ds/EffinorButton';
import { CTASection } from '@/components/ds/CTASection';
import { CeeDisclaimer } from '@/components/ds/CeeDisclaimer';
import { buildLeadFormHrefForPage } from '@/lib/leadFormDestination';

const FinalCTA = () => {
  const { pathname } = useLocation();
  const studyHref = buildLeadFormHrefForPage(pathname, { cta: 'final_cta' });

  return (
    <CTASection
      variant="dark"
      className="overflow-x-hidden"
      innerClassName="max-w-[95%] sm:max-w-lg md:max-w-3xl lg:max-w-4xl xl:max-w-5xl"
      title="Un projet PAC ou déstratification à arbitrer cette année ?"
      description={
        <>
          L&apos;étude gratuite cadrera faisabilité, ordre de grandeur économique et pistes de financement — pour décider
          avec des éléments concrets, sans engagement.
        </>
      }
      footer={<CeeDisclaimer />}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 w-full"
      >
        <EffinorButton
          to={studyHref}
          variant="primary"
          size="responsive"
          onClick={() =>
            trackCtaStudy({ effinor_source: 'home', effinor_cta_location: 'final_cta' })
          }
        >
          Lancer mon étude gratuite
          <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
        </EffinorButton>
        <EffinorButton
          href="tel:+33978455063"
          variant="inverse"
          size="responsive"
          onClick={() =>
            trackPhoneClick({ effinor_source: 'home', effinor_cta_location: 'final_cta' })
          }
        >
          <Phone className="h-4 w-4 md:h-5 md:w-5" />
          09 78 45 50 63
        </EffinorButton>
      </motion.div>
    </CTASection>
  );
};

export default FinalCTA;
