import type { AccessContext } from "@/lib/auth/access-context";
import { hasFullCommercialDataAccess } from "@/lib/auth/lead-scope";
import type { TechnicalVisitStatus } from "@/types/database.types";

/** Fenêtre d’accès aux données sensibles : à partir de 24h avant `scheduled_at` (référence UTC). */
export const TECHNICIAN_SENSITIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Rôles / profils qui ne sont jamais soumis à la réduction « technicien avant J-24h ».
 * Aligné sur le périmètre métier (manager, commercial élargi, confirmateur, super admin).
 */
export function bypassesTechnicianPreVisitRedaction(roleCodes: readonly string[]): boolean {
  if (roleCodes.includes("super_admin")) return true;
  if (roleCodes.includes("manager")) return true;
  if (hasFullCommercialDataAccess(roleCodes)) return true;
  if (roleCodes.includes("confirmer")) return true;
  return false;
}

/**
 * Technicien « terrain » sans rôle bureau : pas de modification statut / affectation dans l’ERP.
 */
export function isTechnicianWithoutDeskVisitPrivileges(access: AccessContext): boolean {
  if (access.kind !== "authenticated") return false;
  return (
    access.roleCodes.includes("technician") &&
    !bypassesTechnicianPreVisitRedaction(access.roleCodes)
  );
}

function isTerminalRedactedForAssignedTechnician(status: TechnicalVisitStatus): boolean {
  return status === "cancelled" || status === "refused" || status === "validated";
}

function isPostFieldworkUnredacted(status: TechnicalVisitStatus): boolean {
  return status === "performed" || status === "report_pending";
}

/** Instant où l’accès aux champs sensibles s’ouvre (24h avant le créneau planifié). */
export function technicianSensitiveWindowStartMs(scheduledAtIso: string): number {
  return new Date(scheduledAtIso).getTime() - TECHNICIAN_SENSITIVE_WINDOW_MS;
}

export function isWithinTechnicianSensitiveAccessWindow(
  scheduledAtIso: string,
  nowMs: number = Date.now(),
): boolean {
  return nowMs >= technicianSensitiveWindowStartMs(scheduledAtIso);
}

export type TechnicianVisitAccessInput = {
  viewerUserId: string;
  viewerRoleCodes: readonly string[];
  technicianId: string | null;
  scheduledAt: string | null;
  status: TechnicalVisitStatus;
};

/**
 * - `full` : accès habituel aux champs sensibles.
 * - `technician_restricted` : vue limitée (technicien affecté hors fenêtre J-24h, ou sans date planifiée, ou dossier clos).
 */
export function getTechnicalVisitFieldAccessLevel(
  input: TechnicianVisitAccessInput,
  nowMs: number = Date.now(),
): "full" | "technician_restricted" {
  if (bypassesTechnicianPreVisitRedaction(input.viewerRoleCodes)) {
    return "full";
  }
  if (!input.technicianId || input.technicianId !== input.viewerUserId) {
    return "full";
  }
  if (isTerminalRedactedForAssignedTechnician(input.status)) {
    return "technician_restricted";
  }
  if (isPostFieldworkUnredacted(input.status)) {
    return "full";
  }
  if (!input.scheduledAt) {
    return "technician_restricted";
  }
  return isWithinTechnicianSensitiveAccessWindow(input.scheduledAt, nowMs) ? "full" : "technician_restricted";
}

export function shouldRedactSensitiveTechnicalVisitFields(
  input: TechnicianVisitAccessInput,
  nowMs?: number,
): boolean {
  return getTechnicalVisitFieldAccessLevel(input, nowMs ?? Date.now()) === "technician_restricted";
}

/** Contexte ERP authentifié + ligne visite (champs minimaux). */
export function getTechnicalVisitFieldAccessLevelForAuthenticatedViewer(
  access: Extract<AccessContext, { kind: "authenticated" }>,
  visit: { technician_id: string | null; scheduled_at: string | null; status: TechnicalVisitStatus },
  nowMs: number = Date.now(),
): "full" | "technician_restricted" {
  return getTechnicalVisitFieldAccessLevel(
    {
      viewerUserId: access.userId,
      viewerRoleCodes: access.roleCodes,
      technicianId: visit.technician_id,
      scheduledAt: visit.scheduled_at,
      status: visit.status,
    },
    nowMs,
  );
}

/**
 * Technicien affecté (vue « pleine » J-24h) : le formulaire terrain / dynamique n’apparaît qu’après
 * « Démarrer la visite » (`started_at`). Les profils bureau (confirmateur, manager, etc.) ne sont pas concernés.
 */
export function shouldHideTechnicianFieldworkFormUntilVisitStarted(
  access: Extract<AccessContext, { kind: "authenticated" }>,
  visit: {
    technician_id: string | null;
    started_at: string | null;
    status: TechnicalVisitStatus;
  },
  fieldAccessLevel: "full" | "technician_restricted",
): boolean {
  if (fieldAccessLevel !== "full") return false;
  if (!access.roleCodes.includes("technician")) return false;
  if (!visit.technician_id || visit.technician_id !== access.userId) return false;
  if (bypassesTechnicianPreVisitRedaction(access.roleCodes)) return false;
  if (visit.started_at) return false;
  if (
    visit.status === "performed" ||
    visit.status === "report_pending" ||
    visit.status === "validated"
  ) {
    return false;
  }
  return true;
}
