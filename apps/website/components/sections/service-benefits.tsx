import type { LucideIcon } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'

export interface ServiceBenefit {
  icon: LucideIcon
  title: string
  description: string
}

interface ServiceBenefitsProps {
  eyebrow?: string
  title: string
  description?: string
  benefits: ServiceBenefit[]
  variant?: 'default' | 'muted'
  /** Rythme section : défaut resserré (md) sur la 2e section */
  spacing?: 'sm' | 'md' | 'lg' | 'xl' | 'none'
}

export function ServiceBenefits({
  eyebrow,
  title,
  description,
  benefits,
  variant = 'default',
  spacing = 'lg',
}: ServiceBenefitsProps) {
  return (
    <Section spacing={spacing} variant={variant}>
      <Container size="site">
        <div className="text-center max-w-content mx-auto">
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          {description && (
            <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          )}
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <li
                key={benefit.title}
                className="flex flex-col rounded-xl border border-border bg-card p-6 lg:p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-50 text-secondary-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                  {benefit.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}
