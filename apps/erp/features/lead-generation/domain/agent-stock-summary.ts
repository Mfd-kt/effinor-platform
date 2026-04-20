/** Synthèse monitoring des assignments lead generation pour un agent. */
export type AgentStockSummary = {
  agentId: string;
  totalAssigned: number;
  /** Stock neuf à traiter (pipeline `new` uniquement) — seule métrique utilisée pour plafond / réinjection. */
  totalActive: number;
  /** Assignations en cours avec pipeline « contacté / en action ». */
  totalContacted: number;
  /** Assignations avec relance planifiée (pipeline « à rappeler »). */
  totalFollowUp: number;
  totalConsumed: number;
  totalConverted: number;
  totalRejected: number;
};
