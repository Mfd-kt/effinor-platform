import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { Button } from '@effinor/design-system'
import { siteConfig } from '@/lib/site-config'

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <Image
        src="/images/hero-residence.png"
        alt="Résidence rénovée par Effinor"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 via-primary-900/75 to-primary-900/40" />

      <div className="relative z-10 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Rénovez.{' '}
              <span className="text-emerald-400">Économisez.</span>{' '}
              Profitez des aides.
            </h1>

            <p className="text-lg sm:text-xl text-white/85 mb-10 leading-relaxed">
              Pompe à chaleur, système solaire combiné, rénovation globale —
              Effinor gère votre projet de A à Z et maximise vos aides (CEE,
              MaPrimeRénov&apos;, éco-PTZ).
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="group">
                <Link href="/contact">
                  Obtenir une étude gratuite
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10 hover:text-white">
                <Link href="/services">Découvrir nos services</Link>
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-3 text-white/80">
              <Phone className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="text-sm">
                Appelez-nous directement :{' '}
                <a
                  href={`tel:${siteConfig.contact.phoneE164}`}
                  className="font-semibold text-white hover:text-emerald-400 transition-colors"
                >
                  {siteConfig.contact.phone}
                </a>
                <span className="ml-2 text-white/60">
                  — {siteConfig.contact.hours.label}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
