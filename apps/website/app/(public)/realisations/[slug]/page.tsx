import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Home, MapPin, Zap } from 'lucide-react'
import { Container } from '@effinor/design-system'
import { RealisationCard } from '@/components/realisations/realisation-card'
import { FinalCTA } from '@/components/sections/final-cta'
import {
  getAllRealisationSlugs,
  getPublishedRealisations,
  getRealisationBySlug,
  SERVICE_TYPE_LABELS,
} from '@/lib/realisations'
import { siteConfig } from '@/lib/site-config'

interface Props {
  params: Promise<{ slug: string }>
}

const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)

export async function generateStaticParams() {
  const slugs = await getAllRealisationSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const r = await getRealisationBySlug(slug)
  if (!r) return { title: 'Réalisation introuvable' }

  const serviceLabel = SERVICE_TYPE_LABELS[r.service_type] ?? r.service_type
  const title = `${r.title} — ${serviceLabel}`
  const canonicalUrl = `${siteConfig.url}/realisations/${slug}`

  return {
    title,
    description: r.excerpt,
    openGraph: {
      type: 'article',
      title,
      description: r.excerpt,
      url: canonicalUrl,
      publishedTime: r.published_at,
      ...(r.cover_image_url
        ? {
            images: [
              {
                url: r.cover_image_url,
                alt: r.cover_image_alt ?? title,
              },
            ],
          }
        : {}),
    },
    alternates: { canonical: canonicalUrl },
  }
}

export default async function RealisationPage({ params }: Props) {
  const { slug } = await params
  const r = await getRealisationBySlug(slug)
  if (!r) notFound()

  const serviceLabel = SERVICE_TYPE_LABELS[r.service_type] ?? r.service_type

  const related = await getPublishedRealisations({
    service_type: r.service_type,
    limit: 4,
  })
  const relatedFiltered = related
    .filter((rel) => rel.slug !== r.slug)
    .slice(0, 3)

  const aidsPercent =
    r.total_cost_eur && r.total_aids_eur
      ? Math.round((r.total_aids_eur / r.total_cost_eur) * 100)
      : null

  return (
    <>
      {/* JSON-LD Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: r.title,
            description: r.excerpt,
            datePublished: r.published_at,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${siteConfig.url}/realisations/${slug}`,
            },
            publisher: {
              '@type': 'Organization',
              name: siteConfig.name,
              url: siteConfig.url,
            },
            ...(r.cover_image_url ? { image: r.cover_image_url } : {}),
          }),
        }}
      />

      <article>
        {/* Header */}
        <header className="bg-gradient-to-b from-primary-50 to-background">
          <Container size="content">
            <div className="py-10 lg:py-14">
              {/* Breadcrumb */}
              <nav aria-label="Fil d'Ariane">
                <Link
                  href="/realisations"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour aux réalisations
                </Link>
              </nav>

              {/* Meta badges */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-medium text-secondary-700 ring-1 ring-secondary-200">
                  {serviceLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {r.city}
                  {r.region ? `, ${r.region}` : ''}
                </span>
                {r.year_completed ? (
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {r.year_completed}
                  </span>
                ) : null}
                {r.surface_m2 ? (
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Home className="h-4 w-4" />
                    {r.surface_m2} m²
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-primary-900 sm:text-4xl lg:text-5xl">
                {r.title}
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                {r.excerpt}
              </p>

              {/* Bloc financement (différenciateur fort) */}
              {(r.total_cost_eur || r.total_aids_eur) ? (
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {r.total_aids_eur ? (
                    <div className="flex items-center gap-3 rounded-xl border border-secondary-200 bg-secondary-50 px-4 py-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-500/15 text-secondary-700">
                        <Zap className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Aides obtenues
                        </p>
                        <p className="text-lg font-bold leading-tight text-secondary-700">
                          {formatEur(r.total_aids_eur)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {r.total_cost_eur ? (
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Coût total
                        </p>
                        <p className="text-lg font-bold leading-tight text-foreground">
                          {formatEur(r.total_cost_eur)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {aidsPercent !== null ? (
                    <div className="flex items-center gap-3 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Financé par les aides
                        </p>
                        <p className="text-2xl font-extrabold leading-tight text-accent-700">
                          {aidsPercent}%
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Container>
        </header>

        {/* Image principale */}
        {r.cover_image_url ? (
          <Container size="content">
            <div className="relative -mt-2 aspect-[16/9] overflow-hidden rounded-2xl shadow-lg ring-1 ring-primary-900/5">
              <Image
                src={r.cover_image_url}
                alt={r.cover_image_alt ?? r.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          </Container>
        ) : null}

        {/* Galerie (gallery_urls[1..6]) */}
        {r.gallery_urls.length > 0 ? (
          <Container size="content">
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {r.gallery_urls.slice(0, 6).map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-primary-900/5"
                >
                  <Image
                    src={url}
                    alt={`${r.title} — photo ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-slow hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </Container>
        ) : null}

        {/* Description HTML */}
        {r.description_html ? (
          <Container size="content">
            <div
              className="prose prose-slate max-w-none py-10 lg:py-14
                prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-primary-900
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:leading-relaxed prose-p:text-foreground
                prose-a:text-secondary-700 prose-a:no-underline prose-a:font-medium
                hover:prose-a:underline
                prose-strong:text-primary-900
                prose-ul:list-disc prose-ol:list-decimal"
              dangerouslySetInnerHTML={{ __html: r.description_html }}
            />
          </Container>
        ) : (
          <div className="py-10" />
        )}
      </article>

      {/* Projets similaires */}
      {relatedFiltered.length > 0 && (
        <section className="border-t border-border bg-muted/30 py-12 lg:py-16">
          <Container size="site">
            <h2 className="mb-8 text-2xl font-bold tracking-tight text-primary-900">
              Projets similaires
            </h2>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedFiltered.map((rel) => (
                <li key={rel.id}>
                  <RealisationCard realisation={rel} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <FinalCTA />
    </>
  )
}
