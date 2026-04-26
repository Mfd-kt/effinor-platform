import { Container, Section } from '@effinor/design-system'
import { Simulator } from '@/components/simulator/simulator'
import { landingConfig } from '@/lib/site-config'

/**
 * Wrapper serveur qui injecte les coordonnées contact dans le simulateur
 * (pour l'écran de remerciement). La landing PAC utilise une config statique
 * (pas de lecture Supabase).
 */
export function SimulatorSection() {
  return (
    <Section
      spacing="lg"
      id="simulateur"
      className="bg-gradient-to-b from-primary-50 to-background"
    >
      <Container size="hero">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
            Simulateur gratuit
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            Combien d&apos;aides pour votre PAC ?
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            6 questions pour estimer vos primes CEE et MaPrimeRénov&apos;. Un conseiller
            Effinor vous recontacte sous 24h ouvrées.
          </p>
        </div>

        <div className="mt-10">
          <Simulator
            contact={{
              phone: landingConfig.contact.phone,
              phoneE164: landingConfig.contact.phoneE164,
              email: landingConfig.contact.email,
            }}
          />
        </div>
      </Container>
    </Section>
  )
}
