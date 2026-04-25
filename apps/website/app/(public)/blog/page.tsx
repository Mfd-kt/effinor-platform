import type { Metadata } from 'next'
import { Container, Section } from '@effinor/design-system'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { FinalCTA } from '@/components/sections/final-cta'
import { getPublishedBlogPosts } from '@/lib/blog'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    "Conseils, actualités et guides pratiques sur la rénovation énergétique, les aides CEE, MaPrimeRénov' et les pompes à chaleur.",
  openGraph: {
    title: `Blog — ${siteConfig.name}`,
    description:
      "Conseils et guides pratiques sur la rénovation énergétique et les aides disponibles en 2026.",
  },
  alternates: {
    canonical: `${siteConfig.url}/blog`,
  },
}

// ISR : revalide toutes les heures (3600 s)
export const revalidate = 3600

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts()

  const featuredPost = posts.find((p) => p.featured) ?? posts[0] ?? null
  const otherPosts = featuredPost
    ? posts.filter((p) => p.id !== featuredPost.id)
    : []

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-background">
        <Container size="site">
          <div className="py-12 lg:py-16">
            <div className="text-center max-w-content mx-auto">
              <p className="text-sm font-semibold uppercase tracking-widest text-secondary-700">
                Blog Effinor
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-primary-900 sm:text-5xl">
                Conseils &amp; actualités
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Guides pratiques sur la rénovation énergétique, les aides de
                l&apos;État et nos retours d&apos;expérience terrain.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Section spacing="lg">
        <Container size="site">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <p className="text-lg font-medium text-foreground">
                Nos premiers articles arrivent bientôt&nbsp;!
              </p>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Revenez prochainement pour découvrir nos conseils sur la rénovation
                énergétique et les aides disponibles.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Article à la une */}
              {featuredPost ? (
                <div>
                  <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-secondary-700">
                    À la une
                  </p>
                  <BlogPostCard post={featuredPost} featured />
                </div>
              ) : null}

              {/* Grille articles */}
              {otherPosts.length > 0 && (
                <div>
                  {featuredPost ? (
                    <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-secondary-700">
                      Tous les articles
                    </p>
                  ) : null}
                  <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {otherPosts.map((post) => (
                      <li key={post.id}>
                        <BlogPostCard post={post} />
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
