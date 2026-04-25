import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Section, Container } from '@effinor/design-system'
import { homeServices } from '@/lib/services-data'

export function ServicesGrid() {
  return (
    <Section spacing="lg">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-900 mb-4">
            Nos solutions de rénovation énergétique
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Des équipements performants, des aides maximisées, une installation
            clé en main par nos équipes certifiées RGE.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {homeServices.map((service) => {
            const Icon = service.icon
            return (
              <Link
                key={service.slug}
                href={service.href}
                className="group relative flex flex-col rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={service.imageSrc}
                    alt={service.imageAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  <div className="absolute top-3 left-3 bg-emerald-500 rounded-lg p-2 shadow">
                    <Icon className="h-5 w-5 text-white" />
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="inline-block bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      {service.benefitTagline}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col flex-1 bg-white p-4">
                  <h3 className="text-base font-semibold text-primary-900 mb-2 leading-snug">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-600 flex-1 leading-relaxed">
                    {service.shortDescription}
                  </p>
                  <div className="mt-4 flex items-center text-emerald-600 text-sm font-medium">
                    En savoir plus
                    <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
