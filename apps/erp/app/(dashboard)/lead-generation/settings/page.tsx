import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { LeadGenerationSettingsPanel } from "@/features/lead-generation/components/lead-generation-settings-panel";
import { getLeadGenerationSettings } from "@/features/lead-generation/settings/get-lead-generation-settings";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadGenerationSettingsPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessAdminCeeSheets(access)) {
    notFound();
  }

  const { settings, invalidKeys } = await getLeadGenerationSettings();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Lead Generation - Réglages métier"
        description="Configuration bornée des seuils métier (fallback automatique sur défauts sûrs)."
        actions={
          <Link href="/lead-generation" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Retour au module
          </Link>
        }
      />
      <LeadGenerationSettingsPanel initialSettings={settings} invalidKeys={invalidKeys} />
    </div>
  );
}
