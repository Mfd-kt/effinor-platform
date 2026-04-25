import { Quote, Star } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'
import { homeTestimonials } from '@/lib/testimonials-data'

export function Testimonials() {
  return (
    <Section spacing="lg" id="temoignages">
      <Container size="site">
        <div className="text-center max-w-content mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-700">
            Avis clients
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl lg:text-5xl">
            Ils nous ont fait confiance
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Particuliers, copropriétés, investisseurs : ils témoignent de leur
            expérience avec Effinor.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-medium text-accent-800">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            Témoignages d&apos;exemple — vrais avis bientôt en ligne
          </div>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {homeTestimonials.map((testimonial) => (
            <li
              key={testimonial.id}
              className="relative flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Quote mark décoratif */}
              <Quote
                className="absolute right-6 top-6 h-8 w-8 text-secondary-100"
                aria-hidden="true"
                strokeWidth={1.5}
              />

              {/* Rating */}
              <div
                className="flex items-center gap-0.5"
                aria-label={`Note ${testimonial.rating} sur 5`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < testimonial.rating
                        ? 'h-4 w-4 fill-accent-500 text-accent-500'
                        : 'h-4 w-4 text-muted-foreground/30'
                    }
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* Texte */}
              <blockquote className="mt-5 flex-1">
                <p className="text-[15px] leading-relaxed text-foreground">
                  « {testimonial.text} »
                </p>
              </blockquote>

              {/* Auteur */}
              <div className="mt-7 flex items-center gap-3 border-t border-border pt-5">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-500/10 text-sm font-semibold text-secondary-700 ring-1 ring-secondary-500/10"
                  aria-hidden="true"
                >
                  {testimonial.authorInitials}
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-foreground">{testimonial.authorName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {testimonial.authorCity} · {testimonial.service}
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
