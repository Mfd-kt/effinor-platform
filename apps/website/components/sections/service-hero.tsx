import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { Button, Container } from '@effinor/design-system'
import { getSiteContact } from '@/lib/site-settings'

interface ServiceHeroProps {
  eyebrow: string
  title: React.ReactNode
  description: string
  imageSrc: string
  imageAlt: string
  benefitTagline?: string
}

export async function ServiceHero({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  benefitTagline,
}: ServiceHeroProps) {
  const contact = await getSiteContact()
  return (
    <section className="bg-gradient-to-b from-primary-50 to-background">
      <Container size="site">
        <div className="grid grid-cols-1 gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>

            {benefitTagline && (
              <p className="mt-6 inline-flex items-center rounded-full bg-secondary-50 px-3 py-1.5 text-sm font-semibold text-secondary-700 ring-1 ring-secondary-200">
                {benefitTagline}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="accent" size="lg">
                <Link href="/contact">
                  Étude gratuite
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={`tel:${contact.phoneE164}`}>
                  <Phone className="mr-1 h-4 w-4" />
                  {contact.phone}
                </a>
              </Button>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl ring-1 ring-border lg:aspect-square">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
