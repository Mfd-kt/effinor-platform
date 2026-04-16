import { createClient } from "@/lib/supabase/server";

import { getManagedTeamsContext, isCeeTeamManager } from "@/features/dashboard/queries/get-managed-teams-context";
import type { AccessContext } from "@/lib/auth/access-context";
import {
  getLeadIdsForAccess,
  shouldRestrictTechnicalVisitsToCreatorOnly,
} from "@/lib/auth/data-scope";

import {
  getTechnicalVisitFieldAccessLevelForAuthenticatedViewer,
  sanitizeTechnicalVisitListRowForRestrictedTechnician,
} from "@/features/technical-visits/access";
import { geocodeFranceAddressServer } from "@/features/technical-visits/lib/nominatim-geocode-server";
import { computeOfficeDistanceKm } from "@/features/technical-visits/lib/office-distance";
import { buildWorksiteGeocodeFallbackQueriesFromFields } from "@/features/technical-visits/lib/worksite-geocode-query";
import type { TechnicalVisitListRow, TechnicalVisitRow } from "@/features/technical-visits/types";
import type { TechnicalVisitStatus } from "@/types/database.types";

export type TechnicalVisitListFilters = {
  q?: string;
  status?: TechnicalVisitStatus;
  lead_id?: string;
};

/** Périmètre liste VT (leads + règle technicien affecté seul). */
export type TechnicalVisitsListAccessScope = {
  scopedLeadIds: string[] | "all" | undefined;
  technicianAssignedVisitsOnly: boolean;
  isTechnician: boolean;
  /** Confirmeur / rôle sans leads : aucune VT listable. */
  nonTechnicianEmptyScope: boolean;
};

export async function resolveTechnicalVisitsListAccessScope(
  supabase: Awaited<ReturnType<typeof createClient>>,
  access: AccessContext,
): Promise<TechnicalVisitsListAccessScope | null> {
  if (access.kind !== "authenticated") return null;

  let scopedLeadIds: string[] | "all" | undefined;
  let technicianAssignedVisitsOnly = false;

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

  let nonTechnicianEmptyScope = false;
  if (scopedLeadIds !== "all" && scopedLeadIds.length === 0) {
    if (access.roleCodes.includes("technician")) {
      technicianAssignedVisitsOnly = true;
    } else {
      nonTechnicianEmptyScope = true;
    }
  }

  return {
    scopedLeadIds,
    technicianAssignedVisitsOnly,
    isTechnician: access.roleCodes.includes("technician"),
    nonTechnicianEmptyScope,
  };
}

/**
 * Filtres Realtime alignés sur `getTechnicalVisits` (périmètre leads / technicien / créateur seul).
 */
export async function getTechnicalVisitsRealtimeSubscriptionForList(access: AccessContext): Promise<{
  enabled: boolean;
  filters: string[];
  debounceMs: number;
}> {
  const off = { enabled: false as const, filters: [] as string[], debounceMs: 500 };

  if (access.kind !== "authenticated") {
    return off;
  }

  const supabase = await createClient();
  const scope = await resolveTechnicalVisitsListAccessScope(supabase, access);
  if (!scope || scope.nonTechnicianEmptyScope) {
    return off;
  }

  const uid = access.userId;
  const creatorOnly = shouldRestrictTechnicalVisitsToCreatorOnly(access);

  if (creatorOnly) {
    return {
      enabled: true,
      filters: [`created_by_user_id=eq.${uid}`],
      debounceMs: 450,
    };
  }

  if (scope.technicianAssignedVisitsOnly) {
    return {
      enabled: true,
      filters: [`technician_id=eq.${uid}`],
      debounceMs: 450,
    };
  }

  if (scope.scopedLeadIds === "all") {
    return {
      enabled: true,
      filters: [],
      debounceMs: 650,
    };
  }

  if (Array.isArray(scope.scopedLeadIds) && scope.scopedLeadIds.length > 0) {
    const leadFilter = `lead_id=in.(${scope.scopedLeadIds.join(",")})`;
    if (scope.isTechnician) {
      return {
        enabled: true,
        filters: [`technician_id=eq.${uid}`, leadFilter],
        debounceMs: 450,
      };
    }
    return {
      enabled: true,
      filters: [leadFilter],
      debounceMs: 450,
    };
  }

  return off;
}

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

async function withOfficeDistanceFallback(rows: TechnicalVisitListRow[]): Promise<TechnicalVisitListRow[]> {
  const out = rows.map((r) => ({
    ...r,
    office_distance_km: computeOfficeDistanceKm(r.worksite_latitude, r.worksite_longitude),
  }));
  const misses = out.filter((r) => r.office_distance_km == null);
  if (misses.length === 0) return out;

  const cache = new Map<string, number | null>();
  const NOMINATIM_DELAY_MS = 300;

  for (const row of misses) {
    const queries = buildWorksiteGeocodeFallbackQueriesFromFields({
      worksite_address: row.worksite_address,
      worksite_postal_code: row.worksite_postal_code,
      worksite_city: row.worksite_city,
    });
    let km: number | null = null;
    for (let i = 0; i < queries.length; i++) {
      const q = queries[i]!;
      if (cache.has(q)) {
        km = cache.get(q) ?? null;
        if (km != null) break;
        continue;
      }
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, NOMINATIM_DELAY_MS));
      }
      const coords = await geocodeFranceAddressServer(q);
      km = coords ? computeOfficeDistanceKm(coords.lat, coords.lng) : null;
      cache.set(q, km);
      if (km != null) break;
    }
    row.office_distance_km = km;
  }

  return out;
}

export async function getTechnicalVisits(
  filters?: TechnicalVisitListFilters,
  access?: AccessContext,
): Promise<TechnicalVisitListRow[]> {
  const supabase = await createClient();

  let scopedLeadIds: string[] | "all" | undefined;
  /** Profil « technicien » sans périmètre leads : on liste uniquement les VT où il est affecté. */
  let technicianAssignedVisitsOnly = false;
  let isTechnician = false;

  if (access?.kind === "authenticated") {
    const scope = await resolveTechnicalVisitsListAccessScope(supabase, access);
    if (scope?.nonTechnicianEmptyScope) {
      return [];
    }
    if (scope) {
      scopedLeadIds = scope.scopedLeadIds;
      technicianAssignedVisitsOnly = scope.technicianAssignedVisitsOnly;
      isTechnician = scope.isTechnician;
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

  if (isTechnician && scopedLeadIds === "all") {
    /* Périmètre leads déjà large : pas de filtre supplémentaire. */
  } else if (
    isTechnician &&
    access?.kind === "authenticated" &&
    scopedLeadIds &&
    scopedLeadIds !== "all" &&
    scopedLeadIds.length > 0
  ) {
    query = query.or(
      `technician_id.eq.${access.userId},lead_id.in.(${scopedLeadIds.join(",")})`,
    );
  } else if (scopedLeadIds && scopedLeadIds !== "all" && scopedLeadIds.length > 0) {
    query = query.in("lead_id", scopedLeadIds);
  }

  if (access?.kind === "authenticated" && technicianAssignedVisitsOnly) {
    query = query.eq("technician_id", access.userId);
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

  const rowsBase = (data as unknown as RawRow[] | null)?.map(normalize) ?? [];
  const rows = await withOfficeDistanceFallback(rowsBase);

  if (access?.kind !== "authenticated") {
    return rows;
  }

  return rows.map((row) => {
    const level = getTechnicalVisitFieldAccessLevelForAuthenticatedViewer(access, row);
    const payload =
      level === "technician_restricted" ? sanitizeTechnicalVisitListRowForRestrictedTechnician(row) : row;
    return { ...payload, technician_field_access: level };
  });
}
