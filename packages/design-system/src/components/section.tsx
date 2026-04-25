import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

const sectionVariants = cva('w-full', {
  variants: {
    spacing: {
      none: 'py-0',
      sm: 'py-section-sm',
      md: 'py-section-md',
      lg: 'py-section-lg',
      xl: 'py-section-xl',
    },
    variant: {
      default: 'bg-background text-foreground',
      muted: 'bg-muted text-foreground',
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      accent: 'bg-accent text-accent-foreground',
      gradient:
        'bg-gradient-to-b from-primary-50 via-background to-background text-foreground',
      hero:
        'relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 text-white',
    },
  },
  defaultVariants: {
    spacing: 'lg',
    variant: 'default',
  },
})

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing, variant, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(sectionVariants({ spacing, variant, className }))}
        {...props}
      />
    )
  }
)
Section.displayName = 'Section'

export { Section, sectionVariants }
