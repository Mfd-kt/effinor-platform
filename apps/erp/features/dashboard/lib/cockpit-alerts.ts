/**
 * Point d’entrée alertes cockpit — logique métier dans `cockpit-alert-rules`.
 */
export {
  buildPeriodBusinessAlerts,
  buildStructuralBusinessAlerts,
  filterCockpitAlertsForVariant,
  sortCockpitAlerts,
  finalizeCockpitAlert,
} from "@/features/dashboard/lib/cockpit-alert-rules";
export type {
  PeriodAlertBuildContext,
  StructuralNetworkInput,
  ManagerCockpitScope,
} from "@/features/dashboard/lib/cockpit-alert-rules";
