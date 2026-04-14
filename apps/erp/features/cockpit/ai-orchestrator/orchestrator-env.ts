import { z } from "zod";

const uuid = z.string().uuid();

export function isAiAutonomousModeEnabled(): boolean {
  const v = process.env.AI_AUTONOMOUS_MODE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function getAiOrchestratorActorUserId(): string | null {
  const raw = process.env.AI_ORCHESTRATOR_ACTOR_USER_ID?.trim();
  if (!raw) return null;
  const p = uuid.safeParse(raw);
  return p.success ? p.data : null;
}

/** Utilisateurs direction à notifier (Slack complément + in-app). CSV d’UUID. */
export function getAiOrchestrationNotifyUserIds(): string[] {
  const raw = process.env.AI_ORCHESTRATION_NOTIFY_USER_IDS?.trim();
  if (!raw) return [];
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const zr = uuid.safeParse(p);
    if (zr.success) out.push(zr.data);
  }
  return out;
}

export const AI_ORCHESTRATOR_TRIGGER_SOURCE = "ai_orchestrator" as const;
