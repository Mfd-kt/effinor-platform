import { createAdminClient } from "@/lib/supabase/admin";

import { detectSlaBreaches } from "./detect-sla-breaches";
import { isInternalSlaEnabled } from "./sla-env";

export type RunInternalSlaEngineResult = {
  skipped: boolean;
  skipReason?: string;
  checked: number;
  created: number;
  warning: number;
  breached: number;
  critical: number;
  resolved: number;
  escalated: number;
  durationMs: number;
};

export async function runInternalSlaEngine(): Promise<RunInternalSlaEngineResult> {
  const t0 = Date.now();
  if (!isInternalSlaEnabled()) {
    return {
      skipped: true,
      skipReason: "AI_INTERNAL_SLA_ENABLED est désactivé.",
      checked: 0,
      created: 0,
      warning: 0,
      breached: 0,
      critical: 0,
      resolved: 0,
      escalated: 0,
      durationMs: Date.now() - t0,
    };
  }

  const admin = createAdminClient();
  const now = new Date();
  const r = await detectSlaBreaches(admin, now);
  return {
    skipped: false,
    checked: r.checked,
    created: r.created,
    warning: r.warning,
    breached: r.breached,
    critical: r.critical,
    resolved: r.resolved,
    escalated: r.escalated,
    durationMs: Date.now() - t0,
  };
}
