"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { insertFromOperationForm } from "@/features/operations/lib/map-to-db";
import { applyCeeToOperationInsert } from "@/features/operations/lib/operation-cee-enrich";
import { OperationInsertSchema } from "@/features/operations/schemas/operation.schema";
import type { OperationRow } from "@/features/operations/types";
import { createClient } from "@/lib/supabase/server";

export type CreateOperationResult =
  | { ok: true; data: OperationRow }
  | { ok: false; message: string };

export async function createOperation(input: unknown): Promise<CreateOperationResult> {
  const parsed = OperationInsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const ref =
    parsed.data.operation_reference?.trim() ||
    `OP-${randomUUID().slice(0, 8).toUpperCase()}`;

  const supabase = await createClient();
  const row = insertFromOperationForm(parsed.data, ref);
  const cee = await applyCeeToOperationInsert(supabase, parsed.data, row);
  if (!cee.ok) {
    return { ok: false, message: cee.message };
  }

  const insertRow = {
    ...cee.row,
    ...(!parsed.data.title?.trim()
      ? {
          title: `Opération ${cee.row.cee_sheet_code?.trim() || cee.row.operation_reference}`,
        }
      : {}),
  };

  const { data, error } = await supabase.from("operations").insert(insertRow).select().single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après création." };
  }

  revalidatePath("/operations");
  return { ok: true, data };
}
