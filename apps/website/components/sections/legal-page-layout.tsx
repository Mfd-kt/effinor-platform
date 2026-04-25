import { Container, Section } from '@effinor/design-system'

interface LegalPageLayoutProps {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

/**
 * Layout commun aux pages légales (mentions, CGV, politique de confidentialité).
 *
 * Style "prose" simple : titres, paragraphes, listes lisibles.
 * À enrichir si besoin avec @tailwindcss/typography plus tard.
 */
export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  return (
    <Section spacing="lg">
      <Container size="content">
        <header className="mb-10 border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Dernière mise à jour : {lastUpdated}
          </p>
        </header>

        <div className="space-y-8 text-foreground [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:text-muted-foreground [&_a]:underline-offset-2 [&_a]:hover:underline [&_a]:text-secondary-700">
          {children}
        </div>
      </Container>
    </Section>
  )
}
