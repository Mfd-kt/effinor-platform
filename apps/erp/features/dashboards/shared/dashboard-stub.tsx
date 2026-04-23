import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import { DashboardLayout, KpiGrid } from "./dashboard-layout";
import { KpiStatCard } from "./kpi-stat-card";
import type { DashboardPeriod } from "./types";

export type StubKpi = {
  label: string;
  /** Valeur affichée (déjà formatée) — un placeholder « — » est acceptable. */
  value: string;
  sublabel?: string;
  icon?: LucideIcon;
};

export type StubFeature = {
  /** Section attendue (« Graphique », « Liste », « Carte », « Action »). */
  type: "graph" | "list" | "map" | "cta";
  title: string;
  description?: string;
};

/** CTA principal affiché dans le header du dashboard et répété en bas. */
export type PrimaryCta = {
  label: string;
  href: string;
  icon?: LucideIcon;
};

type Props = {
  title: string;
  description: string;
  period?: DashboardPeriod;
  kpis: StubKpi[];
  features: StubFeature[];
  primaryCta?: PrimaryCta;
  /** Texte affiché dans la bannière « scaffold » (rappel de l'état v1). */
  roadmapNote?: string;
  className?: string;
};

const TYPE_LABEL: Record<StubFeature["type"], string> = {
  graph: "Graphique",
  list: "Liste",
  map: "Carte",
  cta: "Action rapide",
};

/**
 * Squelette commun pour les dashboards de rôles non encore implémentés.
 * Affiche les KPIs cibles (placeholders) + un récap des blocs prévus, dans le même
 * gabarit visuel que les dashboards finaux pour valider le design system.
 */
export function DashboardStub({
  title,
  description,
  period,
  kpis,
  features,
  primaryCta,
  roadmapNote,
  className,
}: Props) {
  const CtaIcon = primaryCta?.icon;
  const ctaButton = primaryCta ? (
    <Link
      href={primaryCta.href}
      className={cn(buttonVariants({ variant: "default", size: "sm" }))}
    >
      {CtaIcon ? <CtaIcon className="size-3.5" aria-hidden /> : null}
      {primaryCta.label}
    </Link>
  ) : null;

  return (
    <DashboardLayout
      title={title}
      description={description}
      period={period}
      className={className}
      actions={ctaButton}
    >
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex items-start gap-3 px-4 py-3 text-sm">
          <Construction className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          <div className="space-y-0.5">
            <p className="font-medium text-foreground">Dashboard en cours d'implémentation</p>
            <p className="text-xs text-muted-foreground">
              {roadmapNote ??
                "Cette vue présente la maquette des KPIs et widgets prévus. Les valeurs sont des placeholders."}
            </p>
          </div>
        </CardContent>
      </Card>

      <KpiGrid cols={(kpis.length === 5 ? 5 : kpis.length >= 4 ? 4 : kpis.length >= 3 ? 3 : 2)}>
        {kpis.map((kpi) => (
          <KpiStatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            sublabel={kpi.sublabel}
            icon={kpi.icon}
          />
        ))}
      </KpiGrid>

      <div className={cn("grid gap-3", features.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
        {features.map((feature) => (
          <Card key={feature.title} className="border-dashed">
            <CardContent className="space-y-1 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {TYPE_LABEL[feature.type]}
              </p>
              <p className="text-sm font-medium text-foreground">{feature.title}</p>
              {feature.description ? (
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
