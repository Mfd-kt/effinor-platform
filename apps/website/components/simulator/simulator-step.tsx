'use client'

import type { ReactNode } from 'react'
import { cn } from '@effinor/design-system'

type SimulatorStepProps = {
  stepIndex: number
  totalSteps: number
  title: string
  description?: string
  children: ReactNode
}

/**
 * Wrapper commun à toutes les étapes :
 *  - Barre de progression emerald
 *  - Libellé "Étape X sur Y"
 *  - Titre + description
 */
export function SimulatorStep({
  stepIndex,
  totalSteps,
  title,
  description,
  children,
}: SimulatorStepProps) {
  const progress = Math.min(100, Math.round((stepIndex / totalSteps) * 100))

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>
            Étape {stepIndex} sur {totalSteps}
          </span>
          <span className="text-secondary-700">{progress}%</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-secondary-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Progression du simulateur"
        >
          <div
            className={cn(
              'h-full rounded-full bg-secondary-500 transition-[width] duration-500 ease-out'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <header>
        <h3 className="text-xl font-bold tracking-tight text-primary-900 sm:text-2xl">
          {title}
        </h3>
        {description ? (
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </header>

      <div>{children}</div>
    </div>
  )
}
