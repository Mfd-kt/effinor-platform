import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { getBeneficiaryIdsForScopedLeads, getLeadIdsForAccess } from "@/lib/auth/data-scope";
import { getLeadScopeForAccess } from "@/lib/auth/lead-scope";

import { resolveBeneficiaryCeeClimateZone } from "@/features/operations/lib/beneficiary-cee-climate";
import type { OperationFormOptions } from "@/features/operations/types";
import type { TechnicalVisitStatus } from "@/types/database.types";

/**
 * Listes pour les sélecteurs du formulaire opération.
 * Les profils actifs sont exposés pour les champs responsables (alignés sur `profiles.is_active`).
 * Les visites techniques (liées à un bénéficiaire) permettent de choisir la VT de référence du dossier.
 */
export async function getOperationFormOptions(access?: AccessContext): Promise<OperationFormOptions> {
  const supabase = await createClient();

  let leadsQuery = supabase
    .from("leads")
    .select("id, company_name")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

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

  let beneficiariesQuery = supabase
    .from("beneficiaries")
    .select("id, company_name, climate_zone, worksite_postal_code, head_office_postal_code")
    .is("deleted_at", null)
    .order("company_name", { ascending: true });

  let technicalVisitsQuery = supabase
    .from("technical_visits")
    .select("id, vt_reference, beneficiary_id, status")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1000);

  const ceeSheetsQuery = supabase
    .from("cee_sheets")
    .select("id, code, label, calculation_profile, input_fields, calculation_config")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });

  if (access?.kind === "authenticated") {
    const leadIds = await getLeadIdsForAccess(supabase, access);
    if (leadIds !== "all") {
      if (leadIds.length === 0) {
        beneficiariesQuery = beneficiariesQuery.eq("id", "00000000-0000-0000-0000-000000000000");
        technicalVisitsQuery = technicalVisitsQuery.eq("id", "00000000-0000-0000-0000-000000000000");
      } else {
        const benIds = await getBeneficiaryIdsForScopedLeads(supabase, leadIds);
        if (benIds.length === 0) {
          beneficiariesQuery = beneficiariesQuery.eq("id", "00000000-0000-0000-0000-000000000000");
        } else {
          beneficiariesQuery = beneficiariesQuery.in("id", benIds);
        }
        technicalVisitsQuery = technicalVisitsQuery.in("lead_id", leadIds);
      }
    }
  }

  const [beneficiariesRes, delegatorsRes, profilesRes, leadsRes, technicalVisitsRes, ceeSheetsRes] =
    await Promise.all([
    beneficiariesQuery,
    supabase
      .from("delegators")
      .select("id, name, prime_per_kwhc_note")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("full_name", { ascending: true }),
    leadsQuery,
    technicalVisitsQuery,
    ceeSheetsQuery,
  ]);

  if (beneficiariesRes.error) {
    throw new Error(`Bénéficiaires : ${beneficiariesRes.error.message}`);
  }
  if (delegatorsRes.error) {
    throw new Error(`Délégataires : ${delegatorsRes.error.message}`);
  }
  if (profilesRes.error) {
    throw new Error(`Profils : ${profilesRes.error.message}`);
  }
  if (leadsRes.error) {
    throw new Error(`Leads : ${leadsRes.error.message}`);
  }
  if (technicalVisitsRes.error) {
    throw new Error(`Visites techniques : ${technicalVisitsRes.error.message}`);
  }
  if (ceeSheetsRes.error) {
    throw new Error(`Fiches CEE : ${ceeSheetsRes.error.message}`);
  }

  const beneficiaries = (beneficiariesRes.data ?? []).map((r) => ({
    id: r.id,
    company_name: r.company_name,
    cee_climate_zone: resolveBeneficiaryCeeClimateZone({
      climate_zone: r.climate_zone,
      worksite_postal_code: r.worksite_postal_code,
      head_office_postal_code: r.head_office_postal_code,
    }),
  }));

  const delegators = (delegatorsRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    prime_per_kwhc_note: r.prime_per_kwhc_note ?? null,
  }));

  const profiles = (profilesRes.data ?? []).map((r) => ({
    id: r.id,
    label: r.full_name?.trim() || r.email || r.id,
  }));

  const leads = (leadsRes.data ?? []).map((r) => ({
    id: r.id,
    company_name: r.company_name,
  }));

  const technicalVisits = (technicalVisitsRes.data ?? []).map((r) => ({
    id: r.id,
    vt_reference: r.vt_reference,
    beneficiary_id: r.beneficiary_id,
    status: r.status as TechnicalVisitStatus,
  }));

  const ceeSheets = (ceeSheetsRes.data ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    label: r.label,
    calculation_profile: r.calculation_profile,
    input_fields: r.input_fields,
    calculation_config: r.calculation_config,
  }));

  return { beneficiaries, delegators, profiles, leads, technicalVisits, ceeSheets };
}
