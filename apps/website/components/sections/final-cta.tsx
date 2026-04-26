import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { Button, Container } from '@effinor/design-system'
import { getSiteContact } from '@/lib/site-settings'

export async function FinalCTA() {
  const contact = await getSiteContact()
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="relative isolate overflow-hidden bg-primary-900 text-white"
    >
      <div
        className="absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-secondary-500/10 blur-3xl" />
        <div className="absolute -right-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-accent-500/10 blur-3xl" />
      </div>

      <Container size="site">
        <div className="pt-9 pb-safe text-center sm:pt-10 lg:pt-11">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-300">
            Prêt à passer à l&apos;action ?
          </p>
          <h2
            id="final-cta-heading"
            className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            Estimez vos aides en 2 minutes
          </h2>
          <p className="mt-4 text-lg text-primary-100 max-w-content mx-auto">
            Étude gratuite et sans engagement. Devis personnalisé sous 48h.
            Notre équipe vous accompagne du diagnostic au versement de vos primes.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="accent" size="lg">
              <Link href="/contact">
                Démarrer mon projet
                <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <a href={`tel:${contact.phoneE164}`}>
                <Phone className="mr-1" />
                {contact.phone}
              </a>
            </Button>
          </div>

          <p className="mt-4 text-sm text-primary-200">
            {contact.hours.label} ·{' '}
            <a
              href={`mailto:${contact.email}`}
              className="underline-offset-2 hover:underline"
            >
              {contact.email}
            </a>
          </p>
        </div>
      </Container>
    </section>
  )
}
