export type { AccessContext, ImpersonationState } from "./access-context";
export {
  getAccessContext,
  getAccessContextWithImpersonation,
  getCurrentUserProfileWithRoles,
} from "./access-context";
export {
  canAccessTechnicalVisitByLeadId,
  canAccessTechnicalVisitDetail,
  getLeadIdsForAccess,
  resolveLeadIdsForScope,
  shouldRestrictTechnicalVisitsToCreator,
  shouldRestrictTechnicalVisitsToCreatorOnly,
} from "./data-scope";
export { resolveDashboardVariant, type DashboardVariant } from "./dashboard-variant";
export { hasFullCommercialDataAccess, getLeadScopeForAccess, canAccessLeadRow, type LeadScope } from "./lead-scope";
export {
  canAccessDelegatorsModule,
  canAccessDocumentsModule,
  canAccessExistingHeatingModule,
  canAccessInstalledProductsModule,
  canAccessInstallationsModule,
  canAccessInvoicesModule,
  canAccessLeadsDirectoryNav,
  canAccessLeadsModule,
  canAccessLostLeadsInbox,
  canAccessProductsModule,
  canAccessQuotesModule,
  canAccessTechnicalStudiesModule,
  canAccessTechnicalVisitsDirectoryNav,
  canAccessTechnicalVisitsModule,
} from "./module-access";
export { canAccessInstallationsPage } from "./installations-access";
export {
  PERM_ACCESS_INSTALLATIONS,
  PERM_ACCESS_TECHNICAL_VISITS,
  PERM_LEADS_SCOPE_ALL,
  PERM_LEADS_SCOPE_CREATOR,
  PERM_LEADS_SCOPE_CREATOR_AGENT,
  PERM_TECH_VISITS_CREATOR_ONLY,
  PERM_TECH_VISITS_SCOPE_ALL,
  PERM_TECH_VISITS_SCOPE_CREATOR,
  type AppPermissionCode,
} from "./permission-codes";
export {
  TABLE_SCOPE_ENTITY_KEYS,
  hasTableScopeModuleAccess,
  permScopeAllCode,
  permScopeCreatorCode,
  type TableScopeEntityKey,
} from "./table-scope";
export { hasPermission, hasPermissionOrLegacy } from "./permission-resolve";
export { buildAllowedNavHrefs } from "./navigation";
export { requireSuperAdmin, requireUsersSettingsAccess } from "./guards";
export { canDeleteLead, canReassignLeadCreator } from "./lead-permissions";
export {
  APP_ROLE_CODES,
  hasRole,
  isAppRoleCode,
  isCloser,
  isConfirmer,
  isSalesAgent,
  isSalesDirector,
  isSuperAdmin,
  isTechnician,
  type AppRoleCode,
} from "./role-codes";
