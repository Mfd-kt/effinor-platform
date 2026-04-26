import Link from 'next/link'
import { ArrowRight, Phone, ShieldCheck, Sparkles } from 'lucide-react'
import { Button, Container } from '@effinor/design-system'

import { landingConfig } from '@/lib/site-config'

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white">
      <div
        aria-hidden="true"
        className="absolute -top-40 -right-40 -z-0 h-[500px] w-[500px] rounded-full bg-secondary-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-40 -z-0 h-[500px] w-[500px] rounded-full bg-accent-500/10 blur-3xl"
      />

      <Container size="site">
        <div className="relative z-10 mx-auto max-w-3xl py-16 text-center sm:py-20 lg:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-secondary-200 backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Certifié RGE QualiPAC · Délégataire CEE
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Chauffez votre maison avec une{' '}
            <span className="text-secondary-300">pompe à chaleur air-eau</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-primary-100 sm:text-lg">
            Économisez jusqu&apos;à <strong className="font-semibold text-white">75 %</strong>{' '}
            sur votre facture de chauffage. Bénéficiez de jusqu&apos;à{' '}
            <strong className="font-semibold text-white">11 000 €</strong> d&apos;aides
            de l&apos;État (CEE + MaPrimeRénov&apos;).
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              variant="accent"
              size="lg"
              className="group shadow-lg shadow-accent-500/30"
            >
              <Link href="#simulateur">
                Estimer mes aides
                <ArrowRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <a href={`tel:${landingConfig.contact.phoneE164}`}>
                <Phone className="mr-1 h-4 w-4" aria-hidden="true" />
                {landingConfig.contact.phone}
              </a>
            </Button>
          </div>

          <ul className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-100">
            <li className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
              Étude gratuite
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
              Sans engagement
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
              Devis sous 48h
            </li>
          </ul>
        </div>
      </Container>
    </section>
  )
}
