import type { Metadata } from 'next'
import Image from 'next/image'
import { Container, Section } from '@effinor/design-system'
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

  return (
    <>
      <section className="relative min-h-[280px] overflow-hidden bg-primary-950 lg:min-h-[320px]">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          className="object-cover opacity-50"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/30 via-primary-950/50 to-primary-950" />
        <div className="absolute left-0 top-0 h-full w-1.5 bg-secondary-500" aria-hidden />
        <Container size="site" className="relative z-10">
          <div className="py-12 text-center lg:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-200/90">
              Effinor
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Rénovation énergétique
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-100/90 sm:text-lg">
              Isolez, renouvelez le chauffage, ou engagez une rénovation d&apos;enveloppe : explorez
              nos fiches thématiques, rédigées et mises à jour depuis notre interface métier.
            </p>
          </div>
        </Container>
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 rounded-t-3xl bg-background lg:h-16"
          aria-hidden
        />
      </section>

      <Section spacing="lg" className="-mt-8 lg:-mt-10">
        <Container size="site">
          <p className="text-center text-sm text-muted-foreground">
            {hasAnyArticle
              ? "Choisissez un pilier, puis la fiche qui correspond à votre besoin."
              : "Prévisualisation (base non connectée) — en production, le contenu est affiché depuis l’ERP."}
          </p>
          <div className="mt-8">
            <ReEnergieMegaGrid columns={columns} />
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </>
  )
}
