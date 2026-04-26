import { ArrowRight, Clock, Phone, ShieldCheck } from 'lucide-react'
import { Button, Container, Section } from '@effinor/design-system'

import { landingConfig } from '@/lib/site-config'

export function FinalCta() {
  return (
    <Section
      spacing="lg"
      className="relative isolate overflow-hidden bg-primary-900 text-white"
    >
      <div
        aria-hidden="true"
        className="absolute -left-24 top-1/2 -z-10 h-96 w-96 -translate-y-1/2 rounded-full bg-secondary-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 top-1/2 -z-10 h-96 w-96 -translate-y-1/2 rounded-full bg-accent-500/15 blur-3xl"
      />

      <Container size="site">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-300">
            Dernière étape
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Audit gratuit sous 24 h
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-100 sm:text-lg">
            6 questions pour estimer votre éligibilité BAR-TH-174. Un conseiller Effinor
            vous recontacte sous 24 h ouvrées pour planifier l&apos;audit énergétique.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="accent" size="lg">
              <a href="#simulateur">
                Estimer mes aides
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </a>
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

          <ul className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-primary-100 sm:text-sm">
            <li className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-secondary-300" aria-hidden="true" />
              {landingConfig.contact.hours}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary-300" aria-hidden="true" />
              Données en France, RGPD conforme
            </li>
          </ul>
        </div>
      </Container>
    </Section>
  )
}
