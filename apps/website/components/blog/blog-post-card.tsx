import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import { cn } from '@effinor/design-system'
import type { BlogPostCard as BlogPostCardType } from '@/lib/blog'

const CATEGORY_LABELS: Record<string, string> = {
  'pompe-a-chaleur': 'Pompe à chaleur',
  'systeme-solaire-combine': 'Système solaire',
  'renovation-globale': 'Rénovation globale',
  aides: 'Aides & financement',
  conseils: 'Conseils pratiques',
  actualites: 'Actualités',
}

interface BlogPostCardProps {
  post: BlogPostCardType
  featured?: boolean
  className?: string
}

export function BlogPostCard({
  post,
  featured = false,
  className,
}: BlogPostCardProps) {
  const categoryLabel = post.category
    ? (CATEGORY_LABELS[post.category] ?? post.category)
    : null

  const formattedDate = new Date(post.published_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background',
        'transition-all duration-base hover:-translate-y-1 hover:border-secondary-300 hover:shadow-lg',
        featured && 'lg:flex-row',
        className
      )}
    >
      {/* Image */}
      <div
        className={cn(
          'relative overflow-hidden bg-muted',
          featured ? 'aspect-[16/9] lg:aspect-auto lg:w-1/2' : 'aspect-[16/9]'
        )}
      >
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? post.title}
            fill
            className="object-cover transition-transform duration-slow group-hover:scale-105"
            sizes={
              featured
                ? '(max-width: 1024px) 100vw, 50vw'
                : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
            <span className="text-5xl font-bold text-primary-200">
              {post.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {categoryLabel && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-primary-900 backdrop-blur-sm">
            {categoryLabel}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className={cn('flex flex-1 flex-col p-5', featured && 'lg:p-8')}>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
          {post.reading_time_min ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.reading_time_min} min de lecture
            </span>
          ) : null}
        </div>

        <h2
          className={cn(
            'mt-3 font-semibold leading-snug tracking-tight text-primary-900',
            'transition-colors group-hover:text-secondary-700',
            featured ? 'text-2xl lg:text-3xl' : 'text-lg'
          )}
        >
          <Link
            href={`/blog/${post.slug}`}
            className="after:absolute after:inset-0"
          >
            {post.title}
          </Link>
        </h2>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {post.excerpt}
        </p>

        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-secondary-700">
          Lire l&apos;article
          <ArrowRight className="h-4 w-4 transition-transform duration-base group-hover:translate-x-1" />
        </div>
      </div>
    </article>
  )
}
