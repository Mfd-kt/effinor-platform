import { createClient } from "@/lib/supabase/server";

import type { OperationSiteFormOptions } from "@/features/operation-sites/types";

/**
 * Opérations disponibles pour rattacher un site (référence + bénéficiaire).
 */
export async function getOperationSiteFormOptions(): Promise<OperationSiteFormOptions> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("operations")
    .select(
      `
      id,
      operation_reference,
      title,
      beneficiaries!operations_beneficiary_id_fkey ( company_name )
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    throw new Error(`Opérations : ${error.message}`);
  }

  type Row = {
    id: string;
    operation_reference: string;
    title: string;
    beneficiaries: { company_name: string } | null;
  };

  const operations = ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    operation_reference: r.operation_reference,
    title: r.title,
    beneficiary_company_name: r.beneficiaries?.company_name ?? null,
  }));

  return { operations };
}
