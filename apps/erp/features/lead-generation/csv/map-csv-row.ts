import type { LeadGenerationRawStockInput } from "../domain/raw-input";
import { CSV_MANUAL_SOURCE_CODE } from "./config";

/**
 * Colonnes CSV supportées. Toutes les clés sont normalisées (lowercase +
 * slug) avant matching, donc "Téléphone", "TELEPHONE", "téléphone" et
 * "telephone" pointent tous vers la même colonne canonique.
 *
 * Le fichier fourni à l'équipe commerciale liste ces en-têtes en français.
 */
export const CSV_EXPECTED_HEADERS = [
  "entreprise",
  "contact",
  "civilite",
  "prenom",
  "nom",
  "telephone",
  "email",
  "site_web",
  "adresse",
  "code_postal",
  "ville",
  "siret",
  "categorie",
  "notes",
] as const;

export type CsvExpectedHeader = (typeof CSV_EXPECTED_HEADERS)[number];

/** Alias acceptés pour chaque colonne (tolérance achats data externe). */
const HEADER_ALIASES: Record<CsvExpectedHeader, readonly string[]> = {
  entreprise: ["entreprise", "societe", "société", "company", "company_name", "raison_sociale", "nom_entreprise"],
  contact: ["contact", "contact_name", "contact_full_name", "full_name"],
  civilite: ["civilite", "civilité", "title", "civility"],
  prenom: ["prenom", "prénom", "first_name", "firstname"],
  nom: ["nom", "last_name", "lastname", "surname"],
  telephone: ["telephone", "téléphone", "tel", "phone", "mobile", "portable", "numero", "numéro", "num_tel"],
  email: ["email", "mail", "courriel", "e_mail"],
  site_web: ["site_web", "website", "site", "url", "web"],
  adresse: ["adresse", "address", "addr", "rue"],
  code_postal: ["code_postal", "codepostal", "cp", "postal_code", "zip", "zip_code"],
  ville: ["ville", "city", "town", "commune"],
  siret: ["siret", "num_siret", "siren"],
  categorie: ["categorie", "catégorie", "category", "secteur", "activite", "activité"],
  notes: ["notes", "note", "commentaire", "comment", "remarque"],
};

function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Construit la map « header CSV → clé canonique » à partir des en-têtes
 * détectés dans le fichier. Les en-têtes inconnus sont ignorés (ajoutés dans
 * `raw_payload.extra_csv_columns` pour ne rien perdre).
 */
export function buildHeaderMapping(csvHeaders: string[]): {
  canonicalByColumn: Map<string, CsvExpectedHeader>;
  unknownColumns: string[];
} {
  const canonicalByColumn = new Map<string, CsvExpectedHeader>();
  const unknownColumns: string[] = [];

  for (const h of csvHeaders) {
    const slug = normalizeHeader(h);
    let matched: CsvExpectedHeader | null = null;
    for (const canonical of CSV_EXPECTED_HEADERS) {
      if (HEADER_ALIASES[canonical].includes(slug)) {
        matched = canonical;
        break;
      }
    }
    if (matched) {
      canonicalByColumn.set(h, matched);
    } else if (h.trim().length > 0) {
      unknownColumns.push(h);
    }
  }

  return { canonicalByColumn, unknownColumns };
}

export type MapCsvRowResult =
  | { ok: true; row: LeadGenerationRawStockInput }
  | { ok: false; error: string };

/**
 * Convertit une ligne CSV (objet `{ colKey: value }`) en
 * `LeadGenerationRawStockInput`, prêt pour `ingestLeadGenerationStock`.
 *
 * Règles :
 *  - `telephone` OBLIGATOIRE (sinon la fiche est rejetée — unicité normalized_phone).
 *  - `company_name` OBLIGATOIRE côté stock : on tente entreprise → contact →
 *    "prenom nom" → "Particulier" (dernier recours pour ne pas perdre la fiche).
 *  - Les colonnes inconnues du CSV sont conservées dans `extra_payload.csv_extra`.
 *
 * Paramètre `lineIndex` (1-based) utilisé pour fournir un `source_external_id`
 * unique basé sur le batch (permet à l'ingest de tracer la ligne source).
 */
export function mapCsvRowToStockInput(
  csvRow: Record<string, string>,
  mapping: Map<string, CsvExpectedHeader>,
  batchRef: string,
  lineIndex: number
): MapCsvRowResult {
  const canonical: Partial<Record<CsvExpectedHeader, string>> = {};
  const extras: Record<string, string> = {};

  for (const [col, value] of Object.entries(csvRow)) {
    const key = mapping.get(col);
    if (key) {
      if (value.trim().length > 0) {
        canonical[key] = value.trim();
      }
    } else if (value.trim().length > 0) {
      extras[col] = value.trim();
    }
  }

  const phone = canonical.telephone ?? "";
  if (!phone) {
    return { ok: false, error: "Téléphone manquant (colonne `telephone` obligatoire)" };
  }

  const prenom = canonical.prenom ?? "";
  const nom = canonical.nom ?? "";
  const contact = canonical.contact ?? [prenom, nom].filter(Boolean).join(" ").trim();
  const companyName =
    (canonical.entreprise ?? "").trim() ||
    contact.trim() ||
    "Particulier";

  const extraPayload: Record<string, unknown> = {};
  if (canonical.civilite) extraPayload.civilite = canonical.civilite;
  if (canonical.prenom) extraPayload.prenom = canonical.prenom;
  if (canonical.nom) extraPayload.nom = canonical.nom;
  if (canonical.contact) extraPayload.contact_full_name = canonical.contact;
  if (canonical.notes) extraPayload.notes = canonical.notes;
  if (Object.keys(extras).length > 0) extraPayload.csv_extra = extras;
  extraPayload.source_batch_ref = batchRef;

  return {
    ok: true,
    row: {
      source: CSV_MANUAL_SOURCE_CODE,
      source_external_id: `${batchRef}-${String(lineIndex).padStart(6, "0")}`,
      company_name: companyName,
      phone,
      email: canonical.email ?? null,
      website: canonical.site_web ?? null,
      address: canonical.adresse ?? null,
      postal_code: canonical.code_postal ?? null,
      city: canonical.ville ?? null,
      siret: canonical.siret ?? null,
      category: canonical.categorie ?? null,
      extra_payload: extraPayload,
    },
  };
}
