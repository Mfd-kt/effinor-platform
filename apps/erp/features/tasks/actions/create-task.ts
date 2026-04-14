"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { CreateTaskSchema } from "@/features/tasks/schemas/task.schema";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAssignTasksToTeam } from "@/lib/auth/task-permissions";
import { createClient } from "@/lib/supabase/server";

export type CreateTaskResult = { ok: true } | { ok: false; message: string };

export async function createTaskAction(raw: unknown): Promise<CreateTaskResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAssignTasksToTeam(access)) {
    return { ok: false, message: "Droits insuffisants pour créer une tâche." };
  }

  const parsed = CreateTaskSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat()[0] ?? "Données invalides.";
    return { ok: false, message: msg };
  }

  const v = parsed.data;
  const description =
    v.description !== undefined && v.description.trim() !== "" ? v.description.trim() : null;

  const leadRaw = v.related_lead_id?.trim() ?? "";
  let related_entity_type: string | null = null;
  let related_entity_id: string | null = null;
  if (leadRaw !== "") {
    const uuidCheck = z.string().uuid().safeParse(leadRaw);
    if (!uuidCheck.success) {
      return { ok: false, message: "Fiche prospect invalide." };
    }
    related_entity_type = "lead";
    related_entity_id = leadRaw;
  }

  let due_date: string | null = null;
  const dueRaw = v.due_date?.trim() ?? "";
  if (dueRaw !== "") {
    const d = new Date(dueRaw);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, message: "Date d’échéance invalide." };
    }
    due_date = d.toISOString();
  }

  const supabase = await createClient();

  const { error } = await supabase.from("tasks").insert({
    title: v.title.trim(),
    description,
    task_type: v.task_type,
    priority: v.priority,
    status: "open",
    due_date,
    assigned_user_id: v.assigned_user_id,
    created_by_user_id: access.userId,
    related_entity_type,
    related_entity_id,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/tasks");
  return { ok: true };
}
