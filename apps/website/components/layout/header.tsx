'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Phone, ChevronDown } from 'lucide-react'
import { Button, Container, cn } from '@effinor/design-system'
import { Logo } from '@/components/brand/logo'
import { mainNav } from './nav-config'
import type { SiteContact } from '@/lib/site-settings'

type HeaderProps = {
  contact: SiteContact
}

export function Header({ contact }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false)
        setServicesOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!mobileOpen) {
      setServicesOpen(false)
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  const closeMenu = () => {
    setMobileOpen(false)
    setServicesOpen(false)
  }

  const mobileNavLinkClass =
    'min-h-11 flex items-center rounded-md px-3 text-base font-medium text-foreground/80 active:bg-muted/80 hover:bg-muted hover:text-foreground transition-colors touch-manipulation'

  return (
    <header
      className={cn(
        'sticky top-0 z-sticky w-full transition-all duration-base pt-[env(safe-area-inset-top,0px)]',
        scrolled
          ? 'bg-background/90 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-background border-b border-transparent'
      )}
    >
      <Container size="site">
        <div className="flex h-16 items-center justify-between gap-3 lg:h-20">
          <Logo size="md" withText href="/" />

          <nav className="hidden lg:flex items-center gap-8" aria-label="Navigation principale">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href={`tel:${contact.phoneE164}`}
              className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              <Phone className="h-4 w-4" />
              {contact.phone}
            </a>
            <Button asChild variant="accent" size="md">
              <Link href="/contact">Demander un devis</Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden inline-flex h-11 min-w-11 touch-manipulation items-center justify-center rounded-md p-2.5 text-foreground/80 hover:bg-muted active:bg-muted/80 transition-colors"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen ? (
          <div
            id="mobile-nav"
            className="lg:hidden max-h-[min(70dvh,520px)] overflow-y-auto overscroll-y-contain border-t border-border py-2"
            role="dialog"
            aria-label="Menu de navigation"
          >
            <nav className="flex flex-col gap-0" aria-label="Navigation mobile">
              {mainNav.map((item) => {
                if (item.children && item.children.length > 0) {
                  return (
                    <div key={item.label} className="border-b border-border/60 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setServicesOpen((o) => !o)}
                        aria-expanded={servicesOpen}
                        className="flex w-full min-h-11 items-center justify-between gap-2 px-3 py-2.5 text-left text-base font-medium text-foreground touch-manipulation"
                      >
                        {item.label}
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                            servicesOpen && 'rotate-180'
                          )}
                          aria-hidden="true"
                        />
                      </button>
                      {servicesOpen ? (
                        <div className="border-t border-border/40 bg-muted/20 px-2 pb-2 pt-0">
                          <Link
                            href={item.href}
                            className="mt-1 block min-h-11 rounded-md border border-transparent px-3 py-2.5 text-sm font-medium text-foreground/90 hover:border-border hover:bg-card active:bg-muted/80"
                            onClick={closeMenu}
                          >
                            Tous les services
                          </Link>
                          <ul className="ml-0 space-y-0 border-l-2 border-secondary-300/50 pl-3" role="list">
                            {item.children.map((child) => (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className="block min-h-11 py-2.5 pl-0 text-sm leading-snug text-foreground/80 hover:text-foreground active:text-foreground"
                                  onClick={closeMenu}
                                >
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={mobileNavLinkClass}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-2 flex flex-col gap-2 border-t border-border px-1 pt-3">
              <a
                href={`tel:${contact.phoneE164}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-foreground/80 hover:bg-muted active:bg-muted/80"
              >
                <Phone className="h-4 w-4 shrink-0" />
                {contact.phone}
              </a>
              <Button asChild variant="accent" size="md" fullWidth className="touch-manipulation">
                <Link href="/contact" onClick={closeMenu}>
                  Demander un devis
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </Container>
    </header>
  )
}
