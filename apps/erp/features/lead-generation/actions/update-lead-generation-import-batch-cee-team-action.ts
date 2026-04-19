"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { lgTable } from "../lib/lg-db";
import { resolveLeadGenerationImportBatchCeeContext } from "../services/resolve-lead-generation-import-batch-cee-context";

const inputSchema = z.object({
  batchId: z.string().uuid(),
  ceeSheetId: z.string().uuid().optional().nullable(),
  targetTeamId: z.string().uuid().optional().nullable(),
});

export type UpdateLeadGenerationImportBatchCeeTeamResult = { updated: true };

/**
 * Met à jour le rattachement fiche CEE + équipe cible d’un lot d’import (contrainte tout-ou-rien en base).
 */
export async function updateLeadGenerationImportBatchCeeTeamAction(
  input: unknown,
): Promise<LeadGenerationActionResult<UpdateLeadGenerationImportBatchCeeTeamResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  const sheet = parsed.data.ceeSheetId?.trim() || null;
  const team = parsed.data.targetTeamId?.trim() || null;

  if (!sheet !== !team) {
    return {
      ok: false,
      error: "Choisissez à la fois une fiche CEE et une équipe, ou retirez complètement le rattachement.",
    };
  }

  const supabase = await createClient();
  const batches = lgTable(supabase, "lead_generation_import_batches");

  if (!sheet && !team) {
    const { error } = await batches
      .update({
        cee_sheet_id: null,
        cee_sheet_code: null,
        target_team_id: null,
      })
      .eq("id", parsed.data.batchId);

    if (error) {
      return { ok: false, error: error.message };
    }
  } else {
    const resolved = await resolveLeadGenerationImportBatchCeeContext(supabase, sheet!, team!);
    if (!resolved.ok) {
      return { ok: false, error: resolved.error };
    }
    const { error } = await batches
      .update({
        cee_sheet_id: resolved.data.cee_sheet_id,
        cee_sheet_code: resolved.data.cee_sheet_code,
        target_team_id: resolved.data.target_team_id,
      })
      .eq("id", parsed.data.batchId);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  revalidatePath("/lead-generation/imports");
  revalidatePath(`/lead-generation/imports/${parsed.data.batchId}`);
  return { ok: true, data: { updated: true } };
}
