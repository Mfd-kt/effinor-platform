import { notFound } from "next/navigation";

import { ModuleListShell } from "@/components/shared/module-page";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessInstallationsPage } from "@/lib/auth/installations-access";
import { createClient } from "@/lib/supabase/server";

export default async function InstallationsPage() {
  const access = await getAccessContext();
  const supabase = await createClient();
  if (access.kind !== "authenticated" || !(await canAccessInstallationsPage(supabase, access))) {
    notFound();
  }

  return (
    <div>
      <ModuleListShell
        title="Installations"
        description="Planning terrain, équipes, coûts et preuves via documents."
        emptyTitle="Aucune installation"
        emptyDescription="Suivi d’exécution et preuves (Phase 4)."
      />
    </div>
  );
}
