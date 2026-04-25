import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
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
