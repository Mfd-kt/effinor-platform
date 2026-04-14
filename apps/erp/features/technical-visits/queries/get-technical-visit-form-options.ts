import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { getLeadScopeForAccess } from "@/lib/auth/lead-scope";

import type { ProfileOption, TechnicalVisitFormOptions } from "@/features/technical-visits/types";

export type GetTechnicalVisitFormOptionsParams = {
  /** Technicien déjà enregistré sur la VT (si hors rôle technicien → `technicianOrphanOption`). */
  visitTechnicianProfileId?: string | null;
};

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

  const [leadsRes, profilesRes] = await Promise.all([
    leadsQuery,
    (async () => {
      const { data: techRole } = await supabase.from("roles").select("id").eq("code", "technician").maybeSingle();

      if (!techRole?.id) {
        /** Sans rôle en base : liste vide (appliquer la migration `technician`). */
        return { data: [] as { id: string; full_name: string | null; email: string }[], error: null };
      }

      const { data: urRows, error: urErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role_id", techRole.id);
      if (urErr) {
        return { data: null, error: urErr };
      }

      const technicianIds = [...new Set((urRows ?? []).map((r) => r.user_id))];

      if (technicianIds.length === 0) {
        return { data: [], error: null };
      }

      return supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", technicianIds)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("full_name", { ascending: true });
    })(),
  ]);

  if (leadsRes.error) {
    throw new Error(`Leads : ${leadsRes.error.message}`);
  }
  if (profilesRes.error) {
    throw new Error(`Profils : ${profilesRes.error.message}`);
  }

  const leads = (leadsRes.data ?? []).map((r) => ({
    id: r.id,
    company_name: r.company_name,
  }));

  const profiles = (profilesRes.data ?? []).map((r) => ({
    id: r.id,
    label: r.full_name?.trim() || r.email || r.id,
  }));

  const visitTid = params?.visitTechnicianProfileId?.trim() ?? "";
  let technicianOrphanOption: ProfileOption | null = null;
  if (visitTid && !profiles.some((p) => p.id === visitTid)) {
    const { data: orphan } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", visitTid)
      .maybeSingle();
    if (orphan) {
      technicianOrphanOption = {
        id: orphan.id,
        label: orphan.full_name?.trim() || orphan.email || orphan.id,
      };
    }
  }

  return { leads, profiles, technicianOrphanOption };
}
