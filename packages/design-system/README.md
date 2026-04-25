# @effinor/design-system

Design system partagé Effinor.

## Contenu
- Tokens CSS (couleurs, typographie, radius, shadows)
- Composants React (Button, Card, Input, Section, Container, Badge, Dialog)
- Preset Tailwind v4
- Utilitaire `cn()` (clsx + tailwind-merge)

## Usage

### Dans une app Next.js / Vite

```typescript
// Importer les styles globaux
import '@effinor/design-system/styles'

// Importer un composant
import { Button } from '@effinor/design-system'
```

### Dans tailwind.config.ts

```typescript
import preset from '@effinor/design-system/tailwind-preset'

export default {
  presets: [preset],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/design-system/src/**/*.{ts,tsx}',
  ],
}
```

## Architecture

Voir le dossier src/ :
- components/ : composants React (shadcn/ui based)
- styles/ : tokens.css + globals.css
- lib/ : utilitaires (cn.ts)
- hooks/ : hooks React partagés

## Développement

Ce package est privé au monorepo Effinor. Il n'est pas publié sur npm.
Les modifications impactent directement toutes les apps qui le consomment.
