import { createClient } from "@/lib/supabase/server";

import type { OperationSiteDetailRow } from "@/features/operation-sites/types";

export async function getOperationSiteById(id: string): Promise<OperationSiteDetailRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("operation_sites")
    .select(
      `
      *,
      operations (
        id,
        operation_reference,
        title,
        beneficiary_id,
        beneficiaries!operations_beneficiary_id_fkey ( id, company_name )
      )
    `,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de charger le site technique : ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return data as unknown as OperationSiteDetailRow;
}
