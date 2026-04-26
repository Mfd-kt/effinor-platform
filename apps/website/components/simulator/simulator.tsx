'use client'

import { useState, useTransition } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Building2,
  Droplets,
  Flame,
  Home,
  Key,
  Layers3,
  Loader2,
  Plug,
  ShieldCheck,
  ShieldQuestion,
  Snowflake,
  Sun,
  Thermometer,
  TreePine,
  User,
  UserCircle2,
  Users,
  HelpCircle,
  Wrench,
  Sparkles,
} from 'lucide-react'
import { Button, cn } from '@effinor/design-system'

import type { SiteContact } from '@/lib/site-settings'
import { SimulatorStep } from './simulator-step'
import { StepChoiceCard } from './step-choice-card'
import { SimulatorResult } from './simulator-result'
import { buildTrancheOptions } from '@/lib/simulator/income-thresholds'
import type {
  ChauffageValue,
  LogementValue,
  StatutValue,
  TrancheValue,
  TravauxValue,
} from '@/lib/simulator/schema'

const TOTAL_STEPS = 6

type SimulatorStepIndex = 1 | 2 | 3 | 4 | 5 | 6

type SimulatorAnswers = {
  logement?: LogementValue
  statut?: StatutValue
  chauffage?: ChauffageValue
  nb_personnes?: 1 | 2 | 3 | 4 | 5
  tranche_revenus?: TrancheValue
  travaux?: TravauxValue[]
  prenom?: string
  nom?: string
  telephone?: string
  email?: string
  code_postal?: string
  rgpd_consent?: boolean
}

type SubmitSuccess = {
  kind: 'success'
  firstName: string
  phoneDisplay: string
}

type SimulatorProps = {
  /** Infos contact Effinor (téléphone + email) pour le message de remerciement. */
  contact: Pick<SiteContact, 'phone' | 'phoneE164' | 'email'>
}

const LOGEMENT_OPTIONS: {
  value: LogementValue
  label: string
  description: string
  Icon: typeof Home
}[] = [
  {
    value: 'maison',
    label: 'Maison individuelle',
    description: 'Pavillon, maison de ville, villa',
    Icon: Home,
  },
  {
    value: 'appartement',
    label: 'Appartement',
    description: 'Dans un immeuble collectif',
    Icon: Building2,
  },
  {
    value: 'immeuble',
    label: 'Immeuble collectif',
    description: 'Copropriété, investisseur',
    Icon: Building,
  },
]

const STATUT_OPTIONS: {
  value: StatutValue
  label: string
  description: string
  Icon: typeof UserCircle2
}[] = [
  {
    value: 'proprietaire',
    label: 'Propriétaire occupant',
    description: 'Je vis dans le logement',
    Icon: UserCircle2,
  },
  {
    value: 'locataire',
    label: 'Locataire',
    description: 'Je suis locataire du logement',
    Icon: Key,
  },
  {
    value: 'sci_sarl',
    label: 'SCI / SARL / Bailleur',
    description: 'Patrimoine locatif ou société',
    Icon: User,
  },
]

const CHAUFFAGE_OPTIONS: {
  value: ChauffageValue
  label: string
  description: string
  Icon: typeof Flame
}[] = [
  {
    value: 'gaz',
    label: 'Gaz',
    description: 'Chaudière murale, cheminée gaz',
    Icon: Flame,
  },
  {
    value: 'fioul',
    label: 'Fioul',
    description: 'Chaudière fioul avec cuve',
    Icon: Flame,
  },
  {
    value: 'electrique',
    label: 'Électrique',
    description: 'Radiateurs électriques, convecteurs',
    Icon: Plug,
  },
  {
    value: 'autre',
    label: 'Autre / Je ne sais pas',
    description: 'Bois, PAC, pompe à chaleur…',
    Icon: HelpCircle,
  },
]

const TRAVAUX_OPTIONS: {
  value: TravauxValue
  label: string
  Icon: typeof Thermometer
}[] = [
  { value: 'isolation', label: 'Isolation', Icon: Layers3 },
  { value: 'pac_clim', label: 'Pompe à chaleur & Clim.', Icon: Snowflake },
  { value: 'chauffage_traditionnel', label: 'Chauffage traditionnel', Icon: Flame },
  { value: 'chauffage_bois', label: 'Chauffage bois', Icon: TreePine },
  { value: 'solaire', label: 'Solaire', Icon: Sun },
  { value: 'chauffe_eau', label: 'Chauffe-eau', Icon: Droplets },
  { value: 'renovation_globale', label: 'Rénovation globale', Icon: Wrench },
  { value: 'je_ne_sais_pas', label: 'Je ne sais pas encore', Icon: ShieldQuestion },
]

export function Simulator({ contact }: SimulatorProps) {
  const [step, setStep] = useState<SimulatorStepIndex>(1)
  const [answers, setAnswers] = useState<SimulatorAnswers>({})
  const [pending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<SubmitSuccess | null>(null)

  const update = <K extends keyof SimulatorAnswers>(key: K, value: SimulatorAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const setNbPersonnes = (n: 1 | 2 | 3 | 4 | 5) => {
    setAnswers((prev) => ({
      ...prev,
      nb_personnes: n,
      // Les bornes de tranches changent avec la taille du foyer : on invalide
      // la sélection précédente pour éviter toute ambiguïté (sauf "je préfère
      // ne pas répondre", qui reste valable).
      tranche_revenus:
        prev.nb_personnes === n || prev.tranche_revenus === 'nr'
          ? prev.tranche_revenus
          : undefined,
    }))
  }

  const trancheOptions = buildTrancheOptions(answers.nb_personnes ?? null)

  const toggleTravaux = (value: TravauxValue) => {
    setAnswers((prev) => {
      const current = prev.travaux ?? []
      const exists = current.includes(value)
      const next = exists ? current.filter((v) => v !== value) : [...current, value]
      return { ...prev, travaux: next }
    })
  }

  const isStepValid = (s: SimulatorStepIndex): boolean => {
    switch (s) {
      case 1:
        return Boolean(answers.logement)
      case 2:
        return Boolean(answers.statut)
      case 3:
        return Boolean(answers.chauffage)
      case 4:
        return Boolean(answers.nb_personnes) && Boolean(answers.tranche_revenus)
      case 5:
        return (answers.travaux?.length ?? 0) > 0
      case 6:
        return (
          (answers.prenom?.trim().length ?? 0) >= 2 &&
          (answers.nom?.trim().length ?? 0) >= 2 &&
          (answers.telephone?.trim().length ?? 0) >= 6 &&
          isEmailLike(answers.email ?? '') &&
          /^\d{5}$/.test(answers.code_postal ?? '') &&
          answers.rgpd_consent === true
        )
    }
  }

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => (s + 1) as SimulatorStepIndex)
    }
  }

  const goBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as SimulatorStepIndex)
    }
  }

  const handleSubmit = () => {
    setSubmitError(null)

    const phoneDisplay = (answers.telephone ?? '').trim()
    const firstName = (answers.prenom ?? '').trim()

    startTransition(async () => {
      try {
        const res = await fetch('/api/simulator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logement: answers.logement,
            statut: answers.statut,
            chauffage: answers.chauffage,
            nb_personnes: answers.nb_personnes,
            tranche_revenus: answers.tranche_revenus,
            travaux: answers.travaux,
            prenom: firstName,
            nom: (answers.nom ?? '').trim(),
            telephone: phoneDisplay,
            email: (answers.email ?? '').trim(),
            code_postal: (answers.code_postal ?? '').trim(),
            rgpd_consent: answers.rgpd_consent === true,
          }),
        })

        const payload = (await res.json().catch(() => null)) as
          | { ok: true; id: string }
          | { ok: false; error?: string }
          | null

        if (!res.ok || !payload?.ok) {
          setSubmitError(
            (payload && 'error' in payload && payload.error) ||
              "Une erreur technique est survenue. Merci de réessayer."
          )
          return
        }

        setResult({ kind: 'success', firstName, phoneDisplay })
      } catch (err) {
        console.error('[simulator submit]', err)
        setSubmitError(
          'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.'
        )
      }
    })
  }

  // ── Résultat (remplace le contenu, pas de redirection) ─────────────
  if (result) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-lg touch-manipulation rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 md:p-8">
        <SimulatorResult
          firstName={result.firstName}
          phoneDisplay={result.phoneDisplay}
          contactPhone={contact.phone}
          contactPhoneE164={contact.phoneE164}
          contactEmail={contact.email}
        />
      </div>
    )
  }

  // ── Contenu étape par étape ────────────────────────────────────────
  return (
    <div
      className={cn(
        'mx-auto w-full min-w-0 max-w-lg touch-manipulation rounded-2xl border border-border bg-card p-4 shadow-sm transition-all sm:p-6 md:p-8',
        step === 6 && 'bg-gradient-to-b from-card to-secondary-50/30'
      )}
    >
      {step === 1 ? (
        <SimulatorStep
          stepIndex={1}
          totalSteps={TOTAL_STEPS}
          title="Quel est votre type de logement ?"
          description="Cela nous aide à identifier les aides et opérations CEE accessibles."
        >
          <div className="grid gap-3">
            {LOGEMENT_OPTIONS.map(({ value, label, description, Icon }) => (
              <StepChoiceCard
                key={value}
                selected={answers.logement === value}
                onSelect={() => update('logement', value)}
                icon={<Icon className="h-5 w-5" />}
                label={label}
                description={description}
              />
            ))}
          </div>
        </SimulatorStep>
      ) : null}

      {step === 2 ? (
        <SimulatorStep
          stepIndex={2}
          totalSteps={TOTAL_STEPS}
          title="Quel est votre statut d'occupant ?"
          description="Les aides diffèrent selon votre statut."
        >
          <div className="grid gap-3">
            {STATUT_OPTIONS.map(({ value, label, description, Icon }) => (
              <StepChoiceCard
                key={value}
                selected={answers.statut === value}
                onSelect={() => update('statut', value)}
                icon={<Icon className="h-5 w-5" />}
                label={label}
                description={description}
              />
            ))}
          </div>
        </SimulatorStep>
      ) : null}

      {step === 3 ? (
        <SimulatorStep
          stepIndex={3}
          totalSteps={TOTAL_STEPS}
          title="Quel est votre chauffage actuel ?"
          description="Le remplacement d'une chaudière gaz ou fioul ouvre souvent le plus d'aides."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {CHAUFFAGE_OPTIONS.map(({ value, label, description, Icon }) => (
              <StepChoiceCard
                key={value}
                selected={answers.chauffage === value}
                onSelect={() => update('chauffage', value)}
                icon={<Icon className="h-5 w-5" />}
                label={label}
                description={description}
              />
            ))}
          </div>
        </SimulatorStep>
      ) : null}

      {step === 4 ? (
        <SimulatorStep
          stepIndex={4}
          totalSteps={TOTAL_STEPS}
          title="Parlons de votre foyer"
          description="Ces informations servent à calculer les aides selon les barèmes nationaux."
        >
          <div className="space-y-6">
            <fieldset>
              <legend className="text-sm font-semibold text-foreground">
                Nombre de personnes dans le foyer
              </legend>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = answers.nb_personnes === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNbPersonnes(n as 1 | 2 | 3 | 4 | 5)}
                      aria-pressed={active}
                      className={cn(
                        'h-12 rounded-lg border text-sm font-semibold transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500',
                        active
                          ? 'border-secondary-500 bg-secondary-500 text-white shadow-sm'
                          : 'border-border bg-card text-foreground hover:border-secondary-400 hover:bg-secondary-50'
                      )}
                    >
                      {n === 5 ? '5+' : n}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Users className="h-4 w-4 text-secondary-700" aria-hidden="true" />
                Revenus annuels du foyer
              </legend>
              {answers.nb_personnes ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Bornes recalculées pour un foyer de{' '}
                  <span className="font-semibold text-foreground">
                    {answers.nb_personnes === 5 ? '5 personnes ou plus' : `${answers.nb_personnes} personne${answers.nb_personnes > 1 ? 's' : ''}`}
                  </span>
                  .
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Sélectionnez d’abord le nombre de personnes dans le foyer pour voir les tranches ajustées.
                </p>
              )}
              <div
                className={cn(
                  'mt-3 grid gap-2 transition-opacity',
                  !answers.nb_personnes && 'pointer-events-none opacity-50'
                )}
                aria-disabled={!answers.nb_personnes}
              >
                {trancheOptions.map(({ value, label, description }) => (
                  <StepChoiceCard
                    key={value}
                    selected={answers.tranche_revenus === value}
                    onSelect={() => update('tranche_revenus', value)}
                    label={label}
                    description={description}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        </SimulatorStep>
      ) : null}

      {step === 5 ? (
        <SimulatorStep
          stepIndex={5}
          totalSteps={TOTAL_STEPS}
          title="Quels travaux vous intéressent ?"
          description="Sélectionnez tout ce qui vous intéresse — plusieurs choix possibles."
        >
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-2.5">
            {TRAVAUX_OPTIONS.map(({ value, label, Icon }) => (
              <StepChoiceCard
                key={value}
                selected={(answers.travaux ?? []).includes(value)}
                onSelect={() => toggleTravaux(value)}
                icon={<Icon />}
                label={label}
                tone="multi"
                compact
              />
            ))}
          </div>
        </SimulatorStep>
      ) : null}

      {step === 6 ? (
        <SimulatorStep
          stepIndex={6}
          totalSteps={TOTAL_STEPS}
          title="Vos coordonnées"
          description="Un conseiller Effinor vous recontacte sous 24h avec une estimation personnalisée."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="sim-prenom"
                className="block text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Prénom *
              </label>
              <input
                id="sim-prenom"
                type="text"
                autoComplete="given-name"
                value={answers.prenom ?? ''}
                onChange={(e) => update('prenom', e.target.value)}
                className="mt-1.5 w-full min-h-11 rounded-lg border border-border bg-card px-3 py-2.5 text-base shadow-xs outline-none transition-colors focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/30"
              />
            </div>
            <div>
              <label
                htmlFor="sim-nom"
                className="block text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Nom *
              </label>
              <input
                id="sim-nom"
                type="text"
                autoComplete="family-name"
                value={answers.nom ?? ''}
                onChange={(e) => update('nom', e.target.value)}
                className="mt-1.5 w-full min-h-11 rounded-lg border border-border bg-card px-3 py-2.5 text-base shadow-xs outline-none transition-colors focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/30"
              />
            </div>
            <div>
              <label
                htmlFor="sim-telephone"
                className="block text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Téléphone *
              </label>
              <input
                id="sim-telephone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="06 12 34 56 78"
                value={answers.telephone ?? ''}
                onChange={(e) => update('telephone', e.target.value)}
                className="mt-1.5 w-full min-h-11 rounded-lg border border-border bg-card px-3 py-2.5 text-base shadow-xs outline-none transition-colors focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/30"
              />
            </div>
            <div>
              <label
                htmlFor="sim-code-postal"
                className="block text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Code postal *
              </label>
              <input
                id="sim-code-postal"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                placeholder="94320"
                value={answers.code_postal ?? ''}
                onChange={(e) =>
                  update('code_postal', e.target.value.replace(/\D/g, '').slice(0, 5))
                }
                className="mt-1.5 w-full min-h-11 rounded-lg border border-border bg-card px-3 py-2.5 text-base shadow-xs outline-none transition-colors focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/30"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="sim-email"
                className="block text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Email *
              </label>
              <input
                id="sim-email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.fr"
                value={answers.email ?? ''}
                onChange={(e) => update('email', e.target.value)}
                className="mt-1.5 w-full min-h-11 rounded-lg border border-border bg-card px-3 py-2.5 text-base shadow-xs outline-none transition-colors focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/30"
              />
            </div>
          </div>

          <label className="mt-5 flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3.5 text-base">
            <input
              type="checkbox"
              checked={answers.rgpd_consent === true}
              onChange={(e) => update('rgpd_consent', e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-secondary-500"
            />
            <span className="text-muted-foreground">
              J&apos;accepte d&apos;être contacté par Effinor pour recevoir des conseils
              personnalisés sur mon projet de rénovation énergétique.
            </span>
          </label>

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-secondary-600" aria-hidden="true" />
            Données stockées en France. Aucun partage commercial. Voir notre{' '}
            <a
              href="/politique-de-confidentialite"
              className="font-medium underline-offset-2 hover:underline"
            >
              politique de confidentialité
            </a>
            .
          </div>

          {submitError ? (
            <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}
        </SimulatorStep>
      ) : null}

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={goBack}
          disabled={step === 1 || pending}
          className={cn(step === 1 && 'invisible')}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour
        </Button>

        {step < TOTAL_STEPS ? (
          <Button
            type="button"
            variant="accent"
            size="md"
            onClick={goNext}
            disabled={!isStepValid(step)}
          >
            Suivant
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="accent"
            size="md"
            onClick={handleSubmit}
            disabled={!isStepValid(6) || pending}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Envoi…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Voir mes aides
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function isEmailLike(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}
