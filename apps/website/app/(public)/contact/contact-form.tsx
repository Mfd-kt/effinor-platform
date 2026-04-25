'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Send } from 'lucide-react'
import { Button, Input, Label, cn } from '@effinor/design-system'
import {
  initialContactState,
  submitContactForm,
  type ContactFormState,
} from './actions'

const SUBJECT_OPTIONS = [
  { value: '', label: '— Sélectionnez un sujet —' },
  { value: 'pac-maison', label: 'Pompe à chaleur — Maison individuelle' },
  { value: 'pac-immeuble', label: 'Pompe à chaleur — Immeuble collectif' },
  { value: 'systeme-solaire-combine', label: 'Système solaire combiné (SSC)' },
  { value: 'renovation-globale', label: 'Rénovation globale' },
  { value: 'aides-financement', label: 'Aides & financement' },
  { value: 'autre', label: 'Autre demande' },
] as const

export function ContactForm() {
  const [state, formAction] = useActionState<ContactFormState, FormData>(
    submitContactForm,
    initialContactState
  )

  const values = state.values ?? {}
  const errors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* Honeypot anti-bot : caché aux humains, rempli uniquement par les bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <Label htmlFor="website">Site web</Label>
        <Input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state.status === 'error' && state.message && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          id="firstName"
          name="firstName"
          label="Prénom"
          autoComplete="given-name"
          required
          defaultValue={values.firstName}
          error={errors.firstName}
        />
        <Field
          id="lastName"
          name="lastName"
          label="Nom"
          autoComplete="family-name"
          required
          defaultValue={values.lastName}
          error={errors.lastName}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          defaultValue={values.email}
          error={errors.email}
        />
        <Field
          id="phone"
          name="phone"
          type="tel"
          label="Téléphone"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
          defaultValue={values.phone}
          error={errors.phone}
          helpText="Optionnel — pour un rappel rapide"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subject">Sujet de votre demande</Label>
        <select
          id="subject"
          name="subject"
          defaultValue={values.subject ?? ''}
          className={cn(
            'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            errors.subject ? 'border-destructive' : 'border-input'
          )}
        >
          {SUBJECT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.subject && (
          <p className="text-xs text-destructive">{errors.subject}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message" required>
          Votre message
        </Label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          minLength={10}
          maxLength={5000}
          defaultValue={values.message ?? ''}
          placeholder="Décrivez votre projet, votre logement, vos besoins…"
          className={cn(
            'flex w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs transition-colors',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            errors.message ? 'border-destructive' : 'border-input'
          )}
        />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message}</p>
        )}
      </div>

      <div className="flex items-start gap-2.5">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-secondary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
        <Label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed">
          J&apos;accepte que mes données soient utilisées pour traiter ma demande, conformément à la{' '}
          <a
            href="/politique-de-confidentialite"
            className="underline-offset-2 hover:underline text-foreground"
          >
            politique de confidentialité
          </a>
          . Aucune donnée ne sera partagée avec des tiers sans mon accord.
        </Label>
      </div>

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="accent" size="lg" disabled={pending}>
      {pending ? 'Envoi en cours…' : (
        <>
          Envoyer ma demande
          <Send className="ml-1.5 h-4 w-4" />
        </>
      )}
    </Button>
  )
}

interface FieldProps {
  id: string
  name: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
  placeholder?: string
  defaultValue?: string
  error?: string
  helpText?: string
}

function Field({
  id,
  name,
  label,
  type = 'text',
  required,
  autoComplete,
  placeholder,
  defaultValue,
  error,
  helpText,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        defaultValue={defaultValue}
        error={Boolean(error)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
      {!error && helpText && (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
    </div>
  )
}
