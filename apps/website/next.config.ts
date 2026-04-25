import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Force la racine de tracing à la racine du monorepo.
  // Sans ça, Next.js peut inférer le mauvais répertoire (lockfile parent)
  // et le warning "We detected multiple lockfiles" est levé.
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  // Permet d'importer @effinor/design-system et @effinor/lib (workspaces)
  transpilePackages: ['@effinor/design-system', '@effinor/lib'],
  // Images : autoriser Supabase Storage (utile dès que blog/réalisations seront en place)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
