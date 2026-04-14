import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import { canAssignTasksToTeam } from "@/lib/auth/task-permissions";

import type { TaskRow, TaskWithPeople } from "@/features/tasks/types";

function mapProfiles(
  tasks: TaskRow[],
  profiles: { id: string; full_name: string | null; email: string }[],
): TaskWithPeople[] {
  const map = new Map(profiles.map((p) => [p.id, p]));
  return tasks.map((t) => ({
    ...t,
    assignee: t.assigned_user_id ? map.get(t.assigned_user_id) ?? null : null,
    creator: t.created_by_user_id ? map.get(t.created_by_user_id) ?? null : null,
  }));
}

export async function getTasksForAccess(access: AccessContext): Promise<TaskWithPeople[]> {
  const supabase = await createClient();

  let query = supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(250);

  if (access.kind === "authenticated" && !canAssignTasksToTeam(access)) {
    query = query.or(`assigned_user_id.eq.${access.userId},created_by_user_id.eq.${access.userId}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Impossible de charger les tâches : ${error.message}`);
  }

  const tasks = (data ?? []) as unknown as TaskRow[];
  const ids = new Set<string>();
  for (const t of tasks) {
    if (t.assigned_user_id) ids.add(t.assigned_user_id);
    if (t.created_by_user_id) ids.add(t.created_by_user_id);
  }

  if (ids.size === 0) {
    return tasks.map((t) => ({
      ...t,
      assignee: null,
      creator: null,
    }));
  }

  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", [...ids]);

  if (pErr) {
    throw new Error(`Impossible de charger les profils (tâches) : ${pErr.message}`);
  }

  return mapProfiles(tasks, profiles ?? []);
}
