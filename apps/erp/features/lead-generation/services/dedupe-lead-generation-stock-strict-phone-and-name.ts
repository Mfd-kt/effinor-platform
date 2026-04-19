import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

import {
  mergeLeadGenerationStockDuplicateGroup,
  pickMergeKeeperAndDuplicates,
} from "./merge-lead-generation-stock-group";

/**
 * Taille max d’un lot pour `.range`. Le plafond PostgREST (`max_rows`, souvent 1000 sur Supabase)
 * peut tronquer la réponse : l’offset doit avancer de `chunk.length`, pas d’une constante fixe.
 */
const FETCH_PAGE = 1000;
/** Limite de sécurité : fiches doublons retirées par exécution (évite timeout action serveur). */
const MAX_DELETES_PER_RUN = 20000;
const MAX_ERROR_LINES = 25;

const COMPOSITE_SEP = "\u001f";

type StockDedupeRow = {
  id: string;
  normalized_phone: string | null;
  normalized_company_name: string | null;
  created_at: string;
  converted_lead_id: string | null;
  stock_status: string;
};

export type DedupeLeadGenerationStockStrictResult = {
  scannedRowsPass1: number;
  scannedRowsPass2: number;
  strictDuplicateGroups: number;
  deletedCountStrict: number;
  /** Même `normalized_phone` sur plusieurs fiches (noms d’affichage / agences différents possibles). */
  phoneOnlyDuplicateGroups: number;
  deletedCountPhoneOnly: number;
  /** Groupes ignorés (ex. plusieurs `converted_lead_id` distincts). */
  skippedIncompatibleGroups: number;
  stoppedAtBudget: boolean;
  errors: string[];
};

function compositeKey(phone: string, company: string): string {
  return `${phone}${COMPOSITE_SEP}${company}`;
}

async function fetchAllStockForDedupe(
  supabase: SupabaseClient,
): Promise<{ rows: StockDedupeRow[]; scanned: number }> {
  const stock = lgTable(supabase, "lead_generation_stock");
  const rows: StockDedupeRow[] = [];

  for (let offset = 0; ; ) {
    const { data, error } = await stock
      .select(
        "id, normalized_phone, normalized_company_name, created_at, converted_lead_id, stock_status",
      )
      .order("created_at", { ascending: true })
      .range(offset, offset + FETCH_PAGE - 1);

    if (error) {
      throw new Error(`Dédoublonnage stock : ${error.message}`);
    }
    const chunk = (data ?? []) as StockDedupeRow[];
    if (chunk.length === 0) {
      break;
    }
    rows.push(...chunk);
    offset += chunk.length;
  }

  return { rows, scanned: rows.length };
}

async function fetchFullStockByIds(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, Record<string, unknown>>> {
  const stock = lgTable(supabase, "lead_generation_stock");
  const { data, error } = await stock.select("*").in("id", ids);
  if (error) {
    throw new Error(`Chargement fiches fusion : ${error.message}`);
  }
  return new Map(
    ((data ?? []) as Record<string, unknown>[]).map((r) => [String(r.id), r]),
  );
}

async function mergeDuplicateRowsInGroups(
  supabase: SupabaseClient,
  groups: StockDedupeRow[][],
  budget: { remaining: number },
  errors: string[],
): Promise<{ deleted: number; skippedIncompatible: number; stopped: boolean }> {
  let deleted = 0;
  let skippedIncompatible = 0;
  let stopped = false;

  const sortedGroups = [...groups].sort((a, b) => b.length - a.length);

  for (const groupRows of sortedGroups) {
    if (budget.remaining <= 0) {
      stopped = true;
      break;
    }

    const ids = groupRows.map((r) => r.id);
    const fullMap = await fetchFullStockByIds(supabase, ids);
    const fullRows = ids.map((id) => fullMap.get(id)).filter(Boolean) as Record<string, unknown>[];
    if (fullRows.length < 2) continue;

    const picked = pickMergeKeeperAndDuplicates(fullRows);
    if ("skip" in picked) {
      skippedIncompatible += 1;
      if (errors.length < MAX_ERROR_LINES) {
        errors.push(`Groupe (${ids[0]?.slice(0, 8)}…) : ${picked.skip}`);
      }
      continue;
    }

    const dupCount = picked.duplicates.length;
    if (dupCount === 0) continue;
    if (dupCount > budget.remaining) {
      stopped = true;
      break;
    }

    const res = await mergeLeadGenerationStockDuplicateGroup(supabase, picked.keeper, picked.duplicates);
    if (!res.ok) {
      if (errors.length < MAX_ERROR_LINES) {
        errors.push(`Fusion (${String(picked.keeper.id).slice(0, 8)}…) : ${res.message}`);
      }
      continue;
    }
    deleted += dupCount;
    budget.remaining -= dupCount;
  }

  return { deleted, skippedIncompatible, stopped };
}

/**
 * Passe 1 : même téléphone normalisé **et** même nom normalisé → fusion dans une fiche (CRM prioritaire).
 * Passe 2 : même téléphone normalisé seul → fusion (plusieurs agences = numéros différents ; un même numéro
 * est regroupé sur une seule fiche).
 */
export async function dedupeLeadGenerationStockStrictPhoneAndName(): Promise<DedupeLeadGenerationStockStrictResult> {
  const supabase = await createClient();
  const budget = { remaining: MAX_DELETES_PER_RUN };
  const errors: string[] = [];
  let stoppedAtBudget = false;
  let skippedIncompatibleTotal = 0;

  const { rows: rows1, scanned: scanned1 } = await fetchAllStockForDedupe(supabase);

  const strictBuckets = new Map<string, StockDedupeRow[]>();
  for (const r of rows1) {
    const phone = r.normalized_phone?.trim() ?? "";
    const company = r.normalized_company_name?.trim() ?? "";
    if (!phone || !company) continue;
    const key = compositeKey(phone, company);
    let arr = strictBuckets.get(key);
    if (!arr) {
      arr = [];
      strictBuckets.set(key, arr);
    }
    arr.push(r);
  }
  const strictGroups = [...strictBuckets.values()].filter((g) => g.length > 1);
  const strictDuplicateGroups = strictGroups.length;

  const r1 = await mergeDuplicateRowsInGroups(supabase, strictGroups, budget, errors);
  skippedIncompatibleTotal += r1.skippedIncompatible;
  if (r1.stopped) stoppedAtBudget = true;

  let scanned2 = 0;
  let phoneOnlyDuplicateGroups = 0;
  let deletedCountPhoneOnly = 0;

  if (budget.remaining > 0 && !stoppedAtBudget) {
    const { rows: rows2, scanned: s2 } = await fetchAllStockForDedupe(supabase);
    scanned2 = s2;

    const phoneBuckets = new Map<string, StockDedupeRow[]>();
    for (const r of rows2) {
      const phone = r.normalized_phone?.trim() ?? "";
      if (!phone) continue;
      let arr = phoneBuckets.get(phone);
      if (!arr) {
        arr = [];
        phoneBuckets.set(phone, arr);
      }
      arr.push(r);
    }
    const phoneGroups = [...phoneBuckets.values()].filter((g) => g.length > 1);
    phoneOnlyDuplicateGroups = phoneGroups.length;

    const r2 = await mergeDuplicateRowsInGroups(supabase, phoneGroups, budget, errors);
    skippedIncompatibleTotal += r2.skippedIncompatible;
    deletedCountPhoneOnly = r2.deleted;
    if (r2.stopped) stoppedAtBudget = true;
  }

  return {
    scannedRowsPass1: scanned1,
    scannedRowsPass2: scanned2,
    strictDuplicateGroups,
    deletedCountStrict: r1.deleted,
    phoneOnlyDuplicateGroups,
    deletedCountPhoneOnly,
    skippedIncompatibleGroups: skippedIncompatibleTotal,
    stoppedAtBudget,
    errors,
  };
}
