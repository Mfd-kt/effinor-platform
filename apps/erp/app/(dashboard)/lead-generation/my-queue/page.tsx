import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { MyLeadGenerationQueueAgentShell } from "@/features/lead-generation/components/my-lead-generation-queue-agent-shell";
import { getLeadGenerationDispatchPolicy } from "@/features/lead-generation/lib/agent-dispatch-policy";
import { getLeadGenerationMyQueueCeeSheetOptions } from "@/features/lead-generation/queries/get-lead-generation-my-queue-cee-sheet-options";
import { getMyLeadGenerationQueue } from "@/features/lead-generation/queries/get-my-lead-generation-queue";
import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/auth/access-context";
import {
  canAccessLeadGenerationHub,
  canAccessLeadGenerationMyQueue,
  canAccessLeadsModule,
} from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyLeadGenerationQueuePage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationMyQueue(access)) {
    notFound();
  }

  let items: Awaited<ReturnType<typeof getMyLeadGenerationQueue>> = [];
  try {
    items = await getMyLeadGenerationQueue(access.userId);
  } catch {
    items = [];
  }

  let ceeSheetOptions: Awaited<ReturnType<typeof getLeadGenerationMyQueueCeeSheetOptions>> = [];
  try {
    ceeSheetOptions = await getLeadGenerationMyQueueCeeSheetOptions(access);
  } catch {
    ceeSheetOptions = [];
  }

  const hub = await canAccessLeadGenerationHub(access);

  const supabase = await createClient();
  const dispatchPolicy = await getLeadGenerationDispatchPolicy(supabase, access.userId);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <PageHeader
        title="Mes fiches à traiter"
        description="Contacts déjà validés pour le terrain : appels, relances et notes — priorité aux rappels."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {hub ? (
              <Link
                href="/lead-generation"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-muted-foreground hover:text-foreground",
                )}
              >
                Stock
              </Link>
            ) : null}
            {canAccessLeadsModule(access) ? (
              <Link href="/leads" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                CRM
              </Link>
            ) : null}
          </div>
        }
      />

      <MyLeadGenerationQueueAgentShell
        items={items}
        ceeSheetOptions={ceeSheetOptions}
        viewerUserId={access.userId}
        effectiveStockCap={dispatchPolicy.effectiveStockCap}
      />
    </div>
  );
}
