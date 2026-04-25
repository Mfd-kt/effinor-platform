import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MapPin, Zap } from 'lucide-react'
import { cn } from '@effinor/design-system'
import {
  SERVICE_TYPE_LABELS,
  type RealisationCard as RealisationCardType,
} from '@/lib/realisations'

interface RealisationCardProps {
  realisation: RealisationCardType
  featured?: boolean
  className?: string
}

const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)

export function RealisationCard({
  realisation,
  featured = false,
  className,
}: RealisationCardProps) {
  const serviceLabel =
    SERVICE_TYPE_LABELS[realisation.service_type] ?? realisation.service_type

  const aidsPercent =
    realisation.total_cost_eur && realisation.total_aids_eur
      ? Math.round(
          (realisation.total_aids_eur / realisation.total_cost_eur) * 100
        )
      : null

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
          featured ? 'aspect-[16/9] lg:aspect-auto lg:w-1/2' : 'aspect-[4/3]'
        )}
      >
        {realisation.cover_image_url ? (
          <Image
            src={realisation.cover_image_url}
            alt={realisation.cover_image_alt ?? realisation.title}
            fill
            className="object-cover transition-transform duration-slow group-hover:scale-105"
            sizes={
              featured
                ? '(max-width: 1024px) 100vw, 50vw'
                : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary-50 to-primary-50">
            <span className="text-5xl font-bold text-primary-200">
              {realisation.city.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Badge service (top-left) */}
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-primary-900 backdrop-blur-sm">
          {serviceLabel}
        </span>

        {/* Badge "% financé" (top-right) */}
        {aidsPercent !== null && (
          <span className="absolute right-3 top-3 rounded-full bg-secondary-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
            {aidsPercent}% financé
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className={cn('flex flex-1 flex-col p-5', featured && 'lg:p-8')}>
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {realisation.city}
            {realisation.region ? ` — ${realisation.region}` : ''}
          </span>
          {realisation.year_completed ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{realisation.year_completed}</span>
            </>
          ) : null}
          {realisation.surface_m2 ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{realisation.surface_m2} m²</span>
            </>
          ) : null}
        </div>

        {/* Titre */}
        <h2
          className={cn(
            'mt-3 font-semibold leading-snug tracking-tight text-primary-900',
            'transition-colors group-hover:text-secondary-700',
            featured ? 'text-2xl lg:text-3xl' : 'text-lg'
          )}
        >
          <Link
            href={`/realisations/${realisation.slug}`}
            className="after:absolute after:inset-0"
          >
            {realisation.title}
          </Link>
        </h2>

        {/* Extrait */}
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {realisation.excerpt}
        </p>

        {/* Aides obtenues (KPI fort) */}
        {realisation.total_aids_eur ? (
          <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary-700">
            <Zap className="h-4 w-4" />
            {formatEur(realisation.total_aids_eur)} d&apos;aides obtenues
          </div>
        ) : null}

        {/* CTA */}
        <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-secondary-700">
          Voir la réalisation
          <ArrowRight className="h-4 w-4 transition-transform duration-base group-hover:translate-x-1" />
        </div>
      </div>
    </article>
  )
}
