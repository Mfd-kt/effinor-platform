import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CloserWorkstation } from "@/features/cee-workflows/components/closer-workstation";
import { getCloserDashboardData } from "@/features/cee-workflows/queries/get-closer-dashboard-data";
import type { CloserQueueTab } from "@/features/cee-workflows/lib/closer-paths";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessCloserWorkspace } from "@/lib/auth/module-access";

function asCloserQueueTab(raw: string | undefined): CloserQueueTab | null {
  if (
    raw === "pending" ||
    raw === "waitingSignature" ||
    raw === "followUps" ||
    raw === "signed" ||
    raw === "lost"
  ) {
    return raw;
  }
  return null;
}

type PageProps = {
  searchParams?: Promise<{ sheet?: string; tab?: string; lead?: string }>;
};

export default async function CloserPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessCloserWorkspace(access)) {
    notFound();
  }

  const params = (await searchParams) ?? {};
  const dashboard = await getCloserDashboardData(access);

  return (
    <Suspense
      fallback={<p className="p-4 text-sm text-muted-foreground">Chargement du poste closer…</p>}
    >
      <CloserWorkstation
        sheets={dashboard.sheets}
        queue={dashboard.queue}
        activeSheetId={params.sheet ?? null}
        initialQueueTab={asCloserQueueTab(params.tab)}
        viewerUserId={access.userId}
      />
    </Suspense>
  );
}
