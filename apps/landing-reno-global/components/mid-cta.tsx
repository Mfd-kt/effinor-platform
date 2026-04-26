import { ArrowRight, Phone, Sparkles } from 'lucide-react'
import { Button, Container, Section } from '@effinor/design-system'

import { landingConfig } from '@/lib/site-config'

export function MidCta() {
  return (
    <Section
      spacing="sm"
      className="bg-gradient-to-r from-accent-500 via-accent-500 to-accent-600 text-white"
    >
      <Container size="site">
        <div className="flex flex-col items-center gap-6 py-4 text-center lg:flex-row lg:justify-between lg:text-left">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-50">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Passez à l&apos;action
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Transformez votre maison, ne payez (presque) rien
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-accent-50 sm:text-base">
              Audit énergétique offert. Aides CEE + MaPrimeRénov&apos; déduites. 0 € à
              avancer pour les ménages très modestes et modestes.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              variant="primary"
              size="lg"
              className="bg-white text-accent-700 hover:bg-accent-50"
            >
              <a href="#simulateur">
                Estimer mes aides
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <a href={`tel:${landingConfig.contact.phoneE164}`}>
                <Phone className="mr-1 h-4 w-4" aria-hidden="true" />
                {landingConfig.contact.phone}
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  )
}
