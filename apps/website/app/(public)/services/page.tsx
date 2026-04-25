import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'
import { homeServices } from '@/lib/services-data'
import { FinalCTA } from '@/components/sections/final-cta'

export const metadata: Metadata = {
  title: 'Nos services',
  description:
    "Pompe à chaleur (maison ou immeuble), système solaire combiné, rénovation globale : découvrez l'ensemble des solutions de rénovation énergétique proposées par Effinor.",
  openGraph: {
    title: 'Nos services de rénovation énergétique',
    description:
      "Solutions complètes de rénovation énergétique : PAC, SSC, rénovation globale.",
  },
}

export default function ServicesPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-primary-50 to-background">
        <Container size="site">
          <div className="py-14 lg:py-20 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
              Nos services
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Des solutions sur-mesure pour chaque projet
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Du remplacement d&apos;une chaudière individuelle au pilotage d&apos;une
              rénovation globale en copropriété, nous adaptons la solution à votre
              logement, vos besoins et votre budget — en mobilisant systématiquement
              toutes les aides disponibles.
            </p>
          </div>
        </Container>
      </section>

      <Section spacing="lg">
        <Container size="site">
          <ul className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {homeServices.map((service) => {
              const Icon = service.icon
              return (
                <li key={service.slug}>
                  <Link
                    href={service.href}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <Image
                        src={service.imageSrc}
                        alt={service.imageAlt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                      <div className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-500 text-white shadow">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="inline-block rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                          {service.benefitTagline}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="text-xl font-semibold tracking-tight text-primary-900">
                        {service.title}
                      </h2>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {service.shortDescription}
                      </p>
                      <span className="mt-5 inline-flex items-center text-sm font-semibold text-secondary-700 group-hover:text-secondary-800">
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

      <FinalCTA />
    </>
  )
}
