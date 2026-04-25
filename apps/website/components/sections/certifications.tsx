import { BadgeCheck } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'
import { certifications } from '@/lib/about-data'

export function Certifications() {
  return (
    <Section spacing="lg" variant="muted" id="certifications">
      <Container size="site">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
          {/* Colonne gauche : intro */}
          <div className="lg:col-span-1">
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
              Certifications
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Des labels qui garantissent votre tranquillité
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Nos certifications sont la preuve de notre engagement qualité. Elles
              vous garantissent l&apos;éligibilité aux aides publiques et la conformité
              technique de nos installations.
            </p>
          </div>

          {/* Colonne droite : liste certifications */}
          <ul className="space-y-5 lg:col-span-2">
            {certifications.map((cert) => (
              <li
                key={cert.code}
                className="flex gap-5 rounded-xl border border-border bg-card p-5 lg:p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary-500 text-white">
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {cert.code}
                    </h3>
                    <p className="text-sm font-medium text-secondary-700">
                      {cert.name}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {cert.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  )
}
