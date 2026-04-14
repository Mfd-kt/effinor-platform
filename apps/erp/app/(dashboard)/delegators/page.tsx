import { notFound } from "next/navigation";

import { ModuleListShell } from "@/components/shared/module-page";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessDelegatorsModule } from "@/lib/auth/module-access";

export default async function DelegatorsPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessDelegatorsModule(access)) {
    notFound();
  }
  return (
    <ModuleListShell
      title="Délégataires"
      description="Partenaires CEE, coordonnées et factures de primes associées."
      emptyTitle="Aucun délégataire"
      emptyDescription="Annuaire et pièces primes (Phase 4)."
    />
  );
}
