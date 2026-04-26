import type { Config } from 'tailwindcss'
import preset from '@effinor/design-system/tailwind-preset'

const config: Config = {
  presets: [preset as Partial<Config>],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './styles/**/*.css',
    '../../packages/design-system/src/**/*.{ts,tsx}',
  ],
}

export default config
