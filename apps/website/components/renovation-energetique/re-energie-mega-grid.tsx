import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'

import { cn } from '@effinor/design-system'

import type { ReEnergieCategoryWithArticles } from '@/lib/re-energie'

import { ReEnergieArticleIcon } from './re-energie-article-icon'

function hrefForArticle(categorySlug: string, a: ReEnergieCategoryWithArticles['articles'][0]) {
  if (a.external_href) return a.external_href
  return `/services/re/${categorySlug}/${a.slug}`
}

function isExternalHref(href: string) {
  return href.startsWith('http://') || href.startsWith('https://')
}

const PILLAR_INTRO: Record<string, string> = {
  isolation: "Réduire les déperditions : toiture, murs, menuiseries, plancher.",
  chauffage: "Remplacer ou compléter le système de production de chaleur et d’eau chaude sanitaire.",
  "renovation-globale":
    "Enchaîner les travaux pour viser le saut de performance (parcours, aides, accompagnement).",
}

type Props = {
  columns: ReEnergieCategoryWithArticles[]
  className?: string
}

/**
 * Hub 3 piliers : cartes haute qualité, extraits, hiérarchie claire (inspiré fiches thématiques type Effy / édito premium).
 */
export function ReEnergieMegaGrid({ columns, className }: Props) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:gap-7 lg:grid-cols-3 lg:items-stretch lg:gap-8',
        className
      )}
    >
      {columns.map((col, i) => (
        <article
          key={col.id}
          className="group/column flex min-h-0 flex-col overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-primary-50/[0.35] shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_40px_-12px_rgba(15,23,42,0.12)] transition-[box-shadow,transform] duration-300 hover:shadow-[0_1px_0_rgba(15,23,42,0.05),0_20px_50px_-16px_rgba(15,23,42,0.16)]"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <header className="relative border-b border-border/70 bg-primary-950/[0.04] px-5 pb-4 pt-6 sm:px-6 sm:pt-7">
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-secondary-500 to-secondary-600/80" />
            <div className="flex items-start gap-3 pl-1">
              <span className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-sm ring-2 ring-primary-500/20">
                <ReEnergieArticleIcon iconKey={col.icon_key} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-800/80">
                  Pilier {i + 1}
                </p>
                <h2 className="mt-1.5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  {col.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {PILLAR_INTRO[col.slug] ??
                    "Fiches mises à jour par nos équipes : guides, aides, prochaine étape."}
                </p>
              </div>
            </div>
          </header>

          <ul className="flex flex-1 flex-col gap-2.5 p-3 sm:p-4">
            {col.articles.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                Bientôt disponible — notre catalogue s’enrichit.
              </li>
            ) : (
              col.articles.map((a) => {
                const href = hrefForArticle(col.slug, a)
                const external = isExternalHref(href)
                return (
                  <li key={a.id}>
                    <Link
                      href={href}
                      className="group/link flex h-full min-h-0 flex-col gap-0 rounded-2xl border border-border/60 bg-white/80 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300/80 hover:bg-white hover:shadow-md sm:p-4"
                      {...(external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-start gap-2.5">
                          <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 group-hover/link:bg-primary-100/90">
                            <ReEnergieArticleIcon iconKey={a.icon_key} className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold leading-snug text-foreground sm:text-[15px]">
                              {a.title}
                            </span>
                            {a.excerpt ? (
                              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                {a.excerpt}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <span
                          className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary-100/80 text-primary-800 opacity-0 transition-opacity group-hover/link:opacity-100"
                          aria-hidden
                        >
                          {external ? (
                            <ExternalLink className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })
            )}
          </ul>
        </article>
      ))}
    </div>
  )
}
