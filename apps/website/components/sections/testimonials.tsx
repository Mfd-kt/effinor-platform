import { Star } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'
import { homeTestimonials } from '@/lib/testimonials-data'

export function Testimonials() {
  return (
    <Section spacing="lg" id="temoignages">
      <Container size="site">
        <div className="text-center max-w-content mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
            Avis clients
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Ils nous ont fait confiance
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Particuliers, copropriétés, investisseurs : ils témoignent de leur
            expérience avec Effinor.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-xs font-medium text-accent-800 ring-1 ring-accent-200">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            Témoignages d&apos;exemple — vrais avis bientôt en ligne
          </div>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {homeTestimonials.map((testimonial) => (
            <li
              key={testimonial.id}
              className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-0.5" aria-label={`Note ${testimonial.rating} sur 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < testimonial.rating
                        ? 'h-4 w-4 fill-accent-500 text-accent-500'
                        : 'h-4 w-4 text-gray-300'
                    }
                    aria-hidden="true"
                  />
                ))}
              </div>

              <blockquote className="mt-4 flex-1">
                <p className="text-sm leading-relaxed text-foreground">
                  « {testimonial.text} »
                </p>
              </blockquote>

              <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 text-sm font-semibold text-secondary-700"
                  aria-hidden="true"
                >
                  {testimonial.authorInitials}
                </div>
                <div className="text-sm">
                  <p className="font-semibold">{testimonial.authorName}</p>
                  <p className="text-xs text-muted-foreground">
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
