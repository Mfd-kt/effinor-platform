"use server";

import { revalidatePath } from "next/cache";

import { linkTechnicalVisitToWorkflow } from "@/features/cee-workflows/services/workflow-service";
import { geocodeWorksiteForSave } from "@/features/technical-visits/lib/geocode-worksite-for-save";
import { insertFromTechnicalVisitForm } from "@/features/technical-visits/lib/map-to-db";
import { TechnicalVisitInsertSchema } from "@/features/technical-visits/schemas/technical-visit.schema";
import type { TechnicalVisitRow } from "@/features/technical-visits/types";
import { createClient } from "@/lib/supabase/server";

export type CreateTechnicalVisitResult =
  | { ok: true; data: TechnicalVisitRow }
  | { ok: false; message: string };

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

  const { data: leadRow } = await supabase
    .from("leads")
    .select("current_workflow_id")
    .eq("id", row.lead_id)
    .maybeSingle();
  row.workflow_id = leadRow?.current_workflow_id ?? null;

  const { lat, lng } = await geocodeWorksiteForSave({
    worksite_address: row.worksite_address,
    worksite_postal_code: row.worksite_postal_code,
    worksite_city: row.worksite_city,
  });
  row.worksite_latitude = lat;
  row.worksite_longitude = lng;

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
