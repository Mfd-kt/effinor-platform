import type { Metadata } from 'next'
import { Hero } from '@/components/sections/hero'
import { TrustBar } from '@/components/sections/trust-bar'
import { ServicesGrid } from '@/components/sections/services-grid'
import { WhyEffinor } from '@/components/sections/why-effinor'
import { HowItWorks } from '@/components/sections/how-it-works'
import { PartnersBar } from '@/components/sections/partners-bar'
import { AidesInfo } from '@/components/sections/aides-info'
import { Testimonials } from '@/components/sections/testimonials'
import { FinalCTA } from '@/components/sections/final-cta'
import { JsonLdFaqHome } from '@/components/seo/json-ld-faq-home'
import { siteConfig } from '@/lib/site-config'

const homeUrl = siteConfig.url.replace(/\/$/, '')

/**
 * Métadonnées dédiées accueil (SEO / partages) — complètent le layout racine.
 */
export const metadata: Metadata = {
  title: {
    absolute: "Rénovation énergétique : aides CEE, MaPrimeRénov' & simulateur | Effinor",
  },
  description:
    "Estimez vos primes en 2 min : pompe à chaleur, solaire, rénovation globale BAR-TH-174. Délégataire CEE, RGE QualiPAC, accompagnement de A à Z. Étude gratuite, Thiais et toute la France.",
  openGraph: {
    url: `${homeUrl}/`,
    title: "Rénovation énergétique financée | Simulateur d'aides — Effinor",
    description:
      "Jusqu'à 90% de prises en charge possibles. Simulateur CEE & MaPrimeRénov', équipes RGE, devis personnalisé.",
    type: 'website',
  },
  twitter: {
    title: "Effinor — Aides rénovation & simulateur 2 min",
    description:
      "Pompe à chaleur, solaire, rénovation globale. CEE, MaPrimeRénov', éco-PTZ — estimez vos droits en ligne.",
  },
  alternates: {
    canonical: `${homeUrl}/`,
  },
  keywords: [
    'aides rénovation énergétique',
    "simulateur MaPrimeRénov'",
    'CEE 2026',
    'délégataire CEE',
    'RGE QualiPAC',
    'pompe à chaleur aides',
  ],
}

export default function HomePage() {
  return (
    <>
      <JsonLdFaqHome />
      {/* Hero avec simulateur intégré à droite (capture directe). */}
      <Hero />
      <TrustBar />
      <ServicesGrid />
      <WhyEffinor />
      <HowItWorks />
      <PartnersBar />
      <AidesInfo />
      <Testimonials />
      <FinalCTA />
    </>
  )
}
