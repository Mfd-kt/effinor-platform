import type { Metadata, Viewport } from 'next'
import { GeistSans, GeistMono } from '@effinor/design-system'

import { JsonLd } from '@/components/seo/json-ld'
import { landingConfig } from '@/lib/site-config'
import '../styles/globals.css'

export const viewport: Viewport = {
  themeColor: '#0C2B5C',
  width: 'device-width',
  initialScale: 1,
}

const SEO_TITLE =
  "Rénovation globale maison — Aides 90% CEE + MaPrimeRénov' 2026 | Effinor"
const SEO_DESCRIPTION =
  "Rénovez votre maison de A à Z avec Effinor : jusqu'à 90 % du montant financé par les aides CEE (BAR-TH-174) et MaPrimeRénov'. 2 sauts de classe DPE minimum, audit énergétique inclus, dossier géré de A à Z."

export const metadata: Metadata = {
  metadataBase: new URL(landingConfig.url),
  title: {
    default: SEO_TITLE,
    template: `%s | ${landingConfig.name}`,
  },
  description: SEO_DESCRIPTION,
  keywords: [
    'rénovation globale maison',
    'BAR-TH-174',
    'rénovation énergétique',
    'aide rénovation énergétique 2026',
    "MaPrimeRénov' rénovation d'ampleur",
    'coup de pouce rénovation performante',
    'saut de classe DPE',
    'audit énergétique CEE',
    'travaux isolation maison',
    'isolation combles',
    'isolation sous-sol',
    'isolation murs intérieur',
    'VMC hygro B',
    'ballon thermodynamique BTD',
    'rénovation performante',
    'bouquet de travaux',
    'rénovation passoire thermique',
    'classe DPE F G rénovation',
  ],
  authors: [{ name: landingConfig.name, url: landingConfig.mainSiteUrl }],
  creator: landingConfig.name,
  publisher: landingConfig.name,
  category: 'Rénovation énergétique',
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
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
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
      <body className="bg-background text-foreground antialiased">
        {children}
        <JsonLd />
      </body>
    </html>
  )
}
