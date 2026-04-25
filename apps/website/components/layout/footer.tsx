import Link from 'next/link'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { Container } from '@effinor/design-system'
import { Logo } from '@/components/brand/logo'
import { mainNav, legalNav } from './nav-config'
import { siteConfig } from '@/lib/site-config'

export function Footer() {
  const currentYear = new Date().getFullYear()

  // Service links flat list (extraits des children de "Services")
  const servicesNav = mainNav.find((item) => item.label === 'Services')?.children ?? []

  return (
    <footer className="bg-primary-900 text-primary-100">
      <Container size="site">
        <div className="py-12 lg:py-16 grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Colonne 1 : Brand + adresse */}
          <div className="space-y-4">
            <Logo size="md" withText href="/" className="text-white" />
            <p className="text-sm text-primary-200 max-w-xs">
              {siteConfig.description}
            </p>
            <address className="not-italic text-sm space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-secondary-400" />
                <span className="text-primary-200">
                  {siteConfig.contact.address.full}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-secondary-400" />
                <span className="text-primary-200">
                  {siteConfig.contact.hours.label}
                </span>
              </div>
            </address>
          </div>

          {/* Colonne 2 : Services + Navigation */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Nos services
            </h2>
            <ul className="space-y-2 text-sm">
              {servicesNav.map((service) => (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className="text-primary-200 hover:text-white transition-colors"
                  >
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-3">
                Le groupe
              </h2>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/a-propos" className="text-primary-200 hover:text-white transition-colors">
                    À propos
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-primary-200 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Colonne 3 : Contact */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Nous contacter
            </h2>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="flex items-center gap-2 text-primary-200 hover:text-white transition-colors"
                >
                  <Mail className="h-4 w-4 text-secondary-400 shrink-0" />
                  {siteConfig.contact.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${siteConfig.contact.phoneE164}`}
                  className="flex items-center gap-2 text-primary-200 hover:text-white transition-colors"
                >
                  <Phone className="h-4 w-4 text-secondary-400 shrink-0" />
                  {siteConfig.contact.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bandeau légal */}
        <div className="border-t border-primary-800 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-primary-300">
          <p>
            © {currentYear} {siteConfig.legal.companyName}. Tous droits réservés.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white transition-colors">
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
