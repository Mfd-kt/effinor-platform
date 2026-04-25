import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react'
import { Container } from '@effinor/design-system'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { FinalCTA } from '@/components/sections/final-cta'
import {
  getAllBlogSlugs,
  getBlogPostBySlug,
  getRelatedPosts,
} from '@/lib/blog'
import { siteConfig } from '@/lib/site-config'

interface Props {
  params: Promise<{ slug: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  'pompe-a-chaleur': 'Pompe à chaleur',
  'systeme-solaire-combine': 'Système solaire combiné',
  'renovation-globale': 'Rénovation globale',
  aides: 'Aides & financement',
  conseils: 'Conseils pratiques',
  actualites: 'Actualités',
}

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return { title: 'Article introuvable' }

  const title = post.seo_title ?? post.title
  const description = post.seo_description ?? post.excerpt
  const canonicalUrl = `${siteConfig.url}/blog/${slug}`

  return {
    title,
    description,
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonicalUrl,
      publishedTime: post.published_at,
      ...(post.cover_image_url
        ? {
            images: [
              {
                url: post.cover_image_url,
                alt: post.cover_image_alt ?? title,
              },
            ],
          }
        : {}),
    },
    alternates: { canonical: canonicalUrl },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  const relatedPosts = await getRelatedPosts(slug, post.category)

  const formattedDate = new Date(post.published_at).toLocaleDateString(
    'fr-FR',
    { day: 'numeric', month: 'long', year: 'numeric' }
  )

  const categoryLabel = post.category
    ? (CATEGORY_LABELS[post.category] ?? post.category)
    : null

  return (
    <>
      {/* JSON-LD Article (SEO structured data) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.excerpt,
            datePublished: post.published_at,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${siteConfig.url}/blog/${slug}`,
            },
            publisher: {
              '@type': 'Organization',
              name: siteConfig.name,
              url: siteConfig.url,
            },
            ...(post.cover_image_url ? { image: post.cover_image_url } : {}),
          }),
        }}
      />

      {/* Hero / header article */}
      <article>
        <header className="bg-gradient-to-b from-primary-50 to-background">
          <Container size="content">
            <div className="py-10 lg:py-14">
              <nav aria-label="Fil d'Ariane">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour au blog
                </Link>
              </nav>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {categoryLabel ? (
                  <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-medium text-secondary-700 ring-1 ring-secondary-200">
                    {categoryLabel}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formattedDate}
                </span>
                {post.reading_time_min ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.reading_time_min} min de lecture
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-primary-900 sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
            </div>
          </Container>
        </header>

        {/* Image de couverture */}
        {post.cover_image_url ? (
          <Container size="content">
            <div className="relative -mt-2 aspect-[16/9] overflow-hidden rounded-2xl shadow-lg ring-1 ring-primary-900/5">
              <Image
                src={post.cover_image_url}
                alt={post.cover_image_alt ?? post.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          </Container>
        ) : null}

        {/* Contenu HTML TipTap (prose) */}
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
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />
        </Container>

        {/* Tags */}
        {post.tags.length > 0 && (
          <Container size="content">
            <div className="flex flex-wrap items-center gap-2 border-t border-border pb-12 pt-6">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Container>
        )}
      </article>

      {/* Articles liés */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-border bg-muted/30 py-12 lg:py-16">
          <Container size="site">
            <h2 className="mb-8 text-2xl font-bold tracking-tight text-primary-900">
              Articles similaires
            </h2>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((related) => (
                <li key={related.id}>
                  <BlogPostCard post={related} />
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
