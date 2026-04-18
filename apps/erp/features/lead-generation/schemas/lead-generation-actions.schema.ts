import { z } from "zod";

import { LEAD_GENERATION_SECTOR_OPTIONS } from "../lib/generate-campaign";
import { LEAD_GENERATION_AUTOMATION_TYPES } from "../automation/types";
import { LEAD_GENERATION_SETTINGS_KEYS } from "../settings/default-settings";
import {
  isManualReviewDecisionAllowedForType,
  type LeadGenerationManualReviewDecision,
} from "../domain/manual-review";

const uuid = z.string().uuid("Identifiant invalide.");

export const getLeadGenerationStockActionInputSchema = z
  .object({
    filters: z
      .object({
        stock_status: z.string().optional(),
        qualification_status: z.string().optional(),
        source: z.string().optional(),
        city: z.string().optional(),
        company_search: z.string().optional(),
        dispatch_queue_status: z.string().optional(),
        lead_tier: z.string().optional(),
        closing_readiness_status: z.string().optional(),
      })
      .optional(),
    limit: z.number().int().positive().max(500).optional(),
    offset: z.number().int().min(0).optional(),
  })
  .optional();

export const stockIdParamSchema = z.object({
  stockId: uuid,
});

export const agentIdParamSchema = z.object({
  agentId: uuid,
});

export const agentIdsParamSchema = z.object({
  agentIds: z.array(uuid).min(1, "Au moins un agent.").max(200),
});

export const convertAssignmentParamSchema = z.object({
  assignmentId: uuid,
  agentId: uuid,
});

/** Conversion depuis la vue agent : uniquement l’identifiant de fiche stock (pas d’UUID agent côté client). */
export const convertMyLeadGenerationStockParamSchema = z.object({
  stockId: uuid,
});

export const startGoogleMapsApifyImportActionInputSchema = z.object({
  searchStrings: z
    .array(z.string().min(1, "Chaque recherche doit être non vide."))
    .min(1, "Au moins une recherche.")
    .max(20, "Maximum 20 recherches."),
  maxCrawledPlacesPerSearch: z.number().int().min(1).max(500).optional(),
  includeWebResults: z.boolean().optional(),
  /** Zone Maps ; vide = défaut serveur (France métropolitaine). */
  locationQuery: z.string().trim().max(200).optional(),
});

/** Maps + Pages Jaunes (fusion) — mêmes recherches pour les deux actors. */
export const startMultiSourceLeadGenerationActionInputSchema = startGoogleMapsApifyImportActionInputSchema.extend({
  campaignName: z.string().trim().max(200).optional(),
  campaignSector: z.string().trim().max(120).optional(),
  maxYellowPagesResults: z.number().int().min(1).max(500).optional(),
  /** Parcours unifié : Pages Jaunes après ingestion carte (si actor configuré). */
  deferYellowPages: z.boolean().optional(),
});

export const syncGoogleMapsApifyImportActionInputSchema = z.object({
  batchId: uuid,
});

export const runManualCsvLeadGenerationImportActionInputSchema = z.object({
  csvText: z
    .string()
    .min(1, "Collez au moins une ligne de CSV.")
    .max(600_000, "Texte CSV trop volumineux (limite ~600 ko)."),
  filename: z.string().trim().max(260).optional().nullable(),
  sourceLabel: z.string().trim().max(200).optional().nullable(),
});

export const enrichLeadGenerationStockBatchActionInputSchema = z.object({
  stockIds: z.array(uuid).min(1, "Au moins une fiche.").max(100, "Maximum 100 fiches."),
});

export const enrichLeadGenerationStockQuickActionInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export const enrichLeadGenerationStockVerifiedBatchActionInputSchema = z.object({
  stockIds: z.array(uuid).min(1, "Au moins une fiche.").max(10, "Maximum 10 fiches."),
});

export const recalculateLeadGenerationCommercialScoreBatchActionInputSchema = z.object({
  stockIds: z.array(uuid).min(1, "Au moins une fiche.").max(100, "Maximum 100 fiches."),
});

export const recalculateReadyLeadGenerationCommercialScoreQuickActionInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export const evaluateLeadGenerationDispatchQueueBatchActionInputSchema = z.object({
  stockIds: z.array(uuid).min(1, "Au moins une fiche.").max(100, "Maximum 100 fiches."),
});

export const evaluateReadyLeadGenerationDispatchQueueQuickActionInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

const activityTypes = ["call", "email", "note", "status_update", "follow_up"] as const;

const activityOutcomes = [
  "called_no_answer",
  "called_wrong_number",
  "called_standard",
  "called_interested",
  "called_not_interested",
  "called_callback_requested",
  "email_sent",
  "email_bounced",
  "qualified_for_conversion",
  "out_of_target_after_review",
] as const;

export const evaluateLeadGenerationAssignmentRecycleStatusActionInputSchema = z.object({
  assignmentId: uuid,
});

export const evaluateLeadGenerationAssignmentRecycleStatusBatchActionInputSchema = z.object({
  assignmentIds: z.array(uuid).min(1, "Au moins une assignation.").max(100, "Maximum 100 assignations."),
});

export const evaluateActiveLeadGenerationAssignmentRecycleStatusQuickActionInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export const recycleLeadGenerationAssignmentActionInputSchema = z.object({
  assignmentId: uuid,
});

export const logLeadGenerationAssignmentActivityActionInputSchema = z.object({
  assignmentId: uuid,
  activityType: z.enum(activityTypes),
  activityLabel: z.string().trim().min(1, "Libellé requis.").max(300, "Libellé trop long."),
  activityNotes: z.string().trim().max(4000).optional().nullable(),
  outcome: z.enum(activityOutcomes).optional().nullable(),
  /** ISO ou valeur `datetime-local` ; vide = pas de relance planifiée. */
  nextActionAt: z.string().trim().max(40).optional().nullable(),
});

const manualReviewTypes = [
  "duplicate_review",
  "dispatch_review",
  "enrichment_review",
  "stock_review",
] as const;

const manualReviewDecisions = [
  "confirm_duplicate",
  "restore_from_duplicate",
  "force_ready_now",
  "force_review",
  "force_do_not_dispatch",
  "confirm_verified_enrichment",
  "reject_enrichment_suggestions",
  "clear_enrichment_suggestions",
  "reopen_stock",
  "close_stock",
] as const;

export const runLeadGenerationAutomationActionInputSchema = z.object({
  automationType: z.enum(LEAD_GENERATION_AUTOMATION_TYPES),
});

export const cleanupOrphanLeadGenerationAssignmentsActionInputSchema = z.object({
  limit: z.number().int().min(1).max(500).optional(),
});

/** Configuration explicite obligatoire : plus de lancement sur recherches codées en dur. */
export const generateAndEnrichLeadsActionInputSchema = z.object({
  campaignName: z.string().trim().min(1, "Indiquez un nom de campagne.").max(120),
  sector: z.enum(LEAD_GENERATION_SECTOR_OPTIONS),
  zone: z.string().trim().min(2, "Indiquez une zone géographique.").max(200),
  maxCrawledPlacesPerSearch: z.number().int().min(1, "Minimum 1 fiche par recherche.").max(200),
  maxTotalPlaces: z.number().int().min(1, "Minimum 1 fiche au total.").max(50_000),
  customQueriesText: z.string().max(8000).optional().default(""),
  includeWebResults: z.boolean().optional().default(false),
  /** Plafond résultats Pages Jaunes (si `APIFY_YELLOW_PAGES_ACTOR_ID` est défini). */
  maxYellowPagesResults: z.number().int().min(1).max(500).optional(),
});

/** Corps POST du parcours unifié (identique à la génération cockpit). */
export const unifiedLeadGenerationPipelineBodySchema = generateAndEnrichLeadsActionInputSchema;

export const prepareLeadsActionInputSchema = z.object({}).optional();

/** Filtres liste alignés sur `GetLeadGenerationStockFilters` (distribution sur intersection avec ready_now). */
export const leadGenerationDispatchFiltersSchema = z.object({
  company_search: z.string().max(500).optional(),
  stock_status: z.string().max(80).optional(),
  qualification_status: z.string().max(80).optional(),
  source: z.string().max(200).optional(),
  city: z.string().max(200).optional(),
  dispatch_queue_status: z.string().max(80).optional(),
  lead_tier: z.string().max(80).optional(),
  closing_readiness_status: z.string().max(80).optional(),
  needs_contact_improvement: z.boolean().optional(),
  import_batch_id: z.string().uuid().optional(),
});

export const autoDispatchLeadsActionInputSchema = z.object({
  filters: leadGenerationDispatchFiltersSchema.optional(),
});

export const identifyPremiumLeadGenerationDecisionMakersBatchActionInputSchema = z.object({
  limit: z.number().int().min(1).max(30).optional(),
});

export const identifyClosingLeadGenerationDecisionMakersBatchActionInputSchema = z.object({
  limit: z.number().int().min(1).max(40).optional(),
});

export const recalculateClosingReadinessBatchActionInputSchema = z.object({
  stockIds: z.array(uuid).min(1, "Au moins une fiche.").max(100, "Maximum 100 fiches."),
});

export const recalculateClosingReadyStockQuickActionInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export const recalculateLeadGenerationPremiumScoreBatchActionInputSchema = z.object({
  stockIds: z.array(uuid).min(1, "Au moins une fiche.").max(100, "Maximum 100 fiches."),
});

export const recalculatePremiumReadyStockQuickActionInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export const autoDispatchPremiumLeadsActionInputSchema = z.object({
  maxActiveStockPerAgent: z.number().int().min(1).max(100).optional(),
});

export const getLeadGenerationSettingsActionInputSchema = z
  .object({
    includeDiagnostics: z.boolean().optional(),
  })
  .optional();

export const updateLeadGenerationSettingsActionInputSchema = z.object({
  key: z.enum(LEAD_GENERATION_SETTINGS_KEYS),
  value: z.record(z.string(), z.unknown()),
});

export const reviewLeadGenerationStockActionInputSchema = z
  .object({
    stockId: uuid,
    reviewType: z.enum(manualReviewTypes),
    reviewDecision: z.enum(manualReviewDecisions),
    reviewNotes: z.string().trim().max(2000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      !isManualReviewDecisionAllowedForType(
        data.reviewType,
        data.reviewDecision as LeadGenerationManualReviewDecision,
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Décision incompatible avec le type de revue.",
        path: ["reviewDecision"],
      });
    }
  });
