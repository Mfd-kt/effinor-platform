import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessTechnicalVisitDetail } from "@/lib/auth/data-scope";

import type { TechnicalVisitDetailRow } from "@/features/technical-visits/types";

export async function getTechnicalVisitById(
  id: string,
  access?: AccessContext,
): Promise<TechnicalVisitDetailRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("technical_visits")
    .select(
      `
      *,
      leads (
        id,
        company_name
      ),
      technician:profiles!technical_visits_technician_id_fkey (
        id,
        full_name,
        email
      )
    `,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de charger la visite technique : ${error.message}`);
  }

  const row = (data as unknown as TechnicalVisitDetailRow | null) ?? null;
  if (!row) {
    return null;
  }
  if (access?.kind === "authenticated") {
    const ok = await canAccessTechnicalVisitDetail(supabase, row, access);
    if (!ok) {
      return null;
    }
  }

  return row;
}
