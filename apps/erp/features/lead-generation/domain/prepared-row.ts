import type { LeadGenerationPhoneEmailWebsiteStatus } from "./statuses";

/**
 * Fiche enrichie par les helpers de normalisation (pur — pas d’accès DB).
 */
export type LeadGenerationPreparedStockRow = {
  source: string;
  source_external_id: string | null;
  company_name: string;
  normalized_company_name: string | null;
  /** Clé de rapprochement anti-doublons (suffixes juridiques, accents) — étape 19. */
  matching_company_key: string | null;
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
  /** SIRET normalisé (14 chiffres) pour comparaison / stockage. */
  normalized_siret: string | null;
  headcount_range: string | null;
  phone_status: LeadGenerationPhoneEmailWebsiteStatus;
  email_status: LeadGenerationPhoneEmailWebsiteStatus;
  website_status: LeadGenerationPhoneEmailWebsiteStatus;
  target_score: number;
  has_linkedin: boolean;
  has_decision_maker: boolean;
  source_signal_score: number;
  source_channels: string[];
  linkedin_url: string | null;
  decision_maker_name: string | null;
  decision_maker_role: string | null;
};
