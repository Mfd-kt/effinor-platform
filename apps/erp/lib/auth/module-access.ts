import type { AccessContext } from "./access-context";
import { isLeadGenerationQuantifier, isSalesAgent } from "./role-codes";
import {
  isCeeTeamManager,
} from "@/features/dashboard/queries/get-managed-teams-context";
import { canAccessCeeWorkflowsModule as canAccessCeeWorkflowsModuleByScope } from "./cee-workflows-scope";
import { hasFullCommercialDataAccess } from "./lead-scope";
import { PERM_ACCESS_INSTALLATIONS, PERM_ACCESS_TECHNICAL_VISITS } from "./permission-codes";
import {
  hasTableScopeModuleAccess,
  permScopeAllCode,
  permScopeCreatorCode,
  type TableScopeEntityKey,
} from "./table-scope";

/** Rôles internes : accès large aux modules hors matrice (catalogue, etc.). */
function legacyInternalFullPipeline(access: Extract<AccessContext, { kind: "authenticated" }>): boolean {
  const rc = access.roleCodes;
  if (rc.includes("super_admin")) {
    return true;
  }
  if (hasFullCommercialDataAccess(rc)) {
    return true;
  }
  return rc.includes("confirmer");
}

function legacyTechnicalVisitsModule(_access: Extract<AccessContext, { kind: "authenticated" }>): boolean {
  return true;
}

function hasAnyTableScopeModuleAccess(
  access: AccessContext,
  entities: readonly TableScopeEntityKey[],
  legacyFns: Partial<Record<TableScopeEntityKey, typeof legacyInternalFullPipeline>>,
): boolean {
  const legacy = legacyInternalFullPipeline;
  for (const entity of entities) {
    const perm =
      entity === "leads"
        ? ""
        : entity === "technical_visits"
          ? PERM_ACCESS_TECHNICAL_VISITS
          : PERM_ACCESS_INSTALLATIONS;
    const legacyFn = legacyFns[entity] ?? legacy;
    if (hasTableScopeModuleAccess(access, entity, perm, legacyFn)) {
      return true;
    }
  }
  return false;
}

/** Leads : matrice OU visites techniques (parcours lié). */
export function canAccessLeadsModule(access: AccessContext): boolean {
  return hasAnyTableScopeModuleAccess(access, ["leads", "technical_visits"], {});
}

/**
 * Lien « liste globale des leads » dans la barre latérale : direction / admin uniquement.
 * Les autres rôles accèdent aux fiches via leurs postes (agent, confirmateur, closer) ou URL directe autorisée par la matrice.
 */
export function canAccessLeadsDirectoryNav(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  const rc = access.roleCodes;
  return (
    rc.includes("super_admin") || rc.includes("admin") || rc.includes("sales_director")
  );
}

/**
 * Liste dédiée `/leads/lost` : direction commerciale / admin et managers d’équipe CEE actifs.
 * Les leads au statut `lost` sont exclus des autres listes opérationnelles.
 */
export async function canAccessLostLeadsInbox(access: AccessContext): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (canAccessLeadsDirectoryNav(access)) {
    return true;
  }
  return isCeeTeamManager(access.userId);
}

/** Visites techniques : matrice OU leads (parcours lié). */
export function canAccessTechnicalVisitsModule(access: AccessContext): boolean {
  return hasAnyTableScopeModuleAccess(
    access,
    ["technical_visits", "leads"],
    { technical_visits: legacyTechnicalVisitsModule },
  );
}

/**
 * Agent commercial et quantificateur lead gen : pas de bloc sidebar « Terrain & suivi »
 * (visites techniques + tâches), sauf s’ils ont aussi un rôle élargi (admin, direction, terrain, etc.).
 */
export function shouldHideTerrainSuiviSidebar(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  const rc = access.roleCodes;
  if (!isSalesAgent(rc) && !isLeadGenerationQuantifier(rc)) {
    return false;
  }
  if (
    rc.includes("super_admin") ||
    rc.includes("admin") ||
    rc.includes("sales_director") ||
    rc.includes("technician") ||
    rc.includes("closer") ||
    rc.includes("confirmer")
  ) {
    return false;
  }
  return true;
}

/**
 * Liste / fiches `/technical-visits` : droits matière visites OU pilotage commercial,
 * ou manager d’équipe CEE (périmètre workflows des fiches gérées).
 */
export async function canAccessTechnicalVisitsDirectoryNav(access: AccessContext): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (shouldHideTerrainSuiviSidebar(access)) {
    return false;
  }
  if (canAccessTechnicalVisitsModule(access)) {
    return true;
  }
  const rc = access.roleCodes;
  if (
    rc.includes("super_admin") ||
    rc.includes("admin") ||
    rc.includes("closer") ||
    rc.includes("sales_director")
  ) {
    return true;
  }
  if (rc.includes("technician")) {
    return true;
  }
  return isCeeTeamManager(access.userId);
}

/** Installations : matrice, rôles internes, ou technicien terrain (liste filtrée par assignation). */
export function canAccessInstallationsModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (access.roleCodes.includes("technician")) {
    return true;
  }
  return hasTableScopeModuleAccess(
    access,
    "installations",
    PERM_ACCESS_INSTALLATIONS,
    legacyInternalFullPipeline,
  );
}

export function canAccessDocumentsModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  return legacyInternalFullPipeline(access);
}

export function canAccessCeeWorkflowsModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  return canAccessCeeWorkflowsModuleByScope(access);
}

export function canAccessConfirmateurWorkspace(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (!canAccessCeeWorkflowsModuleByScope(access)) {
    return false;
  }
  return (
    access.roleCodes.includes("super_admin") ||
    access.roleCodes.includes("admin") ||
    access.roleCodes.includes("sales_director") ||
    access.roleCodes.includes("confirmer")
  );
}

export function canAccessCloserWorkspace(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (!canAccessCeeWorkflowsModuleByScope(access)) {
    return false;
  }
  return (
    access.roleCodes.includes("super_admin") ||
    access.roleCodes.includes("admin") ||
    access.roleCodes.includes("sales_director") ||
    access.roleCodes.includes("closer")
  );
}

export function canAccessAdminCeeSheets(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  return (
    access.roleCodes.includes("super_admin") ||
    access.roleCodes.includes("admin") ||
    access.roleCodes.includes("sales_director")
  );
}

/**
 * Pilotage lead generation (pages / actions hors file « Mes fiches ») :
 * même périmètre que les fiches CEE admin, ou manager d’équipe CEE actif.
 */
export async function canAccessLeadGenerationHub(access: AccessContext): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (canAccessAdminCeeSheets(access)) {
    return true;
  }
  return isCeeTeamManager(access.userId);
}

/** Dashboard direction / pilotage des quantificateurs (même périmètre que {@link canAccessLeadGenerationHub}). */
export async function canAccessLeadGenerationManagementDashboard(access: AccessContext): Promise<boolean> {
  return canAccessLeadGenerationHub(access);
}

/**
 * Impersonation (super_admin → commercial) : le compte réel peut ouvrir la file / une fiche
 * même si le sujet n’a pas le rôle `sales_agent` (support).
 */
export function canBypassLeadGenMyQueueAsImpersonationActor(access: AccessContext): boolean {
  if (access.kind !== "authenticated" || !access.impersonation) {
    return false;
  }
  const ar = access.actorRoleCodes;
  return ar.includes("super_admin") || ar.includes("admin") || ar.includes("sales_director");
}

/**
 * File opérationnelle « Mes fiches » (lead generation) : agents commerciaux + accès back-office déjà autorisés ailleurs.
 */
export function canAccessLeadGenerationMyQueue(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (canAccessAdminCeeSheets(access)) {
    return true;
  }
  if (access.roleCodes.includes("sales_agent")) {
    return true;
  }
  if (canBypassLeadGenMyQueueAsImpersonationActor(access)) {
    return true;
  }
  return false;
}

/**
 * File « Quantification » : validation terrain des fiches (hors pilotage complet, hors closing).
 */
export function canAccessLeadGenerationQuantification(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  return access.roleCodes.includes("lead_generation_quantifier");
}

/**
 * Lien sidebar « Ma file » : jamais si l’utilisateur a accès à la quantification (même avec `sales_agent` en plus).
 * Sinon : `sales_agent`, ou support en impersonation. L’accès route reste {@link canAccessLeadGenerationMyQueue}.
 */
export function shouldShowLeadGenerationMyQueueNav(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (canAccessLeadGenerationQuantification(access)) {
    return false;
  }
  if (canBypassLeadGenMyQueueAsImpersonationActor(access)) {
    return true;
  }
  return access.roleCodes.includes("sales_agent");
}

/** Liste des imports : lots créés par le quantificateur (sans pilotage complet). */
export function canAccessLeadGenerationQuantifierImports(access: AccessContext): boolean {
  return canAccessLeadGenerationQuantification(access);
}

/** Centre de commande direction : super_admin et directeur commercial uniquement. */
export function canAccessCommandCockpit(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  const rc = access.roleCodes;
  return rc.includes("super_admin") || rc.includes("sales_director");
}

/**
 * Accès à la route `/cockpit` : direction (voir `canAccessCommandCockpit`) ou manager d’équipe CEE actif.
 * Les managers voient une variante « manager » du bundle (périmètre équipes), sans doublon `/manager`.
 */
export async function canAccessCockpitRoute(access: AccessContext): Promise<boolean> {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (canAccessCommandCockpit(access)) {
    return true;
  }
  return isCeeTeamManager(access.userId);
}

export function canAccessExistingHeatingModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  return legacyInternalFullPipeline(access);
}

export function canAccessInstalledProductsModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  return legacyInternalFullPipeline(access);
}

export function canAccessTechnicalStudiesModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  return legacyInternalFullPipeline(access);
}

export function canAccessQuotesModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  return legacyInternalFullPipeline(access);
}

export function canAccessProductsModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  return legacyInternalFullPipeline(access);
}

export function canAccessDelegatorsModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  return legacyInternalFullPipeline(access);
}

export function canAccessBeneficiariesModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (legacyInternalFullPipeline(access) || canAccessLeadsModule(access)) {
    return true;
  }
  const pc = new Set(access.permissionCodes);
  return (
    pc.has(permScopeAllCode("beneficiaries")) || pc.has(permScopeCreatorCode("beneficiaries"))
  );
}

export function canAccessOperationsModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  return legacyInternalFullPipeline(access) || canAccessLeadsModule(access);
}

export function canAccessOperationSitesModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  return legacyInternalFullPipeline(access) || canAccessLeadsModule(access);
}

export function canAccessInvoicesModule(access: AccessContext): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  return legacyInternalFullPipeline(access);
}
