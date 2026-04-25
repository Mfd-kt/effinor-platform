import type { Config } from 'tailwindcss'

/**
 * Preset Tailwind v4 partagé pour toutes les apps Effinor.
 * Les tokens de design complets sont ajoutés en étape 2.2.
 */
const preset: Partial<Config> = {
  theme: {
    extend: {
      // Les tokens seront injectés ici en 2.2
    },
  },
}

export default preset
