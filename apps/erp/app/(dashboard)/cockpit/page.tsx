import { notFound } from "next/navigation";

import { CommandCockpitShell } from "@/features/cockpit/components/command-cockpit-shell";
import { loadCommandCockpitData } from "@/features/cockpit/load-cockpit-data";
import { CommandCockpitRealtimeBoundary } from "@/features/cockpit/realtime";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessCockpitRoute } from "@/lib/auth/module-access";

export default async function CockpitPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessCockpitRoute(access))) {
    notFound();
  }

  const data = await loadCommandCockpitData(access);
  if (!data) {
    notFound();
  }

  return (
    <CommandCockpitRealtimeBoundary userId={access.userId}>
      <CommandCockpitShell data={data} />
    </CommandCockpitRealtimeBoundary>
  );
}
