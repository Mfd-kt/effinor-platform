import type { Json } from "./json";

export type LeadGenerationGptResearchStatus =
  | "idle"
  | "pending"
  | "completed"
  | "completed_with_warning"
  | "failed";

export type LeadGenerationGptSector = "industrial" | "tertiary" | "mixed" | "unknown";

export type LeadGenerationGptBuildingType = "industrial" | "tertiary" | "mixed" | "unknown";

export type LeadGenerationGptConfidence = "low" | "medium" | "high";

export type LeadGenerationGptMatchConfidence = "none" | "low" | "medium" | "high";

export type LeadGenerationGptQualificationRecommendation = "good" | "review" | "out_of_target";

export type LeadGenerationGptCommercialAction = "call" | "review" | "discard";

export type LeadGenerationGptCommercialPriority = "high" | "medium" | "low";

export type LeadGenerationGptScoreBreakdownLine = {
  line: string;
};

export type LeadGenerationGptSignalValue = {
  value: string | null;
  confidence: LeadGenerationGptConfidence;
  evidence: string;
};

export type LeadGenerationGptDecisionMaker = {
  name: string;
  role: string;
  email: string;
  phone: string;
  source: string;
  confidence: LeadGenerationGptConfidence;
};

export type LeadGenerationGptPappersMatch = {
  match_confidence: LeadGenerationGptMatchConfidence;
  siren: string;
  siret: string;
  legal_name: string;
  head_office_address: string;
  legal_form: string;
  directors: string[];
  useful_company_data: string[];
};

export type LeadGenerationGptUsefulLink = {
  url: string;
  label: string;
};

export type LeadGenerationGptSourceRef = {
  url: string;
  title: string;
  note: string;
};

/**
 * Phase 1 — enquête web (activité, bâtiment, décideur, sources, reco simple).
 * Pas de score ni script commercial (phase 2).
 */
export type LeadGenerationGptResearchPhase1Payload = {
  company_name_confirmed: string;
  activity_summary: string;
  sector: LeadGenerationGptSector;
  building_type: LeadGenerationGptBuildingType;
  height_signal: LeadGenerationGptSignalValue;
  surface_signal: LeadGenerationGptSignalValue;
  heating_signals: string[];
  qualification_signals: string[];
  decision_maker: LeadGenerationGptDecisionMaker;
  pappers_match: LeadGenerationGptPappersMatch;
  useful_links: LeadGenerationGptUsefulLink[];
  sources: LeadGenerationGptSourceRef[];
  qualification_recommendation: LeadGenerationGptQualificationRecommendation;
  qualification_reason: string;
};

/**
 * Phase 2 — synthèse commerciale à partir de la phase 1 (sans web_search).
 */
export type LeadGenerationGptResearchPhase2Payload = {
  lead_score: number;
  lead_score_breakdown: LeadGenerationGptScoreBreakdownLine[];
  commercial_action_recommendation: LeadGenerationGptCommercialAction;
  commercial_action_reason: string;
  commercial_priority: LeadGenerationGptCommercialPriority;
  commercial_call_script: string;
  commercial_call_angle: string;
  commercial_contact_target: LeadGenerationGptDecisionMaker;
};

/** Réponse retry ciblé décideur + sources additionnelles. */
export type LeadGenerationGptResearchDecisionMakerRetryPayload = {
  decision_maker: LeadGenerationGptDecisionMaker;
  sources: LeadGenerationGptSourceRef[];
};

export type LeadGenerationGptResearchQuality = {
  completeness: "complete" | "incomplete";
  warnings: string[];
};

/**
 * Sortie JSON attendue (stockée dans `research_gpt_payload` après fusion Pappers).
 */
export type LeadGenerationGptResearchPayload = LeadGenerationGptResearchPhase1Payload &
  LeadGenerationGptResearchPhase2Payload & {
    /** Renseigné côté serveur après validation ; pas produit par le modèle. */
    gpt_research_quality?: LeadGenerationGptResearchQuality;
  };

export type LeadGenerationGptResearchInput = {
  company_name: string;
  phone: string | null;
  normalized_phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  website: string | null;
  enriched_website: string | null;
  normalized_domain: string | null;
  maps_url: string | null;
  street_view_url: string | null;
  cee_sheet_id: string | null;
  cee_sheet_code: string | null;
  decision_maker_name: string | null;
  decision_maker_role: string | null;
  email: string | null;
  enriched_email: string | null;
  siret: string | null;
  category: string | null;
  sub_category: string | null;
  raw_payload_excerpt: Json | null;
};

export type LeadGenerationGptPappersEnrichment = {
  match: LeadGenerationGptPappersMatch;
  raw_search: Json | null;
  raw_entreprise: Json | null;
};
