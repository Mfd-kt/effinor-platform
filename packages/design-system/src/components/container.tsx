import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

const containerVariants = cva('mx-auto w-full px-4 sm:px-6 lg:px-8', {
  variants: {
    size: {
      readable: 'max-w-readable',
      content: 'max-w-content',
      hero: 'max-w-hero',
      site: 'max-w-site',
      wide: 'max-w-wide',
      full: 'max-w-full',
    },
  },
  defaultVariants: {
    size: 'site',
  },
})

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: 'div' | 'section' | 'article' | 'main' | 'header' | 'footer'
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, as: Comp = 'div', ...props }, ref) => {
    return (
      <Comp
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(containerVariants({ size, className }))}
        {...props}
      />
    )
  }
)
Container.displayName = 'Container'

export { Container, containerVariants }
