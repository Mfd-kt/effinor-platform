/**
 * Codes alignés sur `public.permissions` — uniquement la matrice à trois domaines
 * (voir `lib/constants/permission-matrix.ts`).
 */
export const PERM_LEADS_SCOPE_ALL = "perm.leads.scope_all" as const;
export const PERM_LEADS_SCOPE_CREATOR_AGENT = "perm.leads.scope_creator_agent" as const;
export const PERM_LEADS_SCOPE_CREATOR = "perm.leads.scope_creator" as const;

export const PERM_TECH_VISITS_CREATOR_ONLY = "perm.technical_visits.creator_only" as const;
export const PERM_TECH_VISITS_SCOPE_ALL = "perm.technical_visits.scope_all" as const;
export const PERM_TECH_VISITS_SCOPE_CREATOR = "perm.technical_visits.scope_creator" as const;

export const PERM_ACCESS_INSTALLATIONS = "perm.access.installations" as const;
export const PERM_ACCESS_TECHNICAL_VISITS = "perm.access.technical_visits" as const;
export const PERM_ACCESS_CEE_WORKFLOWS = "perm.access.cee_workflows" as const;
export const PERM_CEE_WORKFLOWS_SCOPE_ALL = "perm.cee_workflows.scope_all" as const;
export const PERM_CEE_WORKFLOWS_SCOPE_TEAM = "perm.cee_workflows.scope_team" as const;
export const PERM_CEE_WORKFLOWS_MANAGE_TEAMS = "perm.cee_workflows.manage_teams" as const;

export type AppPermissionCode =
  | typeof PERM_LEADS_SCOPE_ALL
  | typeof PERM_LEADS_SCOPE_CREATOR_AGENT
  | typeof PERM_LEADS_SCOPE_CREATOR
  | typeof PERM_TECH_VISITS_CREATOR_ONLY
  | typeof PERM_TECH_VISITS_SCOPE_ALL
  | typeof PERM_TECH_VISITS_SCOPE_CREATOR
  | typeof PERM_ACCESS_INSTALLATIONS
  | typeof PERM_ACCESS_TECHNICAL_VISITS
  | typeof PERM_ACCESS_CEE_WORKFLOWS
  | typeof PERM_CEE_WORKFLOWS_SCOPE_ALL
  | typeof PERM_CEE_WORKFLOWS_SCOPE_TEAM
  | typeof PERM_CEE_WORKFLOWS_MANAGE_TEAMS
  | "perm.installations.scope_all"
  | "perm.installations.scope_creator";
