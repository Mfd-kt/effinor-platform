import type { Metadata } from 'next'
import Image from 'next/image'
import { Container, Section } from '@effinor/design-system'
import { Sparkles } from 'lucide-react'
import { ReEnergieMegaGrid } from '@/components/renovation-energetique/re-energie-mega-grid'
import { FinalCTA } from '@/components/sections/final-cta'
import { getReEnergieHubData } from '@/lib/re-energie'
import { getStaticReEnergieHubFallback } from '@/lib/re-energie-fallback'
import { siteConfig } from '@/lib/site-config'

/** Contenu piloté par Supabase ; délai raisonnable jusqu’au prochain déploiement vitrine. */
export const revalidate = 120

const HERO_IMAGE = '/images/hero-residence.png'

export const metadata: Metadata = {
  title: 'Rénovation énergétique',
  description:
    "Isoler, se chauffer autrement, engager une rénovation d'enveloppe : le hub Effinor — catégories et fiches, pilotées par nos équipes et publiées depuis notre outil de gestion.",
  openGraph: {
    title: 'Rénovation énergétique',
    description:
      "Isolation, chauffage, rénovation globale : l'essentiel pour votre projet, avec l'accompagnement Effinor.",
    url: `${siteConfig.url}/services`,
  },
  alternates: { canonical: `${siteConfig.url}/services` },
}

export default async function ServicesPage() {
  const fromDb = await getReEnergieHubData()
  const hasAnyArticle = fromDb.some((c) => c.articles.length > 0)
  const columns = hasAnyArticle ? fromDb : getStaticReEnergieHubFallback()
  const articleCount = columns.reduce((n, c) => n + c.articles.length, 0)

  return (
    <>
      <section className="relative min-h-[300px] overflow-hidden bg-neutral-900 lg:min-h-[360px]">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          className="object-cover object-center opacity-45"
          sizes="100vw"
          priority
        />
        {/* Scrim : lisibilité texte + garde l’identité vert Effinor */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-primary-950/80 via-primary-900/70 to-primary-950/90"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950 via-transparent to-black/20" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute left-0 top-0 h-full w-1 bg-secondary-500 sm:w-1.5" aria-hidden />
        <Container size="site" className="relative z-10">
          <div className="flex flex-col items-center py-14 text-center lg:py-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-200/95">
              Effinor
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.6rem] lg:leading-[1.12]">
              Rénovation énergétique
            </h1>
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-white/10 bg-primary-950/50 px-5 py-4 text-left shadow-lg backdrop-blur-md sm:px-6 sm:py-5">
              <p className="text-sm leading-relaxed text-white/95 sm:text-base">
                Isolez, renouvelez le chauffage, ou engagez une rénovation d&apos;enveloppe : des fiches
                claires — rédigées et mises à jour par nos équipes — pour avancer sur votre projet, avec
                le bon calendrier d&apos;aides.
              </p>
            </div>
            {articleCount > 0 && (
              <p className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-primary-100/90">
                <Sparkles className="h-3.5 w-3.5 text-secondary-300" aria-hidden />
                {articleCount} fiche{articleCount > 1 ? 's' : ''} · 3 piliers
              </p>
            )}
          </div>
        </Container>
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 rounded-t-[2.5rem] bg-background shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.12)] sm:h-16"
          aria-hidden
        />
      </section>

      <Section spacing="lg" className="-mt-10 sm:-mt-12 lg:-mt-14">
        <Container size="site">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Explorez par pilier
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {hasAnyArticle
                ? 'Choisissez un volet, ouvrez la fiche : isolation, solutions de chauffage, ou parcours rénovation globale.'
                : 'Aperçu du hub — en production, le contenu provient de notre outil de gestion (ERP).'}
            </p>
          </div>
          <div className="mt-10 sm:mt-12">
            <ReEnergieMegaGrid columns={columns} />
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </>
  )
}
