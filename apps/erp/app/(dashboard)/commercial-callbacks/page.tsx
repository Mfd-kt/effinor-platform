import { redirect } from "next/navigation";

import { CommercialCallbacksTeamClient } from "@/features/commercial-callbacks/components/commercial-callbacks-team-client";
import { canAccessCommercialCallbacksTeamOverview } from "@/features/commercial-callbacks/lib/callback-access";
import { getCommercialCallbackAssigneeOptions } from "@/features/commercial-callbacks/queries/get-callback-assignee-options";
import {
  fetchCommercialCallbacksAllVisible,
  fetchProfileDisplayNamesByIds,
} from "@/features/commercial-callbacks/queries/get-commercial-callbacks-for-agent";
import { PageHeader } from "@/components/shared/page-header";
import { getAccessContext } from "@/lib/auth/access-context";

export default async function CommercialCallbacksTeamPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessCommercialCallbacksTeamOverview(access)) {
    redirect("/");
  }

  const [rows, assigneeOptions] = await Promise.all([
    fetchCommercialCallbacksAllVisible(),
    getCommercialCallbackAssigneeOptions(),
  ]);
  const agentIds = rows
    .map((r) => r.assigned_agent_user_id)
    .filter((id): id is string => id != null && id !== "");
  const agentNameById = await fetchProfileDisplayNamesByIds(agentIds);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Rappels commerciaux — vue équipe"
        description="Consultez les rappels de chaque agent commercial et retirez-les de la liste si nécessaire (suppression logique)."
      />
      <CommercialCallbacksTeamClient
        rows={rows}
        agentNameById={agentNameById}
        currentUserId={access.userId}
        assigneeOptions={assigneeOptions}
      />
    </div>
  );
}
