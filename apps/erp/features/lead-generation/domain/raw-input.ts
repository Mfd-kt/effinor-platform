/**
 * Fiche brute importée (scraping, fichier, etc.) — avant normalisation / insertion.
 */
export type LeadGenerationSourceChannel = "google_maps" | "yellow_pages" | "linkedin";

export type LeadGenerationRawStockInput = {
  source: string;
  source_external_id?: string | null;
  company_name: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  category?: string | null;
  sub_category?: string | null;
  siret?: string | null;
  headcount_range?: string | null;
  /** Score 0–100 issu du blending multi-sources (servant aussi de seed pour `target_score`). */
  source_signal_score?: number;
  /** Canaux ayant alimenté la ligne (fusion Maps + Pages Jaunes, etc.). */
  source_channels?: LeadGenerationSourceChannel[];
  has_linkedin?: boolean;
  has_decision_maker?: boolean;
  linkedin_url?: string | null;
  decision_maker_name?: string | null;
  decision_maker_role?: string | null;
  /** Données additionnelles fusionnées dans `raw_payload` (jsonb). */
  extra_payload?: Record<string, unknown>;
};
