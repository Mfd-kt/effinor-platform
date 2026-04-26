import { Quote, Star } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'

type Testimonial = {
  author: string
  location: string
  initials: string
  rating: 1 | 2 | 3 | 4 | 5
  text: string
  service: string
  date: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    author: 'Sophie L.',
    location: 'Lyon (69)',
    initials: 'SL',
    rating: 5,
    text:
      "Accompagnement de bout en bout, équipe à l'écoute et chantier propre. Ma facture de chauffage a baissé de 60 % dès le premier hiver. Je recommande Effinor sans hésiter.",
    service: 'Pompe à chaleur air-eau',
    date: 'Mars 2026',
  },
  {
    author: 'Karim B.',
    location: 'Toulouse (31)',
    initials: 'KB',
    rating: 5,
    text:
      "J'avais peur de la complexité administrative des aides. Effinor a tout géré : MaPrimeRénov', CEE, éco-PTZ. Au final 14 000 € d'aides sur un projet de 18 000 €.",
    service: 'PAC Daikin Altherma 3',
    date: 'Janvier 2026',
  },
  {
    author: 'Marie-Hélène P.',
    location: 'Nantes (44)',
    initials: 'MP',
    rating: 5,
    text:
      "Étude technique sérieuse, devis clair, installation impeccable en 2 jours. Le suivi par l'équipe technique a été parfait. Très bon rapport qualité-prix.",
    service: 'Mitsubishi Ecodan + ECS',
    date: 'Février 2026',
  },
]

export function Testimonials() {
  return (
    <Section spacing="md" id="avis">
      <Container size="site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary-700">
            Ils ont choisi Effinor
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">
            Plus de 2 500 foyers équipés
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Note moyenne{' '}
            <strong className="font-semibold text-foreground">4,7 / 5</strong> sur Google —
            voici quelques retours récents.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-medium text-accent-800">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            Témoignages d&apos;exemple — vrais avis bientôt synchronisés depuis Google
          </div>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <li
              key={t.author}
              className="relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <Quote
                className="absolute right-5 top-5 h-7 w-7 text-secondary-100"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <div
                className="flex items-center gap-0.5"
                aria-label={`Note ${t.rating} sur 5`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < t.rating
                        ? 'h-4 w-4 fill-accent-500 text-accent-500'
                        : 'h-4 w-4 text-muted-foreground/30'
                    }
                    aria-hidden="true"
                  />
                ))}
              </div>
              <blockquote className="mt-4 flex-1">
                <p className="text-[15px] leading-relaxed text-foreground">« {t.text} »</p>
              </blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-500/10 text-sm font-semibold text-secondary-700 ring-1 ring-secondary-500/10"
                  aria-hidden="true"
                >
                  {t.initials}
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-foreground">{t.author}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.location} · {t.service} · {t.date}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
