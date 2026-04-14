"use server";

import { revalidatePath } from "next/cache";

import { geocodeWorksiteForSave } from "@/features/technical-visits/lib/geocode-worksite-for-save";
import { updateFromTechnicalVisitForm } from "@/features/technical-visits/lib/map-to-db";
import { TechnicalVisitUpdateSchema } from "@/features/technical-visits/schemas/technical-visit.schema";
import type { TechnicalVisitRow } from "@/features/technical-visits/types";
import { createClient } from "@/lib/supabase/server";
import { notifyTechnicalVisitLifecycle } from "@/features/notifications/services/notification-service";

export type UpdateTechnicalVisitResult =
  | { ok: true; data: TechnicalVisitRow }
  | { ok: false; message: string };

export async function updateTechnicalVisit(
  input: unknown,
): Promise<UpdateTechnicalVisitResult> {
  const parsed = TechnicalVisitUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const { id, ...rest } = parsed.data;
  const patch = updateFromTechnicalVisitForm(rest);

  const supabase = await createClient();

  const { data: beforeRow } = await supabase
    .from("technical_visits")
    .select("status, vt_reference, scheduled_at, lead_id")
    .eq("id", id)
    .maybeSingle();

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

    if (fetchErr) {
      return { ok: false, message: fetchErr.message };
    }
    if (!existing) {
      return { ok: false, message: "Visite technique introuvable." };
    }

    const merged = {
      worksite_address:
        rest.worksite_address !== undefined
          ? rest.worksite_address?.trim() || null
          : existing.worksite_address,
      worksite_postal_code:
        rest.worksite_postal_code !== undefined
          ? rest.worksite_postal_code?.trim() || null
          : existing.worksite_postal_code,
      worksite_city:
        rest.worksite_city !== undefined ? rest.worksite_city?.trim() || null : existing.worksite_city,
    };

    const { lat, lng } = await geocodeWorksiteForSave(merged);
    patch.worksite_latitude = lat;
    patch.worksite_longitude = lng;
  }

  const { data, error } = await supabase
    .from("technical_visits")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après mise à jour." };
  }

  revalidatePath("/technical-visits");
  revalidatePath(`/technical-visits/${id}`);

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
