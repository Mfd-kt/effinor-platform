import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { LeadGenerationHubStockSection } from "@/features/lead-generation/components/lead-generation-hub-stock-section";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub, canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadGenerationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    notFound();
  }

  const sp = await searchParams;
  if (typeof sp.view === "string") {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (k === "view") {
        continue;
      }
      if (typeof v === "string" && v.trim() !== "") {
        p.set(k, v);
      }
    }
    const qs = p.toString();
    redirect(qs ? `/lead-generation?${qs}` : "/lead-generation");
  }

  const headerActions = (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {canAccessLeadGenerationMyQueue(access) ? (
        <Link
          href="/lead-generation/my-queue"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground hover:text-foreground",
          )}
        >
          Ma file
        </Link>
      ) : null}
      <Link
        href="/lead-generation/settings"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "border-border/80 bg-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
        )}
      >
        Réglages
      </Link>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
      <PageHeader
        title="Stock leads"
        description="Liste et filtres sur le carnet — qualification et dispatch via le circuit qualificateur."
        actions={headerActions}
      />

      <LeadGenerationHubStockSection searchParams={sp} />
    </div>
  );
}
