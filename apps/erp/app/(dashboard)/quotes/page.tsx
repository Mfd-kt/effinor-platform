import { notFound } from "next/navigation";

import { ModuleListShell } from "@/components/shared/module-page";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessQuotesModule } from "@/lib/auth/module-access";

export default async function QuotesPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessQuotesModule(access)) {
    notFound();
  }

  return (
    <div>
      <ModuleListShell
        title="Devis"
        description="Propositions commerciales, lignes, montants et document PDF principal."
        emptyTitle="Aucun devis"
        emptyDescription="Création et signature pilotées depuis le pipeline commercial (Phase 4)."
      />
    </div>
  );
}
