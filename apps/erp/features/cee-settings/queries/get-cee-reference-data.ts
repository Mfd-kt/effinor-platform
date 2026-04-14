import { createClient } from "@/lib/supabase/server";

import type { Database } from "@/types/database.types";

export type DelegatorRow = Database["public"]["Tables"]["delegators"]["Row"];
export type CeeSheetRow = Database["public"]["Tables"]["cee_sheets"]["Row"];

export type CeeReferenceData = {
  delegators: DelegatorRow[];
  ceeSheets: CeeSheetRow[];
};

export async function getCeeReferenceData(): Promise<CeeReferenceData> {
  const supabase = await createClient();

  const [dRes, cRes] = await Promise.all([
    supabase.from("delegators").select("*").is("deleted_at", null).order("name", { ascending: true }),
    supabase
      .from("cee_sheets")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("code", { ascending: true }),
  ]);

  const err = dRes.error ?? cRes.error;
  if (err) {
    throw new Error(err.message);
  }

  return {
    delegators: (dRes.data ?? []) as DelegatorRow[],
    ceeSheets: (cRes.data ?? []) as CeeSheetRow[],
  };
}
