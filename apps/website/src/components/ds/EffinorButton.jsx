import React from 'react';
import { Link } from 'react-router-dom';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Bouton marketing Effinor — aligné sur .btn-primary / .btn-secondary / .btn-outline (global-design-system).
 * Utiliser `asChild` avec Radix Slot si besoin ; sinon `href` → <a>, `to` → <Link>, défaut → <button>.
 */
const effinorButtonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-semibold text-center no-underline',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
    'min-h-[44px] sm:min-h-[40px]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-secondary-500 text-white border-0 shadow-md',
          'hover:bg-secondary-600 hover:-translate-y-0.5 hover:shadow-lg',
          'active:translate-y-0',
        ].join(' '),
        secondary: [
          'bg-gray-200 text-gray-700 border-2 border-white',
          'hover:bg-gray-300',
          'active:translate-y-0',
        ].join(' '),
        outline: [
          'bg-transparent text-secondary-600 border-2 border-secondary-600',
          'hover:bg-secondary-50',
          'active:bg-secondary-100',
        ].join(' '),
        /** Sur fond sombre (hero, CTA bleu) — équivalent aux liens « secondaires » clairs */
        inverse: [
          'bg-white/10 text-white border-2 border-white/30',
          'hover:bg-white/15',
        ].join(' '),
        /** CTA sur fond bleu foncé : bouton blanc plein */
        onDarkSolid: [
          'bg-white text-primary-900 border-0 shadow-lg font-bold',
          'hover:bg-primary-50',
        ].join(' '),
        ghost: [
          'bg-transparent text-gray-700 border-0',
          'hover:bg-gray-100',
        ].join(' '),
      },
      size: {
        md: 'px-7 py-3.5 rounded-lg text-base',
        sm: 'px-4 py-2.5 rounded-lg text-sm',
        /** Hero / FinalCTA responsive */
        responsive: 'rounded-lg text-sm md:text-base px-4 md:px-6 py-2.5 md:py-3',
        lg: 'px-8 py-3.5 rounded-lg text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

const EffinorButton = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      to,
      href,
      type = 'button',
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = cn(effinorButtonVariants({ variant, size, fullWidth }), className);

    if (to) {
      return (
        <Link ref={ref} to={to} className={classes} {...props}>
          {children}
        </Link>
      );
    }
    if (href) {
      return (
        <a ref={ref} href={href} className={classes} {...props}>
          {children}
        </a>
      );
    }
    return (
      <button ref={ref} type={type} disabled={disabled} className={classes} {...props}>
        {children}
      </button>
    );
  },
);

EffinorButton.displayName = 'EffinorButton';

export { EffinorButton, effinorButtonVariants };
