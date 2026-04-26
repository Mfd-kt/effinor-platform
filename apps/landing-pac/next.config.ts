import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Force la racine de tracing à la racine du monorepo.
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  // Permet d'importer @effinor/design-system et @effinor/lib (workspaces)
  transpilePackages: ['@effinor/design-system', '@effinor/lib'],
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
