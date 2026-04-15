"use server";

import { revalidatePath } from "next/cache";

import { canManageTechnicalVisitPilotageAlerts } from "@/features/technical-visits/alerts/technical-visit-alerts-access";
import { isTechnicalVisitAlertsTableUnavailable } from "@/features/technical-visits/alerts/technical-visit-alerts-schema-error";
import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/auth/access-context";

export async function dismissTechnicalVisitAlertAction(
  alertId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await getAccessContext();
  if (!canManageTechnicalVisitPilotageAlerts(access)) {
    return { ok: false, error: "Action réservée au pilotage (manager, admin, confirmer)." };
  }
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("technical_visit_alerts")
    .select("id, technical_visit_id, status")
    .eq("id", alertId)
    .maybeSingle();

  if (fetchErr) {
    if (isTechnicalVisitAlertsTableUnavailable(fetchErr)) {
      return {
        ok: false,
        error:
          "Alertes pilotage indisponibles : appliquer la migration Supabase `20260416010000_technical_visit_alerts.sql`.",
      };
    }
    return { ok: false, error: fetchErr.message };
  }
  if (!row) {
    return { ok: false, error: "Alerte introuvable." };
  }
  if (row.status !== "open") {
    return { ok: false, error: "Cette alerte n’est plus ouverte." };
  }

  const { error: upErr } = await supabase
    .from("technical_visit_alerts")
    .update({
      status: "dismissed",
      resolved_at: new Date().toISOString(),
      resolved_by: access.userId,
    })
    .eq("id", alertId);

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  revalidatePath(`/technical-visits/${row.technical_visit_id}`);
  return { ok: true };
}

export async function resolveTechnicalVisitAlertAction(
  alertId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await getAccessContext();
  if (!canManageTechnicalVisitPilotageAlerts(access)) {
    return { ok: false, error: "Action réservée au pilotage (manager, admin, confirmer)." };
  }
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("technical_visit_alerts")
    .select("id, technical_visit_id, status")
    .eq("id", alertId)
    .maybeSingle();

  if (fetchErr) {
    if (isTechnicalVisitAlertsTableUnavailable(fetchErr)) {
      return {
        ok: false,
        error:
          "Alertes pilotage indisponibles : appliquer la migration Supabase `20260416010000_technical_visit_alerts.sql`.",
      };
    }
    return { ok: false, error: fetchErr.message };
  }
  if (!row) {
    return { ok: false, error: "Alerte introuvable." };
  }
  if (row.status !== "open") {
    return { ok: false, error: "Cette alerte n’est plus ouverte." };
  }

  const { error: upErr } = await supabase
    .from("technical_visit_alerts")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by: access.userId,
    })
    .eq("id", alertId);

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  revalidatePath(`/technical-visits/${row.technical_visit_id}`);
  return { ok: true };
}
