import { IDF_DEPTS } from "@/features/simulator-cee/domain/plafonds";
import type {
  EligibilityResult,
  FinancementType,
  OperationCee,
  PacResult,
  RenovResult,
  SimulationAnswers,
  TravauxClef,
  TypeChauffage,
  ZoneKind,
} from "@/features/simulator-cee/domain/types";

/**
 * Règles issues du cahier des charges **BAR-TH-174 V A80.3** et des pratiques
 * des délégataires (AB Énergie, GEO PLC, Hellio).
 *
 * Aligné aussi sur BAR-TH-171 (PAC propriétaire occupant) et BAR-TH-179 (PAC
 * SCI / bailleur). Voir tests unitaires `eligibility-rules.test.ts` pour la
 * matrice détaillée.
 */

export function detectZone(codePostal: string | undefined | null): ZoneKind {
  if (!codePostal || codePostal.length < 2) return "unknown";
  const dept = codePostal.slice(0, 2);
  return IDF_DEPTS.includes(dept as (typeof IDF_DEPTS)[number]) ? "idf" : "hors_idf";
}

const isPacInstallee = (c: TypeChauffage): boolean =>
  c === "pac_air_eau" || c === "pac_air_air";

const PAC_REPLACEABLE: TypeChauffage[] = ["gaz", "gaz_cond", "fioul"];

/** Profils SCI / bailleur / SARL — accès BAR-TH-179. */
const SCI_OR_BAILLEUR_PROFILS = new Set<string>(["sci", "bailleur", "sarl"]);

function buildPackage(answers: SimulationAnswers, scenario: "SC1" | "SC2"): TravauxClef[] {
  const pkg: TravauxClef[] = ["combles"];
  if (scenario === "SC1") {
    pkg.push("sous_sol");
  } else {
    pkg.push("murs");
  }
  if (answers.btdInstalle === false) pkg.push("btd");
  if (answers.vmcInstallee === false) pkg.push("vmc");
  if (scenario === "SC2" && answers.fenetres === "simple_vitrage_bois") {
    pkg.push("fenetres");
  }
  return pkg;
}

export function computePacEligibility(
  answers: SimulationAnswers,
): { eligible: boolean; raison: string | null; operation: OperationCee | null } {
  const c = answers.chauffage;

  if (isPacInstallee(c)) {
    return { eligible: false, raison: "PAC déjà installée", operation: null };
  }

  if (answers.profil === "locataire") {
    return { eligible: false, raison: "Réservé aux propriétaires", operation: null };
  }

  if (!PAC_REPLACEABLE.includes(c)) {
    return {
      eligible: false,
      raison: "Chauffage élec / bois / granulés — non éligible PAC",
      operation: null,
    };
  }

  if (SCI_OR_BAILLEUR_PROFILS.has(answers.profil)) {
    return {
      eligible: true,
      raison: "Éligible PAC résidentiel (bailleur/SCI)",
      operation: "BAR-TH-179",
    };
  }

  // Propriétaire occupant — BAR-TH-171 (maison ou appartement)
  return {
    eligible: true,
    raison: "Éligible PAC résidentiel — remplacement chauffage",
    operation: "BAR-TH-171",
  };
}

export function computeRenovGlobaleEligibility(
  answers: SimulationAnswers,
): { eligible: boolean; raison: string | null; scenario: "SC1" | "SC2" | null } {
  if (answers.profil === "locataire") {
    return { eligible: false, raison: "Réservé aux propriétaires", scenario: null };
  }

  if (answers.typeLogement === "appartement") {
    return {
      eligible: false,
      raison: "BAR-TH-174 — uniquement maisons individuelles",
      scenario: null,
    };
  }

  // BLOQUEUR : chauffage remplacé dans les 24 derniers mois
  if (answers.chauffage24Mois === true) {
    return {
      eligible: false,
      raison:
        "Chauffage remplacé dans les 24 derniers mois — BAR-TH-174 exclu. Attendre 24 mois ou orienter vers PAC.",
      scenario: null,
    };
  }

  // BLOQUEUR : travaux CEE déjà reçus (cumul interdit)
  if (answers.travauxCeeRecus === "oui") {
    return {
      eligible: false,
      raison:
        "Travaux CEE déjà reçus sur ce logement — cumul interdit sur les postes enveloppe / chauffage / ventilation si engagement < 24 mois. À vérifier avec les justificatifs.",
      scenario: null,
    };
  }

  // RÈGLE 1 : simple vitrage bois → exclusion absolue
  if (answers.fenetres === "simple_vitrage_bois") {
    return {
      eligible: false,
      raison:
        "Fenêtres bois simple vitrage — BAR-TH-174 non éligible. Orienter vers BAR-TH-171 (PAC) si chauffage éligible.",
      scenario: null,
    };
  }

  // RÈGLE 2 : fioul → exclusion absolue
  if (answers.chauffage === "fioul") {
    return {
      eligible: false,
      raison:
        "Chauffage fioul — BAR-TH-174 non éligible dès le départ. Orienter vers BAR-TH-171 (PAC).",
      scenario: null,
    };
  }

  // SCI / bailleur / SARL → toutes classes DPE
  if (SCI_OR_BAILLEUR_PROFILS.has(answers.profil)) {
    return {
      eligible: true,
      raison: "SCI/SAS/SARL — éligible toutes classes DPE",
      scenario: answers.sousSol ? "SC1" : "SC2",
    };
  }

  // Propriétaire occupant
  const anneeOkPourRenov =
    answers.periodeConstruction === "apres_2000" || answers.iteItiRecente === true;

  if (anneeOkPourRenov) {
    const chauffageOk: TypeChauffage[] = ["gaz", "gaz_cond", "granules", "elec", "bois"];
    if (chauffageOk.includes(answers.chauffage)) {
      return {
        eligible: true,
        raison: null,
        scenario: answers.sousSol ? "SC1" : "SC2",
      };
    }
    return {
      eligible: false,
      raison: "Chauffage non éligible dans cette configuration",
      scenario: null,
    };
  }

  // Avant 2000 sans ITE récente
  // RÈGLE 3 : granulés OU PAC déjà installée → éligible
  if (answers.chauffage === "granules" || isPacInstallee(answers.chauffage)) {
    return {
      eligible: true,
      raison: null,
      scenario: answers.sousSol ? "SC1" : "SC2",
    };
  }

  return {
    eligible: false,
    raison:
      "Maison avant 2000 sans ITE récente — chauffage gaz/élec/bois non éligible",
    scenario: null,
  };
}

// NB : pas de calcul de prime CEE pour l’instant. Le simulateur retourne
// uniquement l’éligibilité + le canal de financement. Les montants seront
// branchés quand le barème délégataire sera fourni.

function emptyPac(raison: string | null = null): PacResult {
  return { eligible: false, raison, operation: null, estimatedPrimeEur: null };
}

function emptyRenov(raison: string | null = null): RenovResult {
  return {
    eligible: false,
    raison,
    scenario: null,
    package: [],
    estimatedPrimeEur: null,
    financement: "non_applicable",
    financementLabel: "Non applicable",
    warnings: [],
  };
}

const REVENUS_CEE_X2 = new Set<string>(["tres_modeste", "modeste"]);
const DPE_FOR_ANAH = new Set<string>(["E", "F", "G"]);

/**
 * Détermine le canal de financement applicable :
 *  - **CEE x2** (Coup de pouce) : ménages très modestes / modestes
 *  - **CEE simple** : ménages intermédiaires / supérieurs
 *  - **ANAH** (bascule MaPrimeRénov’) : DPE E/F/G + logement > 15 ans
 *  - **Non applicable** : si rénovation globale non éligible
 */
export function computeFinancement(
  answers: SimulationAnswers,
  renovEligible: boolean,
): { type: FinancementType; label: string } {
  if (!renovEligible) {
    return { type: "non_applicable", label: "Non applicable" };
  }

  // Bascule ANAH : DPE E/F/G + logement > 15 ans → MaPrimeRénov’
  if (DPE_FOR_ANAH.has(answers.dpe) && answers.ageLogement === "plus_15_ans") {
    return {
      type: "anah_bascule",
      label: "Bascule ANAH — MaPrimeRénov’ (hors périmètre CEE)",
    };
  }

  if (REVENUS_CEE_X2.has(answers.trancheRevenu)) {
    return { type: "cee_x2", label: "CEE ×2 — Coup de pouce (ménages modestes)" };
  }

  return { type: "cee_simple", label: "CEE standard" };
}

export function computeResult(answers: SimulationAnswers): EligibilityResult {
  const zone = detectZone(answers.adresse?.codePostal);

  if (answers.profil === "locataire") {
    return {
      zone,
      doNotDispatch: true,
      pac: emptyPac("Profil locataire — pas de création de lead depuis ce parcours."),
      renov: emptyRenov("Profil locataire."),
      packageKey: "none",
      estimatedTotalPrimeEur: null,
      cibleIdeale: false,
    };
  }

  const pacRaw = computePacEligibility(answers);
  const renovRaw = computeRenovGlobaleEligibility(answers);
  const financement = computeFinancement(answers, renovRaw.eligible);

  const renovWarnings: string[] = [];
  if (renovRaw.eligible && answers.travauxCeeRecus === "jsp") {
    renovWarnings.push(
      "Vérifier l’absence de travaux CEE antérieurs lors de la visite technique (cumul interdit < 24 mois).",
    );
  }

  const renovPackage =
    renovRaw.eligible && renovRaw.scenario ? buildPackage(answers, renovRaw.scenario) : [];

  const packageKey: EligibilityResult["packageKey"] =
    pacRaw.eligible && renovRaw.eligible
      ? "pack_pac_renov"
      : pacRaw.eligible
        ? "pac_only"
        : renovRaw.eligible
          ? "renov_only"
          : "none";

  return {
    zone,
    doNotDispatch: false,
    pac: {
      eligible: pacRaw.eligible,
      raison: pacRaw.raison,
      operation: pacRaw.operation,
      estimatedPrimeEur: null,
    },
    renov: {
      eligible: renovRaw.eligible,
      raison: renovRaw.raison,
      scenario: renovRaw.scenario,
      package: renovPackage,
      estimatedPrimeEur: null,
      financement: financement.type,
      financementLabel: financement.label,
      warnings: renovWarnings,
    },
    packageKey,
    estimatedTotalPrimeEur: null,
    cibleIdeale: isCibleIdeale(answers),
  };
}

export function buildPkg(answers: SimulationAnswers): EligibilityResult["packageKey"] {
  return computeResult(answers).packageKey;
}

/**
 * Profils éligibles à la « cible idéale ». `sarl` est listé pour anticiper
 * un futur ajout dans `ProfilOccupant` ; sans modification de l’enum, le
 * `Set<string>` reste tolérant.
 */
const PROFILS_CIBLE_IDEALE = new Set<string>([
  "proprietaire_occupant",
  "sci",
  "bailleur",
  "sarl",
]);

const TRANCHES_CIBLE_IDEALE = new Set<string>(["tres_modeste", "modeste"]);

/**
 * Détermine si le prospect correspond à la « cible idéale » pour la
 * rénovation globale : maison récente, double vitrage déjà fait, sous-sol
 * isolable, BTD et VMC à poser, revenus modestes / très modestes
 * → bonifications CEE + Coup de pouce → reste à charge minimal attendu.
 *
 * Indicateur **commercial** uniquement, indépendant de `computeResult`.
 */
export function isCibleIdeale(answers: SimulationAnswers): boolean {
  return (
    PROFILS_CIBLE_IDEALE.has(answers.profil) &&
    answers.typeLogement === "maison" &&
    answers.periodeConstruction === "apres_2000" &&
    answers.fenetres === "double_vitrage" &&
    answers.sousSol === true &&
    answers.btdInstalle === false &&
    answers.vmcInstallee === false &&
    answers.trancheRevenu !== undefined &&
    TRANCHES_CIBLE_IDEALE.has(answers.trancheRevenu)
  );
}

export { getThresholds, buildTranches } from "@/features/simulator-cee/domain/plafonds";
