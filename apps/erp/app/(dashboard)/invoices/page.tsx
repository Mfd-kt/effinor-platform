import { notFound } from "next/navigation";

import { ModuleListShell } from "@/components/shared/module-page";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessInvoicesModule } from "@/lib/auth/module-access";

export default async function InvoicesPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessInvoicesModule(access)) {
    notFound();
  }

  return (
    <div>
      <ModuleListShell
        title="Factures"
        description="Facturation client : échéances, paiements et pièce PDF liée au référentiel documentaire."
        emptyTitle="Aucune facture"
        emptyDescription="Émission et suivi des règlements (Phase 4)."
      />
    </div>
  );
}
