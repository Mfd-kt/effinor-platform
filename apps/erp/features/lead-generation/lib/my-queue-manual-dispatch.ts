/** Lot par défaut pour le bouton « Récupérer des fiches » (Mes fiches à traiter). */
export const MY_QUEUE_MANUAL_CHUNK_DEFAULT = 20;

/**
 * Plafond de fiches actives (assignations en cours) par fiche CEE pour un agent.
 * Au-delà, plus d’attribution sur cette fiche jusqu’à traitement / libération.
 */
export const LEAD_GEN_MAX_ACTIVE_STOCK_PER_CEE_SHEET = 100;

/** @deprecated Utiliser {@link LEAD_GEN_MAX_ACTIVE_STOCK_PER_CEE_SHEET} — conservé pour imports existants. */
export const MY_QUEUE_MAX_ACTIVE_STOCK = LEAD_GEN_MAX_ACTIVE_STOCK_PER_CEE_SHEET;
