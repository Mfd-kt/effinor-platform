import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { shouldRestrictTechnicalVisitsToCreatorOnly } from "@/lib/auth/data-scope";
import { ACTIVE_TECHNICAL_VISIT_STATUSES } from "@/features/leads/constants/technical-visit-active-statuses";
import type { TechnicalVisitRef } from "@/features/leads/queries/get-technical-visits-for-lead";

/**
 * Retourne une VT « bloquante » pour ce lead s’il en existe une non supprimée
 * et dont le statut est dans {@link ACTIVE_TECHNICAL_VISIT_STATUSES}.
 */
export async function getActiveTechnicalVisitForLead(
  leadId: string,
  access?: AccessContext,
): Promise<TechnicalVisitRef | null> {
  const supabase = await createClient();

  let q = supabase
    .from("technical_visits")
    .select("id, vt_reference")
    .eq("lead_id", leadId)
    .is("deleted_at", null)
    .in("status", [...ACTIVE_TECHNICAL_VISIT_STATUSES]);

  if (access?.kind === "authenticated" && shouldRestrictTechnicalVisitsToCreatorOnly(access)) {
    q = q.eq("created_by_user_id", access.userId);
  }

  const { data, error } = await q.order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (error) {
    throw new Error(`Impossible de vérifier les visites techniques : ${error.message}`);
  }

  return (data as TechnicalVisitRef | null) ?? null;
}
