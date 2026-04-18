/** Synthèse monitoring des assignments lead generation pour un agent. */
export type AgentStockSummary = {
  agentId: string;
  totalAssigned: number;
  totalActive: number;
  totalConsumed: number;
  totalConverted: number;
  totalRejected: number;
};
