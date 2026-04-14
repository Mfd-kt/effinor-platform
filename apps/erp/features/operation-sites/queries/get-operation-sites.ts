import { createClient } from "@/lib/supabase/server";

import type { OperationSiteListRow, OperationSiteRow } from "@/features/operation-sites/types";
import type { SiteKind } from "@/types/database.types";

export type OperationSiteListFilters = {
  q?: string;
  operation_id?: string;
  site_kind?: SiteKind;
  building_type?: string;
  is_primary?: boolean;
};

type RawRow = OperationSiteRow & {
  operations: {
    operation_reference: string;
    title: string;
    beneficiaries: { company_name: string } | null;
  } | null;
};

function normalize(raw: RawRow): OperationSiteListRow {
  const { operations, ...rest } = raw;
  return {
    ...rest,
    operation_reference: operations?.operation_reference ?? null,
    operation_title: operations?.title ?? null,
    beneficiary_company_name: operations?.beneficiaries?.company_name ?? null,
  };
}

export async function getOperationSites(
  filters?: OperationSiteListFilters,
): Promise<OperationSiteListRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("operation_sites")
    .select(
      `
      *,
      operations (
        operation_reference,
        title,
        beneficiaries!operations_beneficiary_id_fkey ( company_name )
      )
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters?.operation_id?.trim()) {
    query = query.eq("operation_id", filters.operation_id.trim());
  }

  if (filters?.site_kind) {
    query = query.eq("site_kind", filters.site_kind);
  }

  if (filters?.building_type?.trim()) {
    const t = `%${filters.building_type.trim()}%`;
    query = query.ilike("building_type", t);
  }

  if (filters?.is_primary === true) {
    query = query.eq("is_primary", true);
  } else if (filters?.is_primary === false) {
    query = query.eq("is_primary", false);
  }

  if (filters?.q?.trim()) {
    const raw = filters.q.trim().replace(/,/g, " ");
    const term = `%${raw}%`;
    query = query.or(
      `label.ilike.${term},activity_type.ilike.${term},building_type.ilike.${term},notes.ilike.${term}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Impossible de charger les sites techniques : ${error.message}`);
  }

  return (data as unknown as RawRow[] | null)?.map(normalize) ?? [];
}
