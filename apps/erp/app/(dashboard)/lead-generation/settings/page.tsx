import { GraduationCap, History, PlayCircle, Sliders, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { PageHeader } from "@/components/shared/page-header";
import { LeadGenerationAutomationRunsList } from "@/features/lead-generation/components/lead-generation-automation-runs-list";
import { LeadGenerationControlledAutomationPanel } from "@/features/lead-generation/components/lead-generation-controlled-automation-panel";
import { LeadGenerationLearningInsightsList } from "@/features/lead-generation/components/lead-generation-learning-insights-list";
import { LeadGenerationMetricCard } from "@/features/lead-generation/components/lead-generation-metric-card";
import { LeadGenerationSettingsPanel } from "@/features/lead-generation/components/lead-generation-settings-panel";
import { getLeadGenerationLearningInsights } from "@/features/lead-generation/learning/get-lead-generation-learning-insights";
import {
  getLeadGenerationAutomationRuns,
  type LeadGenerationAutomationRunListItem,
} from "@/features/lead-generation/queries/get-lead-generation-automation-runs";
import { getLeadGenerationSettings } from "@/features/lead-generation/settings/get-lead-generation-settings";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

export const dynamic = "force-dynamic";

export default async function LeadGenerationSettingsPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    notFound();
  }

  const [{ settings, invalidKeys }, automationRunsResult, learning] = await Promise.all([
    getLeadGenerationSettings(),
    getLeadGenerationAutomationRuns(12).catch(
      () => [] as LeadGenerationAutomationRunListItem[],
    ),
    getLeadGenerationLearningInsights().catch(() => null),
  ]);

  const automationRuns = automationRunsResult;
  const lastRunAt = automationRuns[0]?.startedAt ?? null;
  const lastRunLabel = lastRunAt
    ? new Date(lastRunAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
    : null;
  const generatedAtLabel = learning?.generatedAt
    ? new Date(learning.generatedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Réglages"
        description="Scoring, dispatch, recyclage, automatisations et apprentissage continu du module."
      />

      <section className="space-y-4">
        <SectionHeader
          icon={<Sliders className="size-4" aria-hidden />}
          title="Configuration métier"
          description="Règles de scoring, file de dispatch, recyclage et limites d'exécution. Modifiables à chaud."
        />
        <LeadGenerationSettingsPanel initialSettings={settings} invalidKeys={invalidKeys} />
      </section>

      <section className="space-y-4">
        <SectionHeader
          icon={<PlayCircle className="size-4" aria-hidden />}
          title="Automatisations contrôlées"
          description="Lancer manuellement une tâche en lot et consulter l'historique. Aucune conversion ni dispatch automatique."
        />
        <CollapsibleSection
          title="Lancer une tâche en lot"
          icon={<PlayCircle className="size-4" aria-hidden />}
        >
          <LeadGenerationControlledAutomationPanel />
        </CollapsibleSection>
        <CollapsibleSection
          title="Historique des runs"
          icon={<History className="size-4" aria-hidden />}
          badge={
            automationRuns.length > 0 ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {automationRuns.length} run{automationRuns.length > 1 ? "s" : ""}
              </span>
            ) : null
          }
        >
          {automationRuns.length === 0 ? (
            <p className="rounded-md border border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
              Aucun run pour l'instant. Lance une tâche au-dessus pour générer le premier.
            </p>
          ) : (
            <div className="space-y-3">
              {lastRunLabel ? (
                <p className="text-xs text-muted-foreground">Dernier run : {lastRunLabel}</p>
              ) : null}
              <LeadGenerationAutomationRunsList runs={automationRuns} />
            </div>
          )}
        </CollapsibleSection>
      </section>

      <section className="space-y-4">
        <SectionHeader
          icon={<GraduationCap className="size-4" aria-hidden />}
          title="Apprentissage continu"
          description="Insights d'amélioration basés sur les résultats réels du module (sources, conversion, exécution)."
        />
        {learning ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <LeadGenerationMetricCard label="Insights générés" value={learning.insights.length} />
              <LeadGenerationMetricCard label="Imports analysés" value={learning.counts.imports} />
              <LeadGenerationMetricCard label="Stock analysé" value={learning.counts.stock} />
              <LeadGenerationMetricCard label="Assignments analysés" value={learning.counts.assignments} />
              <LeadGenerationMetricCard
                label="Activités analysées"
                value={learning.counts.activities}
                hint={generatedAtLabel ? `Généré le ${generatedAtLabel}` : undefined}
              />
            </div>
            <CollapsibleSection
              title="Insights et recommandations"
              icon={<Sparkles className="size-4" aria-hidden />}
              badge={
                learning.insights.length > 0 ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {learning.insights.length}
                  </span>
                ) : null
              }
            >
              <LeadGenerationLearningInsightsList insights={learning.insights} />
            </CollapsibleSection>
          </>
        ) : (
          <p className="rounded-md border border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
            Indisponible pour le moment — les insights seront recalculés au prochain passage.
          </p>
        )}
      </section>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border/60 pb-3">
      <span className="mt-0.5 flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
