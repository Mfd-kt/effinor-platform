import Image from 'next/image'
import Link from 'next/link'
import { Phone, Sparkles, Star } from 'lucide-react'
import { Button, Container } from '@effinor/design-system'

import { Simulator } from '@/components/simulator/simulator'
import { BLUR_PLACEHOLDERS } from '@/lib/blur-placeholders'
import { getSiteContact, getSiteStats } from '@/lib/site-settings'

const HERO_IMAGE = '/images/hero-residence.png'

export async function Hero() {
  const contact = await getSiteContact()
  const stats = await getSiteStats()
  return (
    <section className="relative isolate overflow-hidden bg-background">
      {/* Background décoratif : dégradé subtil + cercles flous */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-background to-secondary-50/30"
      />
      <div
        aria-hidden="true"
        className="absolute -top-40 -right-40 -z-10 h-[500px] w-[500px] rounded-full bg-secondary-200/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-40 -z-10 h-[500px] w-[500px] rounded-full bg-accent-200/15 blur-3xl"
      />

      <Container size="site">
        <div className="grid grid-cols-1 gap-8 py-8 lg:grid-cols-12 lg:gap-10 lg:py-14">
          {/* COLONNE GAUCHE — Contenu */}
          <div className="flex flex-col justify-center lg:col-span-6">
            {/* Eyebrow chip */}
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-secondary-200 bg-secondary-50 px-3 py-1.5 text-xs font-semibold text-secondary-700">
              <Sparkles className="h-3.5 w-3.5" />
              Certifié RGE QualiPAC · Délégataire CEE
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-primary-900 sm:text-5xl lg:text-6xl">
              Votre rénovation énergétique,{' '}
              <span className="relative whitespace-nowrap">
                <span className="relative text-secondary-600">
                  financée jusqu&apos;à 90%
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 418 42"
                  className="absolute left-0 top-full -mt-1 h-3 w-full fill-secondary-300/40"
                  preserveAspectRatio="none"
                >
                  <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Pompe à chaleur, système solaire combiné, rénovation globale —
              Effinor gère votre projet de A à Z et maximise vos aides
              <strong className="font-semibold text-foreground"> CEE, MaPrimeRénov&apos;, éco-PTZ</strong>.
            </p>

            <div className="relative mt-6 aspect-[16/9] w-full max-w-xl overflow-hidden rounded-2xl shadow-lg ring-1 ring-border/40">
              <Image
                src={HERO_IMAGE}
                alt="Résidence rénovée — isolation et équipements performants"
                fill
                priority
                quality={80}
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDERS.heroResidence}
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="object-cover"
                fetchPriority="high"
              />
            </div>

            {/* Liste de réassurance */}
            <ul className="mt-6 grid grid-cols-1 gap-2 text-sm text-foreground sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-700">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                </span>
                <span>
                  <strong className="font-semibold">11 000 €</strong> d&apos;aides moyennes par projet
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-700">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                </span>
                <span>Étude gratuite &amp; sans engagement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-700">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                </span>
                <span>Garantie décennale · travaux assurés</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-700">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                </span>
                <span>Conseiller dédié · rappel sous 24h</span>
              </li>
            </ul>

            {/* CTA secondaire — "découvrir nos services" */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Button asChild variant="outline" size="md">
                <Link href="/services">Découvrir nos services</Link>
              </Button>

              <a
                href={`tel:${contact.phoneE164}`}
                className="group inline-flex items-center gap-3 text-sm text-foreground"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-700 transition-colors group-hover:bg-secondary-500 group-hover:text-white">
                  <Phone className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-semibold leading-tight">{contact.phone}</span>
                  <span className="block text-xs text-muted-foreground">
                    {contact.hours.label}
                  </span>
                </span>
              </a>
            </div>

            <p className="mt-5 text-center text-[11px] font-serif uppercase tracking-[0.18em] text-muted-foreground sm:text-left">
              <span className="font-medium text-foreground/80">Partenaires installés :</span>{' '}
              <span className="text-foreground/70">
                Daikin · Mitsubishi · Atlantic · Ariston · Panasonic
              </span>
            </p>

            {/* Note confiance */}
            <div className="mt-4 flex items-center gap-2.5 text-sm text-muted-foreground">
              <div className="flex" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-accent-500 text-accent-500"
                  />
                ))}
              </div>
              <span>
                <strong className="font-semibold text-foreground">
                  {stats[2]?.value ?? '4.7/5'}
                </strong>
                {' · '}
                {stats[0]?.value} {stats[0]?.label?.toLowerCase() ?? 'chantiers'}
              </span>
            </div>
          </div>

          {/* COLONNE DROITE — Simulateur CEE (capture directe) */}
          <div className="relative lg:col-span-6" id="simulateur">
            <div className="relative">
              {/* Pastille titre au-dessus du simulateur */}
              <div className="mb-4 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-800">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Simulateur gratuit · 2 minutes
                </span>
                <h2 className="mt-3 text-xl font-bold tracking-tight text-primary-900 sm:text-2xl">
                  Combien d&apos;aides pouvez-vous obtenir ?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  6 questions pour estimer vos primes CEE &amp; MaPrimeRénov&apos;.
                </p>
              </div>
              <Simulator
                contact={{
                  phone: contact.phone,
                  phoneE164: contact.phoneE164,
                  email: contact.email,
                }}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
