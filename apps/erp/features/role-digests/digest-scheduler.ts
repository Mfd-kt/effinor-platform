import { isCeeTeamManager } from "@/features/dashboard/queries/get-managed-teams-context";
import type { AccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

import { buildAgentDigest } from "./build-agent-digest";
import { buildCloserDigest } from "./build-closer-digest";
import { buildConfirmateurDigest } from "./build-confirmateur-digest";
import { buildDirectionDigest } from "./build-direction-digest";
import { buildManagerDigest } from "./build-manager-digest";
import { buildDigestDedupeKey, shouldGenerateDigest, shouldSuppressDigestAsDuplicate } from "./digest-delivery-rules";
import { parisYmd, resolvePrimaryDigestRole } from "./digest-helpers";
import { logDigestSuppressedDuplicate, persistRoleDigest } from "./digest-logging";
import type { RoleDigest, RoleDigestComputeResult } from "./digest-types";
import { loadRoleDigestData } from "./load-role-digest-data";

export async function computeRoleDigestForAccess(
  access: AccessContext,
  options?: { persist?: boolean; now?: Date },
): Promise<RoleDigestComputeResult> {
  const now = options?.now ?? new Date();
  if (access.kind !== "authenticated") {
    return { digest: null, skipReason: "no_role", persisted: false };
  }

  const isMgr = await isCeeTeamManager(access.userId);
  const role = resolvePrimaryDigestRole(access, isMgr);
  if (!role) {
    return { digest: null, skipReason: "no_role", persisted: false };
  }

  const snapshot = await loadRoleDigestData(access, role, now);
  if (!snapshot) {
    return { digest: null, skipReason: "error", persisted: false };
  }

  let digest: RoleDigest | null = null;
  switch (role) {
    case "agent":
      digest = buildAgentDigest(snapshot);
      break;
    case "confirmateur":
      digest = buildConfirmateurDigest(snapshot);
      break;
    case "closer":
      digest = buildCloserDigest(snapshot);
      break;
    case "manager":
      digest = await buildManagerDigest(snapshot);
      break;
    case "direction":
      digest = buildDirectionDigest(snapshot);
      break;
    default:
      digest = null;
  }

  if (!shouldGenerateDigest(digest)) {
    return { digest: null, skipReason: "empty", persisted: false };
  }

  const dedupeKey = buildDigestDedupeKey(digest!, parisYmd(now));
  const supabase = await createClient();
  const dup = await shouldSuppressDigestAsDuplicate(supabase, access.userId, role, dedupeKey, now);

  if (dup) {
    await logDigestSuppressedDuplicate(supabase, access.userId, {
      role_target: role,
      dedupe_key: dedupeKey,
    });
    return {
      digest: digest!,
      displayDigest: digest!,
      skipReason: "duplicate_suppressed",
      persisted: false,
      dedupeKey,
    };
  }

  const persist = options?.persist !== false;
  if (persist) {
    const row = await persistRoleDigest(supabase, digest!, dedupeKey);
    if (!row) {
      return { digest: digest!, persisted: false, dedupeKey };
    }
    return { digest: digest!, persisted: true, dedupeKey };
  }

  return { digest: digest!, persisted: false, dedupeKey };
}
