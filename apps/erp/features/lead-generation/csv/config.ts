/**
 * Import CSV manuel — constantes partagées.
 * Utilisé quand l'équipe achète une data list et veut l'injecter directement
 * dans `lead_generation_stock` sans passer par un scraper Apify.
 */

export const CSV_MANUAL_SOURCE_CODE = "csv_manual" as const;

/** Libellé affiché dans la liste des imports si `source_label` n'est pas défini. */
export const CSV_MANUAL_SOURCE_LABEL = "CSV manuel";

/** Nombre maximum de lignes acceptées dans un CSV (anti-abus + limite d'ingestion raisonnable). */
export const CSV_MANUAL_MAX_ROWS = 10_000;

/** Taille fichier max (bytes). 10 MB = ~100k lignes pour un CSV propre. */
export const CSV_MANUAL_MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Nombre maximum de fiches traitées en parallèle par l'ingestion (écrit côté server action). */
export const CSV_MANUAL_INGEST_CHUNK = 100;
