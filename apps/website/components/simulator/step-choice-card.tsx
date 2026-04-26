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
}

/**
 * Card cliquable uniforme pour les étapes à choix (single ou multi).
 * - État non sélectionné : bordure discrète, hover emerald.
 * - État sélectionné : bordure + fond emerald + pastille check.
 */
export function StepChoiceCard({
  label,
  description,
  icon,
  selected,
  onSelect,
  tone = 'single',
}: StepChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full items-start gap-4 rounded-xl border bg-card p-4 text-left transition-all',
        'hover:border-secondary-400 hover:bg-secondary-50/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2',
        selected
          ? 'border-secondary-500 bg-secondary-50 shadow-sm ring-1 ring-secondary-500/30'
          : 'border-border'
      )}
    >
      {icon ? (
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors',
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
        <span className="block text-sm font-semibold text-foreground sm:text-base">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground sm:text-sm">
            {description}
          </span>
        ) : null}
      </span>

      <span
        className={cn(
          'mt-1 flex h-5 w-5 shrink-0 items-center justify-center transition-all',
          tone === 'multi' ? 'rounded-md border' : 'rounded-full border',
          selected
            ? 'border-secondary-500 bg-secondary-500 text-white'
            : 'border-border bg-background text-transparent'
        )}
        aria-hidden="true"
      >
        <Check className="h-3.5 w-3.5" />
      </span>
    </button>
  )
}
