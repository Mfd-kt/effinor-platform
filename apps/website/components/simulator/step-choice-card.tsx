'use client'

import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@effinor/design-system'

type StepChoiceCardProps = {
  label: string
  description?: string
  icon?: ReactNode
  selected: boolean
  onSelect: () => void
  tone?: 'single' | 'multi'
  /** Layout compact : icône plus petite, padding réduit, label sur 1-2 lignes. */
  compact?: boolean
}

/**
 * Card cliquable uniforme pour les étapes à choix (single ou multi).
 * - État non sélectionné : bordure discrète, hover emerald.
 * - État sélectionné : bordure + fond emerald + pastille check.
 * - `compact` : version dense utilisée quand beaucoup d'options (>= 6).
 */
export function StepChoiceCard({
  label,
  description,
  icon,
  selected,
  onSelect,
  tone = 'single',
  compact = false,
}: StepChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full rounded-xl border bg-card text-left transition-all',
        'hover:border-secondary-400 hover:bg-secondary-50/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2',
        compact
          ? 'items-center gap-3 p-3'
          : 'items-start gap-4 p-4',
        selected
          ? 'border-secondary-500 bg-secondary-50 shadow-sm ring-1 ring-secondary-500/30'
          : 'border-border'
      )}
    >
      {icon ? (
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-lg transition-colors',
            compact ? 'h-9 w-9 [&_svg]:h-4 [&_svg]:w-4' : 'h-11 w-11',
            selected
              ? 'bg-secondary-500 text-white'
              : 'bg-secondary-500/10 text-secondary-700 group-hover:bg-secondary-500/15'
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block font-semibold text-foreground',
            compact ? 'text-sm leading-tight' : 'text-sm sm:text-base'
          )}
        >
          {label}
        </span>
        {description ? (
          <span
            className={cn(
              'block text-muted-foreground',
              compact ? 'mt-0.5 text-xs leading-snug' : 'mt-0.5 text-xs sm:text-sm'
            )}
          >
            {description}
          </span>
        ) : null}
      </span>

      <span
        className={cn(
          'flex shrink-0 items-center justify-center transition-all',
          compact ? 'mt-0 h-4 w-4' : 'mt-1 h-5 w-5',
          tone === 'multi' ? 'rounded-md border' : 'rounded-full border',
          selected
            ? 'border-secondary-500 bg-secondary-500 text-white'
            : 'border-border bg-background text-transparent'
        )}
        aria-hidden="true"
      >
        <Check className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      </span>
    </button>
  )
}
