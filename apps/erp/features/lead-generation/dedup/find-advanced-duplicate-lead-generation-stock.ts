import type { SupabaseClient } from "@supabase/supabase-js";

import type { LeadGenerationPreparedStockRow } from "../domain/prepared-row";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";
import {
  computeLeadGenerationDuplicateMatch,
  type LeadGenerationDuplicateMatchReason,
} from "./compute-duplicate-match";

export type AdvancedDuplicateFindResult = {
  duplicateOf: LeadGenerationStockRow;
  matchScore: number;
  matchReasons: LeadGenerationDuplicateMatchReason[];
};

function sortByCreatedAsc(rows: LeadGenerationStockRow[]): LeadGenerationStockRow[] {
  return [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

/**
 * Recherche hiérarchisée d’un doublon : requêtes ciblées (index), puis validation par {@link computeLeadGenerationDuplicateMatch}.
 */
export async function findAdvancedDuplicateLeadGenerationStock(
  supabase: SupabaseClient,
  prepared: LeadGenerationPreparedStockRow,
): Promise<AdvancedDuplicateFindResult | null> {
  const stock = lgTable(supabase, "lead_generation_stock");

  const tryRow = (row: LeadGenerationStockRow | null): AdvancedDuplicateFindResult | null => {
    if (!row) {
      return null;
    }
    const m = computeLeadGenerationDuplicateMatch(row, prepared);
    if (!m.isDuplicate) {
      return null;
    }
    return {
      duplicateOf: row,
      matchScore: m.matchScore,
      matchReasons: m.matchReasons,
    };
  };

  const tryRows = (rows: LeadGenerationStockRow[]): AdvancedDuplicateFindResult | null => {
    for (const row of sortByCreatedAsc(rows)) {
      const t = tryRow(row);
      if (t) {
        return t;
      }
    }
    return null;
  };

  if (prepared.normalized_siret) {
    const { data, error } = await stock
      .select("*")
      .eq("siret", prepared.normalized_siret)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error(`Dédup SIRET : ${error.message}`);
    }
    const hit = tryRow(data as LeadGenerationStockRow | null);
    if (hit) {
      return hit;
    }
  }

  if (prepared.normalized_email) {
    const { data, error } = await stock
      .select("*")
      .eq("normalized_email", prepared.normalized_email)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error(`Dédup email : ${error.message}`);
    }
    const hit = tryRow(data as LeadGenerationStockRow | null);
    if (hit) {
      return hit;
    }
  }

  const nc = prepared.normalized_company_name?.trim();
  if (nc) {
    const { data, error } = await stock
      .select("*")
      .eq("normalized_company_name", nc)
      .order("created_at", { ascending: true })
      .limit(25);
    if (error) {
      throw new Error(`Dédup nom de société normalisé : ${error.message}`);
    }
    const hit = tryRows((data ?? []) as LeadGenerationStockRow[]);
    if (hit) {
      return hit;
    }
  }

  if (prepared.normalized_phone) {
    const { data, error } = await stock
      .select("*")
      .eq("normalized_phone", prepared.normalized_phone)
      .order("created_at", { ascending: true })
      .limit(25);
    if (error) {
      throw new Error(`Dédup téléphone : ${error.message}`);
    }
    const hit = tryRows((data ?? []) as LeadGenerationStockRow[]);
    if (hit) {
      return hit;
    }
  }

  if (prepared.normalized_domain) {
    const { data, error } = await stock
      .select("*")
      .eq("normalized_domain", prepared.normalized_domain)
      .order("created_at", { ascending: true })
      .limit(25);
    if (error) {
      throw new Error(`Dédup domaine : ${error.message}`);
    }
    const hit = tryRows((data ?? []) as LeadGenerationStockRow[]);
    if (hit) {
      return hit;
    }
  }

  if (prepared.normalized_company_name && prepared.city?.trim()) {
    const { data, error } = await stock
      .select("*")
      .eq("normalized_company_name", prepared.normalized_company_name)
      .ilike("city", prepared.city.trim())
      .order("created_at", { ascending: true })
      .limit(15);
    if (error) {
      throw new Error(`Dédup société + ville : ${error.message}`);
    }
    const hit = tryRows((data ?? []) as LeadGenerationStockRow[]);
    if (hit) {
      return hit;
    }
  }

  if (prepared.postal_code?.trim() && prepared.matching_company_key) {
    const { data, error } = await stock
      .select("*")
      .eq("postal_code", prepared.postal_code.trim())
      .order("created_at", { ascending: true })
      .limit(40);
    if (error) {
      throw new Error(`Dédup code postal : ${error.message}`);
    }
    const hit = tryRows((data ?? []) as LeadGenerationStockRow[]);
    if (hit) {
      return hit;
    }
  }

  return null;
}
