import { cn } from '@/lib/utils';

/** Champ texte / email / tel / nombre — marketing & mini-form */
export function effinorInputClass(hasError = false) {
  return cn(
    'w-full min-h-[44px] rounded-lg border px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all duration-200 sm:min-h-0',
    'focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-500 bg-red-50/30 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-200 bg-gray-50 focus:border-secondary-500 focus:ring-secondary-500/20',
  );
}

/** Select natif aligné sur les inputs Effinor (+ chevron `.ds-select`) */
export function effinorSelectClass(hasError = false) {
  return cn(effinorInputClass(hasError), 'ds-select');
}

/** Zone de texte marketing */
export function effinorTextareaClass(hasError = false) {
  return cn(effinorInputClass(hasError), 'min-h-[120px] resize-none');
}
