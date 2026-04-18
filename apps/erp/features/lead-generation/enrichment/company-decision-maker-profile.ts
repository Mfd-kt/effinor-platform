/**
 * Profil simplifié pour ordonner les angles de recherche décideur (pas une étiquette entreprise absolue).
 */
export type LeadGenerationCompanyDecisionMakerProfile =
  | "industrial_logistics"
  | "sme"
  | "tertiary"
  | "general";

export function inferCompanyDecisionMakerProfile(input: {
  category: string | null | undefined;
  sub_category: string | null | undefined;
}): LeadGenerationCompanyDecisionMakerProfile {
  const blob = `${input.category ?? ""} ${input.sub_category ?? ""}`.toLowerCase();
  if (
    /\b(entrepôt|entrepot|logistique|industriel|industrie|production|manutention|plateforme|warehouse)\b/.test(blob)
  ) {
    return "industrial_logistics";
  }
  if (/\b(artisan|artisanat|tpe|pm\b|pme\b|commerce\s+de\s+détail|boulanger|plombier|électricien)\b/.test(blob)) {
    return "sme";
  }
  if (
    /\b(bureau|tertiaire|conseil|services?\s+aux|saas|informatique|immobilier|assurance|banque)\b/.test(blob)
  ) {
    return "tertiary";
  }
  return "general";
}

export type DecisionMakerSearchAngleId = "executive" | "site_ops" | "maintenance" | "technical";

export type DecisionMakerSearchAngle = { id: DecisionMakerSearchAngleId; querySuffix: string };

const ANGLE_EXECUTIVE: DecisionMakerSearchAngle = {
  id: "executive",
  querySuffix: '(dirigeant OR gérant OR président OR PDG OR "chef d\'entreprise" OR directeur général)',
};

const ANGLE_SITE: DecisionMakerSearchAngle = {
  id: "site_ops",
  querySuffix:
    '("directeur de site" OR "directrice de site" OR "directeur d\'exploitation" OR "directrice d\'exploitation")',
};

const ANGLE_MAINT: DecisionMakerSearchAngle = {
  id: "maintenance",
  querySuffix: '("responsable maintenance" OR "chef maintenance" OR "coordinateur maintenance")',
};

const ANGLE_TECH: DecisionMakerSearchAngle = {
  id: "technical",
  querySuffix:
    '("responsable technique" OR "directeur technique" OR travaux OR énergie OR "responsable travaux")',
};

export function orderedDecisionMakerSearchAngles(
  profile: LeadGenerationCompanyDecisionMakerProfile,
): DecisionMakerSearchAngle[] {
  switch (profile) {
    case "industrial_logistics":
      return [ANGLE_MAINT, ANGLE_TECH, ANGLE_SITE, ANGLE_EXECUTIVE];
    case "sme":
      return [ANGLE_EXECUTIVE, ANGLE_SITE, ANGLE_MAINT, ANGLE_TECH];
    case "tertiary":
      return [ANGLE_SITE, ANGLE_EXECUTIVE, ANGLE_TECH, ANGLE_MAINT];
    default:
      return [ANGLE_EXECUTIVE, ANGLE_SITE, ANGLE_MAINT, ANGLE_TECH];
  }
}
