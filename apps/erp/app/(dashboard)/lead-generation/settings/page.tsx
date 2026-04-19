import { BarChart3, Brain, Link2, Zap } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { LeadGenerationSettingsPanel } from "@/features/lead-generation/components/lead-generation-settings-panel";
import { getLeadGenerationSettings } from "@/features/lead-generation/settings/get-lead-generation-settings";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadGenerationSettingsPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    notFound();
  }

  const { settings, invalidKeys } = await getLeadGenerationSettings();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Lead Generation — Réglages"
        description="Réglages métier et outils d’analyse — tout reste accessible depuis cette page."
        actions={
          <Link href="/lead-generation" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Pilotage
          </Link>
        }
      />

      <section aria-label="Outils et suivi" className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/lead-generation/automation"
          className={cn(
            "flex items-start gap-3 rounded-xl border border-border/80 bg-card/40 p-4 shadow-sm transition-colors hover:bg-muted/30",
            "ring-1 ring-black/[0.03] dark:ring-white/[0.05]",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-foreground">
            <Zap className="size-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">Automatisations</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">Scénarios et limites automatiques.</span>
          </span>
        </Link>
        <Link
          href="/lead-generation/analytics"
          className={cn(
            "flex items-start gap-3 rounded-xl border border-border/80 bg-card/40 p-4 shadow-sm transition-colors hover:bg-muted/30",
            "ring-1 ring-black/[0.03] dark:ring-white/[0.05]",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-foreground">
            <BarChart3 className="size-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">Analytics</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">Indicateurs et volumes du carnet.</span>
          </span>
        </Link>
        <Link
          href="/lead-generation/learning"
          className={cn(
            "flex items-start gap-3 rounded-xl border border-border/80 bg-card/40 p-4 shadow-sm transition-colors hover:bg-muted/30",
            "ring-1 ring-black/[0.03] dark:ring-white/[0.05]",
            "sm:col-span-2",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-foreground">
            <Brain className="size-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">Learning loop</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">Retours et amélioration continue.</span>
          </span>
        </Link>
        <Link
          href="/lead-generation/stock"
          className={cn(
            "flex items-start gap-3 rounded-xl border border-border/80 bg-card/40 p-4 shadow-sm transition-colors hover:bg-muted/30",
            "ring-1 ring-black/[0.03] dark:ring-white/[0.05]",
            "sm:col-span-2",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-foreground">
            <Link2 className="size-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">Stock et imports</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Accéder au stock complet ou aux lots importés.
            </span>
          </span>
        </Link>
      </section>

      <LeadGenerationSettingsPanel initialSettings={settings} invalidKeys={invalidKeys} />
    </div>
  );
}
