import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { Container } from '@effinor/design-system'
import { FinalCTA } from '@/components/sections/final-cta'
import {
  getReEnergieArticle,
  getReEnergieStaticPaths,
} from '@/lib/re-energie'
import { siteConfig } from '@/lib/site-config'

export const revalidate = 120

interface Props {
  params: Promise<{ categorySlug: string; articleSlug: string }>
}

export async function generateStaticParams() {
  return getReEnergieStaticPaths()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, articleSlug } = await params
  const article = await getReEnergieArticle(categorySlug, articleSlug)
  if (!article) return { title: 'Fiche introuvable' }
  if (article.external_href) return { title: article.title }

  const path = `${siteConfig.url}/services/re/${categorySlug}/${articleSlug}`
  const title = article.seo_title ?? article.title
  const description = article.seo_description ?? article.excerpt

  return {
    title,
    description,
    openGraph: {
      type: 'article',
      title,
      description,
      url: path,
      publishedTime: article.published_at ?? undefined,
      ...(article.cover_image_url
        ? {
            images: [
              {
                url: article.cover_image_url,
                alt: article.cover_image_alt ?? title,
              },
            ],
          }
        : {}),
    },
    alternates: { canonical: path },
  }
}

export default async function ReEnergieArticlePage({ params }: Props) {
  const { categorySlug, articleSlug } = await params
  const article = await getReEnergieArticle(categorySlug, articleSlug)
  if (!article) notFound()
  if (article.external_href) {
    redirect(article.external_href)
  }

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const path = `${siteConfig.url}/services/re/${categorySlug}/${articleSlug}`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.excerpt,
            datePublished: article.published_at,
            mainEntityOfPage: { '@type': 'WebPage', '@id': path },
            publisher: {
              '@type': 'Organization',
              name: siteConfig.name,
              url: siteConfig.url,
            },
            ...(article.cover_image_url
              ? { image: article.cover_image_url }
              : {}),
          }),
        }}
      />

      <article>
        <header className="bg-gradient-to-b from-primary-50 to-background">
          <Container size="content">
            <div className="py-10 lg:py-14">
              <nav aria-label="Fil d'Ariane">
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Rénovation énergétique
                </Link>
              </nav>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-medium text-secondary-700 ring-1 ring-secondary-200">
                  {article.category.title}
                </span>
                {formattedDate ? (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formattedDate}
                  </span>
                ) : null}
                {article.reading_time_min ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {article.reading_time_min} min de lecture
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-primary-900 sm:text-4xl lg:text-5xl">
                {article.title}
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                {article.excerpt}
              </p>
            </div>
          </Container>
        </header>

        {article.cover_image_url ? (
          <Container size="content">
            <div className="relative -mt-2 aspect-[16/9] overflow-hidden rounded-2xl shadow-lg ring-1 ring-primary-900/5">
              <Image
                src={article.cover_image_url}
                alt={article.cover_image_alt ?? article.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          </Container>
        ) : null}

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
              prose-blockquote:border-l-secondary-400 prose-blockquote:bg-secondary-50/40
              prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4
              prose-blockquote:not-italic prose-blockquote:font-normal
              prose-code:bg-muted prose-code:rounded prose-code:px-1.5 prose-code:py-0.5
              prose-code:before:content-none prose-code:after:content-none
              prose-img:rounded-xl prose-img:shadow-md
              prose-ul:list-disc prose-ol:list-decimal"
            dangerouslySetInnerHTML={{ __html: article.content_html }}
          />
        </Container>
      </article>

      <FinalCTA />
    </>
  )
}
