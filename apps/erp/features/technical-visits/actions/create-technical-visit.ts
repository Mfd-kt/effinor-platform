"use server";

import { revalidatePath } from "next/cache";

import { linkTechnicalVisitToWorkflow } from "@/features/cee-workflows/services/workflow-service";
import { geocodeWorksiteForSave } from "@/features/technical-visits/lib/geocode-worksite-for-save";
import { insertFromTechnicalVisitForm } from "@/features/technical-visits/lib/map-to-db";
import { TechnicalVisitInsertSchema } from "@/features/technical-visits/schemas/technical-visit.schema";
import type { TechnicalVisitRow } from "@/features/technical-visits/types";
import { isTechnicianWithoutDeskVisitPrivileges } from "@/features/technical-visits/access";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

export type CreateTechnicalVisitResult =
  | { ok: true; data: TechnicalVisitRow }
  | { ok: false; message: string };

/**
 * Crée une VT **legacy** (sans template dynamique).
 *
 * RÈGLE MÉTIER : une VT dynamique (visit_template_key, visit_schema_snapshot_json)
 * doit être créée depuis un contexte workflow / fiche CEE qui fournit le template.
 * Voir `createTechnicalVisitFromLead` et le futur flux « création depuis workflow ».
 * Cette action ne pose pas de template ; les colonnes restent NULL.
 */
export async function createTechnicalVisit(
  input: unknown,
): Promise<CreateTechnicalVisitResult> {
  const parsed = TechnicalVisitInsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Session expirée." };
  }

  const row = insertFromTechnicalVisitForm(parsed.data);
  row.created_by_user_id = user.id;

  const access = await getAccessContext();
  if (access.kind === "authenticated" && isTechnicianWithoutDeskVisitPrivileges(access)) {
    row.technician_id = access.userId;
    row.status = "to_schedule";
  }

  const { data: leadRow } = await supabase
    .from("leads")
    .select("current_workflow_id")
    .eq("id", row.lead_id)
    .maybeSingle();
  row.workflow_id = leadRow?.current_workflow_id ?? null;

  const geo = await geocodeWorksiteForSave({
    worksite_address: row.worksite_address,
    worksite_postal_code: row.worksite_postal_code,
    worksite_city: row.worksite_city,
    worksite_country: row.worksite_country,
  });
  row.worksite_latitude = geo.lat;
  row.worksite_longitude = geo.lng;
  row.geocoding_status = geo.geocoding_status;
  row.geocoding_provider = geo.geocoding_provider;
  row.geocoding_error = geo.geocoding_error;
  row.geocoding_updated_at = new Date().toISOString();
  row.geocoding_attempts = 1;

  const { data, error } = await supabase.from("technical_visits").insert(row).select().single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après création." };
  }

  if (row.workflow_id) {
    await linkTechnicalVisitToWorkflow(supabase, {
      workflowId: row.workflow_id,
      technicalVisitId: data.id,
      actorUserId: user.id,
      markDone: false,
    });
  }

  revalidatePath("/technical-visits");
  return { ok: true, data };
}
