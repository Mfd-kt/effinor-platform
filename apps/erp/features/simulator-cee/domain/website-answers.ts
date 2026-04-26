/**
 * Pont entre les réponses collectées par le simulateur public (apps/website)
 * et le schéma ERP (`SimulationAnswers`).
 *
 * Le simulateur site stocke ses réponses dans `leads.sim_payload_json` avec
 * `sim_version = 'website-simulator-v1'` — 6 questions seulement (profil,
 * logement, chauffage, foyer, travaux, coordonnées), les détails techniques
 * (construction, ITE, fenêtres, sous-sol, BTD, VMC, DPE, âge, travaux CEE)
 * restent à compléter par le closer.
 */

import type {
  ProfilOccupant,
  SimulationAnswers,
  TrancheRevenu,
  TypeChauffage,
  TypeLogement,
} from "./types";

export const WEBSITE_SIM_VERSION = "website-simulator-v1";

export type WebsiteLogement = "maison" | "appartement" | "immeuble";
export type WebsiteStatut = "proprietaire" | "locataire" | "sci_sarl";
export type WebsiteChauffage = "gaz" | "fioul" | "electrique" | "autre";
export type WebsiteTravauxKind =
  | "isolation"
  | "pac_clim"
  | "chauffage_traditionnel"
  | "chauffage_bois"
  | "solaire"
  | "chauffe_eau"
  | "renovation_globale"
  | "je_ne_sais_pas";
export type WebsiteTranche =
  | "tres_modeste"
  | "modeste"
  | "intermediaire"
  | "superieur"
  | "nr";

export type WebsiteSimulatorAnswers = {
  logement: WebsiteLogement;
  statut: WebsiteStatut;
  chauffage: WebsiteChauffage;
  nb_personnes: 1 | 2 | 3 | 4 | 5;
  tranche_revenus: WebsiteTranche;
  travaux: WebsiteTravauxKind[];
  code_postal: string;
};

export type WebsiteSimulatorContact = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_e164?: string;
};

export type WebsiteSimulatorPayload = {
  source: "website_simulator";
  version: string;
  answers: WebsiteSimulatorAnswers;
  contact?: WebsiteSimulatorContact;
};

const LOGEMENT_VALUES: readonly WebsiteLogement[] = ["maison", "appartement", "immeuble"];
const STATUT_VALUES: readonly WebsiteStatut[] = ["proprietaire", "locataire", "sci_sarl"];
const CHAUFFAGE_VALUES: readonly WebsiteChauffage[] = ["gaz", "fioul", "electrique", "autre"];
const TRAVAUX_VALUES: readonly WebsiteTravauxKind[] = [
  "isolation",
  "pac_clim",
  "chauffage_traditionnel",
  "chauffage_bois",
  "solaire",
  "chauffe_eau",
  "renovation_globale",
  "je_ne_sais_pas",
];
const TRANCHE_VALUES: readonly WebsiteTranche[] = [
  "tres_modeste",
  "modeste",
  "intermediaire",
  "superieur",
  "nr",
];

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

/**
 * Extrait une payload simulateur site depuis `leads.sim_payload_json`.
 * Retourne `null` si l'objet n'est pas un payload site valide (autre version,
 * structure inattendue, etc.) — l'ERP peut alors retomber sur son flux normal.
 */
export function extractWebsiteSimulatorPayload(raw: unknown): WebsiteSimulatorPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  if (r.source !== "website_simulator") return null;
  if (typeof r.version !== "string" || !r.version.startsWith("website-simulator-")) return null;

  const a = r.answers;
  if (!a || typeof a !== "object") return null;
  const ans = a as Record<string, unknown>;

  if (!isOneOf(ans.logement, LOGEMENT_VALUES)) return null;
  if (!isOneOf(ans.statut, STATUT_VALUES)) return null;
  if (!isOneOf(ans.chauffage, CHAUFFAGE_VALUES)) return null;
  if (!isOneOf(ans.tranche_revenus, TRANCHE_VALUES)) return null;
  if (typeof ans.nb_personnes !== "number") return null;
  const nb = Math.max(1, Math.min(5, Math.floor(ans.nb_personnes))) as 1 | 2 | 3 | 4 | 5;
  if (typeof ans.code_postal !== "string") return null;

  const travauxRaw = Array.isArray(ans.travaux) ? ans.travaux : [];
  const travaux = travauxRaw.filter((v): v is WebsiteTravauxKind =>
    isOneOf(v, TRAVAUX_VALUES)
  );

  const c = r.contact;
  const contact: WebsiteSimulatorContact | undefined =
    c && typeof c === "object"
      ? {
          first_name:
            typeof (c as Record<string, unknown>).first_name === "string"
              ? ((c as Record<string, unknown>).first_name as string)
              : undefined,
          last_name:
            typeof (c as Record<string, unknown>).last_name === "string"
              ? ((c as Record<string, unknown>).last_name as string)
              : undefined,
          email:
            typeof (c as Record<string, unknown>).email === "string"
              ? ((c as Record<string, unknown>).email as string)
              : undefined,
          phone_e164:
            typeof (c as Record<string, unknown>).phone_e164 === "string"
              ? ((c as Record<string, unknown>).phone_e164 as string)
              : undefined,
        }
      : undefined;

  return {
    source: "website_simulator",
    version: r.version,
    answers: {
      logement: ans.logement,
      statut: ans.statut,
      chauffage: ans.chauffage,
      nb_personnes: nb,
      tranche_revenus: ans.tranche_revenus,
      travaux,
      code_postal: ans.code_postal,
    },
    contact,
  };
}

// ─── Mapping website → ERP ────────────────────────────────────────────

function mapStatut(s: WebsiteStatut): ProfilOccupant {
  switch (s) {
    case "proprietaire":
      return "proprietaire_occupant";
    case "locataire":
      return "locataire";
    case "sci_sarl":
      return "sci";
  }
}

function mapLogement(l: WebsiteLogement): TypeLogement | undefined {
  if (l === "maison") return "maison";
  if (l === "appartement") return "appartement";
  // `immeuble` : non exprimable dans l'enum ERP ('maison' | 'appartement').
  // Le closer tranchera — on laisse undefined.
  return undefined;
}

function mapChauffage(c: WebsiteChauffage): TypeChauffage | undefined {
  switch (c) {
    case "gaz":
      return "gaz";
    case "fioul":
      return "fioul";
    case "electrique":
      return "elec";
    case "autre":
      // L'utilisateur a répondu "Autre / Je ne sais pas" — le closer précisera
      // (chaudière gaz condensation, bois, granulés, PAC déjà installée, etc.).
      return undefined;
  }
}

function mapTranche(t: WebsiteTranche): TrancheRevenu | undefined {
  if (t === "nr") return undefined;
  return t;
}

export type MappedWebsiteSimulatorAnswers = {
  answers: Partial<SimulationAnswers>;
  /** Champs que le closer doit encore saisir (pour message informatif UI). */
  missingFields: string[];
};

/**
 * Convertit une payload site en `Partial<SimulationAnswers>` consommable par
 * `SimulatorCee` (prop `initialAnswers`). Les champs non collectés par le
 * site restent `undefined` — à compléter par le closer avec le prospect.
 *
 * @param payload   Payload site (issue de `extractWebsiteSimulatorPayload`)
 * @param leadAddr  Coordonnées lead déjà en base (worksite_*) — prioritaires
 */
export function mapWebsitePayloadToSimulatorAnswers(
  payload: WebsiteSimulatorPayload,
  leadAddr?: {
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
  }
): MappedWebsiteSimulatorAnswers {
  const a = payload.answers;
  const profil = mapStatut(a.statut);
  const typeLogement = mapLogement(a.logement);
  const chauffage = mapChauffage(a.chauffage);
  const trancheRevenu = mapTranche(a.tranche_revenus);

  const postalCode = (leadAddr?.postalCode ?? a.code_postal ?? "").trim();
  const address = (leadAddr?.address ?? "").trim();
  const city = (leadAddr?.city ?? "").trim();

  const initial: Partial<SimulationAnswers> = {
    profil,
    ...(typeLogement ? { typeLogement } : {}),
    ...(chauffage ? { chauffage } : {}),
    nbPersonnes: a.nb_personnes,
    ...(trancheRevenu ? { trancheRevenu } : {}),
    adresse: {
      adresse: address,
      codePostal: postalCode,
      ville: city,
    },
  };

  // On initialise `contact` avec les infos site (le lead est déjà en DB, mais
  // le simulateur en a besoin dans sa payload pour la re-soumission).
  const c = payload.contact
  if (c?.first_name || c?.last_name || c?.email || c?.phone_e164) {
    initial.contact = {
      civilite: "M.",
      prenom: c?.first_name ?? "",
      nom: c?.last_name ?? "",
      email: c?.email ?? "",
      telephone: c?.phone_e164 ?? "",
    }
  }

  const missingFields: string[] = []
  if (!typeLogement) missingFields.push("Type de logement (immeuble collectif)")
  if (!chauffage) missingFields.push("Chauffage précis")
  if (!trancheRevenu) missingFields.push("Tranche de revenus")
  if (profil === "proprietaire_occupant" && !typeLogement) {
    // déjà signalé
  }

  // Étapes à compléter par le closer (toujours manquantes côté site)
  missingFields.push(
    "DPE",
    "Période de construction",
    "Travaux CEE déjà reçus",
  )
  if (profil === "proprietaire_occupant") {
    missingFields.push("Fenêtres", "Sous-sol", "BTD", "VMC", "Chauffage remplacé < 24 mois")
  }

  return { answers: initial, missingFields }
}
