/** Alignés sur les contraintes CHECK SQL — pas de logique UI. */

export type LeadGenerationImportBatchStatus = "pending" | "running" | "completed" | "failed";

export type LeadGenerationPhoneEmailWebsiteStatus = "found" | "missing";

export type LeadGenerationQualificationStatus =
  | "pending"
  | "qualified"
  | "rejected"
  | "duplicate";

export type LeadGenerationStockStatus =
  | "new"
  | "ready"
  | "assigned"
  | "in_progress"
  | "converted"
  | "rejected"
  | "expired"
  | "archived";

/** Étape 10 — enrichissement manuel ciblé (CHECK SQL). */
export type LeadGenerationEnrichmentStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "failed";

/** Mini-étape 10.1 — fiabilité des suggestions (CHECK SQL, défaut `low`). */
export type LeadGenerationEnrichmentConfidence = "low" | "medium" | "high";

/** Étape 11 — origine des enrichissements `enriched_*` (CHECK SQL). */
export type LeadGenerationEnrichmentSource = "heuristic" | "firecrawl";

/** Extraction décideur B2B — colonnes `decision_maker_*` (CHECK SQL). */
export type LeadGenerationDecisionMakerSource = "website" | "google" | "linkedin";

/** Confiance décideur : alignée sur la source (LinkedIn > site > recherche). */
export type LeadGenerationDecisionMakerConfidence = "low" | "medium" | "high";

/** Étape 12 — priorité dérivée du score commercial (CHECK SQL). */
export type LeadGenerationCommercialPriority = "low" | "normal" | "high" | "critical";

/** Étape 13 — décision de file de dispatch (CHECK SQL). */
export type LeadGenerationDispatchQueueStatus =
  | "ready_now"
  | "enrich_first"
  | "review"
  | "low_value"
  | "do_not_dispatch";

export type LeadGenerationRejectionReason = "no_phone" | (string & {});
