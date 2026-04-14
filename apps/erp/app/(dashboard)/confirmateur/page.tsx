import { notFound, redirect } from "next/navigation";

import { ConfirmateurWorkstation } from "@/features/cee-workflows/components/confirmateur-workstation";
import {
  buildConfirmateurWorkflowPath,
  type ConfirmateurQueueTab,
} from "@/features/cee-workflows/lib/confirmateur-paths";
import { getConfirmateurDashboardData } from "@/features/cee-workflows/queries/get-confirmateur-dashboard-data";
import { canAccessConfirmateurWorkspace } from "@/lib/auth/module-access";
import { getAccessContext } from "@/lib/auth/access-context";

function asConfirmateurQueueTab(raw: string | undefined): ConfirmateurQueueTab | null {
  if (raw === "pending" || raw === "qualified" || raw === "docsReady" || raw === "recent") {
    return raw;
  }
  return null;
}

type PageProps = {
  searchParams?: Promise<{ sheet?: string; workflow?: string; tab?: string }>;
};

export default async function ConfirmateurPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessConfirmateurWorkspace(access)) {
    notFound();
  }

  const params = (await searchParams) ?? {};
  if (params.workflow) {
    redirect(buildConfirmateurWorkflowPath(params.workflow, params.sheet ?? null));
  }

  const dashboard = await getConfirmateurDashboardData(access);

  return (
    <ConfirmateurWorkstation
      sheets={dashboard.sheets}
      queue={dashboard.queue}
      activeSheetId={params.sheet ?? null}
      initialQueueTab={asConfirmateurQueueTab(params.tab)}
    />
  );
}
