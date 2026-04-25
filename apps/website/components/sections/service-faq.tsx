import { Container, Section } from '@effinor/design-system'

export interface FAQItem {
  question: string
  answer: string
}

interface ServiceFAQProps {
  title?: string
  description?: string
  items: FAQItem[]
}

export function ServiceFAQ({
  title = 'Questions fréquentes',
  description,
  items,
}: ServiceFAQProps) {
  return (
    <Section spacing="lg" variant="muted">
      <Container size="content">
        <div className="text-center max-w-content mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          {description && (
            <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-card">
          {items.map((item, idx) => (
            <details
              key={idx}
              className="group p-5 sm:p-6 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold tracking-tight">
                <span>{item.question}</span>
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-secondary-600 transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  )
}
