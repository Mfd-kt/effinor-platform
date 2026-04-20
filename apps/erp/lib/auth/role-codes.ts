export const APP_ROLE_CODES = [
  "super_admin",
  "admin",
  "sales_agent",
  "confirmer",
  "closer",
  "sales_director",
  "technician",
  "lead_generation_quantifier",
] as const;

export type AppRoleCode = (typeof APP_ROLE_CODES)[number];

/** Libellés FR alignés sur `public.roles.label_fr` (affichage UI). */
export const ROLE_LABEL_FR: Record<AppRoleCode, string> = {
  super_admin: "Super administrateur",
  admin: "Administrateur",
  sales_agent: "Agent commercial",
  confirmer: "Confirmateur",
  closer: "Closer",
  sales_director: "Directeur commercial",
  technician: "Technicien",
  lead_generation_quantifier: "Quantificateur lead gen",
};

const SET = new Set<string>(APP_ROLE_CODES);

export function isAppRoleCode(code: string): code is AppRoleCode {
  return SET.has(code);
}

export function hasRole(codes: readonly string[], ...roles: string[]): boolean {
  return roles.some((r) => codes.includes(r));
}

export function isSuperAdmin(codes: readonly string[]): boolean {
  return codes.includes("super_admin");
}

export function isSalesAgent(codes: readonly string[]): boolean {
  return codes.includes("sales_agent");
}

export function isConfirmer(codes: readonly string[]): boolean {
  return codes.includes("confirmer");
}

export function isCloser(codes: readonly string[]): boolean {
  return codes.includes("closer");
}

export function isSalesDirector(codes: readonly string[]): boolean {
  return codes.includes("sales_director");
}

export function isTechnician(codes: readonly string[]): boolean {
  return codes.includes("technician");
}

export function isLeadGenerationQuantifier(codes: readonly string[]): boolean {
  return codes.includes("lead_generation_quantifier");
}
