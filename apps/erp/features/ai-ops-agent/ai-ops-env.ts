export function isAiOpsAgentEnabled(): boolean {
  const v = process.env.AI_OPS_AGENT_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function isAiOpsAgentAutonomousMode(): boolean {
  const v = process.env.AI_OPS_AGENT_AUTONOMOUS_MODE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function isAiOpsAgentSlackEnabled(): boolean {
  const v = process.env.AI_OPS_AGENT_SLACK_ENABLED?.trim().toLowerCase();
  if (!v) return true;
  return v === "1" || v === "true" || v === "yes";
}

export function isAiOpsAgentDirectionEscalationEnabled(): boolean {
  const v = process.env.AI_OPS_AGENT_DIRECTION_ESCALATION_ENABLED?.trim().toLowerCase();
  if (!v) return true;
  return v === "1" || v === "true" || v === "yes";
}

/** Limite de nouveaux messages agent par tick (anti-spam). */
export function aiOpsMaxMessagesPerTick(): number {
  const n = Number.parseInt(process.env.AI_OPS_AGENT_MAX_MESSAGES_PER_TICK ?? "40", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 200) : 40;
}

/** Conversations « actives » max par utilisateur (open / awaiting_user / escalated / snoozed). */
export function aiOpsMaxOpenConversationsPerUser(): number {
  const n = Number.parseInt(process.env.AI_OPS_MAX_OPEN_CONVERSATIONS_PER_USER ?? "25", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 80) : 25;
}

/** Messages IA max par utilisateur et par type d’issue sur une journée UTC. */
export function aiOpsMaxAiMessagesPerUserPerDayPerIssueType(): number {
  const n = Number.parseInt(process.env.AI_OPS_MAX_AI_MSG_PER_USER_DAY_TYPE ?? "8", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 8;
}
