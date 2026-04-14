export const CEE_TEAM_ROLE_VALUES = [
  "agent",
  "confirmateur",
  "closer",
  "manager",
] as const;

export type CeeTeamRole = (typeof CEE_TEAM_ROLE_VALUES)[number];

export const CEE_WORKFLOW_STATUS_VALUES = [
  "draft",
  "simulation_done",
  "to_confirm",
  "qualified",
  "docs_prepared",
  "to_close",
  "agreement_sent",
  "agreement_signed",
  "quote_pending",
  "quote_sent",
  "quote_signed",
  "technical_visit_pending",
  "technical_visit_done",
  "installation_pending",
  "cee_deposit_pending",
  "cee_deposited",
  "paid",
  "lost",
] as const;

export type CeeWorkflowStatus = (typeof CEE_WORKFLOW_STATUS_VALUES)[number];

export const DEFAULT_WORKFLOW_STATUS: CeeWorkflowStatus = "draft";

export const DEFAULT_DESTRAT_SIMULATOR_KEY = "destrat";
