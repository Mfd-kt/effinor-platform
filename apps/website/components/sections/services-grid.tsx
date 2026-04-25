import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'
import { homeServices } from '@/lib/services-data'

export function ServicesGrid() {
  return (
    <Section spacing="lg" id="services">
      <Container size="site">
        <div className="text-center max-w-content mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
            Nos solutions
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            Toute la rénovation énergétique sous un même toit
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Équipements performants, aides maximisées, installation clé en main par
            nos équipes certifiées RGE.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {homeServices.map((service) => {
            const Icon = service.icon
            return (
              <li key={service.slug}>
                <Link
                  href={service.href}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-base hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={service.imageSrc}
                      alt={service.imageAlt}
                      fill
                      className="object-cover transition-transform duration-slower group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-900/70 via-primary-900/10 to-transparent" />

                    <div className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-500 text-white shadow-md">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="inline-block rounded-full bg-accent-500 px-2.5 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
                        {service.benefitTagline}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-semibold leading-snug tracking-tight text-primary-900">
                      {service.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {service.shortDescription}
                    </p>
                    <span className="mt-4 inline-flex items-center text-sm font-semibold text-secondary-700 group-hover:text-secondary-800">
                      En savoir plus
                      <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}
