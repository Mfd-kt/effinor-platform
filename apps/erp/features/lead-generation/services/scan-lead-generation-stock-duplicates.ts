import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

/** Voir `dedupe-lead-generation-stock-strict-phone-and-name` : pagination robuste au plafond PostgREST. */
const FETCH_PAGE = 1000;
const MAX_GROUPS = 200;
const MAX_IDS_PER_GROUP = 50;

export type LeadGenerationDuplicateGroup = {
  /** Valeur normalisée (téléphone ou nom société). */
  key: string;
  /** Nombre de fiches dans le groupe. */
  count: number;
  /** Identifiants (tronqués si très gros groupe). */
  stockIds: string[];
  /** Fiches non listées dans `stockIds` (si groupe tronqué). */
  omittedIdsCount: number;
  /** Exemples de libellés société pour repérage rapide. */
  sampleCompanyNames: string[];
};

export type ScanLeadGenerationStockDuplicatesResult = {
  byPhone: LeadGenerationDuplicateGroup[];
  byCompany: LeadGenerationDuplicateGroup[];
  scannedRows: number;
  /** True si au moins un type de groupe a atteint MAX_GROUPS. */
  groupsTruncated: boolean;
};

type Bucket = { ids: string[]; names: string[] };

function pushBucket(bucket: Map<string, Bucket>, key: string, id: string, companyName: string | null) {
  let b = bucket.get(key);
  if (!b) {
    b = { ids: [], names: [] };
    bucket.set(key, b);
  }
  b.ids.push(id);
  const n = (companyName ?? "").trim();
  if (n && b.names.length < 8 && !b.names.includes(n)) {
    b.names.push(n);
  }
}

function toGroups(bucket: Map<string, Bucket>, maxGroups: number): {
  groups: LeadGenerationDuplicateGroup[];
  truncated: boolean;
} {
  const entries = [...bucket.entries()].filter(([, v]) => v.ids.length > 1);
  entries.sort((a, b) => b[1].ids.length - a[1].ids.length);
  const sliced = entries.slice(0, maxGroups);
  const truncated = entries.length > maxGroups;

  const groups: LeadGenerationDuplicateGroup[] = sliced.map(([key, v]) => {
    const count = v.ids.length;
    const stockIds = v.ids.slice(0, MAX_IDS_PER_GROUP);
    return {
      key,
      count,
      stockIds,
      omittedIdsCount: Math.max(0, count - stockIds.length),
      sampleCompanyNames: v.names.slice(0, 5),
    };
  });

  return { groups, truncated };
}

/**
 * Parcourt tout le stock (pagination) et regroupe les fiches par téléphone normalisé et par nom de société normalisé.
 * Aligné sur les colonnes utilisées à l’ingestion (`normalized_phone`, `normalized_company_name`).
 */
export async function scanLeadGenerationStockDuplicates(): Promise<ScanLeadGenerationStockDuplicatesResult> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const byPhoneBuckets = new Map<string, Bucket>();
  const byCompanyBuckets = new Map<string, Bucket>();
  let scannedRows = 0;

  for (let offset = 0; ; ) {
    const { data, error } = await stock
      .select("id, company_name, normalized_phone, normalized_company_name")
      .order("created_at", { ascending: true })
      .range(offset, offset + FETCH_PAGE - 1);

    if (error) {
      throw new Error(`Scan doublons stock : ${error.message}`);
    }
    const rows = (data ?? []) as {
      id: string;
      company_name: string | null;
      normalized_phone: string | null;
      normalized_company_name: string | null;
    }[];

    if (rows.length === 0) {
      break;
    }
    scannedRows += rows.length;

    for (const r of rows) {
      const phone = r.normalized_phone?.trim();
      if (phone) {
        pushBucket(byPhoneBuckets, phone, r.id, r.company_name);
      }
      const company = r.normalized_company_name?.trim();
      if (company) {
        pushBucket(byCompanyBuckets, company, r.id, r.company_name);
      }
    }

    offset += rows.length;
  }

  const phoneResult = toGroups(byPhoneBuckets, MAX_GROUPS);
  const companyResult = toGroups(byCompanyBuckets, MAX_GROUPS);

  return {
    byPhone: phoneResult.groups,
    byCompany: companyResult.groups,
    scannedRows,
    groupsTruncated: phoneResult.truncated || companyResult.truncated,
  };
}
