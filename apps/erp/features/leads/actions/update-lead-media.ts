"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { getRestrictedAgentLeadEditBlockReason } from "@/lib/auth/restricted-agent-lead-edit";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database.types";

type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

const UpdateLeadMediaSchema = z.object({
  leadId: z.string().uuid(),
  field: z.enum(["aerial_photos", "cadastral_parcel_files", "recording_files", "study_media_files"]),
  urls: z.array(z.string().min(1).max(2000)).max(40),
});

export async function updateLeadMediaFieldAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = UpdateLeadMediaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données média invalides." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const supabase = await createClient();
  const { data: existingRow, error: fetchError } = await supabase
    .from("leads")
    .select("id, created_by_agent_id, confirmed_by_user_id")
    .eq("id", parsed.data.leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError || !existingRow) {
    return { ok: false, message: fetchError?.message ?? "Lead introuvable." };
  }

  if (!canAccessLeadRow(existingRow, access)) {
    return { ok: false, message: "Accès refusé à ce lead." };
  }

  const agentBlock = await getRestrictedAgentLeadEditBlockReason(supabase, access, parsed.data.leadId);
  if (agentBlock) {
    return { ok: false, message: agentBlock };
  }

  const urlsJson = parsed.data.urls as unknown as Json;
  const patch: LeadUpdate =
    parsed.data.field === "aerial_photos"
      ? { aerial_photos: urlsJson }
      : parsed.data.field === "cadastral_parcel_files"
        ? { cadastral_parcel_files: urlsJson }
        : parsed.data.field === "recording_files"
          ? { recording_files: urlsJson }
          : { study_media_files: urlsJson };

  const { error: updateError } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", parsed.data.leadId)
    .is("deleted_at", null);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${parsed.data.leadId}`);
  return { ok: true };
}
