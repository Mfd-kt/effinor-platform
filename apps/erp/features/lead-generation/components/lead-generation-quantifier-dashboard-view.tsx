import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ArrowRight, CheckCircle2, Info } from "lucide-react";

import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { QuantifierPersonalAlert } from "../domain/quantifier-personal-dashboard";
import type { QuantifierPersonalDashboardData } from "../queries/get-lead-generation-quantifier-personal-dashboard";

function pct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) {
    return "—";
  }
  return `${v} %`;
}

function scoreBadgeUI(badge: QuantifierPersonalDashboardData["score"]["badge"]): {
  label: string;
  emoji: string;
  className: string;
} {
  switch (badge) {
    case "excellent":
      return {
        emoji: "🔥",
        label: "Excellent",
        className: "border-emerald-400/40 bg-emerald-500/20 text-emerald-100",
      };
    case "good":
      return {
        emoji: "✅",
        label: "Bon",
        className: "border-sky-400/35 bg-sky-500/15 text-sky-100",
      };
    case "warn":
      return {
        emoji: "⚠️",
        label: "À améliorer",
        className: "border-amber-400/40 bg-amber-500/20 text-amber-100",
      };
    default:
      return {
        emoji: "❌",
        label: "Faible",
        className: "border-destructive/40 bg-destructive/15 text-destructive-foreground",
      };
  }
}

function qualityBadgeUI(b: QuantifierPersonalDashboardData["qualityBadge"]): { emoji: string; label: string } {
  switch (b) {
    case "high":
      return { emoji: "🟢", label: "Qualité élevée" };
    case "mid":
      return { emoji: "🟡", label: "Qualité moyenne" };
    default:
      return { emoji: "🔴", label: "Qualité à renforcer" };
  }
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const p = max > 0 ? Math.min(100, Math.round((100 * value) / max)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

type Props = {
  data: QuantifierPersonalDashboardData;
};

function alertVisual(kind: QuantifierPersonalAlert["kind"]): {
  Icon: LucideIcon;
  card: string;
  iconWrap: string;
} {
  switch (kind) {
    case "positive":
      return {
        Icon: CheckCircle2,
        card: "border-emerald-500/25 bg-emerald-500/[0.07] ring-1 ring-emerald-500/10",
        iconWrap: "bg-emerald-500/15 text-emerald-200",
      };
    case "warning":
      return {
        Icon: AlertTriangle,
        card: "border-amber-500/30 bg-amber-500/[0.07] ring-1 ring-amber-500/10",
        iconWrap: "bg-amber-500/15 text-amber-200",
      };
    case "danger":
      return {
        Icon: AlertTriangle,
        card: "border-red-500/35 bg-red-500/[0.08] ring-1 ring-red-500/15",
        iconWrap: "bg-red-500/15 text-red-200",
      };
    default:
      return {
        Icon: Info,
        card: "border-border/80 bg-muted/30 ring-1 ring-border/50",
        iconWrap: "bg-muted text-muted-foreground",
      };
  }
}

export function LeadGenerationQuantifierDashboardView({ data }: Props) {
  const {
    displayName,
    today,
    week,
    month,
    score,
    primeToday,
    primeWeek,
    primeMonth,
    qualityBadge,
    ranking,
    goals,
    activity,
    alerts,
  } = data;
  const sb = scoreBadgeUI(score.badge);
  const qb = qualityBadgeUI(qualityBadge);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bonjour, ${displayName}`}
        description="Ton cockpit performance — volume, qualité et impact business sur tes lots."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/lead-generation/quantification" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
              File à qualifier
            </Link>
            <Link href="/lead-generation/imports" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Mes imports
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-primary/25 bg-primary/[0.07] shadow-sm ring-1 ring-primary/10 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ton score</CardTitle>
            <p className="text-xs font-normal text-muted-foreground">
              Sur 100 (7 j) : qualification − retours + bonus volume. Même logique que le classement équipe.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-4xl font-bold tabular-nums text-foreground">{score.value}</p>
            <Badge variant="outline" className={cn("w-fit", sb.className)}>
              <span aria-hidden>{sb.emoji}</span> {sb.label}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Objectifs du jour</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Leads traités (qualif. + hors cible)</span>
                <span className="tabular-nums text-foreground">
                  {goals.treated} / {goals.targetTreated}
                </span>
              </div>
              <ProgressBar value={goals.treated} max={goals.targetTreated} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Leads qualifiés</span>
                <span className="tabular-nums text-foreground">
                  {goals.qualified} / {goals.targetQualified}
                </span>
              </div>
              <ProgressBar value={goals.qualified} max={goals.targetQualified} />
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Tes alertes du moment</h2>
        <p className="text-xs text-muted-foreground">
          Feedback rapide sur ton activité — priorité aux points à corriger, puis aux encouragements.
        </p>
        <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-3">
          {alerts.map((alert) => {
            const { Icon, card, iconWrap } = alertVisual(alert.kind);
            return (
              <Card key={`${alert.kind}-${alert.priority}-${alert.title}`} className={cn("shadow-sm", card)}>
                <CardContent className="flex gap-3 p-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      iconWrap,
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-sm font-semibold leading-snug text-foreground">{alert.title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{alert.message}</p>
                    {alert.actionHint ? (
                      <p className="flex items-start gap-1.5 text-xs font-medium text-foreground/90">
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                        {alert.actionHint}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Aujourd&apos;hui</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Kpi label="Traités" value={today.treated} hint="Qualifiés + hors cible" />
          <Kpi label="Qualifiés" value={today.qualified} />
          <Kpi label="Hors cible" value={today.outOfTarget} />
          <Kpi label="Taux qualification" value={pct(today.qualifyRatePercent)} isText />
          <Kpi label="Retours commercial" value={today.commercialReturns} hint="Sur tes lots" />
          <Kpi label="Doublons auto évités" value={today.autoDuplicateOot} hint="Mis hors cible auto" />
        </div>
        <p className="text-xs text-muted-foreground">
          Retours commerciaux (7 j) : <span className="font-medium text-foreground">{week.commercialReturns}</span> ·
          (30 j) : <span className="font-medium text-foreground">{month.commercialReturns}</span>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Ta prime estimée</h2>
        <p className="text-xs text-muted-foreground">
          Indicatif (paramètres internes). Continue comme ça pour augmenter ta prime.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-amber-500/20 bg-amber-500/[0.06] shadow-sm">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Aujourd&apos;hui</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 text-2xl font-semibold tabular-nums text-amber-100">
              {primeToday.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/60 shadow-sm">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Semaine (7 j)</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 text-2xl font-semibold tabular-nums">
              {primeWeek.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/60 shadow-sm">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Mois (30 j)</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 text-2xl font-semibold tabular-nums">
              {primeMonth.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Impact réel de tes leads sur le business</h2>
        <p className="text-xs text-muted-foreground">
          Périmètre : tes lots — leads convertis dans la fenêtre (voir pilotage direction pour les définitions RDV / accord /
          VT / installation).
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi label="Fiches converties (7 j)" value={week.convertedLeads} />
          <Kpi label="RDV (7 j)" value={week.withRdv} />
          <Kpi label="Accords (7 j)" value={week.withAccord} />
          <Kpi label="VT (7 j)" value={week.withVt} />
          <Kpi label="Installations (7 j)" value={week.withInstallation} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-border/80 bg-card/50 shadow-sm">
            <CardContent className="flex items-center justify-between py-4">
              <span className="text-sm text-muted-foreground">% RDV / qualifiés (7 j)</span>
              <span className="text-lg font-semibold tabular-nums">{pct(week.rdvVsQualifiedPercent)}</span>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/50 shadow-sm">
            <CardContent className="flex items-center justify-between py-4">
              <span className="text-sm text-muted-foreground">% accords / qualifiés (7 j)</span>
              <span className="text-lg font-semibold tabular-nums">{pct(week.accordVsQualifiedPercent)}</span>
            </CardContent>
          </Card>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Les % utilisent tes qualifications 7 j comme dénominateur et les outcomes 7 j comme numérateur — ordre de grandeur
          pour le pilotage individuel.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/80 bg-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Qualité du travail</CardTitle>
            <p className="text-xs font-normal text-muted-foreground">7 derniers jours</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Taux de retour commercial</span>
              <span className="tabular-nums font-medium">{pct(week.returnRatePercent)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Requalifiés après retour</span>
              <span className="tabular-nums font-medium">{week.requalifiedAfterReturn}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Rejets après contrôle (retour → hors cible)</span>
              <span className="tabular-nums font-medium">{week.rejectedAfterControl}</span>
            </div>
            <Badge variant="outline" className="mt-1 w-fit">
              <span aria-hidden>{qb.emoji}</span> {qb.label}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ton classement</CardTitle>
            <p className="text-xs font-normal text-muted-foreground">Score 7 j · équipe quantification</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-2xl font-semibold tabular-nums">
              {ranking.position != null ? (
                <>
                  #{ranking.position}
                  <span className="text-base font-normal text-muted-foreground"> / {ranking.teamSize}</span>
                </>
              ) : (
                <span className="text-base text-muted-foreground">Hors classement (pas encore de lot ou d&apos;activité)</span>
              )}
            </p>
            {ranking.teamAverageScore != null ? (
              <p className={cn(ranking.aboveAverage ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                {ranking.aboveAverage
                  ? "Tu es au-dessus de la moyenne de l’équipe."
                  : "Tu es en dessous de la moyenne de l’équipe — garde le rythme !"}
                <span className="block text-xs text-muted-foreground">
                  Moyenne score : {ranking.teamAverageScore} · Tes qualifications aujourd&apos;hui :{" "}
                  {ranking.userTodayQualifyCount}
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground">Pas assez de données pour la moyenne équipe.</p>
            )}
            {ranking.topPerformerTodayDisplayName && ranking.topPerformerTodayQualifyCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                Top performer du jour :{" "}
                <span className="font-medium text-foreground">{ranking.topPerformerTodayDisplayName}</span> (
                {ranking.topPerformerTodayQualifyCount} qualif.)
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Pas encore de qualifications aujourd&apos;hui dans l&apos;équipe.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Activité récente</h2>
        <Card className="border-border/80 bg-card/50 shadow-sm">
          <CardContent className="divide-y divide-border/60 p-0">
            {activity.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Aucun événement récent sur tes lots.</p>
            ) : (
              activity.map((a, i) => (
                <div key={`${a.at}-${i}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="font-medium text-foreground">{a.companyName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {a.kind === "qualify" ? "Qualifié" : a.kind === "oot" ? "Hors cible" : "Retour commercial"}
                    </Badge>
                    <span className="text-xs tabular-nums text-muted-foreground">{formatDateTimeFr(a.at)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Rappel 30 jours</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi label="Qualifiés (30 j)" value={month.qualified} />
          <Kpi label="Hors cible (30 j)" value={month.outOfTarget} />
          <Kpi label="Taux qualification (30 j)" value={pct(month.qualifyRatePercent)} isText />
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint, isText }: { label: string; value: string | number; hint?: string; isText?: boolean }) {
  return (
    <Card className="border-border/80 bg-card/60 shadow-sm">
      <CardHeader className="space-y-0.5 pb-1 pt-4">
        <CardTitle className="text-[11px] font-medium leading-tight text-muted-foreground">{label}</CardTitle>
        {hint ? <p className="text-[10px] text-muted-foreground/85">{hint}</p> : null}
      </CardHeader>
      <CardContent className={cn("pb-4 pt-0", isText ? "text-lg font-semibold" : "text-2xl font-semibold tabular-nums")}>
        {value}
      </CardContent>
    </Card>
  );
}
