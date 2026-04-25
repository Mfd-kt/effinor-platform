import Image from 'next/image'
import { Container } from '@effinor/design-system'

export function AboutHero() {
  return (
    <section className="bg-gradient-to-b from-primary-50 to-background">
      <Container size="site">
        <div className="grid grid-cols-1 gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24 lg:items-center">
          {/* Texte */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
              À propos d&apos;Effinor
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              La rénovation énergétique{' '}
              <span className="text-secondary-600">simple et accessible</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Effinor accompagne les particuliers et professionnels dans leur transition
              énergétique depuis 2018. Notre mission : rendre la rénovation énergétique
              simple, transparente et financièrement accessible, grâce à une expertise
              technique de pointe et une maîtrise complète des aides publiques.
            </p>
          </div>

          {/* Photo équipe */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl ring-1 ring-border lg:aspect-square">
            <Image
              src="/images/services/pac-maison.jpg"
              alt="Équipe Effinor au travail sur une installation de pompe à chaleur"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-primary-900/20 via-transparent to-transparent"
              aria-hidden="true"
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
