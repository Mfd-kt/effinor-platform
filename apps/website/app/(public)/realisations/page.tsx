import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, cn } from '@effinor/design-system'
import { RealisationCard } from '@/components/realisations/realisation-card'
import { FinalCTA } from '@/components/sections/final-cta'
import {
  getPublishedRealisations,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPES,
  type ServiceType,
} from '@/lib/realisations'
import { siteConfig } from '@/lib/site-config'

interface Props {
  searchParams: Promise<{ service?: string }>
}

export const metadata: Metadata = {
  title: 'Nos réalisations',
  description:
    "Découvrez nos projets de rénovation énergétique : pompes à chaleur, systèmes solaires, rénovation globale. Résultats concrets et aides obtenues pour chaque client.",
  openGraph: {
    title: `Nos réalisations — ${siteConfig.name}`,
    description:
      "Projets de rénovation énergétique réalisés par Effinor. Économies d'énergie et aides CEE pour chaque chantier.",
  },
  alternates: { canonical: `${siteConfig.url}/realisations` },
}

export const revalidate = 3600

function isValidServiceType(value: string | undefined): value is ServiceType {
  return (
    !!value && (SERVICE_TYPES as readonly string[]).includes(value)
  )
}

export default async function RealisationsPage({ searchParams }: Props) {
  const { service } = await searchParams
  const activeFilter: ServiceType | undefined = isValidServiceType(service)
    ? service
    : undefined

  const realisations = await getPublishedRealisations({
    service_type: activeFilter,
  })

  const featured = realisations.find((r) => r.featured) ?? realisations[0] ?? null
  const others = featured
    ? realisations.filter((r) => r.id !== featured.id)
    : []

  // Sans filtre : on met en avant la "phare" + grille des autres
  // Avec filtre : on affiche directement la grille de tous les résultats
  const showFeaturedBlock = !activeFilter && featured
  const gridItems = activeFilter ? realisations : others

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-background">
        <Container size="site">
          <div className="py-12 lg:py-16">
            <div className="text-center max-w-content mx-auto">
              <p className="text-sm font-semibold uppercase tracking-widest text-secondary-700">
                Portfolio
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-primary-900 sm:text-5xl">
                Nos réalisations
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Chaque projet est une preuve concrète. Retrouvez nos chantiers de
                rénovation énergétique avec les économies et aides obtenues.
              </p>
            </div>

            {/* Filtres */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Link
                href="/realisations"
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  !activeFilter
                    ? 'bg-primary-900 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                Tous
              </Link>
              {SERVICE_TYPES.map((type) => (
                <Link
                  key={type}
                  href={`/realisations?service=${type}`}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    activeFilter === type
                      ? 'bg-primary-900 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {SERVICE_TYPE_LABELS[type]}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Section spacing="lg">
        <Container size="site">
          {realisations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <p className="text-lg font-medium text-foreground">
                {activeFilter
                  ? `Aucune réalisation pour « ${SERVICE_TYPE_LABELS[activeFilter]} » pour l'instant.`
                  : 'Nos premières réalisations arrivent bientôt !'}
              </p>
              {activeFilter ? (
                <Link
                  href="/realisations"
                  className="mt-4 text-sm font-medium text-secondary-700 hover:underline"
                >
                  Voir toutes les réalisations
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="space-y-12">
              {showFeaturedBlock ? (
                <div>
                  <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-secondary-700">
                    Réalisation phare
                  </p>
                  <RealisationCard realisation={featured} featured />
                </div>
              ) : null}

              {gridItems.length > 0 && (
                <div>
                  {showFeaturedBlock ? (
                    <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-secondary-700">
                      Toutes nos réalisations
                    </p>
                  ) : null}
                  <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {gridItems.map((r) => (
                      <li key={r.id}>
                        <RealisationCard realisation={r} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Container>
      </Section>

      <FinalCTA />
    </>
  )
}
