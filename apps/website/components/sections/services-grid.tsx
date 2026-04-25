import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'
import { homeServices } from '@/lib/services-data'

export function ServicesGrid() {
  return (
    <Section spacing="lg" id="services">
      <Container size="site">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary-700">
              Nos solutions
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl lg:text-5xl">
              Toute la rénovation énergétique sous un même toit
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Équipements performants, aides maximisées, installation clé en main par
            nos équipes certifiées RGE.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {homeServices.map((service) => {
            const Icon = service.icon
            return (
              <li key={service.slug} className="group h-full">
                <Link
                  href={service.href}
                  className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-base hover:-translate-y-1 hover:border-secondary-300 hover:shadow-xl hover:shadow-secondary-500/10"
                >
                  {/* Halo gradient au hover */}
                  <div
                    className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-secondary-50 via-transparent to-transparent opacity-0 transition-opacity duration-base group-hover:opacity-100"
                    aria-hidden="true"
                  />

                  {/* Icone */}
                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-500/10 text-secondary-700 ring-1 ring-secondary-500/10 transition-colors group-hover:bg-secondary-500 group-hover:text-white">
                      <Icon className="h-7 w-7" />
                    </div>
                    <span
                      className="absolute right-0 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground/0 text-foreground/0 transition-all group-hover:bg-foreground group-hover:text-background"
                      aria-hidden="true"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>

                  {/* Tagline bénéfice */}
                  <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-accent-700">
                    {service.benefitTagline}
                  </p>

                  {/* Titre */}
                  <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight text-primary-900 group-hover:text-primary-900">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {service.shortDescription}
                  </p>

                  {/* Lien */}
                  <span className="mt-6 inline-flex items-center text-sm font-semibold text-secondary-700">
                    En savoir plus
                    <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}
