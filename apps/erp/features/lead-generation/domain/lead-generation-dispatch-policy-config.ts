/**
 * Configuration métier singleton pour la politique d’injection lead_generation.
 * @see public.lead_generation_dispatch_policy_config — source de vérité partagée avec les RPC cockpit SQL.
 */
export type LeadGenerationDispatchPolicyConfig = {
  id: number;
  pipelineBacklogSuspendThreshold: number;
  slaBreachedSuspendThreshold: number;
  breachRatioPenaltyThreshold: number;
  breachRatioBonusThreshold: number;
  minPendingAssignmentsForBonus: number;
  capMultiplierPenalty: number;
  capMultiplierBonus: number;
  capBasePerCeeSheet: number;
  effectiveCapMin: number;
  effectiveCapMax: number;
  updatedAt: string;
  updatedBy: string | null;
};
