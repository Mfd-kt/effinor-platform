import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { DashboardAlert } from "../../shared/types";

const ACTIVE_LGA_STATUSES = ["assigned", "opened", "in_progress"] as const;

/**
 * Signaux opérationnels réels (inactivité file LGC, etc.).
 * Pas de plafond téléphones codé en dur : à brancher quand un quota LBC existera en base.
 */
export async function getAdminAlerts(): Promise<DashboardAlert[]> {
  const supabase = await createClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();

  const [staleWithActivity, neverTouched, stockLowPhone] = await Promise.all([
    supabase
      .from("lead_generation_assignments")
      .select("id", { count: "exact", head: true })
      .in("assignment_status", [...ACTIVE_LGA_STATUSES])
      .not("last_activity_at", "is", null)
      .lt("last_activity_at", weekAgo),
    supabase
      .from("lead_generation_assignments")
      .select("id", { count: "exact", head: true })
      .in("assignment_status", [...ACTIVE_LGA_STATUSES])
      .is("last_activity_at", null),
    supabase
      .from("lead_generation_stock")
      .select("id", { count: "exact", head: true })
      .eq("phone_status", "missing")
      .in("stock_status", ["new", "ready", "assigned", "in_progress"]),
  ]);

  if (staleWithActivity.error) throw new Error(staleWithActivity.error.message);
  if (neverTouched.error) throw new Error(neverTouched.error.message);
  if (stockLowPhone.error) throw new Error(stockLowPhone.error.message);

  const idleAssignments = (staleWithActivity.count ?? 0) + (neverTouched.count ?? 0);
  const alerts: DashboardAlert[] = [];

  if (idleAssignments > 0) {
    alerts.push({
      id: "lga-idle-7d",
      severity: "info",
      title: `${idleAssignments} assignation(s) sans activité ou avec silence > 7 j`,
      description: "Fiches LGC en cours côté agents : pas d’appel enregistré sur la période.",
      href: "/lead-generation/management",
      ctaLabel: "File d’attente",
    });
  }

  if ((stockLowPhone.count ?? 0) > 0) {
    alerts.push({
      id: "stock-missing-phone",
      severity: "warning",
      title: `${(stockLowPhone.count ?? 0).toLocaleString("fr-FR")} fiche(s) stock sans numéro`,
      description: "Ces fiches ne sont pas joignables tant que le téléphone n’est pas complété ou enrichi.",
      href: "/lead-generation/stock",
      ctaLabel: "Voir le stock",
    });
  }

  return alerts;
}
