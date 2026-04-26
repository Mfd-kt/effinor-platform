import Link from 'next/link'
import type { ReEnergieCategoryWithArticles } from '@/lib/re-energie'
import { ReEnergieArticleIcon } from './re-energie-article-icon'
import { cn } from '@effinor/design-system'

function hrefForArticle(categorySlug: string, a: ReEnergieCategoryWithArticles['articles'][0]) {
  if (a.external_href) return a.external_href
  return `/services/re/${categorySlug}/${a.slug}`
}

function isExternalHref(href: string) {
  return href.startsWith('http://') || href.startsWith('https://')
}

type Props = {
  columns: ReEnergieCategoryWithArticles[]
  className?: string
}

export function ReEnergieMegaGrid({ columns, className }: Props) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-8 rounded-2xl border border-border bg-card p-6 shadow-lg md:grid-cols-3 md:gap-10 md:p-8 lg:gap-12',
        className
      )}
    >
      {columns.map((col) => (
        <div key={col.id}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary-700">
            {col.title}
          </h2>
          <ul className="mt-4 space-y-0 divide-y divide-border/80">
            {col.articles.length === 0 ? (
              <li className="py-3 text-sm text-muted-foreground">Bientôt</li>
            ) : (
              col.articles.map((a) => {
                const href = hrefForArticle(col.slug, a)
                return (
                  <li key={a.id}>
                    <Link
                      href={href}
                      className="group -mx-1 flex min-h-[2.75rem] items-center gap-3 rounded-lg px-1 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-primary-50/80 hover:text-primary-900"
                      {...(isExternalHref(href) ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
                    >
                      <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 group-hover:bg-primary-100">
                        <ReEnergieArticleIcon iconKey={a.icon_key} className="h-4 w-4" />
                      </span>
                      <span className="leading-snug">{a.title}</span>
                    </Link>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ))}
    </div>
  )
}
