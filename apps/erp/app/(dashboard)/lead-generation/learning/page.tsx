import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { LeadGenerationLearningInsightsList } from "@/features/lead-generation/components/lead-generation-learning-insights-list";
import { LeadGenerationMetricCard } from "@/features/lead-generation/components/lead-generation-metric-card";
import { getLeadGenerationLearningInsights } from "@/features/lead-generation/learning/get-lead-generation-learning-insights";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadGenerationLearningPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    notFound();
  }

  const data = await getLeadGenerationLearningInsights();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        title="Learning Loop Lead Generation"
        description="Insights d’amélioration continue basés sur les résultats réels du module."
        actions={
          <Link href="/lead-generation/analytics" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Voir analytics
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <LeadGenerationMetricCard label="Insights générés" value={data.insights.length} />
        <LeadGenerationMetricCard label="Imports analysés" value={data.counts.imports} />
        <LeadGenerationMetricCard label="Stock analysé" value={data.counts.stock} />
        <LeadGenerationMetricCard label="Assignments analysés" value={data.counts.assignments} />
        <LeadGenerationMetricCard
          label="Activités analysées"
          value={data.counts.activities}
          hint={`Généré le ${new Date(data.generatedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Insights et recommandations</h2>
        <LeadGenerationLearningInsightsList insights={data.insights} />
      </section>
    </div>
  );
}
