import type { LeadGenerationRawStockInput } from "../../domain/raw-input";

import { dropEmptyCsvRows, parseCsvRows } from "./parse-csv";

/** Normalise un en-tête CSV pour correspondance (casse, accents, espaces). */
export function normalizeCsvHeaderKey(raw: string): string {
  return raw
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/** Pour chaque champ métier, liste des en-têtes possibles (avant normalisation). */
const FIELD_HEADER_GROUPS: {
  field: keyof Pick<
    LeadGenerationRawStockInput,
    | "company_name"
    | "phone"
    | "email"
    | "website"
    | "address"
    | "postal_code"
    | "city"
    | "category"
    | "sub_category"
    | "siret"
  >;
  headers: readonly string[];
}[] = [
  {
    field: "company_name",
    headers: [
      "company_name",
      "raison_sociale",
      "entreprise",
      "societe",
      "société",
      "company",
      "name",
      "nom",
    ],
  },
  {
    field: "phone",
    headers: ["phone", "telephone", "téléphone", "tel", "mobile"],
  },
  { field: "email", headers: ["email", "mail", "e_mail"] },
  { field: "website", headers: ["website", "site", "url", "web"] },
  { field: "address", headers: ["address", "adresse", "rue"] },
  { field: "postal_code", headers: ["postal_code", "code_postal", "zip", "cp"] },
  { field: "city", headers: ["city", "ville", "localite", "localité"] },
  { field: "category", headers: ["category", "categorie", "catégorie"] },
  { field: "sub_category", headers: ["sub_category", "sous_categorie", "sous_catégorie"] },
  { field: "siret", headers: ["siret"] },
];

function buildNormalizedLookup(): Map<string, keyof LeadGenerationRawStockInput> {
  const m = new Map<string, keyof LeadGenerationRawStockInput>();
  for (const g of FIELD_HEADER_GROUPS) {
    for (const h of g.headers) {
      m.set(normalizeCsvHeaderKey(h), g.field);
    }
  }
  return m;
}

const HEADER_TO_FIELD = buildNormalizedLookup();

function pickField(
  rawRecord: Record<string, string>,
  field: (typeof FIELD_HEADER_GROUPS)[number]["field"],
): string | null {
  for (const [key, val] of Object.entries(rawRecord)) {
    if (HEADER_TO_FIELD.get(key) !== field) {
      continue;
    }
    const t = val?.trim();
    if (t) {
      return t;
    }
  }
  return null;
}

function pickCompanyName(rawRecord: Record<string, string>): string {
  const direct = pickField(rawRecord, "company_name");
  return direct?.trim() ?? "";
}

export type MapCsvToRawStockResult = {
  rows: LeadGenerationRawStockInput[];
  skippedEmptyCompany: number;
  headerKeys: string[];
};

/**
 * Parse le texte CSV, lit la première ligne non vide comme en-tête, mappe vers des entrées brutes.
 */
export function mapCsvTextToLeadGenerationRawStockInputs(
  csvText: string,
  sourceCode: "csv_manual",
): MapCsvToRawStockResult {
  const trimmed = csvText.trim();
  if (!trimmed) {
    return { rows: [], skippedEmptyCompany: 0, headerKeys: [] };
  }

  const allRows = dropEmptyCsvRows(parseCsvRows(trimmed));
  if (allRows.length === 0) {
    return { rows: [], skippedEmptyCompany: 0, headerKeys: [] };
  }

  const headerCells = allRows[0]!.map((h) => normalizeCsvHeaderKey(h));
  const dataRows = allRows.slice(1);

  const headerKeys = [...new Set(headerCells.filter(Boolean))];

  let skippedEmptyCompany = 0;
  const rows: LeadGenerationRawStockInput[] = [];

  for (let lineIndex = 0; lineIndex < dataRows.length; lineIndex++) {
    const cells = dataRows[lineIndex]!;
    const rawRecord: Record<string, string> = {};
    for (let col = 0; col < headerCells.length; col++) {
      const hk = headerCells[col];
      if (!hk) {
        continue;
      }
      rawRecord[hk] = cells[col] === undefined || cells[col] === null ? "" : String(cells[col]);
    }

    const company_name = pickCompanyName(rawRecord);
    if (!company_name.trim()) {
      skippedEmptyCompany += 1;
      continue;
    }

    const row: LeadGenerationRawStockInput = {
      source: sourceCode,
      source_external_id: String(lineIndex + 1),
      company_name: company_name.trim(),
      phone: pickField(rawRecord, "phone"),
      email: pickField(rawRecord, "email"),
      website: pickField(rawRecord, "website"),
      address: pickField(rawRecord, "address"),
      postal_code: pickField(rawRecord, "postal_code"),
      city: pickField(rawRecord, "city"),
      category: pickField(rawRecord, "category"),
      sub_category: pickField(rawRecord, "sub_category"),
      siret: pickField(rawRecord, "siret"),
      extra_payload: {
        csv_manual: {
          line_index: lineIndex + 1,
          raw_row: rawRecord,
        },
      },
    };

    rows.push(row);
  }

  return { rows, skippedEmptyCompany, headerKeys };
}
