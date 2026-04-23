import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { buttonVariants } from "@/components/ui/button-variants";
import { MyQueueWithCapacityShellAsync } from "@/features/lead-generation/components/my-queue-with-capacity-shell-async";
import { MyQueueEmptyQueueToast } from "@/features/lead-generation/components/my-queue-empty-queue-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeadGenerationMyQueueCeeSheetOptions } from "@/features/lead-generation/queries/get-lead-generation-my-queue-cee-sheet-options";
import { getMyLeadGenerationQueue } from "@/features/lead-generation/queries/get-my-lead-generation-queue";
import { getAccessContext } from "@/lib/auth/access-context";
import {
  canAccessLeadGenerationMyQueue,
  canAccessLeadsModule,
} from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MyLeadGenerationQueuePage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  const sp = await searchParams;
  const showQueueEmptyToast = typeof sp.queueEmpty === "string" && sp.queueEmpty === "1";
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

  return (
    <div className="space-y-8">
      {showQueueEmptyToast ? <MyQueueEmptyQueueToast /> : null}
      <PageHeader
        title="Ma file"
        description="Contacts déjà validés pour le terrain : appels, relances et notes — priorité aux rappels."
        actions={
          canAccessLeadsModule(access) ? (
            <Link href="/leads" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              CRM
            </Link>
          ) : null
        }
      />

      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr]">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            <TableSkeleton rows={5} cols={5} />
          </div>
        }
      >
        <MyQueueWithCapacityShellAsync
          userId={access.userId}
          items={items}
          ceeSheetOptions={ceeSheetOptions}
        />
      </Suspense>
    </div>
  );
}
