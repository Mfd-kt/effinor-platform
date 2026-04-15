"use server";

import { revalidatePath } from "next/cache";

import { assertTechnicalVisitNotTechnicianRestrictedForViewer } from "@/features/technical-visits/access/technician-mutation-guard";
import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/auth/access-context";
import {
  notifyTechnicalVisitLifecycle,
  notifyTechnicalVisitStarted,
} from "@/features/notifications/services/notification-service";
import type { Database, TechnicalVisitStatus } from "@/types/database.types";

type TechnicalVisitUpdate = Database["public"]["Tables"]["technical_visits"]["Update"];
import { refreshTechnicalVisitAlerts } from "@/features/technical-visits/alerts/sync-technical-visit-alerts";
import { buildStartGeoProofInsert } from "@/features/technical-visits/geo/build-start-geo-proof-row";
import { isTechnicalVisitGeoProofsTableUnavailable } from "@/features/technical-visits/geo/geo-proofs-schema-error";
import {
  VisitStartGeoPayloadSchema,
  type VisitStartGeoPayloadInput,
} from "@/features/technical-visits/geo/visit-start-geo-payload";
import {
  canStartVisit,
  canCompleteVisit,
  canLockVisit,
  canUnlockVisit,
  canValidateVisit,
  canCancelVisit,
  canReopenVisitForFieldwork,
  resolveActorRole,
  type VisitLifecycleRow,
} from "./rules";

export type LifecycleResult = { ok: true; notice?: string } | { ok: false; message: string };

async function guardTechnicianRestrictedVisit(
  row: VisitLifecycleRow,
): Promise<LifecycleResult | null> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return null;
  }
  const gate = await assertTechnicalVisitNotTechnicianRestrictedForViewer(access, row);
  return gate.ok ? null : gate;
}

async function loadVisitForLifecycle(
  visitId: string,
): Promise<
  | { ok: true; row: VisitLifecycleRow & { id: string; vt_reference: string; lead_id: string }; actorRole: ReturnType<typeof resolveActorRole>; userId: string }
  | { ok: false; message: string }
> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("technical_visits")
    .select(
      "id, vt_reference, lead_id, status, started_at, completed_at, performed_at, locked_at, locked_by, technician_id, scheduled_at, worksite_latitude, worksite_longitude",
    )
    .eq("id", visitId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "Visite technique introuvable." };

  return {
    ok: true,
    row: data as VisitLifecycleRow & { id: string; vt_reference: string; lead_id: string },
    actorRole: resolveActorRole(access.roleCodes),
    userId: access.userId,
  };
}

async function patchVisit(
  visitId: string,
  patch: Record<string, unknown>,
): Promise<LifecycleResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("technical_visits")
    .update(patch as TechnicalVisitUpdate)
    .eq("id", visitId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/technical-visits");
  revalidatePath(`/technical-visits/${visitId}`);
  return { ok: true };
}

async function notifyStatusChange(
  row: { vt_reference: string; lead_id: string; id: string },
  previousStatus: string,
  currentStatus: string,
) {
  const supabase = await createClient();
  let companyName: string | null = null;
  if (row.lead_id) {
    const { data: lr } = await supabase
      .from("leads")
      .select("company_name")
      .eq("id", row.lead_id)
      .maybeSingle();
    companyName = lr?.company_name ?? null;
  }
  void notifyTechnicalVisitLifecycle({
    previousStatus,
    currentStatus,
    vtReference: row.vt_reference,
    vtId: row.id,
    leadCompanyName: companyName,
  });
}

export async function startTechnicalVisit(
  visitId: string,
  geoInput?: VisitStartGeoPayloadInput,
): Promise<LifecycleResult> {
  const ctx = await loadVisitForLifecycle(visitId);
  if (!ctx.ok) return ctx;

  const restrictedGate = await guardTechnicianRestrictedVisit(ctx.row);
  if (restrictedGate && !restrictedGate.ok) return restrictedGate;

  if (!canStartVisit(ctx.row, ctx.actorRole)) {
    return { ok: false, message: "Impossible de démarrer cette visite (statut, technicien ou droits insuffisants)." };
  }

  const geoParsed = VisitStartGeoPayloadSchema.safeParse(
    geoInput ?? ({ ok: false, code: "unavailable" } as VisitStartGeoPayloadInput),
  );
  const geoPayload = geoParsed.success
    ? geoParsed.data
    : ({ ok: false, code: "unavailable" } as VisitStartGeoPayloadInput);

  const { row: proofRow, userMessageFr } = buildStartGeoProofInsert(
    visitId,
    ctx.row.worksite_latitude,
    ctx.row.worksite_longitude,
    geoPayload,
  );

  const startedAt = new Date().toISOString();
  const supabase = await createClient();

  const { error: upErr } = await supabase
    .from("technical_visits")
    .update({ started_at: startedAt })
    .eq("id", visitId);

  if (upErr) {
    return { ok: false, message: upErr.message };
  }

  const accessForNotify = await getAccessContext();
  const technicianLabelForNotify =
    accessForNotify.kind === "authenticated"
      ? accessForNotify.fullName?.trim() || accessForNotify.email?.trim() || null
      : null;

  const { error: insErr } = await supabase.from("technical_visit_geo_proofs").insert(proofRow);
  if (insErr) {
    if (isTechnicalVisitGeoProofsTableUnavailable(insErr)) {
      revalidatePath("/technical-visits");
      revalidatePath(`/technical-visits/${visitId}`);
      await refreshTechnicalVisitAlerts(supabase, visitId);
      void notifyTechnicalVisitStarted({
        vtReference: ctx.row.vt_reference,
        vtId: visitId,
        leadId: ctx.row.lead_id,
        technicianLabel: technicianLabelForNotify,
        startedAt,
      }).catch((e) => console.warn("[notifications] VT started notify failed:", e));
      return {
        ok: true,
        notice:
          "Visite démarrée. Preuve GPS non enregistrée : appliquer la migration Supabase (fichier `20260415190000_technical_visit_geo_proofs.sql`).",
      };
    }
    await supabase
      .from("technical_visits")
      .update({ started_at: null })
      .eq("id", visitId)
      .eq("started_at", startedAt);
    return { ok: false, message: insErr.message };
  }

  revalidatePath("/technical-visits");
  revalidatePath(`/technical-visits/${visitId}`);
  await refreshTechnicalVisitAlerts(supabase, visitId);
  void notifyTechnicalVisitStarted({
    vtReference: ctx.row.vt_reference,
    vtId: visitId,
    leadId: ctx.row.lead_id,
    technicianLabel: technicianLabelForNotify,
    startedAt,
  }).catch((e) => console.warn("[notifications] VT started notify failed:", e));
  return { ok: true, notice: userMessageFr ?? undefined };
}

export async function completeTechnicalVisit(visitId: string): Promise<LifecycleResult> {
  const ctx = await loadVisitForLifecycle(visitId);
  if (!ctx.ok) return ctx;

  const restrictedGate = await guardTechnicianRestrictedVisit(ctx.row);
  if (restrictedGate && !restrictedGate.ok) return restrictedGate;

  if (!canCompleteVisit(ctx.row, ctx.actorRole)) {
    return { ok: false, message: "Impossible de terminer cette visite (visite non démarrée ou droits insuffisants)." };
  }

  const now = new Date().toISOString();
  const previousStatus = ctx.row.status;
  const nextStatus: TechnicalVisitStatus = "performed";

  const result = await patchVisit(visitId, {
    completed_at: now,
    performed_at: now,
    status: nextStatus,
  });

  if (result.ok) {
    await notifyStatusChange(ctx.row, previousStatus, nextStatus);
    const supabaseAlerts = await createClient();
    await refreshTechnicalVisitAlerts(supabaseAlerts, visitId);
  }

  return result;
}

export async function lockTechnicalVisit(visitId: string): Promise<LifecycleResult> {
  const ctx = await loadVisitForLifecycle(visitId);
  if (!ctx.ok) return ctx;

  const restrictedGate = await guardTechnicianRestrictedVisit(ctx.row);
  if (restrictedGate && !restrictedGate.ok) return restrictedGate;

  if (!canLockVisit(ctx.row, ctx.actorRole)) {
    return { ok: false, message: "Verrouillage impossible (statut ou droits insuffisants)." };
  }

  return patchVisit(visitId, {
    locked_at: new Date().toISOString(),
    locked_by: ctx.userId,
  });
}

export async function unlockTechnicalVisit(visitId: string): Promise<LifecycleResult> {
  const ctx = await loadVisitForLifecycle(visitId);
  if (!ctx.ok) return ctx;

  const restrictedGate = await guardTechnicianRestrictedVisit(ctx.row);
  if (restrictedGate && !restrictedGate.ok) return restrictedGate;

  if (!canUnlockVisit(ctx.row, ctx.actorRole)) {
    return { ok: false, message: "Déverrouillage impossible (droits admin requis)." };
  }

  return patchVisit(visitId, {
    locked_at: null,
    locked_by: null,
  });
}

export async function validateTechnicalVisit(visitId: string): Promise<LifecycleResult> {
  const ctx = await loadVisitForLifecycle(visitId);
  if (!ctx.ok) return ctx;

  const restrictedGate = await guardTechnicianRestrictedVisit(ctx.row);
  if (restrictedGate && !restrictedGate.ok) return restrictedGate;

  if (!canValidateVisit(ctx.row, ctx.actorRole)) {
    return { ok: false, message: "Validation impossible (statut ou droits insuffisants)." };
  }

  const previousStatus = ctx.row.status;
  const nextStatus: TechnicalVisitStatus = "validated";

  const result = await patchVisit(visitId, { status: nextStatus });

  if (result.ok) {
    await notifyStatusChange(ctx.row, previousStatus, nextStatus);
    const supabaseAlerts = await createClient();
    await refreshTechnicalVisitAlerts(supabaseAlerts, visitId);
  }

  return result;
}

export async function cancelTechnicalVisit(visitId: string): Promise<LifecycleResult> {
  const ctx = await loadVisitForLifecycle(visitId);
  if (!ctx.ok) return ctx;

  const restrictedGate = await guardTechnicianRestrictedVisit(ctx.row);
  if (restrictedGate && !restrictedGate.ok) return restrictedGate;

  if (!canCancelVisit(ctx.row, ctx.actorRole)) {
    return { ok: false, message: "Annulation impossible (statut ou droits insuffisants)." };
  }

  const previousStatus = ctx.row.status;
  const nextStatus: TechnicalVisitStatus = "cancelled";

  const result = await patchVisit(visitId, { status: nextStatus });
  if (result.ok) {
    const supabaseAlerts = await createClient();
    await refreshTechnicalVisitAlerts(supabaseAlerts, visitId);
  }
  return result;
}

/**
 * Corrige une visite marquée effectuée / compte-rendu en cours pour permettre un nouveau passage terrain.
 * Repasse en « planifiée » si une date était déjà posée, sinon « à planifier ».
 */
export async function reopenTechnicalVisitForFieldwork(visitId: string): Promise<LifecycleResult> {
  const ctx = await loadVisitForLifecycle(visitId);
  if (!ctx.ok) return ctx;

  const restrictedGate = await guardTechnicianRestrictedVisit(ctx.row);
  if (restrictedGate && !restrictedGate.ok) return restrictedGate;

  if (!canReopenVisitForFieldwork(ctx.row, ctx.actorRole)) {
    return {
      ok: false,
      message:
        "Remise à effectuer impossible (statut, fiche verrouillée ou droits insuffisants). Déverrouillez la visite si besoin.",
    };
  }

  const previousStatus = ctx.row.status;
  const nextStatus: TechnicalVisitStatus = ctx.row.scheduled_at ? "scheduled" : "to_schedule";

  const result = await patchVisit(visitId, {
    status: nextStatus,
    started_at: null,
    completed_at: null,
    performed_at: null,
  });

  if (result.ok) {
    await notifyStatusChange(ctx.row, previousStatus, nextStatus);
    const supabaseAlerts = await createClient();
    await refreshTechnicalVisitAlerts(supabaseAlerts, visitId);
  }

  return result;
}
