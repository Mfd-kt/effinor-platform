'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { formatPhoneE164, isValidEmail } from '@effinor/lib'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export type ContactFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Partial<Record<ContactFormField, string>>
  values?: Partial<Record<ContactFormField, string>>
}

type ContactFormField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'subject'
  | 'message'

const VALID_SUBJECTS = new Set([
  'pac-maison',
  'pac-immeuble',
  'systeme-solaire-combine',
  'renovation-globale',
  'aides-financement',
  'autre',
])

export const initialContactState: ContactFormState = { status: 'idle' }

/**
 * Server Action : crée une demande de contact.
 *
 * - Honeypot anti-bot (champ `website` invisible). Si rempli → redirect succès silencieux.
 * - Validation côté serveur (jamais faire confiance au client).
 * - Téléphone normalisé en E.164 si fourni.
 * - Metadata : user-agent, referer, source URL.
 * - Source = 'website_form' (table `contacts.source`).
 */
export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // 1. Honeypot : si le champ "website" est rempli, c'est un bot
  const honeypot = String(formData.get('website') ?? '').trim()
  if (honeypot.length > 0) {
    redirect('/contact/merci')
  }

  // 2. Extraction & nettoyage
  const raw = {
    firstName: String(formData.get('firstName') ?? '').trim(),
    lastName: String(formData.get('lastName') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    subject: String(formData.get('subject') ?? '').trim(),
    message: String(formData.get('message') ?? '').trim(),
  }
  const consent = formData.get('consent') === 'on'

  // 3. Validation
  const fieldErrors: Partial<Record<ContactFormField, string>> = {}

  if (raw.firstName.length < 2) fieldErrors.firstName = 'Prénom requis (2 caractères min.)'
  if (raw.firstName.length > 80) fieldErrors.firstName = 'Prénom trop long'

  if (raw.lastName.length < 2) fieldErrors.lastName = 'Nom requis (2 caractères min.)'
  if (raw.lastName.length > 80) fieldErrors.lastName = 'Nom trop long'

  if (!isValidEmail(raw.email)) fieldErrors.email = 'Email invalide'

  let phoneE164: string | null = null
  if (raw.phone.length > 0) {
    phoneE164 = formatPhoneE164(raw.phone)
    if (!phoneE164) fieldErrors.phone = 'Numéro de téléphone invalide (ex : 06 12 34 56 78)'
  }

  if (raw.subject && !VALID_SUBJECTS.has(raw.subject)) {
    fieldErrors.subject = 'Sujet invalide'
  }

  if (raw.message.length < 10) fieldErrors.message = 'Message trop court (10 caractères min.)'
  if (raw.message.length > 5000) fieldErrors.message = 'Message trop long (5000 caractères max.)'

  if (!consent) {
    return {
      status: 'error',
      message: 'Vous devez accepter le traitement de vos données pour envoyer le message.',
      values: raw,
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: 'error',
      message: 'Veuillez corriger les erreurs ci-dessous.',
      fieldErrors,
      values: raw,
    }
  }

  // 4. Metadata technique (utile pour anti-spam et analytics)
  const headerStore = await headers()
  const userAgent = headerStore.get('user-agent') ?? null
  const referer = headerStore.get('referer') ?? null

  // 5. Insertion en base (RLS : INSERT anon autorisé)
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('contacts').insert({
    first_name: raw.firstName,
    last_name: raw.lastName,
    email: raw.email.toLowerCase(),
    phone: phoneE164,
    subject: raw.subject || null,
    message: raw.message,
    source: 'website_form',
    source_url: referer,
    metadata: {
      user_agent: userAgent,
      referer,
    },
  })

  if (error) {
    console.error('[contact form] insert failed:', error)
    return {
      status: 'error',
      message:
        "Une erreur technique est survenue. Veuillez réessayer dans quelques instants ou nous contacter par téléphone.",
      values: raw,
    }
  }

  // 6. Succès → page de remerciement (PRG pattern)
  redirect('/contact/merci')
}
