/**
 * Règles métier du cycle de vie d'une visite technique.
 *
 * Pas de machine à états parallèle : on utilise les statuts existants
 * et on applique des pré-conditions sur les colonnes de cycle terrain
 * (started_at, completed_at, locked_at, locked_by).
 */

import type { TechnicalVisitStatus } from "@/types/database.types";

export type VisitLifecycleRow = {
  status: TechnicalVisitStatus;
  started_at: string | null;
  completed_at: string | null;
  performed_at: string | null;
  locked_at: string | null;
  locked_by: string | null;
  technician_id: string | null;
  scheduled_at: string | null;
  /** Pour preuve GPS au démarrage (optionnel selon la requête). */
  worksite_latitude?: number | null;
  worksite_longitude?: number | null;
};

export type ActorRole = "technician" | "confirmer" | "manager" | "admin" | "super_admin";

const EDITABLE_STATUSES: ReadonlySet<TechnicalVisitStatus> = new Set([
  "to_schedule",
  "scheduled",
  "performed",
  "report_pending",
]);

const TERMINAL_STATUSES: ReadonlySet<TechnicalVisitStatus> = new Set([
  "refused",
  "cancelled",
]);

const LOCKABLE_STATUSES: ReadonlySet<TechnicalVisitStatus> = new Set([
  "performed",
  "report_pending",
  "validated",
]);

const ADMIN_ROLES: ReadonlySet<ActorRole> = new Set(["admin", "super_admin"]);
const MANAGER_PLUS: ReadonlySet<ActorRole> = new Set(["manager", "admin", "super_admin"]);

function isAdminPlus(role: ActorRole): boolean {
  return ADMIN_ROLES.has(role);
}

function isManagerPlus(role: ActorRole): boolean {
  return MANAGER_PLUS.has(role);
}

export function canEditVisit(row: VisitLifecycleRow, role: ActorRole): boolean {
  if (TERMINAL_STATUSES.has(row.status)) {
    return role === "super_admin";
  }

  if (row.status === "validated") {
    return isAdminPlus(role) && !row.locked_at;
  }

  if (!EDITABLE_STATUSES.has(row.status)) return false;

  if (row.locked_at) {
    return isAdminPlus(role);
  }

  return true;
}

export function canStartVisit(row: VisitLifecycleRow, role: ActorRole): boolean {
  if (row.status !== "scheduled") return false;
  if (row.started_at) return false;
  if (row.completed_at) return false;
  if (row.performed_at) return false;
  if (!row.technician_id) return false;
  return role === "technician" || isManagerPlus(role);
}

export function canCompleteVisit(row: VisitLifecycleRow, role: ActorRole): boolean {
  if (row.status !== "scheduled") return false;
  if (!row.started_at) return false;
  if (row.completed_at) return false;
  return role === "technician" || isManagerPlus(role);
}

export function canLockVisit(row: VisitLifecycleRow, role: ActorRole): boolean {
  if (row.locked_at) return false;
  if (!LOCKABLE_STATUSES.has(row.status)) return false;
  return isManagerPlus(role);
}

export function canUnlockVisit(row: VisitLifecycleRow, role: ActorRole): boolean {
  if (!row.locked_at) return false;
  if (!LOCKABLE_STATUSES.has(row.status)) return false;
  return isAdminPlus(role);
}

export function canValidateVisit(row: VisitLifecycleRow, role: ActorRole): boolean {
  if (row.status !== "performed" && row.status !== "report_pending") return false;
  return role === "confirmer" || isManagerPlus(role);
}

export function canCancelVisit(row: VisitLifecycleRow, role: ActorRole): boolean {
  if (TERMINAL_STATUSES.has(row.status)) return false;
  if (row.status === "validated") return false;
  return role === "confirmer" || isManagerPlus(role);
}

/**
 * Remettre la visite « à faire » après une erreur : repasse en planifié / à planifier
 * et efface les marqueurs terrain (démarrage, fin, date effectuée).
 * Déverrouiller d’abord si la fiche est verrouillée.
 */
export function canReopenVisitForFieldwork(row: VisitLifecycleRow, role: ActorRole): boolean {
  if (row.locked_at) return false;
  if (row.status !== "performed" && row.status !== "report_pending") return false;
  return role === "confirmer" || isManagerPlus(role);
}

export type VisitPermissions = {
  edit: boolean;
  start: boolean;
  complete: boolean;
  lock: boolean;
  unlock: boolean;
  validate: boolean;
  cancel: boolean;
  reopenFieldwork: boolean;
};

export function computeVisitPermissions(
  row: VisitLifecycleRow,
  role: ActorRole,
): VisitPermissions {
  return {
    edit: canEditVisit(row, role),
    start: canStartVisit(row, role),
    complete: canCompleteVisit(row, role),
    lock: canLockVisit(row, role),
    unlock: canUnlockVisit(row, role),
    validate: canValidateVisit(row, role),
    cancel: canCancelVisit(row, role),
    reopenFieldwork: canReopenVisitForFieldwork(row, role),
  };
}

/** Maps `roleCodes` from AccessContext to the highest applicable ActorRole. */
export function resolveActorRole(roleCodes: readonly string[]): ActorRole {
  if (roleCodes.includes("super_admin")) return "super_admin";
  if (roleCodes.includes("admin")) return "admin";
  if (roleCodes.includes("manager")) return "manager";
  if (roleCodes.includes("confirmer")) return "confirmer";
  if (roleCodes.includes("technician")) return "technician";
  return "technician";
}
