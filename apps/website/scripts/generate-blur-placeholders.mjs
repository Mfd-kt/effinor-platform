/**
 * Génère des blurDataURL (JPEG miniaturisé) pour next/image placeholder="blur".
 * Usage : `node apps/website/scripts/generate-blur-placeholders.mjs` (à la racine du monorepo)
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const websiteRoot = join(__dirname, '..')
const publicDir = join(websiteRoot, 'public')
const outFile = join(websiteRoot, 'lib', 'blur-placeholders.ts')

const IMAGES = [
  { key: 'heroResidence', file: 'images/hero-residence.png' },
  { key: 'pacMaison', file: 'images/services/pac-maison.jpg' },
  { key: 'pacImmeuble', file: 'images/services/pac-immeuble.jpg' },
  { key: 'ssc', file: 'images/services/ssc-solaire.jpg' },
  { key: 'renoGlobale', file: 'images/services/renovation-globale.jpg' },
]

async function toBlurDataUrl(absPath) {
  const input = await readFile(absPath)
  const buf = await sharp(input)
    .resize(12, 12, { fit: 'cover' })
    .jpeg({ quality: 60 })
    .toBuffer()
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

const entries = []
for (const { key, file } of IMAGES) {
  const p = join(publicDir, file)
  const dataUrl = await toBlurDataUrl(p)
  entries.push(`  ${key}: ${JSON.stringify(dataUrl)},`)
  console.log('OK', file)
}

const source = `/**
 * BlurDataURL pré-générés pour next/image (placeholder="blur").
 * Régénérer : \`node apps/website/scripts/generate-blur-placeholders.mjs\`
 */
export const BLUR_PLACEHOLDERS = {
${entries.join('\n')}
} as const

export type BlurImageKey = keyof typeof BLUR_PLACEHOLDERS
`

await writeFile(outFile, source, 'utf8')
console.log('Wrote', outFile)
