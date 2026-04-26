import { Container, Section } from '@effinor/design-system'

const BRANDS = ['Daikin', 'Mitsubishi Electric', 'Atlantic', 'Ariston', 'Panasonic']

export function Partners() {
  return (
    <Section spacing="sm" variant="muted" id="partners">
      <Container size="site">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Marques partenaires — technologies reconnues par le marché
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12">
          {BRANDS.map((brand) => (
            <li
              key={brand}
              className="font-serif text-base font-semibold tracking-tight text-primary-900/70 sm:text-lg"
            >
              {brand}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
