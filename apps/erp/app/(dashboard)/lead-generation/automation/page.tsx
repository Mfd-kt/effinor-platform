import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { LeadGenerationAutomationRunsList } from "@/features/lead-generation/components/lead-generation-automation-runs-list";
import { LeadGenerationControlledAutomationPanel } from "@/features/lead-generation/components/lead-generation-controlled-automation-panel";
import {
  getLeadGenerationAutomationRuns,
  type LeadGenerationAutomationRunListItem,
} from "@/features/lead-generation/queries/get-lead-generation-automation-runs";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadGenerationAutomationPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    notFound();
  }

  let automationRuns: LeadGenerationAutomationRunListItem[] = [];
  try {
    automationRuns = await getLeadGenerationAutomationRuns(12);
  } catch {
    automationRuns = [];
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <PageHeader
        title="Automatisations"
        description="Tâches en lot contrôlées, journalisées. Aucune conversion ni dispatch automatique depuis cet écran."
        actions={
          <Link href="/lead-generation" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Retour cockpit
          </Link>
        }
      />

      <LeadGenerationControlledAutomationPanel />
      <LeadGenerationAutomationRunsList runs={automationRuns} />
    </div>
  );
}
