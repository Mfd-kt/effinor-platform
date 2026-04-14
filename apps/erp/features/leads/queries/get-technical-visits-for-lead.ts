import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { shouldRestrictTechnicalVisitsToCreatorOnly } from "@/lib/auth/data-scope";

export type TechnicalVisitRef = {
  id: string;
  vt_reference: string;
};

export async function getTechnicalVisitRefsForLead(
  leadId: string,
  access?: AccessContext,
): Promise<TechnicalVisitRef[]> {
  const supabase = await createClient();

  let q = supabase
    .from("technical_visits")
    .select("id, vt_reference")
    .eq("lead_id", leadId)
    .is("deleted_at", null);

  if (access?.kind === "authenticated" && shouldRestrictTechnicalVisitsToCreatorOnly(access)) {
    q = q.eq("created_by_user_id", access.userId);
  }

  const { data, error } = await q.order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Impossible de charger les visites techniques : ${error.message}`);
  }

  return (data ?? []) as TechnicalVisitRef[];
}
