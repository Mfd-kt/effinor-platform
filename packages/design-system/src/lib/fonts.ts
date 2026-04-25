/**
 * Re-export des fonts Geist et Geist Mono pour usage dans les apps Next.js.
 *
 * Usage :
 *   import { GeistSans, GeistMono } from '@effinor/design-system/lib/fonts'
 *
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable}`}>
 *         <body>{children}</body>
 *       </html>
 *     )
 *   }
 */
export { GeistSans } from 'geist/font/sans'
export { GeistMono } from 'geist/font/mono'
