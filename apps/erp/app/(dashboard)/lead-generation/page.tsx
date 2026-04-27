import { notFound, redirect } from "next/navigation";

import { LeadGenerationHubStockSection } from "@/features/lead-generation/components/lead-generation-hub-stock-section";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub, canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";

export const dynamic = "force-dynamic";

export default async function LeadGenerationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    notFound();
  }
  const canHub = await canAccessLeadGenerationHub(access);
  if (!canHub) {
    if (canAccessLeadGenerationMyQueue(access)) {
      redirect("/lead-generation/my-queue");
    }
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

  return (
    <div className="space-y-6 pb-10">
      <p className="text-sm text-muted-foreground">
        Fiches récupérées, prêtes à qualifier et à dispatcher.
      </p>
      <LeadGenerationHubStockSection searchParams={sp} />
    </div>
  );
}
