import { Button, Container, Section } from '@effinor/design-system'

export default function HomePage() {
  return (
    <>
      <Section variant="hero" spacing="xl">
        <Container size="hero">
          <p className="text-secondary-300 text-sm font-semibold uppercase tracking-widest">
            EFFINOR — Site en construction
          </p>
          <h1 className="text-5xl font-bold mt-4 sm:text-6xl">
            Hello Effinor
          </h1>
          <p className="text-xl mt-6 text-primary-200 max-w-content">
            Le scaffolding Next.js 16 fonctionne ✅. Design system intégré, fonts Geist chargées,
            tokens CSS actifs. Header et Footer en place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="accent" size="lg">
              Bouton Accent
            </Button>
            <Button variant="secondary" size="lg">
              Bouton Secondary
            </Button>
            <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
              Bouton Outline
            </Button>
          </div>
        </Container>
      </Section>

      <Section spacing="lg">
        <Container size="site">
          <h2 className="text-3xl font-semibold">Vérification du design system</h2>
          <p className="text-muted-foreground mt-2">
            Cette page confirme que les tokens CSS, les composants partagés, la police Geist
            ainsi que le Header et le Footer sont correctement intégrés.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="rounded-lg bg-primary-50 p-6 border border-primary-200">
              <p className="text-xs font-semibold text-primary-600 uppercase">Primary</p>
              <p className="text-2xl font-bold text-primary-900 mt-1">Slate</p>
            </div>
            <div className="rounded-lg bg-secondary-50 p-6 border border-secondary-200">
              <p className="text-xs font-semibold text-secondary-600 uppercase">Secondary</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">Emerald</p>
            </div>
            <div className="rounded-lg bg-accent-50 p-6 border border-accent-200">
              <p className="text-xs font-semibold text-accent-600 uppercase">Accent</p>
              <p className="text-2xl font-bold text-accent-900 mt-1">Amber</p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
