"use server";

import { revalidatePath } from "next/cache";

import { DEFAULT_DESTRAT_SIMULATOR_KEY } from "@/features/cee-workflows/domain/constants";
import {
  completeSimulation as completeWorkflowSimulation,
  createLeadSheetWorkflow as createLeadSheetWorkflowInService,
} from "@/features/cee-workflows/services/workflow-service";
import { isPacPreferredLocalUsage } from "@/features/leads/simulator/domain/cee-solution-decision";
import {
  buildSimulationSnapshot,
  computeSimulator,
} from "@/features/leads/simulator/domain/simulator";
import type { SimulatorComputedResult } from "@/features/leads/simulator/domain/types";
import {
  normalizeSimulatorInput,
  SimulateAndCreateLeadSchema,
  SimulateLeadSchema,
} from "@/features/leads/simulator/schemas/simulator.schema";
import { heatingModesToDb } from "@/features/leads/lib/heating-modes";
import {
  leadBuildingTypeFromSimulatorCee,
  leadHeatingTypesFromSimulator,
} from "@/features/leads/lib/simulator-to-lead-technical";
import type { LeadRow } from "@/features/leads/types";
import { notifyLeadFromSimulator } from "@/features/notifications/services/notification-service";
import { createClient } from "@/lib/supabase/server";

type SimulateLeadResult =
  | { ok: true; data: SimulatorComputedResult }
  | { ok: false; error: string };

type SimulateCreateLeadResult =
  | { ok: true; lead: LeadRow; simulation: SimulatorComputedResult }
  | { ok: false; error: string };

function parseContactName(contactName: string): { firstName: string | null; lastName: string | null } {
  const clean = contactName.trim().replace(/\s+/g, " ");
  if (!clean) return { firstName: null, lastName: null };
  const [first, ...rest] = clean.split(" ");
  return {
    firstName: first ?? null,
    lastName: rest.length ? rest.join(" ") : null,
  };
}

function localDateTimeToIso(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function extractWorksitePostalCodeFromDepartment(value: string | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  // Cas usuels: "06000", "06 - Alpes-Maritimes", "75008 Paris"
  const match5 = raw.match(/\b\d{5}\b/);
  if (match5) return match5[0];
  const match2or3 = raw.match(/\b\d{2,3}\b/);
  if (match2or3) return match2or3[0];
  return raw;
}

async function resolvePrimaryCeeSheetId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  explicitSheetId: string | undefined,
): Promise<string | null> {
  if (explicitSheetId) {
    return explicitSheetId;
  }

  const { data, error } = await supabase
    .from("cee_sheets")
    .select("id")
    .eq("simulator_key", DEFAULT_DESTRAT_SIMULATOR_KEY)
    .eq("is_commercial_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data?.id ?? null;
}

export async function simulateLead(input: unknown): Promise<SimulateLeadResult> {
  const parsed = SimulateLeadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = computeSimulator(normalizeSimulatorInput(parsed.data));
  return { ok: true, data };
}

export async function simulateAndCreateLead(input: unknown): Promise<SimulateCreateLeadResult> {
  const parsed = SimulateAndCreateLeadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { ok: false, error: "Session invalide." };
  }

  const normalized = normalizeSimulatorInput(parsed.data);
  const simulation = computeSimulator(normalized);
  const snapshot = buildSimulationSnapshot(normalized);
  const technicalBuildingType = leadBuildingTypeFromSimulatorCee(normalized.buildingType, normalized.localUsage);
  const technicalHeatingTypes = leadHeatingTypesFromSimulator(
    normalized.currentHeatingMode ?? null,
    simulation.heatingMode,
  );
  const omitHeightOnLead = isPacPreferredLocalUsage(normalized.localUsage);
  const contact = parseContactName(parsed.data.contactName);
  const callbackAt = localDateTimeToIso(parsed.data.callbackAt);
  const worksitePostalCode = extractWorksitePostalCodeFromDepartment(parsed.data.department);
  const ceeSheetId = await resolvePrimaryCeeSheetId(supabase, parsed.data.ceeSheetId);

  if (!callbackAt) {
    return { ok: false, error: "Date/heure de rappel invalide." };
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      source: parsed.data.source ?? "cold_call",
      lead_status: "new",
      qualification_status: "pending",
      cee_sheet_id: ceeSheetId,
      lead_channel: "phone",
      lead_origin: "simulateur_fiche_cee",
      company_name: parsed.data.companyName.trim(),
      // Champs non nuls dans le schéma leads (compatibilité multi-migrations).
      head_office_address: "",
      head_office_postal_code: "",
      head_office_city: "",
      worksite_address: "",
      worksite_postal_code: worksitePostalCode,
      worksite_city: "",
      heated_building: parsed.data.isHeated,
      surface_m2: normalized.surfaceM2,
      ceiling_height_m: omitHeightOnLead ? null : normalized.heightM,
      building_type: technicalBuildingType ?? null,
      heating_type: heatingModesToDb(technicalHeatingTypes),
      first_name: contact.firstName,
      last_name: contact.lastName,
      contact_name: parsed.data.contactName.trim(),
      phone: parsed.data.phone.trim(),
      email: parsed.data.email ?? null,
      job_title: parsed.data.jobTitle?.trim() || null,
      department: parsed.data.department?.trim() || null,
      contact_role: parsed.data.jobTitle?.trim() || null,
      callback_at: callbackAt,
      created_by_agent_id: user.id,
      assigned_to: user.id,
      owner_user_id: user.id,
      sim_height_m: omitHeightOnLead ? null : simulation.heightM,
      sim_surface_m2: simulation.surfaceM2,
      sim_client_type: simulation.clientType,
      sim_model: simulation.model,
      sim_heating_mode: simulation.heatingMode,
      sim_consigne: simulation.consigne,
      sim_volume_m3: simulation.volumeM3,
      sim_air_change_rate: simulation.airChangeRate,
      sim_model_capacity_m3h: simulation.modelCapacityM3h,
      sim_needed_destrat: simulation.neededDestrat,
      sim_power_kw: simulation.powerKw,
      sim_consumption_kwh_year: simulation.consumptionKwhYear,
      sim_cost_year_min: simulation.costYearMin,
      sim_cost_year_max: simulation.costYearMax,
      sim_cost_year_selected: simulation.costYearSelected,
      sim_saving_kwh_30: simulation.savingKwh30,
      sim_saving_eur_30_min: simulation.savingEur30Min,
      sim_saving_eur_30_max: simulation.savingEur30Max,
      sim_saving_eur_30_selected: simulation.savingEur30Selected,
      sim_co2_saved_tons: simulation.co2SavedTons,
      sim_cee_prime_estimated: simulation.ceePrimeEstimated,
      sim_install_unit_price: simulation.installUnitPrice,
      sim_install_total_price: simulation.installTotalPrice,
      sim_rest_to_charge: simulation.restToCharge,
      sim_lead_score: simulation.leadScore,
      sim_payload_json: snapshot,
      sim_version: snapshot.version,
      simulated_at: snapshot.simulatedAtIso,
      simulated_by_user_id: user.id,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Impossible de créer le lead." };
  }

  if (ceeSheetId) {
    try {
      const workflow = await createLeadSheetWorkflowInService(supabase, {
        leadId: data.id,
        ceeSheetId,
        actorUserId: user.id,
      });
      await completeWorkflowSimulation(supabase, {
        workflowId: workflow.id,
        actorUserId: user.id,
        simulation: {
          simulationInputJson: snapshot,
          simulationResultJson: simulation,
        },
      });
    } catch {
      // Compatibilité transitoire : la création de lead ne doit pas échouer si le workflow
      // CEE n'est pas encore complètement configuré pour la fiche.
    }
  }

  const { data: refreshedLead } = await supabase.from("leads").select("*").eq("id", data.id).single();

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath(`/leads/${data.id}`);

  void notifyLeadFromSimulator(refreshedLead ?? data);

  return { ok: true, lead: refreshedLead ?? data, simulation };
}

