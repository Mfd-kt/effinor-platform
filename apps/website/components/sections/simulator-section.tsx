import { Container, Section } from '@effinor/design-system'

import { Simulator } from '@/components/simulator/simulator'
import { getSiteContact } from '@/lib/site-settings'

/**
 * Section simulateur CEE — intégrable sur la home et sur les pages services.
 * Charge les coordonnées (téléphone, email) côté serveur puis délègue au
 * composant client `Simulator` (stateful).
 */
export async function SimulatorSection() {
  const contact = await getSiteContact()

  return (
    <Section spacing="lg" variant="muted" id="simulateur">
      <Container size="hero">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
            Simulateur gratuit
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Combien d&apos;aides pouvez-vous obtenir ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Répondez à 6 questions et recevez une estimation personnalisée. Gratuit,
            sans engagement, résultat immédiat.
          </p>
        </div>
        <Simulator contact={contact} />
      </Container>
    </Section>
  )
}
