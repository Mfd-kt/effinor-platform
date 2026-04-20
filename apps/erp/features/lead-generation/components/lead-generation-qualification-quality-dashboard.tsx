import { cn } from "@/lib/utils";

import type { LeadGenerationQualificationQualityStats } from "../queries/get-lead-generation-qualification-quality-stats";

type Props = {
  stats: LeadGenerationQualificationQualityStats;
  className?: string;
};

function fmtPct(v: number | null): string {
  if (v == null) {
    return "—";
  }
  return `${v} %`;
}

function KpiCard({
  title,
  subtitle,
  valueMain,
  valueToday,
  value7d,
  footnote,
  valueClassName,
}: {
  title: string;
  subtitle?: string;
  valueMain?: string;
  valueToday?: number;
  value7d?: number;
  footnote?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-card/50 px-4 py-3 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {subtitle ? <p className="mt-0.5 text-[11px] text-muted-foreground/90">{subtitle}</p> : null}
      {valueMain != null ? (
        <p className={cn("mt-1 text-2xl font-semibold tabular-nums", valueClassName)}>{valueMain}</p>
      ) : (
        <p className={cn("mt-1 text-sm tabular-nums leading-relaxed", valueClassName)}>
          <span className="font-semibold">{valueToday ?? 0}</span>
          <span className="text-muted-foreground"> aujourd’hui</span>
          <span className="mx-1.5 text-muted-foreground">·</span>
          <span className="font-semibold">{value7d ?? 0}</span>
          <span className="text-muted-foreground"> sur 7 j</span>
        </p>
      )}
      {footnote ? <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{footnote}</p> : null}
    </div>
  );
}

export function LeadGenerationQualificationQualityDashboard({ stats, className }: Props) {
  const { rates } = stats;

  return (
    <section
      className={cn(
        "rounded-xl border border-border/80 bg-card/35 p-4 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05]",
        className,
      )}
    >
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Qualité de qualification</h2>
          <p className="text-xs text-muted-foreground">
            Lecture opérationnelle : file actuelle, retours commerciaux, hors cible et requalifications (UTC).
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="À qualifier"
          subtitle="En file quantification maintenant"
          valueMain={String(stats.toQualifyNow)}
          footnote="Fiches pending / to_validate, sans assignation ni doublon, statut new ou ready."
        />
        <KpiCard
          title="Retours commerciaux"
          subtitle="Fiches distinctes ayant un retour enregistré"
          valueToday={stats.commercialReturns.today}
          value7d={stats.commercialReturns.last7Days}
          footnote="Basé sur l’audit « retour quantification »."
        />
        <KpiCard
          title="Hors cible"
          subtitle="Décisions manuelles (quantificateur ou pilotage)"
          valueToday={stats.manualOutOfTarget.today}
          value7d={stats.manualOutOfTarget.last7Days}
          valueClassName="text-destructive"
          footnote="Quantificateur : revue hors cible. Hub : clôture stock avec motif pilotage."
        />
        <KpiCard
          title="Doublons hors cible"
          subtitle="Exclusion automatique à l’import"
          valueToday={stats.autoDuplicateOutOfTarget.today}
          value7d={stats.autoDuplicateOutOfTarget.last7Days}
          footnote="Comptage sur la date de création de la fiche (rejet auto_oot:duplicate_of_out_of_target)."
        />
        <KpiCard
          title="Requalifiés"
          subtitle="Repasse qualified après un retour commercial"
          valueToday={stats.requalifiedPositive.today}
          value7d={stats.requalifiedPositive.last7Days}
          valueClassName="text-emerald-700 dark:text-emerald-400"
          footnote="Fiches avec au moins un retour commercial antérieur à une validation quantificateur."
        />
      </div>

      <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
        <p className="text-[11px] font-medium text-muted-foreground">Indicateurs sur 7 jours (périmètre affiché)</p>
        <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Retours / qualifications</dt>
            <dd className="font-medium tabular-nums">{fmtPct(rates.returnVsQualify7d)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Part hors cible manuel</dt>
            <dd className="font-medium tabular-nums">{fmtPct(rates.outOfTargetShare7d)}</dd>
            <dd className="text-[10px] text-muted-foreground">vs décisions qualify + hors cible manuel</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Requalifiés / fiches avec retour</dt>
            <dd className="font-medium tabular-nums">{fmtPct(rates.requalifyVsReturns7d)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
