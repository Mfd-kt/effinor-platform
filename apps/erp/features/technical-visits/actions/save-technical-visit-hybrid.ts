"use server";

import { revalidatePath } from "next/cache";

import { buildLegacyPatch } from "@/features/technical-visits/dynamic/legacy-sync";
import { serverRecalculateAnswers } from "@/features/technical-visits/dynamic/server-recalculate";
import { geocodeWorksiteForSave } from "@/features/technical-visits/lib/geocode-worksite-for-save";
import { parseSiteGpsString } from "@/features/technical-visits/lib/parse-site-gps";
import { clearLifecycleTimestampsWhenStatusMovesToPlanning } from "@/features/technical-visits/lib/lifecycle-save-sync";
import { updateFromTechnicalVisitForm } from "@/features/technical-visits/lib/map-to-db";
import { TechnicalVisitUpdateSchema } from "@/features/technical-visits/schemas/technical-visit.schema";
import type { TechnicalVisitRow } from "@/features/technical-visits/types";
import type { VisitTemplateSchema } from "@/features/technical-visits/templates/schema-types";
import type { Json } from "@/types/database.types";
import { refreshTechnicalVisitAlerts } from "@/features/technical-visits/alerts/sync-technical-visit-alerts";
import { isTechnicianWithoutDeskVisitPrivileges } from "@/features/technical-visits/access";
import {
  assertTechnicalVisitNotTechnicianRestrictedForViewer,
  assertTechnicianFieldworkSaveAllowedIfApplicable,
} from "@/features/technical-visits/access/technician-mutation-guard";
import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/auth/access-context";
import { notifyTechnicalVisitLifecycle } from "@/features/notifications/services/notification-service";

export type SaveTechnicalVisitHybridResult =
  | { ok: true; data: TechnicalVisitRow }
  | { ok: false; message: string };

/**
 * Single orchestrator for saving a technical visit in hybrid mode:
 * 1. Validates & persists legacy fields (same logic as updateTechnicalVisit).
 * 2. If a dynamic schema is provided: server-recalculates calculated fields,
 *    persists form_answers_json, and syncs mapToLegacyColumn values.
 *
 * The component calls this once; no more two-step save.
 */
export async function saveTechnicalVisitHybrid(input: {
  legacyPayload: unknown;
  dynamicSchema?: VisitTemplateSchema | null;
  dynamicAnswers?: Record<string, unknown> | null;
}): Promise<SaveTechnicalVisitHybridResult> {
  const { legacyPayload, dynamicSchema, dynamicAnswers } = input;

  const parsed = TechnicalVisitUpdateSchema.safeParse(legacyPayload);
  if (!parsed.success) {
    return { ok: false, message: "Données legacy invalides." };
  }

  const { id, ...rest } = parsed.data;
  const patch = updateFromTechnicalVisitForm(rest);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Session expirée." };
  }

  const { data: beforeRow } = await supabase
    .from("technical_visits")
    .select(
      "status, vt_reference, scheduled_at, lead_id, technician_id, started_at, worksite_address, worksite_postal_code, worksite_city, worksite_country, geocoding_attempts",
    )
    .eq("id", id)
    .maybeSingle();

  const access = await getAccessContext();
  if (access.kind === "authenticated" && beforeRow) {
    const gate = await assertTechnicalVisitNotTechnicianRestrictedForViewer(access, beforeRow);
    if (!gate.ok) {
      return { ok: false, message: gate.message };
    }
    const fieldworkGate = await assertTechnicianFieldworkSaveAllowedIfApplicable(access, beforeRow);
    if (!fieldworkGate.ok) {
      return { ok: false, message: fieldworkGate.message };
    }
  }

  let recalculated: Record<string, unknown> | null = null;
  const legacySyncPatch: Record<string, unknown> = {};

  if (dynamicSchema && dynamicAnswers) {
    recalculated = serverRecalculateAnswers(dynamicSchema, dynamicAnswers);
    (patch as Record<string, unknown>).form_answers_json = recalculated as unknown as Json;
    Object.assign(legacySyncPatch, buildLegacyPatch(dynamicSchema, recalculated));
    for (const [col, val] of Object.entries(legacySyncPatch)) {
      (patch as Record<string, unknown>)[col] = val;
    }
  }

  if (!beforeRow) {
    return { ok: false, message: "Visite technique introuvable." };
  }

  const legacySyncTouchesWorksite = [
    "worksite_address",
    "worksite_postal_code",
    "worksite_city",
    "worksite_country",
  ].some((k) => k in legacySyncPatch);

  const worksiteTouchedForm =
    "worksite_address" in rest || "worksite_postal_code" in rest || "worksite_city" in rest;
  const worksiteTouched = worksiteTouchedForm || legacySyncTouchesWorksite;

  const merged = {
    worksite_address:
      patch.worksite_address !== undefined
        ? ((patch.worksite_address as string | null) ?? "").trim() || null
        : beforeRow.worksite_address,
    worksite_postal_code:
      patch.worksite_postal_code !== undefined
        ? ((patch.worksite_postal_code as string | null) ?? "").trim() || null
        : beforeRow.worksite_postal_code,
    worksite_city:
      patch.worksite_city !== undefined
        ? ((patch.worksite_city as string | null) ?? "").trim() || null
        : beforeRow.worksite_city,
    worksite_country:
      patch.worksite_country !== undefined
        ? ((patch.worksite_country as string | null) ?? "").trim() || null
        : beforeRow.worksite_country,
  };

  if (!merged.worksite_country?.trim()) {
    merged.worksite_country = "France";
    (patch as Record<string, unknown>).worksite_country = "France";
  }

  const siteGpsParsed = parseSiteGpsString(recalculated?.site_gps ?? dynamicAnswers?.site_gps);

  if (siteGpsParsed) {
    patch.worksite_latitude = siteGpsParsed.lat;
    patch.worksite_longitude = siteGpsParsed.lng;
    (patch as Record<string, unknown>).geocoding_status = "complete_geocoded";
    (patch as Record<string, unknown>).geocoding_provider = "site_gps";
    (patch as Record<string, unknown>).geocoding_error = null;
    (patch as Record<string, unknown>).geocoding_updated_at = new Date().toISOString();
    (patch as Record<string, unknown>).geocoding_attempts = (beforeRow.geocoding_attempts ?? 0) + 1;
  } else if (worksiteTouched) {
    const { lat, lng, geocoding_status, geocoding_provider, geocoding_error } =
      await geocodeWorksiteForSave(merged);
    patch.worksite_latitude = lat;
    patch.worksite_longitude = lng;
    (patch as Record<string, unknown>).geocoding_status = geocoding_status;
    (patch as Record<string, unknown>).geocoding_provider = geocoding_provider;
    (patch as Record<string, unknown>).geocoding_error = geocoding_error;
    (patch as Record<string, unknown>).geocoding_updated_at = new Date().toISOString();
    (patch as Record<string, unknown>).geocoding_attempts = (beforeRow.geocoding_attempts ?? 0) + 1;
  }

  const pureTechnician =
    access.kind === "authenticated" && isTechnicianWithoutDeskVisitPrivileges(access);
  if (pureTechnician) {
    delete (patch as Record<string, unknown>).status;
    delete (patch as Record<string, unknown>).technician_id;
  }

  clearLifecycleTimestampsWhenStatusMovesToPlanning(
    patch as Record<string, unknown>,
    pureTechnician ? beforeRow?.status : rest.status,
    beforeRow?.status,
  );

  const { data, error } = await supabase
    .from("technical_visits")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "Aucune donnée retournée après mise à jour." };

  revalidatePath("/technical-visits");
  revalidatePath(`/technical-visits/${id}`);

  await refreshTechnicalVisitAlerts(supabase, id);

  if (beforeRow) {
    let leadCompanyName: string | null = null;
    if (data.lead_id) {
      const { data: lr } = await supabase
        .from("leads")
        .select("company_name")
        .eq("id", data.lead_id)
        .maybeSingle();
      leadCompanyName = lr?.company_name ?? null;
    }
    void notifyTechnicalVisitLifecycle({
      previousStatus: beforeRow.status,
      currentStatus: data.status,
      vtReference: data.vt_reference,
      vtId: data.id,
      leadCompanyName,
      scheduledAt: data.scheduled_at,
    });
  }

  return { ok: true, data };
}
