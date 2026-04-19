"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationActionResult } from "../lib/action-result";
import { lgTable } from "../lib/lg-db";
import { logLeadGenerationAssignmentActivityActionInputSchema } from "../schemas/lead-generation-actions.schema";
import {
  logLeadGenerationAssignmentActivity,
  type LeadGenerationAssignmentActivityRow,
} from "../services/log-lead-generation-assignment-activity";

function parseOptionalNextActionAt(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined || raw.trim() === "") {
    return null;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

export async function logLeadGenerationAssignmentActivityAction(
  input: unknown,
): Promise<LeadGenerationActionResult<{ activity: LeadGenerationAssignmentActivityRow }>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Authentification requise." };
  }

  const parsed = logLeadGenerationAssignmentActivityActionInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Données invalides." };
  }

  const { nextActionAt, mergeLatestCallStub, ...rest } = parsed.data;
  const nextActionAtIso = parseOptionalNextActionAt(nextActionAt);

  try {
    const data = await logLeadGenerationAssignmentActivity({
      ...rest,
      nextActionAt: nextActionAtIso,
      mergeLatestCallStub: mergeLatestCallStub ?? false,
      actorUserId: access.userId,
      allowAsAdmin: await canAccessLeadGenerationHub(access),
    });

    const supabase = await createClient();
    const assignments = lgTable(supabase, "lead_generation_assignments");
    const { data: asn } = await assignments.select("stock_id").eq("id", parsed.data.assignmentId).maybeSingle();
    const stockId = (asn as { stock_id: string } | null)?.stock_id;
    if (stockId) {
      revalidatePath("/lead-generation/my-queue");
      revalidatePath(`/lead-generation/my-queue/${stockId}`);
    }

    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de l’enregistrement.";
    return { ok: false, error: message };
  }
}
