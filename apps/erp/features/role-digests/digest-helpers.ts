import { randomUUID } from "crypto";

import { calendarDateInParis } from "@/features/commercial-callbacks/domain/callback-dates";
import type { AccessContext } from "@/lib/auth/access-context";
import {
  canAccessCloserWorkspace,
  canAccessCommandCockpit,
  canAccessConfirmateurWorkspace,
} from "@/lib/auth/module-access";

import type { RoleDigest, RoleDigestPriority, RoleDigestTarget } from "./digest-types";

/** Empreinte stable courte pour dédup (pas cryptographique). */
export function digestFingerprint(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h, 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function parisYmd(now: Date): string {
  return calendarDateInParis(now);
}

export function newDigestId(): string {
  return randomUUID();
}

export function formatEur(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export function maxPriority(a: RoleDigestPriority, b: RoleDigestPriority): RoleDigestPriority {
  const order: RoleDigestPriority[] = ["low", "normal", "high", "critical"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))] ?? "normal";
}

export function digestOverallPriority(d: RoleDigest): RoleDigestPriority {
  let p: RoleDigestPriority = d.priority;
  for (const a of d.actionItems) {
    p = maxPriority(p, a.priority);
  }
  return p;
}

export function stableDedupePayload(d: RoleDigest): string {
  const sec = d.sections
    .map((s) => `${s.key}:${s.items.slice(0, 8).join("¦")}`)
    .sort()
    .join("|");
  const act = d.actionItems
    .map((a) => a.id)
    .sort()
    .join(",");
  return `${d.roleTarget}|${sec}|${act}|${d.summary.slice(0, 120)}`;
}

/** Résout le rôle digest principal (un seul par session). */
export function resolvePrimaryDigestRole(access: AccessContext, isManager: boolean): RoleDigestTarget | null {
  if (access.kind !== "authenticated") return null;
  const rc = access.roleCodes;
  if (canAccessCommandCockpit(access)) return "direction";
  if (isManager) return "manager";
  if (rc.includes("closer") && canAccessCloserWorkspace(access)) return "closer";
  if (rc.includes("confirmer") && canAccessConfirmateurWorkspace(access)) return "confirmateur";
  if (rc.includes("sales_agent")) return "agent";
  if (canAccessConfirmateurWorkspace(access)) return "confirmateur";
  if (canAccessCloserWorkspace(access)) return "closer";
  return "agent";
}
