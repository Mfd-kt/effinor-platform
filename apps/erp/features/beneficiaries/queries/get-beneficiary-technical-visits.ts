import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { shouldRestrictTechnicalVisitsToCreatorOnly } from "@/lib/auth/data-scope";

import type { BeneficiaryLinkedTechnicalVisit } from "@/features/beneficiaries/types";
import type { TechnicalVisitStatus } from "@/types/database.types";

type RawRow = {
  id: string;
  vt_reference: string;
  status: TechnicalVisitStatus;
  scheduled_at: string | null;
  performed_at: string | null;
  lead_id: string;
  leads: { company_name: string } | null;
  technician: { full_name: string | null; email: string } | null;
};

function normalize(raw: RawRow): BeneficiaryLinkedTechnicalVisit {
  const techLabel =
    raw.technician?.full_name?.trim() || raw.technician?.email?.trim() || null;
  return {
    id: raw.id,
    vt_reference: raw.vt_reference,
    status: raw.status,
    scheduled_at: raw.scheduled_at,
    performed_at: raw.performed_at,
    lead_id: raw.lead_id,
    lead_company_name: raw.leads?.company_name ?? null,
    technician_label: techLabel,
  };
}

/**
 * Visites techniques liées à un bénéficiaire (flux Lead → VT → Bénéficiaire).
 */
export async function getBeneficiaryTechnicalVisits(
  beneficiaryId: string,
  access?: AccessContext,
): Promise<BeneficiaryLinkedTechnicalVisit[]> {
  const supabase = await createClient();

  let q = supabase
    .from("technical_visits")
    .select(
      `
      id,
      vt_reference,
      status,
      scheduled_at,
      performed_at,
      lead_id,
      leads (
        company_name
      ),
      technician:profiles!technical_visits_technician_id_fkey (
        full_name,
        email
      )
    `,
    )
    .eq("beneficiary_id", beneficiaryId)
    .is("deleted_at", null);

  if (access?.kind === "authenticated" && shouldRestrictTechnicalVisitsToCreatorOnly(access)) {
    q = q.eq("created_by_user_id", access.userId);
  }

  const { data, error } = await q.order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Impossible de charger les visites techniques du bénéficiaire : ${error.message}`,
    );
  }

  return ((data as unknown as RawRow[]) ?? []).map(normalize);
}
