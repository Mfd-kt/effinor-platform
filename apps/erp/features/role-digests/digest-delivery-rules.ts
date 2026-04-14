import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import { digestFingerprint, stableDedupePayload } from "./digest-helpers";
import type { RoleDigest, RoleDigestTarget } from "./digest-types";

const DUPLICATE_WINDOW_MS = 4 * 3_600_000;

/** Contenu utile : sections non vides ou actions concrètes. */
export function shouldGenerateDigest(d: RoleDigest | null): boolean {
  if (!d) return false;
  const hasSections = d.sections.some((s) => s.items.some((x) => x.trim().length > 0));
  const hasActions = d.actionItems.length > 0;
  if (!hasSections && !hasActions) return false;
  if (!hasActions && d.summary.trim().length < 12) return false;
  return true;
}

export function buildDigestDedupeKey(d: RoleDigest, parisDay: string): string {
  const fp = digestFingerprint(stableDedupePayload(d));
  return `${d.roleTarget}:${d.targetUserId ?? "none"}:${parisDay}:${fp}`;
}

export async function shouldSuppressDigestAsDuplicate(
  supabase: SupabaseClient<Database>,
  targetUserId: string,
  roleTarget: RoleDigestTarget,
  dedupeKey: string,
  now: Date,
): Promise<boolean> {
  const since = new Date(now.getTime() - DUPLICATE_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from("role_digests")
    .select("id")
    .eq("target_user_id", targetUserId)
    .eq("role_target", roleTarget)
    .eq("dedupe_key", dedupeKey)
    .gte("generated_at", since)
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}
