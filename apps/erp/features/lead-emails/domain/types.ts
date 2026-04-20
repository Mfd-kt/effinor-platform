import type { Json } from "@/features/lead-generation/domain/json";

/**
 * Signaux bâtiment / exploitation — uniquement des champs réellement présents côté données.
 */
export type QualifiedLeadBuildingSignals = {
  large_volume?: boolean;
  heated_building?: boolean;
  workshop?: boolean;
  industrial_site?: boolean;
  tertiary_site?: boolean;
  heating_type?: string | null;
  surface?: string | null;
  height?: string | null;
  other_notes?: string | null;
};

/**
 * Contexte nettoyé pour le modèle et la validation (aucune invention).
 */
export type QualifiedLeadEmailContext = {
  company_name: string | null;
  activity: string | null;
  city: string | null;
  postal_code: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_full_name: string | null;
  contact_role: string | null;
  email: string | null;
  phone: string | null;
  building_signals: QualifiedLeadBuildingSignals;
  qualification_notes: string | null;
  source: string | null;
  /** JSON brut restreint (secteur, résumé GPT, etc.) — déjà filtré. */
  enrichment_hints: Record<string, Json | undefined>;
};

export type OpenAiGeneratedQualifiedEmail = {
  subject: string;
  email_body: string;
  used_signals: string[];
  confidence: "high" | "medium" | "low";
};

export type QualifiedEmailValidationResult =
  | {
      ok: true;
      personalizationScore: number;
    }
  | {
      ok: false;
      reason: string;
      personalizationScore: number;
    };

export type QualifiedProspectEmailPipelineStatus =
  | "skipped"
  | "validation_failed"
  | "sent"
  | "failed"
  | "openai_failed";

export type QualifiedProspectEmailGenerationSource = "openai" | "fallback" | "none";
