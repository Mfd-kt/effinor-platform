/**
 * Seuils métier cockpit — ajuster ici pour la production.
 * Regroupés par domaine pour lisibilité.
 */

export const COCKPIT_ALERT_THRESHOLDS = {
  backlog: {
    /** Stock global à confirmer (simulation_done + to_confirm) — warning */
    pendingGlobalWarning: 15,
    pendingGlobalCritical: 30,
    /** Stock par fiche CEE */
    pendingPerSheetWarning: 8,
    pendingPerSheetCritical: 15,
    /** Stock par équipe */
    pendingPerTeamWarning: 10,
    pendingPerTeamCritical: 20,
    /** Jours sans mise à jour sur un dossier à confirmer / simulé en attente */
    confirmStaleDaysWarning: 3,
    confirmStaleDaysCritical: 5,
  },
  docs: {
    /** Docs préparés (docs_prepared) sans transmission — jours */
    docsPreparedStaleDaysWarning: 2,
    docsPreparedStaleDaysCritical: 4,
    /** Nombre de dossiers docs_prepared considérés comme stock élevé */
    docsPreparedBacklogWarning: 10,
    docsPreparedBacklogCritical: 20,
  },
  closer: {
    agreementSentStaleDaysWarning: 3,
    agreementSentStaleDaysCritical: 7,
    /** Accords « envoyés » (statut) encore ouverts sur la période */
    agreementSentStockWarning: 12,
    agreementSentStockCritical: 25,
    /** Relances (next_follow_up_at dépassé) — nombre */
    followUpsOverdueWarning: 5,
    followUpsOverdueCritical: 12,
  },
  conversion: {
    /** Taux signés / (signés + encore envoyés) sur la période — par roll-up */
    signRateWarning: 0.15,
    signRateCritical: 0.08,
    minWorkflowsForSignRate: 8,
  },
  loss: {
    lossRateWarning: 0.35,
    lossRateCritical: 0.5,
    minWorkflowsForLossRate: 20,
    /** Hausse du taux de perte vs période précédente (points) */
    lossRateJumpWarning: 0.12,
    lossRateJumpCritical: 0.2,
  },
  activity: {
    /** Baisse des leads créés vs période précédente */
    leadsDropWarningPct: 25,
    leadsDropCriticalPct: 45,
    minLeadsPreviousForDrop: 5,
    /** Volume absolu trop faible (période courante) */
    leadsAbsoluteLowWarning: 3,
    leadsAbsoluteLowCritical: 1,
    minPeriodDaysForAbsoluteLow: 7,
    /** Baisse du volume « post-simulation » (hors brouillon) */
    pipelineDropWarningPct: 30,
    pipelineDropCriticalPct: 50,
    minPipelinePrevious: 8,
  },
  channel: {
    /** Chute du volume leads / workflows par canal vs période précédente */
    volumeDropWarningPct: 40,
    volumeDropCriticalPct: 60,
    minChannelWorkflowsPrev: 5,
  },
  draft: {
    staleDraftDays: 10,
  },
  staffing: {
    /** Équipe sans manager (alerte info / warning selon politique) */
    warnTeamWithoutManager: true,
  },
} as const;

export type CockpitAlertThresholds = typeof COCKPIT_ALERT_THRESHOLDS;
