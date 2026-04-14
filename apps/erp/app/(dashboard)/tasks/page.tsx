import { PageHeader } from "@/components/shared/page-header";
import { TaskCreateForm } from "@/features/tasks/components/task-create-form";
import { TasksList } from "@/features/tasks/components/tasks-list";
import { getTasksForAccess } from "@/features/tasks/queries/get-tasks";
import { getLeads } from "@/features/leads/queries/get-leads";
import { getLeadFormOptions } from "@/features/leads/queries/get-lead-form-options";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAssignTasksToTeam } from "@/lib/auth/task-permissions";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const access = await getAccessContext();

  if (access.kind !== "authenticated") {
    return null;
  }

  const canAssign = canAssignTasksToTeam(access);

  let tasks;
  try {
    tasks = await getTasksForAccess(access);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du chargement des tâches.";
    return (
      <div>
        <PageHeader
          title="Tâches"
          description="Suivi des actions : priorité, échéance, rattachement dossier ou bénéficiaire."
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      </div>
    );
  }

  const [assigneeData, leadsList] = canAssign
    ? await Promise.all([getLeadFormOptions(), getLeads(access)])
    : [{ profiles: [] as { id: string; label: string }[] }, []];

  const leadOptions = canAssign
    ? leadsList.slice(0, 400).map((l) => ({
        id: l.id,
        label: l.company_name?.trim() || l.id,
      }))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tâches"
        description="Suivi des actions : priorité, échéance, rattachement à une fiche prospect. La direction peut créer des tâches et les assigner à un membre de l’équipe."
      />

      {canAssign ? (
        <TaskCreateForm assignees={assigneeData.profiles} leads={leadOptions} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Vous voyez les tâches qui vous sont assignées ou que vous avez créées. Pour créer une tâche pour un
          collaborateur, un compte direction ou administrateur est requis.
        </p>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Liste</h2>
        <TasksList tasks={tasks} />
      </div>
    </div>
  );
}
