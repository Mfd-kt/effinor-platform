import Link from 'next/link'
import { BadgeCheck, Phone, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { Button, Container } from '@effinor/design-system'

import { Simulator } from '@/components/simulator/simulator'
import { landingConfig } from '@/lib/site-config'

const REASSURE = [
  'Audit énergétique inclus',
  '2 sauts de classe DPE minimum',
  'Dossier géré de A à Z',
  'Aides déduites du devis',
]

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-background to-secondary-50/40"
      />
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 -z-10 h-[460px] w-[460px] rounded-full bg-secondary-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -left-32 -z-10 h-[460px] w-[460px] rounded-full bg-primary-200/30 blur-3xl"
      />

      <Container size="site">
        <div className="grid grid-cols-1 gap-10 py-10 lg:grid-cols-12 lg:gap-12 lg:py-16">
          {/* COLONNE GAUCHE — Contenu */}
          <div className="flex flex-col justify-center lg:col-span-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-secondary-200 bg-secondary-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-secondary-700">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Dispositif BAR-TH-174 · Certifié RGE
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-primary-900 sm:text-5xl lg:text-6xl">
              Rénovez votre maison et économisez{' '}
              <span className="text-accent-600">jusqu&apos;à 90 %</span> grâce aux aides de
              l&apos;État
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Bouquet de travaux complet (isolation, chauffage, VMC) pour gagner{' '}
              <strong className="font-semibold text-foreground">2 classes DPE minimum</strong>.
              Audit énergétique inclus. Aides CEE + MaPrimeRénov&apos; déduites
              directement du devis — vous n&apos;avancez rien.
            </p>

            <ul className="mt-6 grid grid-cols-1 gap-2 text-sm text-foreground sm:grid-cols-2">
              {REASSURE.map((label) => (
                <li key={label} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500/15 text-secondary-700"
                    aria-hidden="true"
                  >
                    <ShieldCheck className="h-3 w-3" />
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4">
              <Button
                asChild
                variant="accent"
                size="lg"
                className="group shadow-lg shadow-accent-500/30"
              >
                <a href="#simulateur">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Estimer mes aides gratuitement
                </a>
              </Button>

              <a
                href={`tel:${landingConfig.contact.phoneE164}`}
                className="group inline-flex items-center gap-3 text-sm text-foreground"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/10 text-primary-700 transition-colors group-hover:bg-primary-500 group-hover:text-white">
                  <Phone className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-semibold leading-tight">
                    {landingConfig.contact.phone}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {landingConfig.contact.hours}
                  </span>
                </span>
              </a>
            </div>

            <div className="mt-6 flex items-center gap-2.5 text-sm text-muted-foreground">
              <div className="flex" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent-500 text-accent-500" />
                ))}
              </div>
              <span>
                <strong className="font-semibold text-foreground">4,7 / 5</strong> — plus de
                2 500 foyers rénovés en France
              </span>
            </div>

            <div className="mt-4 hidden items-center gap-3 text-xs text-muted-foreground lg:flex">
              <Link
                href={landingConfig.mainSiteUrl}
                className="hover:text-foreground hover:underline"
                rel="noopener"
              >
                Découvrir Effinor
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                href={`${landingConfig.mainSiteUrl}/realisations`}
                className="hover:text-foreground hover:underline"
                rel="noopener"
              >
                Nos chantiers
              </Link>
            </div>
          </div>

          {/* COLONNE DROITE — Simulateur */}
          <div className="relative lg:col-span-6" id="simulateur">
            <div className="mb-3 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent-800">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Simulateur gratuit · 2 min
              </span>
              <h2 className="mt-3 text-xl font-bold tracking-tight text-primary-900 sm:text-2xl">
                Combien d&apos;aides pour vos travaux ?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                6 questions. Résultat personnalisé et rappel sous 24 h.
              </p>
            </div>
            <Simulator
              contact={{
                phone: landingConfig.contact.phone,
                phoneE164: landingConfig.contact.phoneE164,
                email: landingConfig.contact.email,
              }}
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
