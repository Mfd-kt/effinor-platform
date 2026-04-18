import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { MyLeadGenerationQueueSummary } from "@/features/lead-generation/components/my-lead-generation-queue-summary";
import { MyLeadGenerationQueueWorkbench } from "@/features/lead-generation/components/my-lead-generation-queue-workbench";
import { getMyLeadGenerationQueue } from "@/features/lead-generation/queries/get-my-lead-generation-queue";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationMyQueue, canAccessLeadsModule } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyLeadGenerationQueuePage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationMyQueue(access)) {
    notFound();
  }

  const items = await getMyLeadGenerationQueue(access.userId);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <PageHeader
        title="Mes fiches à traiter"
        description="Vos prospections attribuées : relances, priorités et actions rapides — tout pour enchaîner les appels."
        actions={
          canAccessLeadsModule(access) ? (
            <Link href="/leads" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Fiches prospects CRM
            </Link>
          ) : null
        }
      />

      <MyLeadGenerationQueueSummary items={items} />

      <MyLeadGenerationQueueWorkbench items={items} />
    </div>
  );
}
