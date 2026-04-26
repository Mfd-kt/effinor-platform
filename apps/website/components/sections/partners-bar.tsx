import { Container } from '@effinor/design-system'

const PARTNERS = [
  'Daikin',
  'Mitsubishi',
  'Atlantic',
  'Ariston',
  'Panasonic',
] as const

export function PartnersBar() {
  return (
    <section
      aria-label="Marques partenaires"
      className="border-y border-border/60 bg-muted/60"
    >
      <Container size="site">
        <div className="flex flex-col items-center justify-center gap-2 py-4 sm:flex-row sm:gap-6 sm:py-5">
          <p className="text-center font-serif text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:text-left">
            Partenaires installés
          </p>
          <p className="text-center font-serif text-sm text-foreground/80 sm:text-left">
            <span className="hidden sm:inline" aria-hidden="true">
              &nbsp;·&nbsp;
            </span>
            {PARTNERS.join(' · ')}
          </p>
        </div>
      </Container>
    </section>
  )
}
