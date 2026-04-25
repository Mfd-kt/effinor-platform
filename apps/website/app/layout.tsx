import type { Metadata } from 'next'
import { GeistSans, GeistMono } from '@effinor/design-system'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Effinor — Rénovation énergétique et CEE',
    template: '%s | Effinor',
  },
  description:
    "Effinor accompagne particuliers et professionnels dans leurs projets de rénovation énergétique : pompes à chaleur, système solaire combiné, rénovation globale.",
  metadataBase: new URL('https://effinor.fr'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Effinor',
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
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  )
}
