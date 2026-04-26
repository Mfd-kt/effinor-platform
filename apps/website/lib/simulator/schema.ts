import { z } from 'zod'

export const LOGEMENT_VALUES = ['maison', 'appartement', 'immeuble'] as const
export const STATUT_VALUES = ['proprietaire', 'locataire', 'sci_sarl'] as const
export const CHAUFFAGE_VALUES = ['gaz', 'fioul', 'electrique', 'autre'] as const
export const TRANCHE_VALUES = [
  'tres_modeste',
  'modeste',
  'intermediaire',
  'superieur',
  'nr',
] as const
export const TRAVAUX_VALUES = [
  'isolation',
  'pac_clim',
  'chauffage_traditionnel',
  'chauffage_bois',
  'solaire',
  'chauffe_eau',
  'renovation_globale',
  'je_ne_sais_pas',
] as const

export const simulatorSubmitSchema = z.object({
  logement: z.enum(LOGEMENT_VALUES),
  statut: z.enum(STATUT_VALUES),
  chauffage: z.enum(CHAUFFAGE_VALUES),
  nb_personnes: z.number().int().min(1).max(5),
  tranche_revenus: z.enum(TRANCHE_VALUES),
  travaux: z.array(z.enum(TRAVAUX_VALUES)).min(1, 'Sélectionnez au moins un type de travaux'),
  prenom: z.string().trim().min(2, 'Prénom trop court').max(80),
  nom: z.string().trim().min(2, 'Nom trop court').max(80),
  telephone: z.string().trim().min(6, 'Téléphone invalide').max(40),
  email: z.string().trim().email('Email invalide').max(200),
  code_postal: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'Code postal invalide (5 chiffres)'),
  rgpd_consent: z.literal(true, {
    errorMap: () => ({ message: 'Le consentement RGPD est obligatoire.' }),
  }),
})

export type SimulatorSubmitInput = z.infer<typeof simulatorSubmitSchema>
export type LogementValue = (typeof LOGEMENT_VALUES)[number]
export type StatutValue = (typeof STATUT_VALUES)[number]
export type ChauffageValue = (typeof CHAUFFAGE_VALUES)[number]
export type TrancheValue = (typeof TRANCHE_VALUES)[number]
export type TravauxValue = (typeof TRAVAUX_VALUES)[number]
