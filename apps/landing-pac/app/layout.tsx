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
  "Pompe à chaleur air-eau maison — Aides CEE + MaPrimeRénov' 2026 | Effinor"
const SEO_DESCRIPTION =
  "Installez votre pompe à chaleur air-eau avec Effinor : jusqu'à 11 000 € d'aides CEE + MaPrimeRénov' déduites du devis. RGE QualiPAC, garantie décennale, étude gratuite sous 24 h."

export const metadata: Metadata = {
  metadataBase: new URL(landingConfig.url),
  title: {
    default: SEO_TITLE,
    template: `%s | ${landingConfig.name}`,
  },
  description: SEO_DESCRIPTION,
  keywords: [
    'pompe à chaleur air-eau',
    'PAC maison individuelle',
    'installation pompe à chaleur',
    'CEE pompe à chaleur',
    'coup de pouce chauffage',
    "MaPrimeRénov' pompe à chaleur",
    'éco-PTZ',
    'RGE QualiPAC',
    'remplacement chaudière gaz',
    'remplacement chaudière fioul',
    'PAC basse température',
    'PAC haute température',
    'COP SCOP pompe à chaleur',
    'chauffage et eau chaude sanitaire',
    'aide pompe à chaleur 2026',
    'prime énergie PAC',
    'Daikin Altherma',
    'Mitsubishi Ecodan',
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
