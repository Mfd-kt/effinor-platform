import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combine clsx et tailwind-merge pour éviter les conflits de classes Tailwind.
 * Exemple : cn('px-2 py-1', condition && 'px-4') → 'py-1 px-4'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
