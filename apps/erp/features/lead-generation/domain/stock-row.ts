import type { Json } from "./json";

import type { LeadGenerationLeadTier } from "./lead-tier";
import type {
  LeadGenerationCommercialPriority,
  LeadGenerationDecisionMakerConfidence,
  LeadGenerationDecisionMakerSource,
  LeadGenerationDispatchQueueStatus,
  LeadGenerationDropcontactStatus,
  LeadGenerationEnrichmentConfidence,
  LeadGenerationEnrichmentSource,
  LeadGenerationEnrichmentStatus,
  LeadGenerationImportBatchStatus,
  LeadGenerationPhoneEmailWebsiteStatus,
  LeadGenerationQualificationStatus,
  LeadGenerationStockStatus,
} from "./statuses";

export type LeadGenerationClosingReadinessStatus = "low" | "medium" | "high";

/**
 * Forme liste / détail alignée sur `public.lead_generation_stock`
 * (types généraux tant que `database.types` n’inclut pas ces tables).
 */
export type LeadGenerationStockRow = {
  id: string;
  import_batch_id: string | null;
  source: string;
  source_external_id: string | null;
  company_name: string;
  normalized_company_name: string | null;
  phone: string | null;
  normalized_phone: string | null;
  email: string | null;
  normalized_email: string | null;
  website: string | null;
  normalized_domain: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  category: string | null;
  sub_category: string | null;
  siret: string | null;
  headcount_range: string | null;
  target_score: number;
  phone_status: LeadGenerationPhoneEmailWebsiteStatus;
  email_status: LeadGenerationPhoneEmailWebsiteStatus;
  website_status: LeadGenerationPhoneEmailWebsiteStatus;
  qualification_status: LeadGenerationQualificationStatus;
  stock_status: LeadGenerationStockStatus;
  rejection_reason: string | null;
  duplicate_of_stock_id: string | null;
  /** Score de rapprochement si doublon à l’import (étape 19). */
  duplicate_match_score: number | null;
  /** Motifs de doublon (codes stables). */
  duplicate_match_reasons: string[] | null;
  converted_lead_id: string | null;
  current_assignment_id: string | null;
  raw_payload: Json;
  imported_at: string | null;
  created_at: string;
  updated_at: string;
  enrichment_status: LeadGenerationEnrichmentStatus;
  /** Requête Dropcontact en cours ou terminée (webhook). */
  dropcontact_request_id?: string | null;
  dropcontact_status?: LeadGenerationDropcontactStatus;
  dropcontact_requested_at?: string | null;
  dropcontact_completed_at?: string | null;
  dropcontact_last_error?: string | null;
  dropcontact_raw_payload?: Json | null;
  enriched_at: string | null;
  enrichment_error: string | null;
  enriched_email: string | null;
  enriched_domain: string | null;
  enriched_website: string | null;
  enrichment_confidence: LeadGenerationEnrichmentConfidence;
  enrichment_source: LeadGenerationEnrichmentSource;
  commercial_score: number;
  commercial_priority: LeadGenerationCommercialPriority;
  commercial_score_breakdown: Json;
  commercial_scored_at: string | null;
  dispatch_queue_status: LeadGenerationDispatchQueueStatus;
  dispatch_queue_reason: string | null;
  dispatch_queue_rank: number;
  dispatch_queue_evaluated_at: string | null;
  /** Dernière revue manuelle — résumé court (étape 20). */
  manual_override_status: string | null;
  manual_override_reason: string | null;
  manually_reviewed_at: string | null;
  manually_reviewed_by_user_id: string | null;
  /** Dernier renvoi par un commercial vers la quantification (relecture). */
  returned_from_commercial_at?: string | null;
  returned_from_commercial_by_user_id?: string | null;
  returned_from_commercial_note?: string | null;
  /** Décideur B2B — extraction publique uniquement (pas d’invention). */
  decision_maker_name?: string | null;
  decision_maker_role?: string | null;
  decision_maker_source?: LeadGenerationDecisionMakerSource | null;
  decision_maker_confidence?: LeadGenerationDecisionMakerConfidence | null;
  has_linkedin?: boolean;
  has_decision_maker?: boolean;
  source_signal_score?: number;
  source_channels?: string[] | null;
  linkedin_url?: string | null;
  /** Classification premium B2B (distincte du score commercial). */
  lead_tier: LeadGenerationLeadTier;
  /** Score premium complémentaire (0–100). */
  premium_score: number;
  /** Motifs du score premium (persistés en JSON). */
  premium_reasons: string[];
  premium_scored_at: string | null;
  /** Priorité du rôle décideur (ordre métier). */
  decision_maker_role_priority?: string | null;
  /** Métadonnées d’enrichissement (LinkedIn ciblé, etc.). */
  enrichment_metadata?: Json | null;
  /** Présents après migration closing — optionnel côté TS pour compatibilité lecture. */
  closing_readiness_score?: number;
  closing_readiness_status?: LeadGenerationClosingReadinessStatus;
  closing_reasons?: string[];
  closing_scored_at?: string | null;
  approach_angle?: string | null;
  approach_hook?: string | null;
};

export type LeadGenerationImportBatchRow = {
  id: string;
  source: string;
  source_label: string | null;
  job_reference: string | null;
  status: LeadGenerationImportBatchStatus;
  imported_count: number;
  accepted_count: number;
  duplicate_count: number;
  rejected_count: number;
  metadata_json: Json;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  cee_sheet_id?: string | null;
  cee_sheet_code?: string | null;
  target_team_id?: string | null;
  created_by_user_id?: string | null;
  stock_initial_qualification?: "qualified" | "to_validate";
};
