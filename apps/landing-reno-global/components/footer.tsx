import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'
import { Container } from '@effinor/design-system'

import { landingConfig } from '@/lib/site-config'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-primary-900 text-primary-100">
      <Container size="site">
        <div className="grid gap-8 py-12 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold tracking-tight text-white">{landingConfig.name}</p>
            <p className="mt-2 max-w-xs text-sm text-primary-200">
              {landingConfig.tagline}. Certifié RGE QualiPAC, délégataire CEE.
            </p>
          </div>

          <nav aria-label="Liens utiles" className="text-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary-300">
              Effinor
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href={landingConfig.mainSiteUrl}
                  className="hover:text-white"
                  rel="noopener"
                >
                  Site principal (effinor.fr)
                </Link>
              </li>
              <li>
                <Link
                  href={`${landingConfig.mainSiteUrl}/contact`}
                  className="hover:text-white"
                  rel="noopener"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href={`${landingConfig.mainSiteUrl}/mentions-legales`}
                  className="hover:text-white"
                  rel="noopener"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  href={`${landingConfig.mainSiteUrl}/politique-de-confidentialite`}
                  className="hover:text-white"
                  rel="noopener"
                >
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </nav>

          <div className="text-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary-300">
              Nous joindre
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href={`tel:${landingConfig.contact.phoneE164}`}
                  className="inline-flex items-center gap-2 hover:text-white"
                >
                  <Phone className="h-4 w-4 text-secondary-300" aria-hidden="true" />
                  {landingConfig.contact.phone}
                </a>
                <p className="mt-0.5 text-xs text-primary-300">{landingConfig.contact.hours}</p>
              </li>
              <li>
                <a
                  href={`mailto:${landingConfig.contact.email}`}
                  className="inline-flex items-center gap-2 break-all hover:text-white"
                >
                  <Mail className="h-4 w-4 shrink-0 text-secondary-300" aria-hidden="true" />
                  {landingConfig.contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="border-t border-white/10 py-6 text-center text-xs text-primary-300">
          © {year} {landingConfig.legal.companyName}. Tous droits réservés.
        </p>
      </Container>
    </footer>
  )
}
