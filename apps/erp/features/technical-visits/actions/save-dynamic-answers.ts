"use server";

import { revalidatePath } from "next/cache";

import { buildLegacyPatch } from "@/features/technical-visits/dynamic/legacy-sync";
import type { VisitTemplateSchema } from "@/features/technical-visits/templates/schema-types";
import { assertTechnicalVisitNotTechnicianRestrictedById } from "@/features/technical-visits/access/technician-mutation-guard";
import type { Database, Json } from "@/types/database.types";
import { createClient } from "@/lib/supabase/server";

type TechnicalVisitUpdate = Database["public"]["Tables"]["technical_visits"]["Update"];

export type SaveDynamicAnswersResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Persists `form_answers_json` for a technical visit and syncs legacy columns
 * for fields that have `mapToLegacyColumn` set in the template schema.
 */
export async function saveDynamicAnswers(input: {
  visitId: string;
  answers: Record<string, unknown>;
  schema: VisitTemplateSchema;
}): Promise<SaveDynamicAnswersResult> {
  const { visitId, answers, schema } = input;

  if (!visitId?.trim()) {
    return { ok: false, message: "Identifiant visite technique manquant." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Session expirée." };
  }

  const gate = await assertTechnicalVisitNotTechnicianRestrictedById(supabase, visitId.trim());
  if (!gate.ok) {
    return { ok: false, message: gate.message };
  }

  const legacyPatch = buildLegacyPatch(schema, answers);

  const patch: Record<string, unknown> = {
    form_answers_json: answers as unknown as Json,
    ...legacyPatch,
  };

  const { error } = await supabase
    .from("technical_visits")
    .update(patch as TechnicalVisitUpdate)
    .eq("id", visitId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/technical-visits/${visitId}`);
  return { ok: true };
}
