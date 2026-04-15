import type { SupabaseClient } from "@supabase/supabase-js";

import { computeVisitPermissions, resolveActorRole } from "@/features/technical-visits/lifecycle/rules";
import { getAccessContext } from "@/lib/auth/access-context";
import type { Database, TechnicalVisitStatus } from "@/types/database.types";

import { assertTechnicalVisitNotTechnicianRestrictedById } from "./technician-mutation-guard";

type VisitGateRow = {
  id: string;
  technician_id: string | null;
  started_at: string | null;
  locked_at: string | null;
  locked_by: string | null;
  status: TechnicalVisitStatus;
  scheduled_at: string | null;
  completed_at: string | null;
  performed_at: string | null;
};

function lifecycleFromRow(row: VisitGateRow) {
  return {
    status: row.status,
    started_at: row.started_at,
    completed_at: row.completed_at,
    performed_at: row.performed_at,
    locked_at: row.locked_at,
    locked_by: row.locked_by,
    technician_id: row.technician_id,
    scheduled_at: row.scheduled_at,
  };
}

async function loadVisitForAudioGate(
  supabase: SupabaseClient<Database>,
  visitId: string,
): Promise<{ ok: true; row: VisitGateRow } | { ok: false; message: string }> {
  const { data, error } = await supabase
    .from("technical_visits")
    .select(
      "id, technician_id, started_at, locked_at, locked_by, status, scheduled_at, completed_at, performed_at",
    )
    .eq("id", visitId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data) {
    return { ok: false, message: "Visite technique introuvable." };
  }
  return { ok: true, row: data };
}

/**
 * Upload d’un nouvel enregistrement : visite démarrée, pas de fenêtre technicien J-24h,
 * droit d’édition, et si l’acteur est « technicien » il doit être le technicien affecté.
 */
export async function assertTechnicalVisitAudioUploadAllowed(
  supabase: SupabaseClient<Database>,
  visitId: string,
): Promise<{ ok: true; visit: VisitGateRow } | { ok: false; message: string }> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const restricted = await assertTechnicalVisitNotTechnicianRestrictedById(supabase, visitId);
  if (!restricted.ok) {
    return restricted;
  }

  const loaded = await loadVisitForAudioGate(supabase, visitId);
  if (!loaded.ok) {
    return loaded;
  }
  const { row } = loaded;

  if (!row.started_at) {
    return {
      ok: false,
      message: "Enregistrement audio possible après le démarrage de la visite terrain.",
    };
  }

  const actorRole = resolveActorRole(access.roleCodes);
  const permissions = computeVisitPermissions(lifecycleFromRow(row), actorRole);
  if (!permissions.edit) {
    return { ok: false, message: "Vous n’avez pas les droits pour modifier cette visite." };
  }

  if (actorRole === "technician" && row.technician_id !== access.userId) {
    return {
      ok: false,
      message: "Seul le technicien affecté peut enregistrer une note vocale sur cette visite.",
    };
  }

  return { ok: true, visit: row };
}

/** Édition / retry de transcription : même contrôle que le reste de la fiche (pas réservé au seul technicien). */
export async function assertTechnicalVisitAudioNoteManageAllowed(
  supabase: SupabaseClient<Database>,
  visitId: string,
): Promise<{ ok: true; visit: VisitGateRow } | { ok: false; message: string }> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const restricted = await assertTechnicalVisitNotTechnicianRestrictedById(supabase, visitId);
  if (!restricted.ok) {
    return restricted;
  }

  const loaded = await loadVisitForAudioGate(supabase, visitId);
  if (!loaded.ok) {
    return loaded;
  }
  const { row } = loaded;

  const actorRole = resolveActorRole(access.roleCodes);
  const permissions = computeVisitPermissions(lifecycleFromRow(row), actorRole);
  if (!permissions.edit) {
    return { ok: false, message: "Vous n’avez pas les droits pour modifier cette visite." };
  }

  return { ok: true, visit: row };
}
