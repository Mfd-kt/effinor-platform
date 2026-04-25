import { Section, Container } from '@effinor/design-system'
import { pillars } from '@/lib/why-effinor-data'

export function WhyEffinor() {
  return (
    <Section variant="muted" spacing="lg">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-900 mb-4">
            Pourquoi choisir Effinor ?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Un partenaire de confiance pour votre transition énergétique, de
            l&apos;étude à la réception des travaux.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.title}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-white shadow-sm"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-50 mb-5">
                  <Icon className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3">
                  {pillar.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
