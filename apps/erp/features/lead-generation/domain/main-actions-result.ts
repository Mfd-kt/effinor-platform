/** Retours des 3 actions principales (UI : pas d’UUID). */

export type GenerateAndEnrichLeadsResult = {
  total_imported: number;
  total_accepted: number;
  total_enriched: number;
  /** Indique si un nouveau run Apify a bien été démarré. */
  apify_run_started: boolean;
  /** Lots synchronisés pendant cette exécution. */
  sync_batches_scanned: number;
  /** Court message utilisateur si le démarrage Apify a échoué (sync / enrich peuvent quand même avoir tourné). */
  apify_notice?: string;
  /** Lot d’import Google Maps (aligné sur le parcours unifié). */
  coordinator_batch_id?: string;
  /** Champ historique (compat.) — l’enrichissement LinkedIn automatisé n’est plus proposé ; rester à 0. */
  linkedin_stocks_updated?: number;
  /** Avertissements Apify / annuaire (non bloquants). */
  ingest_warnings?: string[];
};

export type PrepareLeadsResult = {
  total_scored: number;
  total_ready_now: number;
  total_enrich_needed: number;
  /** Fiches effectivement classées dans la file (succès). */
  dispatch_evaluated: number;
  /** Compléments email / site réussis avant l’analyse des priorités. */
  improvement_succeeded: number;
  /** Fiches ciblées pour complément contacts (traitées ou tentées). */
  improvement_attempted: number;
};

export type AutoDispatchLeadsResult = {
  total_assigned: number;
  distribution_par_agent: Record<string, number>;
  remaining_leads: number;
  agents_considered: number;
  /** Présent si distribution « jusqu’à épuisement » (plusieurs passes). */
  rounds?: number;
};

/** Création cockpit simplifiée : import Google Maps sur le lot (sans enrich rapide). */
export type SimpleCreateLeadsMapsResult = {
  acceptedCount: number;
  coordinatorBatchId: string;
  mapsBatchId: string;
};

/** Distribution automatique — flux premium uniquement (noms d’agents, pas d’UUID). */
export type PremiumAutoDispatchLeadsResult = {
  totalAssigned: number;
  distributionByAgent: Record<string, number>;
  remainingPremiumLeads: number;
  agentsConsidered: number;
};
