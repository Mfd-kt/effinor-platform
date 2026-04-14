import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { getBeneficiaryIdsForScopedLeads, getLeadIdsForAccess } from "@/lib/auth/data-scope";

import type { OperationListRow, OperationRow } from "@/features/operations/types";
import type { OperationStatus } from "@/types/database.types";

export type OperationListFilters = {
  q?: string;
  operation_status?: OperationStatus;
  beneficiary_id?: string;
};

type RawRow = OperationRow & {
  beneficiaries: { company_name: string } | null;
  reference_technical_visit: { vt_reference: string } | null;
};

function normalize(raw: RawRow): OperationListRow {
  const { beneficiaries, reference_technical_visit, ...rest } = raw;
  return {
    ...rest,
    beneficiary_company_name: beneficiaries?.company_name ?? null,
    reference_vt_reference: reference_technical_visit?.vt_reference ?? null,
  };
}

export async function getOperations(
  filters?: OperationListFilters,
  access?: AccessContext,
): Promise<OperationListRow[]> {
  const supabase = await createClient();

  let scopedOperationIds: string[] | undefined;
  if (access?.kind === "authenticated") {
    const leadIds = await getLeadIdsForAccess(supabase, access);
    if (leadIds !== "all") {
      if (leadIds.length === 0) {
        return [];
      }
      const benIds = await getBeneficiaryIdsForScopedLeads(supabase, leadIds);
      const parts: string[] = [];
      parts.push(`lead_id.in.(${leadIds.join(",")})`);
      if (benIds.length > 0) {
        parts.push(`beneficiary_id.in.(${benIds.join(",")})`);
      }
      const scopeOr = parts.join(",");
      const { data: scopedRows, error: scopeErr } = await supabase
        .from("operations")
        .select("id")
        .or(scopeOr)
        .is("deleted_at", null);
      if (scopeErr) {
        throw new Error(`Impossible de charger les opérations : ${scopeErr.message}`);
      }
      scopedOperationIds = scopedRows?.map((r) => r.id) ?? [];
      if (scopedOperationIds.length === 0) {
        return [];
      }
    }
  }

  let query = supabase
    .from("operations")
    .select(
      `
      *,
      beneficiaries (
        company_name
      ),
      reference_technical_visit:technical_visits!operations_reference_technical_visit_id_fkey (
        vt_reference
      )
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (scopedOperationIds) {
    query = query.in("id", scopedOperationIds);
  }

  if (filters?.operation_status) {
    query = query.eq("operation_status", filters.operation_status);
  }

  if (filters?.beneficiary_id?.trim()) {
    query = query.eq("beneficiary_id", filters.beneficiary_id.trim());
  }

  if (filters?.q?.trim()) {
    const raw = filters.q.trim().replace(/,/g, " ");
    const term = `%${raw}%`;
    query = query.or(
      `title.ilike.${term},operation_reference.ilike.${term},cee_sheet_code.ilike.${term}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Impossible de charger les opérations : ${error.message}`);
  }

  return (data as unknown as RawRow[] | null)?.map(normalize) ?? [];
}
