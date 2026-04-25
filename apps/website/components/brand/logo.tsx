import { cn } from '@effinor/design-system'
import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  withText?: boolean
  className?: string
  href?: string | null  // null = pas de Link wrapper
}

const sizeClasses = {
  sm: { box: 'h-8 w-8 text-sm', text: 'text-lg' },
  md: { box: 'h-10 w-10 text-base', text: 'text-xl' },
  lg: { box: 'h-14 w-14 text-xl', text: 'text-2xl' },
}

/**
 * Logo Effinor : carré emerald avec "E" blanc.
 * Reproduit l'identité visuelle existante.
 *
 * @example
 *   <Logo size="md" withText />
 *   <Logo size="sm" />
 */
export function Logo({
  size = 'md',
  withText = false,
  className,
  href = '/',
}: LogoProps) {
  const sizes = sizeClasses[size]

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-md bg-secondary-500 font-bold text-white',
          sizes.box
        )}
        aria-hidden="true"
      >
        E
      </div>
      {withText && (
        <span className={cn('font-semibold tracking-tight', sizes.text)}>
          Effinor
        </span>
      )}
    </div>
  )

  if (href === null) {
    return content
  }

  return (
    <Link
      href={href}
      className="inline-flex transition-opacity hover:opacity-80"
      aria-label="Effinor — Retour à l'accueil"
    >
      {content}
    </Link>
  )
}
