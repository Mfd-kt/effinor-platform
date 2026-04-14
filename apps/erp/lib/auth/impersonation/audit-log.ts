import { createAdminClient } from "@/lib/supabase/admin";

export async function insertImpersonationAuditStarted(input: {
  actorUserId: string;
  impersonatedUserId: string;
  startedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("impersonation_audit_events").insert({
    event: "impersonation_started",
    actor_user_id: input.actorUserId,
    impersonated_user_id: input.impersonatedUserId,
    started_at: input.startedAt,
    ip_address: input.ipAddress,
    user_agent: input.userAgent,
  });
  if (error) {
    console.error("[impersonation audit] start", error);
  }
}

export async function insertImpersonationAuditStopped(input: {
  actorUserId: string;
  impersonatedUserId: string;
  endedAt: string;
  startedAtMs: number;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<void> {
  const durationSeconds = Math.max(
    0,
    Math.floor((Date.parse(input.endedAt) - input.startedAtMs) / 1000),
  );
  const admin = createAdminClient();
  const { error } = await admin.from("impersonation_audit_events").insert({
    event: "impersonation_stopped",
    actor_user_id: input.actorUserId,
    impersonated_user_id: input.impersonatedUserId,
    ended_at: input.endedAt,
    started_at: new Date(input.startedAtMs).toISOString(),
    duration_seconds: durationSeconds,
    ip_address: input.ipAddress,
    user_agent: input.userAgent,
  });
  if (error) {
    console.error("[impersonation audit] stop", error);
  }
}
