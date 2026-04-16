import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { getLeadScopeForAccess } from "@/lib/auth/lead-scope";

import type { TechnicalVisitFormOptions } from "@/features/technical-visits/types";
import { loadTechnicianRecommendationBundle } from "@/features/technical-visits/lib/technical-visit-technician-recommendation-bundle";
import type { GetTechnicalVisitFormOptionsParams } from "@/features/technical-visits/queries/technical-visit-form-options-params";

export type { GetTechnicalVisitFormOptionsParams } from "@/features/technical-visits/queries/technical-visit-form-options-params";

/**
 * Listes pour les sélecteurs (leads, profils pour le champ technicien).
 * Le sélecteur ne propose que les comptes avec le rôle `technician` (pas de fusion avec d'autres rôles).
 */
export async function getTechnicalVisitFormOptions(
  access?: AccessContext,
  params?: GetTechnicalVisitFormOptionsParams,
): Promise<TechnicalVisitFormOptions> {
  const supabase = await createClient();

  let leadsQuery = supabase
    .from("leads")
    .select("id, company_name")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (access?.kind === "authenticated") {
    const scope = getLeadScopeForAccess(access);
    if (scope.mode === "none") {
      leadsQuery = leadsQuery.eq("id", "00000000-0000-0000-0000-000000000000");
    } else if (scope.mode === "created_by") {
      leadsQuery = leadsQuery.eq("created_by_agent_id", scope.userId);
    } else if (scope.mode === "confirmed_by") {
      leadsQuery = leadsQuery.eq("confirmed_by_user_id", scope.userId);
    } else if (scope.mode === "created_or_confirmed") {
      leadsQuery = leadsQuery.or(
        `created_by_agent_id.eq.${scope.userId},confirmed_by_user_id.eq.${scope.userId}`,
      );
    }
  }

  const [leadsRes, recoBundle] = await Promise.all([
    leadsQuery,
    loadTechnicianRecommendationBundle(supabase, params),
  ]);

  if (leadsRes.error) {
    throw new Error(`Leads : ${leadsRes.error.message}`);
  }

  const leads = (leadsRes.data ?? []).map((r) => ({
    id: r.id,
    company_name: r.company_name,
  }));

  return {
    leads,
    ...recoBundle,
  };
}
