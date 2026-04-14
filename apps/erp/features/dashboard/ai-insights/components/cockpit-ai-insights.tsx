import { Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiInsightResult } from "@/features/dashboard/ai-insights/domain/types";
import { buildAdminInsightContext, buildDirectorInsightContext } from "@/features/dashboard/ai-insights/lib/build-insight-contexts";
import { generateAiInsights } from "@/features/dashboard/ai-insights/services/generate-insights";
import type { CockpitBundle } from "@/features/dashboard/queries/get-cockpit-bundle";
import { cn } from "@/lib/utils";

function AiInsightSummaryCard({ result }: { result: AiInsightResult }) {
  return (
    <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-background dark:border-violet-900/40 dark:from-violet-950/25">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-600 dark:text-violet-400" />
          <CardTitle className="text-base font-semibold">Synthèse IA</CardTitle>
        </div>
        <CardDescription>
          {result.heuristicOnly
            ? "Analyse métier (sans appel LLM — configurez OPENAI_API_KEY pour enrichir)."
            : "Analyse enrichie à partir des agrégats cockpit."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground/90">{result.summary}</p>
      </CardContent>
    </Card>
  );
}

function AiInsightPriorityList({ title, items, variant }: { title: string; items: string[]; variant: "default" | "risk" }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="space-y-2">
        {items.map((line, i) => (
          <li
            key={i}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm leading-snug",
              variant === "risk"
                ? "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20"
                : "border-border/70 bg-card/40",
            )}
          >
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AiInsightRecommendationPanel({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 px-4 py-3 dark:border-emerald-900/35 dark:bg-emerald-950/15">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
        Recommandations
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-foreground/90">
        {items.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export function AiInsightsLayout({ result }: { result: AiInsightResult }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <AiInsightSummaryCard result={result} />
      </div>
      <AiInsightPriorityList title="Constats" items={result.findings} variant="default" />
      <AiInsightPriorityList title="Priorités" items={result.priorities} variant="default" />
      <div className="lg:col-span-2 space-y-4">
        <AiInsightRecommendationPanel items={result.recommendations} />
        <AiInsightPriorityList title="Risques" items={result.risks} variant="risk" />
      </div>
    </div>
  );
}

export async function CockpitAiInsightsSection({
  bundle,
  audience,
}: {
  bundle: CockpitBundle;
  audience: "admin" | "director";
}) {
  const ctx =
    audience === "admin" ? buildAdminInsightContext(bundle) : buildDirectorInsightContext(bundle);
  const result = await generateAiInsights(ctx, audience);
  return <AiInsightsLayout result={result} />;
}
