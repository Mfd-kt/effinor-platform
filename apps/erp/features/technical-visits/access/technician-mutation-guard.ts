import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccessContext } from "@/lib/auth/access-context";
import { getAccessContext } from "@/lib/auth/access-context";
import type { Database, TechnicalVisitStatus } from "@/types/database.types";

import {
  getTechnicalVisitFieldAccessLevelForAuthenticatedViewer,
  shouldHideTechnicianFieldworkFormUntilVisitStarted,
  shouldRedactSensitiveTechnicalVisitFields,
} from "./technician-sensitive-access";

export const TECHNICIAN_RESTRICTED_MUTATION_MESSAGE =
  "Action impossible : les informations détaillées de cette visite ne sont ouvertes qu’à partir de 24h avant le créneau planifié, ou après le passage terrain.";

export const TECHNICIAN_MUST_START_VISIT_BEFORE_SAVE_MESSAGE =
  "Enregistrement impossible : démarrez d’abord la visite avec le bouton « Démarrer la visite » pour accéder au formulaire terrain.";

export function visitIdFromTechnicalVisitStorageObjectPath(objectPath: string): string | null {
  const m = objectPath.match(/^technical-visits\/([0-9a-f-]{36})\//i);
  return m?.[1] ?? null;
}

export async function assertTechnicalVisitNotTechnicianRestrictedForViewer(
  access: AccessContext,
  visit: {
    technician_id: string | null;
    scheduled_at: string | null;
    status: TechnicalVisitStatus;
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }
  if (
    shouldRedactSensitiveTechnicalVisitFields({
      viewerUserId: access.userId,
      viewerRoleCodes: access.roleCodes,
      technicianId: visit.technician_id,
      scheduledAt: visit.scheduled_at,
      status: visit.status,
    })
  ) {
    return { ok: false, message: TECHNICIAN_RESTRICTED_MUTATION_MESSAGE };
  }
  return { ok: true };
}

/**
 * Empêche le technicien affecté d’enregistrer le formulaire tant que la visite n’a pas été démarrée (`started_at`).
 */
export async function assertTechnicianFieldworkSaveAllowedIfApplicable(
  access: AccessContext,
  visit: {
    technician_id: string | null;
    scheduled_at: string | null;
    started_at: string | null;
    status: TechnicalVisitStatus;
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (access.kind !== "authenticated") {
    return { ok: true };
  }
  const level = getTechnicalVisitFieldAccessLevelForAuthenticatedViewer(access, {
    technician_id: visit.technician_id,
    scheduled_at: visit.scheduled_at,
    status: visit.status,
  });
  if (
    shouldHideTechnicianFieldworkFormUntilVisitStarted(access, visit, level)
  ) {
    return { ok: false, message: TECHNICIAN_MUST_START_VISIT_BEFORE_SAVE_MESSAGE };
  }
  return { ok: true };
}

export async function assertTechnicalVisitNotTechnicianRestrictedById(
  supabase: SupabaseClient<Database>,
  visitId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const access = await getAccessContext();
  const { data, error } = await supabase
    .from("technical_visits")
    .select("technician_id, scheduled_at, status, started_at")
    .eq("id", visitId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data) {
    return { ok: false, message: "Visite technique introuvable." };
  }

  const restricted = await assertTechnicalVisitNotTechnicianRestrictedForViewer(access, data);
  if (!restricted.ok) {
    return restricted;
  }
  return assertTechnicianFieldworkSaveAllowedIfApplicable(access, data);
}
