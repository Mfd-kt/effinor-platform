export type AgentSimulatorDefinition =
  | {
      kind: "destrat";
      title: string;
      description: string;
    }
  | {
      kind: "unsupported";
      title: string;
      description: string;
    };

/** Contexte fiche pour résoudre le simulateur (clé explicite + métadonnées). */
export type AgentSimulatorSheetContext = {
  code: string;
  label: string;
  simulatorKey?: string | null;
  calculationProfile?: string | null;
};

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

function matchesDestratSimulatorKey(raw: string | null | undefined): boolean {
  if (!raw?.trim()) return false;
  const k = stripAccents(raw.trim().toLowerCase());
  if (k === "destrat") return true;
  if (k.includes("destratification")) return true;
  if (k.includes("destratif")) return true;
  return false;
}

/**
 * Fiches CEE déstrat (BAT-TH / IND-BA) créées avant simulator_key : profil coeff_zone_system_power
 * ou libellé / code identifiable.
 */
export function inferDestratSimulatorFromSheetMetadata(sheet: AgentSimulatorSheetContext): boolean {
  if (sheet.calculationProfile === "coeff_zone_system_power") {
    return true;
  }
  const blob = stripAccents(`${sheet.code} ${sheet.label}`.toLowerCase());
  if (blob.includes("destratification") || blob.includes("destratif")) {
    return true;
  }
  if (blob.includes("bat-th")) {
    return true;
  }
  if (blob.includes("ind-ba")) {
    return true;
  }
  return false;
}

const DESTRAT_DEF: AgentSimulatorDefinition = {
  kind: "destrat",
  title: "Simulateur destratification",
  description: "Qualification rapide du potentiel de destratification pendant l'appel.",
};

function unsupportedFromKey(simulatorKey: string | null | undefined): AgentSimulatorDefinition {
  const key = simulatorKey?.trim();
  if (!key) {
    return {
      kind: "unsupported",
      title: "Simulateur bientôt disponible",
      description: "Aucun simulateur n'est configuré pour cette fiche CEE.",
    };
  }
  return {
    kind: "unsupported",
    title: "Simulateur bientôt disponible",
    description: `Le simulateur "${key}" n'est pas encore branché dans le poste agent.`,
  };
}

/** @deprecated Préférer passer un objet fiche pour gérer les clés manquantes. */
export function resolveAgentSimulatorDefinition(simulatorKey: string | null | undefined): AgentSimulatorDefinition;

export function resolveAgentSimulatorDefinition(sheet: AgentSimulatorSheetContext): AgentSimulatorDefinition;

export function resolveAgentSimulatorDefinition(
  input: string | null | undefined | AgentSimulatorSheetContext,
): AgentSimulatorDefinition {
  if (typeof input === "string" || input === null || input === undefined) {
    if (matchesDestratSimulatorKey(input ?? null)) {
      return DESTRAT_DEF;
    }
    return unsupportedFromKey(input ?? null);
  }

  const sheet = input;
  if (matchesDestratSimulatorKey(sheet.simulatorKey)) {
    return DESTRAT_DEF;
  }
  if (inferDestratSimulatorFromSheetMetadata(sheet)) {
    return DESTRAT_DEF;
  }
  return unsupportedFromKey(sheet.simulatorKey ?? null);
}
