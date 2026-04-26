import type { Metadata } from 'next'
import { Mail, Phone, MapPin, Clock, ShieldCheck } from 'lucide-react'
import { Container, Section } from '@effinor/design-system'
import { getSiteContact } from '@/lib/site-settings'
import { ContactForm } from './contact-form'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    "Contactez Effinor pour toute demande d'information ou devis : pompe à chaleur, système solaire combiné, rénovation globale. Étude gratuite et sans engagement.",
  openGraph: {
    title: 'Contactez Effinor',
    description:
      "Étude gratuite et sans engagement pour votre projet de rénovation énergétique.",
  },
}

export default async function ContactPage() {
  const contact = await getSiteContact()
  return (
    <>
      <section className="bg-gradient-to-b from-primary-50 to-background">
        <Container size="site">
          <div className="py-14 lg:py-20 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary-600">
              Contact
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Parlons de votre projet
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Décrivez-nous votre projet, votre logement et vos besoins.
              Notre équipe vous répond sous 24h ouvrées avec une première
              estimation des aides mobilisables et la prochaine étape recommandée.
            </p>
          </div>
        </Container>
      </section>

      <Section spacing="lg">
        <Container size="site">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-12">
            {/* Formulaire (2/3) */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:p-10">
                <h2 className="text-xl font-semibold tracking-tight">
                  Envoyez-nous un message
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Champs marqués d&apos;un <span className="text-destructive">*</span> obligatoires.
                </p>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>
            </div>

            {/* Sidebar infos contact (1/3) */}
            <aside className="space-y-6">
              <div className="rounded-2xl bg-primary-900 p-6 text-primary-100 sm:p-8">
                <h2 className="text-lg font-semibold text-white">Nous joindre directement</h2>

                <ul className="mt-6 space-y-5 text-sm">
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-secondary-400" />
                    <div>
                      <p className="font-medium text-white">Téléphone</p>
                      <a
                        href={`tel:${contact.phoneE164}`}
                        className="mt-0.5 block text-primary-200 hover:text-white transition-colors"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-secondary-400" />
                    <div>
                      <p className="font-medium text-white">Email</p>
                      <a
                        href={`mailto:${contact.email}`}
                        className="mt-0.5 block text-primary-200 hover:text-white transition-colors break-all"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-secondary-400" />
                    <div>
                      <p className="font-medium text-white">Adresse</p>
                      <address className="not-italic mt-0.5 text-primary-200">
                        {contact.address.street}
                        <br />
                        {contact.address.postalCode}{' '}
                        {contact.address.city}
                      </address>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-secondary-400" />
                    <div>
                      <p className="font-medium text-white">Horaires</p>
                      <p className="mt-0.5 text-primary-200">{contact.hours.label}</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-muted/40 p-6 sm:p-7">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary-600" />
                  <div className="text-sm">
                    <p className="font-semibold tracking-tight">Vos données sont protégées</p>
                    <p className="mt-1.5 text-muted-foreground leading-relaxed">
                      Vos informations sont stockées en France et utilisées uniquement
                      pour traiter votre demande. Aucun partage commercial avec des tiers.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  )
}
