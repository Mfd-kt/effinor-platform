import type { ProfilOccupant, SimulationAnswers } from "@/features/simulator-cee/domain/types";

export type SimulatorStepId =
  | "profil"
  | "raison_sociale"
  | "patrimoine_type"
  | "nb_logements"
  | "surface_totale"
  | "logement"
  | "construction"
  | "ite_iti"
  | "fenetres"
  | "sous_sol"
  | "btd"
  | "vmc"
  | "chauffage"
  | "chauffage_24_mois"
  | "dpe"
  | "age_logement"
  | "travaux_cee"
  | "foyer"
  | "tranche"
  | "preliminary_result"
  | "adresse"
  | "contact"
  | "rappel"
  | "resultat";

/** Phase fonctionnelle de l’étape (pour le label du progress header). */
export type StepPhase = "qualification" | "finalisation" | "result";

export type StepIllustration = {
  imageSrc?: string;
  imageAlt?: string;
  title?: string;
  description?: string;
  sellingPoint?: string;
};

export type StepContext = {
  /**
   * `forceCollect` = vrai quand l’agent décide d’enregistrer un prospect non éligible.
   * Sert à conditionner l’affichage des étapes adresse/contact/rappel.
   */
  forceCollect?: boolean;
  /** Préliminaire calculé : éligible PAC ou Renov ? */
  hasAnyEligibility?: boolean;
};

export type StepDefinition = {
  id: SimulatorStepId;
  label: string;
  field: keyof SimulationAnswers | "synthese" | "coordination";
  phase: StepPhase;
  /** Skip = ne pas afficher cette étape dans le parcours actif. */
  skip?: (answers: Partial<SimulationAnswers>, ctx?: StepContext) => boolean;
  /** Contenu pédagogique affiché en haut de l’étape. */
  illustration?: StepIllustration;
};

function isOwner(p: ProfilOccupant | undefined): boolean {
  return p === "proprietaire_occupant";
}
function isSciOrBailleur(p: ProfilOccupant | undefined): boolean {
  return p === "sci" || p === "bailleur";
}
function isLocataire(p: ProfilOccupant | undefined): boolean {
  return p === "locataire";
}

/**
 * `cannotFinalize(answers, ctx)` — utilisé pour skipper les étapes adresse /
 * contact / rappel quand on n’a pas d’éligibilité (et pas d’override agent).
 */
function cannotFinalize(answers: Partial<SimulationAnswers>, ctx?: StepContext): boolean {
  if (isLocataire(answers.profil)) return ctx?.forceCollect !== true;
  if (ctx?.hasAnyEligibility === false && ctx?.forceCollect !== true) return true;
  return false;
}

export const STEPS: StepDefinition[] = [
  {
    id: "profil",
    label: "Profil",
    field: "profil",
    phase: "qualification",
    illustration: {
      title: "Qui est le client ?",
      description:
        "Le profil détermine les opérations CEE accessibles. Propriétaires occupants : BAR-TH-171 (PAC) ou BAR-TH-174 (rénovation globale). SCI/bailleurs : BAR-TH-179 uniquement.",
    },
  },

  // SCI / bailleur uniquement
  {
    id: "raison_sociale",
    label: "Société",
    field: "raisonSociale",
    phase: "qualification",
    skip: (a) => !isSciOrBailleur(a.profil),
  },
  {
    id: "patrimoine_type",
    label: "Patrimoine",
    field: "patrimoineType",
    phase: "qualification",
    skip: (a) => !isSciOrBailleur(a.profil),
  },
  {
    id: "nb_logements",
    label: "Nombre de logements",
    field: "nbLogements",
    phase: "qualification",
    skip: (a) => !isSciOrBailleur(a.profil),
  },
  {
    id: "surface_totale",
    label: "Surface totale",
    field: "surfaceTotaleM2",
    phase: "qualification",
    skip: (a) => !isSciOrBailleur(a.profil),
  },

  // Proprio occupant uniquement
  {
    id: "logement",
    label: "Logement",
    field: "typeLogement",
    phase: "qualification",
    skip: (a) => !isOwner(a.profil),
    illustration: {
      // TODO: remplacer par photo réelle — placeholder SVG actuellement
      imageSrc: "/simulator/maison-vs-appart.svg",
      title: "Type de logement",
      description:
        "La rénovation globale (BAR-TH-174) est réservée aux maisons individuelles. En appartement, seule la PAC est possible.",
    },
  },
  {
    id: "construction",
    label: "Construction",
    field: "periodeConstruction",
    phase: "qualification",
    skip: (a) => !isOwner(a.profil),
    illustration: {
      // TODO: remplacer par photo réelle — placeholder SVG actuellement
      imageSrc: "/simulator/maison-recente-vs-ancienne.svg",
      title: "Année de construction",
      description:
        "Trouvable sur la taxe foncière ou l’acte de propriété. Si doute : maison avec isolation apparente, double vitrage d’origine = souvent après 2000.",
    },
  },
  {
    id: "ite_iti",
    label: "ITE / ITI",
    field: "iteItiRecente",
    phase: "qualification",
    skip: (a) => !isOwner(a.profil) || a.periodeConstruction !== "avant_2000",
    illustration: {
      // TODO: remplacer par photo réelle — placeholder SVG actuellement
      imageSrc: "/simulator/ite-coupe.svg",
      title: "Isolation thermique par l’extérieur",
      description:
        "L’ITE = couche d’isolant posée sur la façade recouverte d’un enduit. Signes extérieurs : murs épais, enduit récent, encadrements de fenêtres décalés.",
      sellingPoint:
        "Une ITE récente (<20 ans) ouvre la rénovation globale même pour une maison avant 2000.",
    },
  },
  {
    id: "fenetres",
    label: "Fenêtres",
    field: "fenetres",
    phase: "qualification",
    skip: (a) => !isOwner(a.profil),
    illustration: {
      // TODO: remplacer par photo réelle — placeholder SVG actuellement
      imageSrc: "/simulator/fenetres-comparaison.svg",
      title: "Type de fenêtres",
      description:
        "Double vitrage : 2 vitres séparées par un espace d’air. Simple vitrage bois : une seule vitre, cadre bois souvent abîmé ou peint plusieurs fois.",
      sellingPoint:
        "Simple vitrage bois = PAC uniquement (BAR-TH-171). Double vitrage = éligible rénovation globale.",
    },
  },
  {
    id: "sous_sol",
    label: "Sous-sol",
    field: "sousSol",
    phase: "qualification",
    skip: (a) => !isOwner(a.profil),
    illustration: {
      // TODO: remplacer par photo réelle — placeholder SVG actuellement
      imageSrc: "/simulator/sous-sol-coupe.svg",
      title: "Sous-sol ou vide sanitaire ?",
      description:
        "Tout espace sous la maison : cave, garage enterré, vide sanitaire accessible. Pas un simple dallage béton au sol.",
      sellingPoint:
        "Sous-sol = scénario SC1 (isolation du plancher bas). Sans sous-sol = SC2 (isolation murs à la place).",
    },
  },
  {
    id: "btd",
    label: "BTD",
    field: "btdInstalle",
    phase: "qualification",
    skip: (a) => !isOwner(a.profil),
    illustration: {
      // TODO: remplacer par photo réelle — placeholder SVG actuellement
      imageSrc: "/simulator/btd-photo.svg",
      title: "Ballon thermodynamique",
      description:
        "Chauffe-eau moderne qui utilise l’air ambiant pour chauffer l’eau. Généralement en buanderie ou garage. Cylindre avec prise d’air sur le dessus.",
      sellingPoint:
        "Si absent, le BTD est inclus dans le package rénovation globale → 0 reste à charge.",
    },
  },
  {
    id: "vmc",
    label: "VMC",
    field: "vmcInstallee",
    phase: "qualification",
    skip: (a) => !isOwner(a.profil),
    illustration: {
      // TODO: remplacer par photo réelle — placeholder SVG actuellement
      imageSrc: "/simulator/vmc-bouche.svg",
      title: "Ventilation mécanique contrôlée",
      description:
        "Petite grille ronde ou carrée au plafond dans la salle de bain, WC, cuisine. Si le client ne sait pas : lui demander s’il entend un moteur tourner en permanence.",
      sellingPoint:
        "VMC obligatoire en rénovation globale, qu’elle soit remplacée ou installée.",
    },
  },

  // Communes proprio + SCI
  {
    id: "chauffage",
    label: "Chauffage",
    field: "chauffage",
    phase: "qualification",
    skip: (a) => isLocataire(a.profil),
    illustration: {
      // TODO: remplacer par photo réelle — placeholder SVG actuellement
      imageSrc: "/simulator/chauffages.svg",
      title: "Reconnaître le chauffage",
      description:
        "Chaudière gaz murale, radiateurs électriques, PAC extérieure… Demander au client de regarder dans son local technique.",
      sellingPoint:
        "Le gaz et le fioul sont les cibles prioritaires pour remplacement par PAC.",
    },
  },
  {
    id: "chauffage_24_mois",
    label: "Chauffage récent ?",
    field: "chauffage24Mois",
    phase: "qualification",
    skip: (a) => isLocataire(a.profil) || a.typeLogement !== "maison",
    illustration: {
      title: "Chauffage remplacé < 24 mois ?",
      description:
        "Règle BAR-TH-174 : le chauffage ne doit pas avoir été remplacé dans les 24 mois précédant l’engagement.",
      sellingPoint:
        "Si oui : la rénovation globale est exclue. On orientera vers une PAC seule (BAR-TH-171).",
    },
  },
  {
    id: "dpe",
    label: "DPE",
    field: "dpe",
    phase: "qualification",
    skip: (a) => isLocataire(a.profil),
    illustration: {
      // TODO: remplacer par photo réelle — placeholder SVG actuellement
      imageSrc: "/simulator/dpe-etiquette.svg",
      title: "Diagnostic de performance énergétique",
      description:
        "Étiquette colorée de A (vert) à G (rouge) présente sur l’acte de propriété, le bail, ou envoyée lors de la vente. Le DPE a < 10 ans généralement.",
      sellingPoint:
        "Classes F et G = passoires thermiques, public prioritaire pour les primes Coup de pouce.",
    },
  },
  {
    id: "age_logement",
    label: "Âge du logement",
    field: "ageLogement",
    phase: "qualification",
    skip: (a) =>
      isLocataire(a.profil) ||
      !isOwner(a.profil) ||
      a.typeLogement !== "maison" ||
      !["E", "F", "G"].includes(a.dpe ?? ""),
    illustration: {
      title: "Le logement a-t-il plus de 15 ans ?",
      description:
        "Question complémentaire : si DPE E/F/G ET logement > 15 ans, le dossier bascule sur l’ANAH (MaPrimeRénov’) plutôt que les CEE.",
    },
  },
  {
    id: "travaux_cee",
    label: "Travaux CEE déjà reçus",
    field: "travauxCeeRecus",
    phase: "qualification",
    skip: (a) => isLocataire(a.profil),
  },

  // Foyer (proprio occupant uniquement — SCI = pas de revenu fiscal)
  {
    id: "foyer",
    label: "Foyer",
    field: "nbPersonnes",
    phase: "qualification",
    skip: (a) => !isOwner(a.profil),
  },
  {
    id: "tranche",
    label: "Revenus",
    field: "trancheRevenu",
    phase: "qualification",
    skip: (a) => !isOwner(a.profil),
  },

  // === Calcul d’éligibilité (étape « pivot ») ===
  {
    id: "preliminary_result",
    label: "Vérification d’éligibilité",
    field: "synthese",
    phase: "qualification",
  },

  // Phase finalisation — adresse, contact, rappel (uniquement si éligible OU forceCollect)
  {
    id: "adresse",
    label: "Adresse",
    field: "adresse",
    phase: "finalisation",
    skip: (a, ctx) => cannotFinalize(a, ctx),
  },
  {
    id: "contact",
    label: "Contact",
    field: "contact",
    phase: "finalisation",
    skip: (a, ctx) => cannotFinalize(a, ctx),
  },
  {
    id: "rappel",
    label: "Rappel",
    field: "rappel",
    phase: "finalisation",
    skip: (a, ctx) => cannotFinalize(a, ctx),
  },

  {
    id: "resultat",
    label: "Résultat",
    field: "synthese",
    phase: "result",
    skip: (a, ctx) => cannotFinalize(a, ctx),
  },
];

export function getActiveSteps(
  answers: Partial<SimulationAnswers>,
  ctx: StepContext = {},
): StepDefinition[] {
  return STEPS.filter((s) => !s.skip?.(answers, ctx));
}

/** Compte les étapes par phase pour le progress header. */
export function countByPhase(steps: StepDefinition[]): Record<StepPhase, number> {
  return steps.reduce(
    (acc, s) => {
      acc[s.phase] += 1;
      return acc;
    },
    { qualification: 0, finalisation: 0, result: 0 } as Record<StepPhase, number>,
  );
}
