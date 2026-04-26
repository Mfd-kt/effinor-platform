import type { Metadata, Viewport } from 'next'
import { GeistSans, GeistMono } from '@effinor/design-system'

import { landingConfig } from '@/lib/site-config'
import '../styles/globals.css'

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(landingConfig.url),
  title: {
    default: `Pompe à chaleur air-eau — ${landingConfig.name}`,
    template: `%s | ${landingConfig.name}`,
  },
  description: landingConfig.description,
  keywords: [
    'pompe à chaleur air-eau',
    'PAC maison individuelle',
    'CEE pompe à chaleur',
    'MaPrimeRénov PAC',
    'installation pompe à chaleur',
    'aide pompe à chaleur 2026',
    'chauffage économique maison',
    'RGE QualiPAC',
  ],
  authors: [{ name: landingConfig.name, url: landingConfig.url }],
  creator: landingConfig.name,
  publisher: landingConfig.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: landingConfig.url,
    siteName: landingConfig.name,
    title: `Pompe à chaleur air-eau — ${landingConfig.name}`,
    description: landingConfig.description,
  },
  twitter: {
    card: 'summary',
    title: `Pompe à chaleur air-eau — ${landingConfig.name}`,
    description: landingConfig.description,
  },
  alternates: {
    canonical: landingConfig.url,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="fr"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}
