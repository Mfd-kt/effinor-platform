import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";
import { repairOrphanLeadGenerationAssignments } from "../services/repair-orphan-lead-generation-assignments";

import { applyLeadGenerationStockFilters } from "./apply-lead-generation-stock-filters";

export type GetLeadGenerationStockFilters = {
  stock_status?: string;
  qualification_status?: string;
  source?: string;
  city?: string;
  /** Recherche simple « contient » sur `company_name` (ILIKE). */
  company_search?: string;
  /** File métier (ex. ready_now). */
  dispatch_queue_status?: string;
  /** Tier premium (ex. premium). */
  lead_tier?: string;
  /** Niveau closing (low | medium | high). */
  closing_readiness_status?: string;
  /**
   * Fiches « non traitées » côté cockpit : prêtes, téléphone présent, enrichissement non fait / échoué,
   * email ou site manquant (même logique que `countLeadGenerationStockNeedingContactImprovement`).
   */
  needs_contact_improvement?: boolean;
  /** Filtrer sur un import / lot coordinateur précis. */
  import_batch_id?: string;
  /** Filtrer sur une fiche CEE (lots dont le batch est rattaché à cette fiche). */
  cee_sheet_id?: string;
  /**
   * Intersection lot : liste d’UUID de `lead_generation_import_batches` (rempli côté serveur pour comptages
   * quand `cee_sheet_id` est utilisé).
   */
  import_batch_ids?: string[];
};

export type GetLeadGenerationStockParams = {
  filters?: GetLeadGenerationStockFilters;
  /** Défaut 50. */
  limit?: number;
  offset?: number;
};

/** Liste allégée pour écrans serveur / API futures. */
export type LeadGenerationStockListItem = Pick<
  LeadGenerationStockRow,
  | "id"
  | "import_batch_id"
  | "source"
  | "company_name"
  | "email"
  | "city"
  | "stock_status"
  | "qualification_status"
  | "normalized_phone"
  | "target_score"
  | "created_at"
  | "enrichment_status"
  | "enrichment_confidence"
  | "commercial_score"
  | "commercial_priority"
  | "dispatch_queue_status"
  | "dispatch_queue_reason"
  | "dispatch_queue_rank"
  | "lead_tier"
  | "premium_score"
  | "decision_maker_name"
  | "decision_maker_confidence"
  | "website"
  | "has_linkedin"
  | "linkedin_url"
  | "closing_readiness_status"
  | "closing_readiness_score"
> & {
  /** Statut recyclage de l’assignation courante (embed), si présent. */
  assignment_recycle_status?: string | null;
  /** Nom lisible de l’agent actuellement assigné, si présent. */
  assigned_agent_display_name?: string | null;
};

const LIST_SELECT = `id, import_batch_id, source, company_name, email, website, city, stock_status, qualification_status, normalized_phone, target_score, created_at, enrichment_status, enrichment_confidence, commercial_score, commercial_priority, dispatch_queue_status, dispatch_queue_reason, dispatch_queue_rank, lead_tier, premium_score, decision_maker_name, decision_maker_confidence, has_linkedin, linkedin_url, closing_readiness_status, closing_readiness_score, current_assignment:lead_generation_assignments!lead_generation_stock_current_assignment_id_fkey(recycle_status,agent_id,agent:profiles!lead_generation_assignments_agent_id_fkey(full_name,email))`;

/**
 * Liste le stock avec filtres optionnels et pagination.
 */
export async function getLeadGenerationStock(
  params?: GetLeadGenerationStockParams,
): Promise<LeadGenerationStockListItem[]> {
  const supabase = await createClient();
  try {
    await repairOrphanLeadGenerationAssignments({ limit: 200 });
  } catch (e) {
    console.warn(
      "[lead-generation] cleanup assignations orphelines ignoré:",
      e instanceof Error ? e.message : e,
    );
  }
  const stock = lgTable(supabase, "lead_generation_stock");

  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  const f = params?.filters;

  let q = stock
    .select(LIST_SELECT)
    .order("dispatch_queue_rank", { ascending: false })
    .order("commercial_score", { ascending: false })
    .order("created_at", { ascending: false });

  q = applyLeadGenerationStockFilters(q, f);

  const { data, error } = await q.range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Liste stock lead generation : ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const r = row as LeadGenerationStockListItem & {
      current_assignment?:
        | {
            recycle_status?: string;
            agent?: { full_name?: string | null; email?: string | null } | null;
          }
        | null;
    };
    const { current_assignment, ...rest } = r;
    const agentName =
      current_assignment?.agent?.full_name?.trim() ||
      current_assignment?.agent?.email?.trim() ||
      null;
    return {
      ...rest,
      assignment_recycle_status: current_assignment?.recycle_status ?? null,
      assigned_agent_display_name: agentName,
    } as LeadGenerationStockListItem;
  });
}
