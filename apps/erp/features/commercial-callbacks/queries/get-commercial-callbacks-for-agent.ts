import { createClient } from "@/lib/supabase/server";

import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";
import type { AccessContext } from "@/lib/auth/access-context";
import { hasFullCeeWorkflowAccess } from "@/lib/auth/cee-workflows-scope";

export type {
  CallbackPerformanceStats,
  CommercialCallbackKpis,
} from "@/features/commercial-callbacks/lib/commercial-callback-metrics";
export {
  computeCallbackPerformanceStats,
  computeCommercialCallbackKpis,
  filterCommercialCallbacks,
} from "@/features/commercial-callbacks/lib/commercial-callback-metrics";
export type { CallbackListFilter } from "@/features/commercial-callbacks/domain/callback-dates";

/**
 * Poste agent : uniquement les rappels où l’utilisateur est assigné ou créateur.
 * Les profils « direction » (sales_director, admin…) voient la vue équipe sur `/commercial-callbacks` ;
 * ici on limite l’onglet Agent à leur propre file.
 */
export async function fetchCommercialCallbacksForAgentWorkstation(
  access: AccessContext,
): Promise<CommercialCallbackRow[]> {
  if (access.kind !== "authenticated") {
    return [];
  }
  const supabase = await createClient();
  let q = supabase
    .from("commercial_callbacks")
    .select("*")
    .is("deleted_at", null)
    .order("callback_date", { ascending: true })
    .order("callback_time", { ascending: true, nullsFirst: false });

  if (hasFullCeeWorkflowAccess(access)) {
    q = q.or(
      `assigned_agent_user_id.eq.${access.userId},created_by_user_id.eq.${access.userId}`,
    );
  }

  const { data, error } = await q;

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as CommercialCallbackRow[];
}

/** Tous les rappels visibles (RLS) — à utiliser pour la vue direction après contrôle d’accès applicatif. */
export async function fetchCommercialCallbacksAllVisible(): Promise<CommercialCallbackRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commercial_callbacks")
    .select("*")
    .is("deleted_at", null)
    .order("callback_date", { ascending: true })
    .order("callback_time", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as CommercialCallbackRow[];
}

export async function fetchProfileDisplayNamesByIds(
  userIds: string[],
): Promise<Record<string, string>> {
  const uniq = [...new Set(userIds.filter(Boolean))];
  if (uniq.length === 0) {
    return {};
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", uniq);

  if (error) {
    throw new Error(error.message);
  }

  const map: Record<string, string> = {};
  for (const p of data ?? []) {
    const label = p.full_name?.trim() || p.email?.trim() || "Utilisateur";
    map[p.id] = label;
  }
  return map;
}
