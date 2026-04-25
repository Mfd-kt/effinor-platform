/**
 * Types métier simulateur CEE.
 * Aligné sur le prototype : 7 chauffages, logement maison/appartement uniquement,
 * période avant_2000 / apres_2000 sans « inconnue », plus questions techniques
 * (ITE, fenêtres, sous-sol, BTD, VMC) + tracking SCI (patrimoine).
 */

export type ZoneKind = "idf" | "hors_idf" | "unknown";

export type ProfilOccupant = "bailleur" | "sci" | "locataire" | "proprietaire_occupant";

/** 8 modes de chauffage validés (PAC scindée en air/eau et air/air). */
export type TypeChauffage =
  | "gaz"
  | "gaz_cond"
  | "fioul"
  | "elec"
  | "bois"
  | "granules"
  | "pac_air_eau"
  | "pac_air_air";

/** Codes d’opération CEE retournés par `computePacEligibility`. */
export type OperationCee = "BAR-TH-171" | "BAR-TH-174" | "BAR-TH-179";

export type TypeLogement = "maison" | "appartement";

export type PeriodeConstruction = "avant_2000" | "apres_2000";

export type DpeLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "inconnu";

export type FenetresType = "double_vitrage" | "simple_vitrage_bois";

export type TravauxCeeRecus = "oui" | "non" | "jsp";

export type PatrimoineType = "appartements" | "maisons" | "mixte";

/** Âge du logement (utilisé pour la règle de bascule ANAH). */
export type AgeLogement = "moins_15_ans" | "plus_15_ans";

/** Type de financement applicable à la rénovation globale. */
export type FinancementType =
  | "cee_x2" // Coup de pouce, double volume
  | "cee_simple" // CEE standard
  | "anah_bascule" // Bascule ANAH/MaPrimeRénov’, hors CEE
  | "non_applicable"; // Pas éligible rénovation globale

export type TrancheRevenu = "tres_modeste" | "modeste" | "intermediaire" | "superieur";

export type TravauxClef = "combles" | "murs" | "fenetres" | "vmc" | "chauffage" | "sous_sol" | "btd";

export type SimulationAddress = {
  adresse: string;
  codePostal: string;
  ville: string;
  latitude?: number;
  longitude?: number;
};

export type SimulationContact = {
  civilite: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
};

export type SimulationRappel = {
  date: string;
  heure: string;
};

export type IncomeThresholdRow = {
  tres_modeste: number;
  modeste: number;
  intermediaire: number;
};

/** Réponses complètes du parcours (persistées dans `cee_simulations.raw_answers` + colonnes dédiées). */
export type SimulationAnswers = {
  // Profil
  profil: ProfilOccupant;
  raisonSociale?: string;

  // Patrimoine SCI / bailleur
  patrimoineType?: PatrimoineType;
  nbLogements?: number;
  surfaceTotaleM2?: number;

  // Logement (proprio occupant)
  typeLogement?: TypeLogement;
  periodeConstruction?: PeriodeConstruction;

  // Questions techniques (proprio occupant)
  iteItiRecente?: boolean;
  fenetres?: FenetresType;
  sousSol?: boolean;
  btdInstalle?: boolean;
  vmcInstallee?: boolean;

  // Communes (proprio + SCI/bailleur)
  chauffage: TypeChauffage;
  /**
   * Le système de chauffage a-t-il été remplacé dans les 24 derniers mois ?
   * `true` → bloque BAR-TH-174 (cf. cahier des charges).
   */
  chauffage24Mois?: boolean;
  dpe: DpeLetter;
  /** Âge du logement — requis quand DPE ∈ {E, F, G} pour la règle ANAH. */
  ageLogement?: AgeLogement;
  travauxCeeRecus?: TravauxCeeRecus;

  // Foyer (proprio occupant uniquement)
  nbPersonnes: number;
  trancheRevenu: TrancheRevenu;

  // Coordonnées
  adresse: SimulationAddress;
  contact?: SimulationContact;
  rappel?: SimulationRappel;
};

export type PacResult = {
  eligible: boolean;
  /** Une seule raison narrative (null si éligible). */
  raison: string | null;
  /** Opération CEE déclenchée (BAR-TH-171 proprio occupant, BAR-TH-179 SCI/bailleur). */
  operation: OperationCee | null;
  estimatedPrimeEur: number | null;
};

export type RenovResult = {
  eligible: boolean;
  raison: string | null;
  scenario: "SC1" | "SC2" | null;
  package: TravauxClef[];
  estimatedPrimeEur: number | null;
  /** Type de financement (CEE x2, CEE standard, ANAH, ou non applicable). */
  financement: FinancementType;
  /** Libellé d’affichage prêt à l’emploi. */
  financementLabel: string;
  /** Avertissements à afficher au commercial (ex : travaux CEE inconnus). */
  warnings: string[];
};

export type EligibilityResult = {
  zone: ZoneKind;
  /** Ne pas dispatcher automatiquement (locataire). */
  doNotDispatch: boolean;
  pac: PacResult;
  renov: RenovResult;
  packageKey: "pack_pac_renov" | "pac_only" | "renov_only" | "none";
  estimatedTotalPrimeEur: number | null;
  /**
   * Indicateur commercial : prospect avec configuration optimale
   * (RAC minimal attendu via bonifications CEE + Coup de pouce).
   * NE remplace PAS l’éligibilité réglementaire.
   */
  cibleIdeale: boolean;
};
