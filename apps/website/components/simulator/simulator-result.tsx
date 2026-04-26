'use client'

import Link from 'next/link'
import { CheckCircle2, Clock, Phone, Mail } from 'lucide-react'
import { Button } from '@effinor/design-system'

type SimulatorResultProps = {
  firstName: string
  phoneDisplay: string
  contactPhone: string
  contactPhoneE164: string
  contactEmail: string
}

export function SimulatorResult({
  firstName,
  phoneDisplay,
  contactPhone,
  contactPhoneE164,
  contactEmail,
}: SimulatorResultProps) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
        <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
      </div>

      <h3 className="mt-6 text-2xl font-bold tracking-tight text-primary-900 sm:text-3xl">
        Merci {firstName} !
      </h3>

      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
        Votre demande a bien été reçue. Un conseiller Effinor vous contacte{' '}
        <strong className="font-semibold text-foreground">sous 24h ouvrées</strong> au{' '}
        <span className="font-mono text-foreground">{phoneDisplay}</span> pour étudier les
        aides mobilisables sur votre projet.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-5 text-left sm:p-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-secondary-700">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Vous souhaitez avancer plus vite ?
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Appelez-nous directement, nous pouvons qualifier votre projet en quelques minutes.
        </p>

        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Téléphone
            </dt>
            <dd className="mt-0.5">
              <a
                href={`tel:${contactPhoneE164}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-700 hover:text-secondary-800"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {contactPhone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </dt>
            <dd className="mt-0.5">
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 break-all text-sm font-semibold text-secondary-700 hover:text-secondary-800"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                {contactEmail}
              </a>
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline" size="md">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  )
}
