import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import type { AccessContext } from "./access-context";
import { getManagedTeamsContext } from "@/features/dashboard/queries/get-managed-teams-context";
import { getLeadScopeForAccess, hasFullCommercialDataAccess } from "./lead-scope";
import type { LeadScope } from "./lead-scope";
import { permScopeAllCode, permScopeCreatorCode } from "./table-scope";
import {
  PERM_TECH_VISITS_CREATOR_ONLY,
  PERM_TECH_VISITS_SCOPE_ALL,
  PERM_TECH_VISITS_SCOPE_CREATOR,
} from "./permission-codes";

export async function resolveLeadIdsForScope(
  supabase: SupabaseClient<Database>,
  scope: LeadScope,
): Promise<string[] | "all"> {
  if (scope.mode === "all") {
    return "all";
  }
  if (scope.mode === "none") {
    return [];
  }
  if (scope.mode === "created_by") {
    const { data } = await supabase
      .from("leads")
      .select("id")
      .eq("created_by_agent_id", scope.userId)
      .is("deleted_at", null);
    return data?.map((r) => r.id) ?? [];
  }
  if (scope.mode === "confirmed_by") {
    const { data } = await supabase
      .from("leads")
      .select("id")
      .eq("confirmed_by_user_id", scope.userId)
      .is("deleted_at", null);
    return data?.map((r) => r.id) ?? [];
  }
  const { data } = await supabase
    .from("leads")
    .select("id")
    .or(`created_by_agent_id.eq.${scope.userId},confirmed_by_user_id.eq.${scope.userId}`)
    .is("deleted_at", null);
  return data?.map((r) => r.id) ?? [];
}

async function fetchLeadIdsFromVisitsCreatedByUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("technical_visits")
    .select("lead_id")
    .eq("created_by_user_id", userId)
    .is("deleted_at", null);
  const set = new Set<string>();
  for (const r of data ?? []) {
    if (r.lead_id) {
      set.add(r.lead_id);
    }
  }
  return [...set];
}

function shouldMergeLeadIdsFromTechnicalVisits(access: AccessContext): boolean {
  if (access.kind !== "authenticated" || access.permissionCodes.length === 0) {
    return false;
  }
  const pc = new Set(access.permissionCodes);
  if (pc.has(PERM_TECH_VISITS_SCOPE_ALL)) {
    return false;
  }
  return pc.has(PERM_TECH_VISITS_SCOPE_CREATOR) || pc.has(PERM_TECH_VISITS_CREATOR_ONLY);
}

export function hasBeneficiaryScopeAllFromPermissions(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (access.roleCodes.includes("super_admin")) {
    return true;
  }
  if (hasFullCommercialDataAccess(access.roleCodes)) {
    return true;
  }
  return new Set(access.permissionCodes).has(permScopeAllCode("beneficiaries"));
}

/** Bénéficiaires liés aux leads visibles via des opérations (même périmètre que la liste opérations). */
export async function getBeneficiaryIdsForScopedLeads(
  supabase: SupabaseClient<Database>,
  leadIds: string[],
): Promise<string[]> {
  if (leadIds.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from("operations")
    .select("beneficiary_id")
    .in("lead_id", leadIds)
    .not("beneficiary_id", "is", null)
    .is("deleted_at", null);
  if (error) {
    throw new Error(`Périmètre bénéficiaires : ${error.message}`);
  }
  const set = new Set<string>();
  for (const r of data ?? []) {
    if (r.beneficiary_id) {
      set.add(r.beneficiary_id);
    }
  }
  return [...set];
}

export async function canAccessBeneficiary(
  supabase: SupabaseClient<Database>,
  beneficiaryId: string,
  access: AccessContext,
): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (hasBeneficiaryScopeAllFromPermissions(access)) {
    return true;
  }
  const leadIds = await getLeadIdsForAccess(supabase, access);
  if (leadIds === "all") {
    return true;
  }
  if (leadIds.length > 0) {
    const fromOps = await getBeneficiaryIdsForScopedLeads(supabase, leadIds);
    if (fromOps.includes(beneficiaryId)) {
      return true;
    }
  }
  const pc = new Set(access.permissionCodes);
  if (
    access.permissionCodes.length > 0 &&
    pc.has(permScopeCreatorCode("beneficiaries")) &&
    !pc.has(permScopeAllCode("beneficiaries"))
  ) {
    const { data } = await supabase
      .from("beneficiaries")
      .select("id")
      .eq("id", beneficiaryId)
      .eq("sales_owner_id", access.userId)
      .is("deleted_at", null)
      .maybeSingle();
    return !!data;
  }
  return false;
}

export async function canAccessOperationRow(
  supabase: SupabaseClient<Database>,
  row: { lead_id: string | null; beneficiary_id: string | null },
  access: AccessContext,
): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  const leadIds = await getLeadIdsForAccess(supabase, access);
  if (leadIds === "all") {
    return true;
  }
  if (leadIds.length === 0) {
    return false;
  }
  if (row.lead_id && leadIds.includes(row.lead_id)) {
    return true;
  }
  if (row.beneficiary_id) {
    const benIds = await getBeneficiaryIdsForScopedLeads(supabase, leadIds);
    return benIds.includes(row.beneficiary_id);
  }
  return false;
}

export async function getLeadIdsForAccess(
  supabase: SupabaseClient<Database>,
  access: AccessContext,
): Promise<string[] | "all"> {
  const scope = getLeadScopeForAccess(access);
  let base = await resolveLeadIdsForScope(supabase, scope);
  if (base === "all") {
    return "all";
  }
  const merged = new Set<string>(base);
  if (access.kind === "authenticated") {
    if (shouldMergeLeadIdsFromTechnicalVisits(access)) {
      const fromVt = await fetchLeadIdsFromVisitsCreatedByUser(supabase, access.userId);
      for (const id of fromVt) {
        merged.add(id);
      }
    }
  }
  return [...merged];
}

/**
 * Confirmateur sans rôle commercial : accès à tous les leads, mais uniquement aux visites techniques
 * dont il est l'auteur (`created_by_user_id`).
 */
export function shouldRestrictTechnicalVisitsToCreator(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  const rc = access.roleCodes;
  if (rc.includes("sales_agent")) {
    return false;
  }
  if (access.permissionCodes.length > 0) {
    const pc = new Set(access.permissionCodes);
    if (pc.has(PERM_TECH_VISITS_SCOPE_ALL)) {
      return false;
    }
    if (rc.includes("super_admin")) {
      return false;
    }
    if (hasFullCommercialDataAccess(rc)) {
      return false;
    }
    const creatorOnlyTv =
      pc.has(PERM_TECH_VISITS_CREATOR_ONLY) || pc.has(PERM_TECH_VISITS_SCOPE_CREATOR);
    if (creatorOnlyTv) {
      return rc.includes("confirmer");
    }
    return false;
  }
  if (rc.includes("super_admin")) {
    return false;
  }
  if (hasFullCommercialDataAccess(rc)) {
    return false;
  }
  return rc.includes("confirmer");
}

/**
 * Liste VT : filtrer sur l'auteur uniquement (permissions DB ou confirmateur historique).
 */
export function shouldRestrictTechnicalVisitsToCreatorOnly(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (access.permissionCodes.length === 0) {
    return shouldRestrictTechnicalVisitsToCreator(access);
  }
  const pc = new Set(access.permissionCodes);
  if (pc.has(PERM_TECH_VISITS_SCOPE_ALL)) {
    return false;
  }
  if (access.roleCodes.includes("super_admin")) {
    return false;
  }
  if (hasFullCommercialDataAccess(access.roleCodes)) {
    return false;
  }
  return pc.has(PERM_TECH_VISITS_SCOPE_CREATOR) || pc.has(PERM_TECH_VISITS_CREATOR_ONLY);
}

async function canAccessTechnicalVisitViaManagedCeeSheets(
  supabase: SupabaseClient<Database>,
  leadId: string,
  userId: string,
): Promise<boolean> {
  const ctx = await getManagedTeamsContext(userId);
  if (!ctx?.sheetIds.length) {
    return false;
  }
  const { data, error } = await supabase
    .from("lead_sheet_workflows")
    .select("id")
    .eq("lead_id", leadId)
    .in("cee_sheet_id", ctx.sheetIds)
    .eq("is_archived", false)
    .limit(1)
    .maybeSingle();
  if (error) {
    return false;
  }
  return Boolean(data);
}

export async function canAccessTechnicalVisitDetail(
  supabase: SupabaseClient<Database>,
  visit: { lead_id: string; created_by_user_id: string | null },
  access: AccessContext,
): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (shouldRestrictTechnicalVisitsToCreatorOnly(access)) {
    return visit.created_by_user_id === access.userId;
  }
  if (await canAccessTechnicalVisitByLeadId(supabase, visit.lead_id, access)) {
    return true;
  }
  return canAccessTechnicalVisitViaManagedCeeSheets(supabase, visit.lead_id, access.userId);
}

export async function canAccessTechnicalVisitByLeadId(
  supabase: SupabaseClient<Database>,
  leadId: string,
  access: AccessContext,
): Promise<boolean> {
  const leadIds = await getLeadIdsForAccess(supabase, access);
  if (leadIds === "all") {
    return true;
  }
  return leadIds.includes(leadId);
}
