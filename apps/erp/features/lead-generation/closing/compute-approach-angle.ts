import type { LeadGenerationStockRow } from "../domain/stock-row";
import { inferCompanyDecisionMakerProfile } from "../enrichment/company-decision-maker-profile";
import { inferDecisionMakerRolePriorityFromRoleText } from "../domain/decision-maker-role-priority";

export type LeadGenerationApproachSuggestion = {
  approachAngle: string;
  approachHook: string;
};

/**
 * Accroches courtes pour l’appel — pas de texte marketing, uniquement des angles exploitables.
 */
export function computeLeadGenerationApproachAngle(row: LeadGenerationStockRow): LeadGenerationApproachSuggestion {
  const role = row.decision_maker_role?.trim() ?? "";
  const rp = inferDecisionMakerRolePriorityFromRoleText(role);
  const profile = inferCompanyDecisionMakerProfile({
    category: row.category,
    sub_category: row.sub_category,
  });

  if (rp === "maintenance_manager" || /maintenance/i.test(role)) {
    return {
      approachAngle: "maintenance",
      approachHook: "Parler optimisation technique et charge de maintenance du site.",
    };
  }
  if (rp === "owner_executive" || /gérant|président|pdg|dirigeant/i.test(role)) {
    return {
      approachAngle: "dirigeant",
      approachHook: "Mettre l’accent sur le gain global et une décision rapide sur le projet.",
    };
  }
  if (rp === "technical_manager" || /technique|travaux|exploitation/i.test(role)) {
    return {
      approachAngle: "technique",
      approachHook: "Aborder l’exploitation actuelle et les leviers d’amélioration des équipements.",
    };
  }
  if (rp === "energy_manager" || /énergie|energie/i.test(role)) {
    return {
      approachAngle: "énergie",
      approachHook: "Cadrer sur la conso et les actions d’efficacité énergétique concrètes.",
    };
  }
  if (rp === "site_director") {
    return {
      approachAngle: "site",
      approachHook: "Parler pilotage du site et impacts opérationnels d’un changement d’équipement.",
    };
  }

  if (profile === "industrial_logistics") {
    return {
      approachAngle: "exploitation",
      approachHook: "Angle entrepôt / flux : fiabilité des installations et temps d’arrêt.",
    };
  }
  if (profile === "tertiary") {
    return {
      approachAngle: "services",
      approachHook: "Reste court : besoin sur les bâtiments tertiaires et confort / coûts.",
    };
  }

  return {
    approachAngle: "entreprise",
    approachHook: "Ouverture simple : comprendre qui pilote les travaux ou l’énergie sur le site.",
  };
}
