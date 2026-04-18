/** File métier utilisée par le dispatch (étape 14) — pas de fallback sur d’autres statuts. */
export type LeadGenerationDispatchSelectedQueueStatus = "ready_now";

/** Résultat de `dispatchLeadGenerationStockForAgent`. */
export type DispatchLeadGenerationStockResult = {
  agentId: string;
  previousStock: number;
  /** Fiches visées pour ce tour (complément jusqu’à la cible de stock actif). */
  requestedCount: number;
  /** Fiches réellement attribuées (sous-corpus `ready_now` disponible). */
  assignedCount: number;
  /** Écart demande − attribué (manque de fiches éligibles). */
  remainingNeed: number;
  selectedQueueStatus: LeadGenerationDispatchSelectedQueueStatus;
  newStock: number;
  assignedStockIds: string[];
};

/** Résultat de `dispatchLeadGenerationStockForAgents` (un résultat par agent, ordre préservé). */
export type DispatchLeadGenerationStockForAgentsResult = {
  agents: DispatchLeadGenerationStockResult[];
};
