import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Phone } from 'lucide-react'
import { Button, Container, Section } from '@effinor/design-system'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Demande envoyée',
  description:
    "Votre demande a bien été enregistrée. Notre équipe vous recontacte sous 24h ouvrées.",
  robots: { index: false, follow: false },
}

export default function ThankYouPage() {
  return (
    <Section spacing="xl">
      <Container size="content">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
            <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Demande bien reçue, merci !
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Votre message a été enregistré. Un conseiller Effinor vous recontacte
            sous <strong className="font-semibold text-foreground">24h ouvrées</strong> pour
            faire le point sur votre projet et les aides mobilisables.
          </p>

          <div className="mt-8 rounded-xl border border-border bg-card p-5 text-left sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-700">
              Vous souhaitez avancer plus vite ?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Appelez-nous directement, nous pouvons souvent qualifier votre projet
              en quelques minutes.
            </p>
            <a
              href={`tel:${siteConfig.contact.phoneE164}`}
              className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-secondary-700 hover:text-secondary-800"
            >
              <Phone className="h-5 w-5" />
              {siteConfig.contact.phone}
            </a>
            <p className="mt-1 text-xs text-muted-foreground">
              {siteConfig.contact.hours.label}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild variant="accent" size="md">
              <Link href="/services">
                Découvrir nos services
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="md">
              <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  )
}
