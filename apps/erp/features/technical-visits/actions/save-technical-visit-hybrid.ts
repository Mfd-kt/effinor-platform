"use server";

import { revalidatePath } from "next/cache";

import { buildLegacyPatch } from "@/features/technical-visits/dynamic/legacy-sync";
import { serverRecalculateAnswers } from "@/features/technical-visits/dynamic/server-recalculate";
import { geocodeWorksiteForSave } from "@/features/technical-visits/lib/geocode-worksite-for-save";
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
    .select("status, vt_reference, scheduled_at, lead_id, technician_id, started_at")
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

  const worksiteTouched =
    "worksite_address" in rest ||
    "worksite_postal_code" in rest ||
    "worksite_city" in rest;

  if (worksiteTouched) {
    const { data: existing, error: fetchErr } = await supabase
      .from("technical_visits")
      .select("worksite_address, worksite_postal_code, worksite_city")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) return { ok: false, message: fetchErr.message };
    if (!existing) return { ok: false, message: "Visite technique introuvable." };

    const merged = {
      worksite_address: rest.worksite_address !== undefined ? rest.worksite_address?.trim() || null : existing.worksite_address,
      worksite_postal_code: rest.worksite_postal_code !== undefined ? rest.worksite_postal_code?.trim() || null : existing.worksite_postal_code,
      worksite_city: rest.worksite_city !== undefined ? rest.worksite_city?.trim() || null : existing.worksite_city,
    };

    const { lat, lng } = await geocodeWorksiteForSave(merged);
    patch.worksite_latitude = lat;
    patch.worksite_longitude = lng;
  }

  if (dynamicSchema && dynamicAnswers) {
    const recalculated = serverRecalculateAnswers(dynamicSchema, dynamicAnswers);
    (patch as Record<string, unknown>).form_answers_json = recalculated as unknown as Json;

    const legacySync = buildLegacyPatch(dynamicSchema, recalculated);
    for (const [col, val] of Object.entries(legacySync)) {
      (patch as Record<string, unknown>)[col] = val;
    }
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
