import { createClient } from "@/lib/supabase/server";

import { getManagedTeamsContext, isCeeTeamManager } from "@/features/dashboard/queries/get-managed-teams-context";
import type { AccessContext } from "@/lib/auth/access-context";
import { getLeadIdsForAccess, shouldRestrictTechnicalVisitsToCreatorOnly } from "@/lib/auth/data-scope";

import type { TechnicalVisitListRow, TechnicalVisitRow } from "@/features/technical-visits/types";
import type { TechnicalVisitStatus } from "@/types/database.types";

export type TechnicalVisitListFilters = {
  q?: string;
  status?: TechnicalVisitStatus;
  lead_id?: string;
};

type RawRow = TechnicalVisitRow & {
  leads: { company_name: string } | null;
  technician: { id: string; full_name: string | null; email: string } | null;
};

function normalize(raw: RawRow): TechnicalVisitListRow {
  const { leads, technician, ...rest } = raw;
  const techLabel =
    technician?.full_name?.trim() || technician?.email?.trim() || null;
  return {
    ...rest,
    lead_company_name: leads?.company_name ?? null,
    technician_label: techLabel,
  };
}

export async function getTechnicalVisits(
  filters?: TechnicalVisitListFilters,
  access?: AccessContext,
): Promise<TechnicalVisitListRow[]> {
  const supabase = await createClient();

  let scopedLeadIds: string[] | "all" | undefined;
  if (access?.kind === "authenticated") {
    scopedLeadIds = await getLeadIdsForAccess(supabase, access);
    if (scopedLeadIds !== "all" && (await isCeeTeamManager(access.userId))) {
      const ctx = await getManagedTeamsContext(access.userId);
      if (ctx?.sheetIds.length) {
        const { data: wfRows, error: wfErr } = await supabase
          .from("lead_sheet_workflows")
          .select("lead_id")
          .in("cee_sheet_id", ctx.sheetIds)
          .eq("is_archived", false);
        if (wfErr) {
          throw new Error(`Périmètre visites techniques : ${wfErr.message}`);
        }
        const merged = new Set<string>(scopedLeadIds);
        for (const r of wfRows ?? []) {
          merged.add(r.lead_id);
        }
        scopedLeadIds = [...merged];
      }
    }
    if (scopedLeadIds !== "all" && scopedLeadIds.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from("technical_visits")
    .select(
      `
      *,
      leads (
        company_name
      ),
      technician:profiles!technical_visits_technician_id_fkey (
        id,
        full_name,
        email
      )
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (scopedLeadIds && scopedLeadIds !== "all") {
    query = query.in("lead_id", scopedLeadIds);
  }

  if (access?.kind === "authenticated" && shouldRestrictTechnicalVisitsToCreatorOnly(access)) {
    query = query.eq("created_by_user_id", access.userId);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.lead_id?.trim()) {
    query = query.eq("lead_id", filters.lead_id.trim());
  }

  if (filters?.q?.trim()) {
    const raw = filters.q.trim().replace(/,/g, " ");
    const term = `%${raw}%`;
    query = query.or(`vt_reference.ilike.${term},worksite_address.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Impossible de charger les visites techniques : ${error.message}`);
  }

  return (data as unknown as RawRow[] | null)?.map(normalize) ?? [];
}
