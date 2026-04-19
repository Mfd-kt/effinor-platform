"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";
import { lgTable } from "@/features/lead-generation/lib/lg-db";
import { recordLeadGenerationCallLaunchActivity } from "@/features/lead-generation/services/log-lead-generation-assignment-activity";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid("Identifiant d’attribution invalide.");

const inputSchema = z.object({
  assignmentId: uuid,
});

export type RecordLeadGenerationCallLaunchResult =
  | { ok: true; skipped: boolean }
  | { ok: false; error: string };

export async function recordLeadGenerationCallLaunchAction(
  input: unknown,
): Promise<RecordLeadGenerationCallLaunchResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Authentification requise." };
  }

  try {
    const result = await recordLeadGenerationCallLaunchActivity({
      assignmentId: parsed.data.assignmentId,
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

    return { ok: true, skipped: result.skipped };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de l’enregistrement.";
    return { ok: false, error: message };
  }
}
