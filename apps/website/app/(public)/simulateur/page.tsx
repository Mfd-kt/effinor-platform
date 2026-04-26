import type { Metadata } from 'next'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'

import { Simulator } from '@/components/simulator/simulator'
import { getSiteContact } from '@/lib/site-settings'
import { siteConfig } from '@/lib/site-config'

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Simulateur d'aides CEE — Estimez vos primes en 2 minutes",
  description:
    "Répondez à 6 questions et recevez une estimation personnalisée des aides CEE et MaPrimeRénov' pour votre projet de rénovation énergétique. Gratuit, sans engagement.",
  alternates: { canonical: `${siteConfig.url}/simulateur` },
  openGraph: {
    title: "Simulateur d'aides CEE — Effinor",
    description:
      'Estimez vos primes CEE et MaPrimeRénov’ en 2 minutes. 6 questions, résultat personnalisé, rappel sous 24h.',
    url: `${siteConfig.url}/simulateur`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Simulateur d'aides CEE — Effinor",
    description:
      'Estimez vos primes CEE et MaPrimeRénov’ en 2 minutes. Réponse sous 24h.',
  },
}

export default async function SimulateurPage() {
  const contact = await getSiteContact()

  return (
    <Section spacing="lg" className="bg-gradient-to-b from-primary-50 to-background">
      <Container size="hero">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary-200 bg-secondary-50 px-3 py-1.5 text-xs font-semibold text-secondary-700">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Gratuit &amp; sans engagement
          </span>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl lg:text-5xl">
            Combien d&apos;aides pouvez-vous obtenir ?
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Répondez à 6 questions et recevez une estimation personnalisée des primes CEE
            et MaPrimeRénov&apos;. Un conseiller Effinor vous recontacte sous 24h.
          </p>

          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground sm:text-sm">
            <li className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent-500" aria-hidden="true" />
              2 minutes
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent-500" aria-hidden="true" />
              RGE QualiPAC
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent-500" aria-hidden="true" />
              Données en France
            </li>
          </ul>
        </div>

        <div className="mt-10">
          <Simulator contact={contact} />
        </div>
      </Container>
    </Section>
  )
}
