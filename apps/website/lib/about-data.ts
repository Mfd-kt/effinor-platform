import type { LucideIcon } from 'lucide-react'
import { Eye, Award, ShieldCheck, Users, Wrench, MapPin } from 'lucide-react'

/**
 * Données de la page À propos.
 *
 * Sources :
 * - Année de création : 2018 (validée par Moufdi)
 * - Chiffres équipe : [TODO Moufdi] valeurs réelles à confirmer
 * - Certifications : [TODO Moufdi] confirmer numéros et organismes exacts
 */

export interface TimelineEvent {
  year: string
  title: string
  description: string
}

export const aboutTimeline: TimelineEvent[] = [
  {
    year: '2018',
    title: "Création d'Effinor",
    description:
      "Lancement de l'entreprise avec une vision claire : simplifier la rénovation énergétique pour les particuliers et professionnels.",
  },
  {
    year: '2020',
    title: 'Certification RGE',
    description:
      "Obtention du label RGE QualiPAC pour garantir la qualité de nos installations et l'éligibilité aux aides de l'État.",
  },
  {
    year: '2023',
    title: 'Délégataire CEE',
    description:
      "Devenons délégataire des Certificats d'Économie d'Énergie pour gérer directement les primes et accélérer leur versement.",
  },
  {
    year: '2026',
    title: 'Expansion nationale',
    description:
      "Déploiement de notre offre Rénovation globale BAR-TH-174 sur l'ensemble du territoire métropolitain.",
  },
]

export interface MissionValue {
  icon: LucideIcon
  title: string
  description: string
}

export const missionValues: MissionValue[] = [
  {
    icon: Eye,
    title: 'Transparence',
    description:
      "Devis détaillés et chiffrés, aides clairement explicitées, aucune surprise. Vous savez exactement ce que vous payez et ce que vous recevez.",
  },
  {
    icon: Award,
    title: 'Qualité',
    description:
      "Équipes certifiées RGE, matériel sélectionné chez les meilleurs fabricants européens, contrôle qualité à chaque étape du chantier.",
  },
  {
    icon: ShieldCheck,
    title: 'Engagement',
    description:
      "Suivi de A à Z par un interlocuteur unique, garantie décennale sur nos installations, service après-vente réactif. Votre projet est notre priorité.",
  },
]

export interface TeamStat {
  icon: LucideIcon
  value: string
  label: string
  description: string
}

export const teamStats: TeamStat[] = [
  {
    icon: Users,
    value: '15+',
    label: 'Collaborateurs',
    description: 'Une équipe pluridisciplinaire dédiée à votre projet',
  },
  {
    icon: Wrench,
    value: '6',
    label: 'Techniciens RGE',
    description: 'Certifiés QualiPAC pour des installations conformes',
  },
  {
    icon: MapPin,
    value: '3',
    label: 'Régions couvertes',
    description: 'Île-de-France, Hauts-de-France, Grand-Est',
  },
]

export interface Certification {
  code: string
  name: string
  description: string
}

export const certifications: Certification[] = [
  {
    code: 'RGE',
    name: "Reconnu Garant de l'Environnement",
    description:
      "Label de qualité de l'État garantissant le savoir-faire des artisans et la qualité des matériaux utilisés. Indispensable pour bénéficier des aides publiques.",
  },
  {
    code: 'QualiPAC',
    name: 'Qualification pompes à chaleur',
    description:
      "Certification spécifique aux installateurs de pompes à chaleur. Atteste de notre maîtrise technique pour les PAC air-eau et air-air.",
  },
  {
    code: 'CEE',
    name: "Délégataire Certificats d'Économie d'Énergie",
    description:
      "Statut officiel qui nous permet de collecter et gérer directement les primes CEE pour le compte de nos clients, accélérant leur versement.",
  },
]
