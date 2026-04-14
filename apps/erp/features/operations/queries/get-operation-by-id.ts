import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessOperationRow } from "@/lib/auth/data-scope";

import type { OperationDetailRow } from "@/features/operations/types";

export async function getOperationById(id: string, access?: AccessContext): Promise<OperationDetailRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("operations")
    .select(
      `
      *,
      beneficiaries (
        id,
        company_name
      ),
      delegators (
        id,
        name,
        prime_per_kwhc_note
      ),
      reference_technical_visit:technical_visits!operations_reference_technical_visit_id_fkey (
        id,
        vt_reference,
        status
      )
    `,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de charger l’opération : ${error.message}`);
  }

  const row = (data as unknown as OperationDetailRow | null) ?? null;
  if (!row) {
    return null;
  }
  if (access?.kind === "authenticated") {
    const ok = await canAccessOperationRow(
      supabase,
      { lead_id: row.lead_id, beneficiary_id: row.beneficiary_id },
      access,
    );
    if (!ok) {
      return null;
    }
  }

  return row;
}
