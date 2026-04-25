import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Phone, ShieldCheck, Star } from 'lucide-react'
import { Button, Container } from '@effinor/design-system'
import { siteConfig } from '@/lib/site-config'

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-primary-900 text-white">
      {/* Image de fond */}
      <Image
        src="/images/hero-residence.png"
        alt=""
        fill
        priority
        className="object-cover object-center -z-10"
        sizes="100vw"
        aria-hidden="true"
      />

      {/* Overlay : dégradé sombre côté texte, plus léger côté droit pour laisser respirer l'image */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-900/95 via-primary-900/80 to-primary-900/30"
        aria-hidden="true"
      />
      {/* Vignette top/bottom pour adoucir les transitions */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-900/40 via-transparent to-primary-900/60"
        aria-hidden="true"
      />

      <Container size="site">
        <div className="py-20 sm:py-24 lg:py-32 max-w-2xl">
          {/* Eyebrow / trust chip */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-secondary-300" />
            Certifié RGE QualiPAC · Délégataire CEE
          </div>

          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Rénovez.{' '}
            <span className="text-secondary-300">Économisez.</span>{' '}
            Profitez des aides.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-100 sm:text-lg">
            Pompe à chaleur, système solaire combiné, rénovation globale —
            Effinor gère votre projet de A à Z et maximise vos aides
            (CEE, MaPrimeRénov&apos;, éco-PTZ).
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="accent" size="lg" className="group">
              <Link href="/contact">
                Obtenir une étude gratuite
                <ArrowRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/40 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
            >
              <Link href="/services">Découvrir nos services</Link>
            </Button>
          </div>

          {/* Strip téléphone + reassurance */}
          <div className="mt-10 flex flex-col gap-4 text-sm text-primary-100 sm:flex-row sm:items-center sm:gap-8">
            <a
              href={`tel:${siteConfig.contact.phoneE164}`}
              className="group inline-flex items-center gap-2.5 font-medium text-white hover:text-secondary-300 transition-colors"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm group-hover:bg-secondary-500/20">
                <Phone className="h-4 w-4 text-secondary-300" />
              </span>
              <span>
                {siteConfig.contact.phone}
                <span className="ml-1 font-normal text-primary-200">
                  · {siteConfig.contact.hours.label}
                </span>
              </span>
            </a>

            <div className="flex items-center gap-1.5">
              <div className="flex" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-accent-400 text-accent-400"
                  />
                ))}
              </div>
              <span className="font-medium text-white">4.7/5</span>
              <span className="text-primary-200">· 2 500+ chantiers</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
