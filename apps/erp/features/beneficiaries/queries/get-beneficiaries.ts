import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import {
  getBeneficiaryIdsForScopedLeads,
  getLeadIdsForAccess,
  hasBeneficiaryScopeAllFromPermissions,
} from "@/lib/auth/data-scope";
import { permScopeAllCode, permScopeCreatorCode } from "@/lib/auth/table-scope";

import type { BeneficiaryRow } from "@/features/beneficiaries/types";
import type { BeneficiaryStatus } from "@/types/database.types";

export type BeneficiaryListFilters = {
  status?: BeneficiaryStatus;
  q?: string;
};

export async function getBeneficiaries(
  filters?: BeneficiaryListFilters,
  access?: AccessContext,
): Promise<BeneficiaryRow[]> {
  const supabase = await createClient();

  let allowedIds: string[] | "all" | undefined;

  if (access?.kind === "authenticated") {
    if (hasBeneficiaryScopeAllFromPermissions(access)) {
      allowedIds = "all";
    } else {
      const leadIds = await getLeadIdsForAccess(supabase, access);
      const ids = new Set<string>();

      if (leadIds === "all") {
        allowedIds = "all";
      } else {
        if (leadIds.length > 0) {
          const fromLeads = await getBeneficiaryIdsForScopedLeads(supabase, leadIds);
          for (const id of fromLeads) {
            ids.add(id);
          }
        }
        const pc = new Set(access.permissionCodes);
        if (
          access.permissionCodes.length > 0 &&
          pc.has(permScopeCreatorCode("beneficiaries")) &&
          !pc.has(permScopeAllCode("beneficiaries"))
        ) {
          const { data: owned } = await supabase
            .from("beneficiaries")
            .select("id")
            .eq("sales_owner_id", access.userId)
            .is("deleted_at", null);
          for (const r of owned ?? []) {
            ids.add(r.id);
          }
        }
        if (ids.size === 0) {
          return [];
        }
        allowedIds = [...ids];
      }
    }
  }

  let query = supabase
    .from("beneficiaries")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (allowedIds && allowedIds !== "all") {
    query = query.in("id", allowedIds);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.ilike("company_name", term);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Impossible de charger les bénéficiaires : ${error.message}`);
  }

  return data ?? [];
}
