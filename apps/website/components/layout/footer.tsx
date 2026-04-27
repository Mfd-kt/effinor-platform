import Link from 'next/link'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { Container } from '@effinor/design-system'
import { Logo } from '@/components/brand/logo'
import { mainNav, legalNav } from './nav-config'
import { siteConfig } from '@/lib/site-config'
import type { SiteContact } from '@/lib/site-settings'

type FooterProps = {
  contact: SiteContact
}

const accentHeading = 'text-xs font-semibold uppercase tracking-[0.2em] text-primary-300'

export function Footer({ contact }: FooterProps) {
  const currentYear = new Date().getFullYear()
  const servicesNav = mainNav.find((item) => item.label === 'Services')?.children ?? []
  const exploreNav = mainNav.filter(
    (item) => !item.children && item.href !== '/'
  )

  return (
    <footer className="border-t border-primary-800/60 bg-primary-900 text-primary-100">
      <Container
        size="site"
        className="pt-3 md:pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] md:pb-6"
      >
        <div className="grid grid-cols-1 gap-6 md:gap-7 lg:grid-cols-12 lg:items-start lg:gap-8">
          {/* Marque + adresse */}
          <div className="lg:col-span-4">
            <Logo size="md" withText href="/" className="text-white" />
            <p className="mt-2.5 max-w-sm text-pretty text-sm leading-relaxed text-primary-200/95">
              {siteConfig.description}
            </p>
            <address className="not-italic mt-3.5 space-y-1.5 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-secondary-400" aria-hidden="true" />
                <span className="text-pretty text-primary-200">{contact.address.full}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-secondary-400" aria-hidden="true" />
                <span className="text-primary-200">{contact.hours.label}</span>
              </div>
            </address>
          </div>

          {/* Services | Explorer : deux colonnes équilibrées, plus d’espace mort */}
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 min-[400px]:gap-x-5 min-[400px]:gap-y-0 gap-5 lg:col-span-5 lg:gap-8">
            <div>
              <h2 className={accentHeading}>Nos services</h2>
              <ul className="mt-2.5 space-y-1.5 text-sm" role="list">
                {servicesNav.map((service) => (
                  <li key={service.href}>
                    <Link
                      href={service.href}
                      className="break-words text-pretty text-primary-200/95 transition-colors hover:text-white"
                    >
                      {service.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className={accentHeading}>Explorer</h2>
              <ul className="mt-2.5 space-y-1.5 text-sm" role="list">
                {exploreNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="break-words text-primary-200/95 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h2 className={accentHeading}>Contact</h2>
            <ul className="mt-2.5 space-y-2.5 text-sm" role="list">
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="group flex items-center gap-2.5 text-primary-200/95 hover:text-white transition-colors"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-800/80 text-secondary-400 group-hover:text-secondary-300">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {contact.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${contact.phoneE164}`}
                  className="group flex items-center gap-2.5 text-primary-200/95 hover:text-white transition-colors"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-800/80 text-secondary-400 group-hover:text-secondary-300">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {contact.phone}
                </a>
              </li>
            </ul>
            <p className="mt-2.5 text-xs leading-relaxed text-primary-400/90">
              Réponse sous 24h ouvrées — devis personnalisé.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 border-t border-primary-800/70 py-3 text-xs text-primary-400/95 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:py-2.5">
          <p>
            © {currentYear} {siteConfig.legal.companyName}. Tous droits réservés.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-primary-200 transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  )
}
