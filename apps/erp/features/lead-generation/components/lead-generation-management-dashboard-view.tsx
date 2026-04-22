import { BookOpen } from "lucide-react";
import Link from "next/link";

import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { LEADERBOARD_MIN_QUALIFICATION_EVENTS } from "../lib/rank-lead-generation-quantifiers-for-management";
import type { LeadGenerationManagementDashboard } from "../queries/get-lead-generation-management-dashboard";

import { LeadGenerationManagementDashboardFilters } from "./lead-generation-management-dashboard-filters";

function pct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) {
    return "—";
  }
  return `${v} %`;
}

function periodLabel(p: string): string {
  if (p === "today") {
    return "aujourd'hui";
  }
  if (p === "7d") {
    return "7 derniers jours";
  }
  return "30 derniers jours";
}

function shortId(id: string): string {
  return id.length <= 12 ? id : `${id.slice(0, 8)}…`;
}

type Props = {
  data: LeadGenerationManagementDashboard;
  /** Masque l’en-tête de page quand rendu dans {@link LeadGenerationTeamPilotageShell}. */
  embedded?: boolean;
};

export function LeadGenerationManagementDashboardView({ data, embedded = false }: Props) {
  const {
    overview,
    quantifiers,
    quantifierLeaderboard,
    businessLotLeaderboard,
    batches,
    quality,
    highlights,
    filterOptions,
    filters,
  } = data;
  const pl = periodLabel(filters.period);

  const lotsLeaderboardInsufficient = businessLotLeaderboard.kind === "insufficient";
  const quantifierLeaderboardEmpty =
    quantifierLeaderboard.kind === "insufficient" || quantifierLeaderboard.kind === "hidden";
  const noTabularData =
    lotsLeaderboardInsufficient && quantifierLeaderboardEmpty && quantifiers.length === 0 && batches.length === 0;

  return (
    <div className="space-y-8">
      {embedded ? null : (
        <PageHeader
          title="Suivi quantificateurs"
          description="Indicateurs direction : performance des quantificateurs, qualité des lots et retours commerciaux (période filtrable ci-dessous)."
        />
      )}

      <LeadGenerationManagementDashboardFilters
        period={filters.period}
        quantifierUserId={filters.quantifierUserId}
        quantifiers={filterOptions.quantifiers}
      />

      {/* A — Vue d'ensemble (5 KPIs essentiels) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Vue d&apos;ensemble</h2>
        <p className="text-xs text-muted-foreground">
          Période sélectionnée : <span className="font-medium text-foreground">{pl}</span> — indicateurs essentiels pour
          piloter la qualification. Plus de détails dans <span className="font-medium text-foreground">Analytics</span>.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="À traiter (file actuelle)" value={overview.toQualifyNow} hint="Fiches encore à qualifier" />
          <KpiCard label="Qualifiés (période)" value={overview.qualifiedInPeriod} hint="Décisions « Qualifier »" />
          <KpiCard label="Hors cible (période)" value={overview.outOfTargetInPeriod} hint="Quantif. + pilotage" />
          <KpiCard
            label="Taux de qualification"
            value={pct(overview.qualifyRatePercent)}
            hint="Qualif. / (qualif. + hors cible)"
            isText
          />
          <KpiCard label="Lots créés (période)" value={overview.batchesCreatedInPeriod} />
        </div>
      </section>

      {/* Rendement business (fiches commerciales issues du stock filtré) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Rendement business</h2>
        <p className="text-xs text-muted-foreground">
          Comptage des fiches commerciales créées depuis le stock avec{" "}
          <span className="font-medium text-foreground">date de création du lead dans la période</span> — RDV, accords,
          VT et installations attribués au lot d&apos;origine.
        </p>
        <CollapsibleSection
          title="Définitions métier"
          icon={<BookOpen className="size-4" aria-hidden />}
          defaultOpen={false}
        >
          <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-muted-foreground">
            <li>
              <span className="text-foreground/80">Lead converti</span> : ligne stock avec{" "}
              <span className="font-mono text-[10px]">converted_lead_id</span> ; lead actif, créé dans la période.
            </li>
            <li>
              <span className="text-foreground/80">RDV</span> :{" "}
              <span className="font-mono text-[10px]">callback_at</span> renseigné sur le lead.
            </li>
            <li>
              <span className="text-foreground/80">Accord</span> : statut lead{" "}
              <span className="font-mono text-[10px]">accord_received</span> ou{" "}
              <span className="font-mono text-[10px]">converted</span>.
            </li>
            <li>
              <span className="text-foreground/80">VT</span> : au moins une{" "}
              <span className="font-mono text-[10px]">technical_visits</span> non annulée / refusée.
            </li>
            <li>
              <span className="text-foreground/80">Installation</span> : non calculé ici (schéma sans lien opération
              exploitable pour l&apos;agrégat pilotage).
            </li>
          </ul>
          <p className="mt-2 text-[10px] text-muted-foreground/90">
            Les pourcentages sont calculés sur le nombre de leads convertis (dénominateur fiable, aligné stock).
          </p>
        </CollapsibleSection>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            label="Fiches commerciales (stock → lead)"
            value={overview.business.convertedLeads}
            hint="Leads créés dans la période, issus du stock du périmètre"
          />
          <KpiCard label="RDV" value={overview.business.withRdv} hint="callback_at renseigné" />
          <KpiCard label="Accords" value={overview.business.withAccord} hint="Statut lead accord_received / converted" />
          <KpiCard label="Visites techniques" value={overview.business.withVt} hint="VT non annulée / refusée" />
          <KpiCard label="Installations" value={overview.business.withInstallation} hint="Non mesuré (sans lien opération)" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Taux RDV / convertis"
            value={pct(overview.business.rates.rdvVsConverted)}
            hint="% des fiches converties avec RDV"
            isText
          />
          <KpiCard
            label="Taux accord / convertis"
            value={pct(overview.business.rates.accordVsConverted)}
            hint="% des fiches converties avec accord"
            isText
          />
          <KpiCard
            label="Taux VT / convertis"
            value={pct(overview.business.rates.vtVsConverted)}
            hint="% des fiches converties avec VT"
            isText
          />
          <KpiCard
            label="Taux installation / convertis"
            value={pct(overview.business.rates.installationVsConverted)}
            hint="% des fiches converties avec installation"
            isText
          />
        </div>
      </section>

      {noTabularData ? (
        <Card className="border-border/80 border-dashed bg-card/40 shadow-sm">
          <CardContent className="space-y-2 py-12 text-center">
            <p className="text-sm font-medium text-foreground">Pas assez de données sur la période</p>
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              Les classements et tableaux apparaissent à partir de{" "}
              <span className="font-medium text-foreground">{LEADERBOARD_MIN_QUALIFICATION_EVENTS} qualifications</span>{" "}
              minimum par profil. Élargissez la période ou attendez l&apos;activité de quantification.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Top / Bottom lots business (mêmes agrégats que le tableau lots) */}
      {!noTabularData && !lotsLeaderboardInsufficient ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Top / Bottom lots business</h2>
          <p className="text-xs text-muted-foreground">
              Classement sur le périmètre et la période sélectionnés. Score ={" "}
              <span className="font-mono text-[10px]">1000×inst. + 100×VT + 10×accord + 1×RDV</span> ; ex-aequo : plus
              de fiches converties dans la période, puis plus de brut importé (haut) — pour le bas, mêmes critères en
              sens inverse sur les lots volumineux.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-emerald-500/20 bg-emerald-500/[0.06] shadow-sm ring-1 ring-emerald-500/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-emerald-100">Top lots business</CardTitle>
                  <p className="text-xs font-normal text-emerald-200/70">
                    Meilleurs outcomes réels (installations et étapes amont), pas le seul volume.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {businessLotLeaderboard.top.map((row) => (
                    <div
                      key={row.batch.batchId}
                      className="flex flex-col gap-2 rounded-lg border border-emerald-500/15 bg-background/40 px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-lg font-bold tabular-nums text-emerald-400">
                            #{row.displayRank}
                          </span>
                          <Link
                            href={`/lead-generation/imports/${row.batch.batchId}`}
                            className="min-w-0 truncate font-semibold text-primary underline-offset-4 hover:underline"
                          >
                            {row.batch.lotLabel}
                          </Link>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {row.batch.ownerDisplay ?? "—"} · CEE {row.batch.ceeSheetCode ?? "—"}
                        </p>
                        <p className="text-[11px] tabular-nums text-muted-foreground">
                          RDV {row.batch.business.withRdv} · Accords {row.batch.business.withAccord} · VT{" "}
                          {row.batch.business.withVt} · Inst. {row.batch.business.withInstallation}
                          <span className="ml-1 text-[10px] text-muted-foreground/80">· score {row.businessScore}</span>
                        </p>
                      </div>
                      <Badge
                        className="h-6 shrink-0 border-emerald-400/30 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/25"
                        variant="outline"
                      >
                        {row.badgeLabel}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-amber-500/25 bg-amber-500/[0.06] shadow-sm ring-1 ring-amber-500/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-amber-100">Bottom lots business</CardTitle>
                  <p className="text-xs font-normal text-amber-200/70">
                    Lots volumineux avec le score business le plus faible (peu de RDV / accords / VT / installations).
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {businessLotLeaderboard.bottom.map((row) => (
                    <div
                      key={row.batch.batchId}
                      className="flex flex-col gap-2 rounded-lg border border-amber-500/20 bg-background/40 px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-lg font-bold tabular-nums text-amber-400">
                            #{row.displayRank}
                          </span>
                          <Link
                            href={`/lead-generation/imports/${row.batch.batchId}`}
                            className="min-w-0 truncate font-semibold text-primary underline-offset-4 hover:underline"
                          >
                            {row.batch.lotLabel}
                          </Link>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {row.batch.ownerDisplay ?? "—"} · CEE {row.batch.ceeSheetCode ?? "—"}
                        </p>
                        <p className="text-[11px] tabular-nums text-muted-foreground">
                          RDV {row.batch.business.withRdv} · Accords {row.batch.business.withAccord} · VT{" "}
                          {row.batch.business.withVt} · Inst. {row.batch.business.withInstallation}
                          <span className="ml-1 text-[10px] text-muted-foreground/80">· score {row.businessScore}</span>
                        </p>
                      </div>
                      <Badge
                        className="h-6 shrink-0 border-amber-400/35 bg-amber-500/20 text-amber-100 hover:bg-amber-500/25"
                        variant="outline"
                      >
                        {row.badgeLabel}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
        </section>
      ) : null}

      {!noTabularData && quantifierLeaderboard.kind === "ok" ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Top / Bottom quantificateurs</h2>
              <p className="text-xs text-muted-foreground">
                Classement sur le périmètre et la période sélectionnés. Score = taux de qualification − taux de retour
                commercial. Éligibles : au moins {LEADERBOARD_MIN_QUALIFICATION_EVENTS} qualifications chacun et taux de
                qualification calculable ; ex-aequo résolus par le volume de qualifications.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-emerald-500/20 bg-emerald-500/[0.06] shadow-sm ring-1 ring-emerald-500/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-emerald-100">Top 3</CardTitle>
                    <p className="text-xs font-normal text-emerald-200/70">
                      Meilleure combinaison qualification élevée et retours commerciaux faibles.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {quantifierLeaderboard.top.map((row) => (
                      <div
                        key={row.quantifier.userId}
                        className="flex flex-col gap-2 rounded-lg border border-emerald-500/15 bg-background/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <span className="mt-0.5 font-mono text-lg font-bold tabular-nums text-emerald-400">
                            #{row.displayRank}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{row.quantifier.displayName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Qualif. {pct(row.quantifier.qualifyRatePercent)} · Retour {pct(row.quantifier.returnRatePercent)}{" "}
                              · {row.quantifier.qualifiedEventsInPeriod} qualifiés
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground/80">Score {row.score}</p>
                          </div>
                        </div>
                        <Badge
                          className="h-6 shrink-0 border-emerald-400/30 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/25"
                          variant="outline"
                        >
                          {row.badgeLabel}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-amber-500/25 bg-amber-500/[0.06] shadow-sm ring-1 ring-amber-500/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-amber-100">Bottom 3</CardTitle>
                    <p className="text-xs font-normal text-amber-200/70">
                      Performances les plus faibles sur le même score — prioriser le pilotage et la formation.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {quantifierLeaderboard.bottom.map((row) => (
                      <div
                        key={row.quantifier.userId}
                        className="flex flex-col gap-2 rounded-lg border border-amber-500/20 bg-background/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <span className="mt-0.5 font-mono text-lg font-bold tabular-nums text-amber-400">
                            #{row.displayRank}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{row.quantifier.displayName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Qualif. {pct(row.quantifier.qualifyRatePercent)} · Retour {pct(row.quantifier.returnRatePercent)}{" "}
                              · {row.quantifier.qualifiedEventsInPeriod} qualifiés
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground/80">Score {row.score}</p>
                          </div>
                        </div>
                        <Badge
                          className="h-6 shrink-0 border-amber-400/35 bg-amber-500/20 text-amber-100 hover:bg-amber-500/25"
                          variant="outline"
                        >
                          {row.badgeLabel}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
        </section>
      ) : null}

      {/* Alertes synthétiques */}
      <section className="grid gap-4 lg:grid-cols-2">
        <HighlightCard
          title="Top — taux de qualification"
          rows={highlights.topQualifyRate.map((q) => ({
            label: q.displayName,
            sub: `${pct(q.qualifyRatePercent)} · ${q.qualifiedEventsInPeriod} qualif.`,
          }))}
          empty="Pas assez de données sur la période."
        />
        <HighlightCard
          title="Top — retours commerciaux les plus faibles"
          subtitle="Parmi les volumes significatifs"
          rows={highlights.lowestReturnRate.map((q) => ({
            label: q.displayName,
            sub: `${pct(q.returnRatePercent)} retour · ${q.qualifiedEventsInPeriod} qualif.`,
          }))}
          empty="Pas assez de données sur la période."
        />
        <HighlightCard
          title="À surveiller — retour commercial élevé"
          variant="warn"
          rows={highlights.watchHighReturn.map((q) => ({
            label: q.displayName,
            sub: `${pct(q.returnRatePercent)} · ${q.commercialReturnsInPeriod} retours`,
          }))}
          empty="Aucun profil ne dépasse le seuil affiché."
        />
        <HighlightCard
          title="À surveiller — qualification basse"
          variant="warn"
          rows={highlights.watchLowQualify.map((q) => ({
            label: q.displayName,
            sub: `${pct(q.qualifyRatePercent)} · ${q.outOfTargetEventsInPeriod} hors cible`,
          }))}
          empty="Aucun profil ne dépasse le seuil affiché."
        />
      </section>

      {/* B — Quantificateurs */}
      {!noTabularData && quantifiers.length > 0 ? (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Quantificateurs</h2>
        <Card className="border-border/80 bg-card/50 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Quantificateur</TableHead>
                    <TableHead className="text-right">Lots (période)</TableHead>
                    <TableHead className="text-right">Brut importé</TableHead>
                    <TableHead className="text-right">Qualifiés</TableHead>
                    <TableHead className="text-right">Hors cible</TableHead>
                    <TableHead className="text-right">Retours</TableHead>
                    <TableHead className="text-right">Taux qualif.</TableHead>
                    <TableHead className="text-right">Taux retour</TableHead>
                    <TableHead className="text-right">À traiter</TableHead>
                    <TableHead className="text-right">Requalif. +</TableHead>
                    <TableHead className="text-right">Doublon auto</TableHead>
                    <TableHead className="text-right border-l border-border/60 bg-muted/10">Conv. lead</TableHead>
                    <TableHead className="text-right bg-muted/10">RDV</TableHead>
                    <TableHead className="text-right bg-muted/10">Accord</TableHead>
                    <TableHead className="text-right bg-muted/10">VT</TableHead>
                    <TableHead className="text-right bg-muted/10">Inst.</TableHead>
                    <TableHead className="text-right bg-muted/10">% RDV</TableHead>
                    <TableHead className="text-right bg-muted/10">% accord</TableHead>
                    <TableHead className="text-right bg-muted/10">% VT</TableHead>
                    <TableHead className="text-right bg-muted/10">% inst.</TableHead>
                    <TableHead>Dernière activité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quantifiers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={21} className="text-center text-sm text-muted-foreground">
                        Aucun quantificateur dans le périmètre filtré.
                      </TableCell>
                    </TableRow>
                  ) : (
                    quantifiers.map((q) => (
                      <TableRow key={q.userId}>
                        <TableCell className="font-medium">
                          <div>{q.displayName}</div>
                          {q.email ? (
                            <div className="text-xs font-normal text-muted-foreground">{q.email}</div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{q.batchesCreatedInPeriod}</TableCell>
                        <TableCell className="text-right tabular-nums">{q.rawImportedInPeriod}</TableCell>
                        <TableCell className="text-right tabular-nums">{q.qualifiedEventsInPeriod}</TableCell>
                        <TableCell className="text-right tabular-nums">{q.outOfTargetEventsInPeriod}</TableCell>
                        <TableCell className="text-right tabular-nums">{q.commercialReturnsInPeriod}</TableCell>
                        <TableCell className="text-right tabular-nums">{pct(q.qualifyRatePercent)}</TableCell>
                        <TableCell className="text-right tabular-nums">{pct(q.returnRatePercent)}</TableCell>
                        <TableCell className="text-right tabular-nums">{q.toProcessNow}</TableCell>
                        <TableCell className="text-right tabular-nums">{q.requalifiedPositiveInPeriod}</TableCell>
                        <TableCell className="text-right tabular-nums">{q.autoDuplicateOotInPeriod}</TableCell>
                        <TableCell className="text-right tabular-nums border-l border-border/60 bg-muted/5">
                          {q.business.convertedLeads}
                        </TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5">{q.business.withRdv}</TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5">{q.business.withAccord}</TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5">{q.business.withVt}</TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5">{q.business.withInstallation}</TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5 text-xs">
                          {pct(q.business.rates.rdvVsConverted)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5 text-xs">
                          {pct(q.business.rates.accordVsConverted)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5 text-xs">
                          {pct(q.business.rates.vtVsConverted)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5 text-xs">
                          {pct(q.business.rates.installationVsConverted)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {q.lastActivityAt ? formatDateTimeFr(q.lastActivityAt) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
      ) : null}

      {/* C — Lots */}
      {!noTabularData && batches.length > 0 ? (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Lots</h2>
        <p className="text-xs text-muted-foreground">
          Jusqu&apos;à 100 lots les plus récents du périmètre filtré. Retours = événements sur la période sélectionnée.
        </p>
        <Card className="border-border/80 bg-card/50 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Lot</TableHead>
                    <TableHead>Propriétaire</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>CEE</TableHead>
                    <TableHead>Zone / recherche</TableHead>
                    <TableHead className="text-right">Brut</TableHead>
                    <TableHead className="text-right">Acceptés</TableHead>
                    <TableHead className="text-right">Qualifiés</TableHead>
                    <TableHead className="text-right">Hors cible</TableHead>
                    <TableHead className="text-right">À traiter</TableHead>
                    <TableHead className="text-right">Taux qualif.</TableHead>
                    <TableHead className="text-right">Retours</TableHead>
                    <TableHead className="text-right">Taux retour</TableHead>
                    <TableHead className="text-right border-l border-border/60 bg-muted/10">Conv. lead</TableHead>
                    <TableHead className="text-right bg-muted/10">RDV</TableHead>
                    <TableHead className="text-right bg-muted/10">Accord</TableHead>
                    <TableHead className="text-right bg-muted/10">VT</TableHead>
                    <TableHead className="text-right bg-muted/10">Inst.</TableHead>
                    <TableHead className="text-right bg-muted/10">% RDV</TableHead>
                    <TableHead className="text-right bg-muted/10">% accord</TableHead>
                    <TableHead className="text-right bg-muted/10">% VT</TableHead>
                    <TableHead className="text-right bg-muted/10">% inst.</TableHead>
                    <TableHead>Détail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={23} className="text-center text-sm text-muted-foreground">
                        Aucun lot récent.
                      </TableCell>
                    </TableRow>
                  ) : (
                    batches.map((b) => (
                      <TableRow key={b.batchId}>
                        <TableCell className="font-mono text-xs">{shortId(b.batchId)}</TableCell>
                        <TableCell className="text-sm">{b.ownerDisplay ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateTimeFr(b.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">{b.ceeSheetCode ?? "—"}</TableCell>
                        <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                          {b.searchSummary ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{b.importedRaw}</TableCell>
                        <TableCell className="text-right tabular-nums">{b.accepted}</TableCell>
                        <TableCell className="text-right tabular-nums">{b.qualified}</TableCell>
                        <TableCell className="text-right tabular-nums">{b.outOfTarget}</TableCell>
                        <TableCell className="text-right tabular-nums">{b.toProcess}</TableCell>
                        <TableCell className="text-right tabular-nums">{pct(b.qualifyRatePercent)}</TableCell>
                        <TableCell className="text-right tabular-nums">{b.commercialReturnsInPeriod}</TableCell>
                        <TableCell className="text-right tabular-nums">{pct(b.returnRatePercent)}</TableCell>
                        <TableCell className="text-right tabular-nums border-l border-border/60 bg-muted/5">
                          {b.business.convertedLeads}
                        </TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5">{b.business.withRdv}</TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5">{b.business.withAccord}</TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5">{b.business.withVt}</TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5">{b.business.withInstallation}</TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5 text-xs">
                          {pct(b.business.rates.rdvVsConverted)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5 text-xs">
                          {pct(b.business.rates.accordVsConverted)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5 text-xs">
                          {pct(b.business.rates.vtVsConverted)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums bg-muted/5 text-xs">
                          {pct(b.business.rates.installationVsConverted)}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/lead-generation/imports/${b.batchId}`}
                            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                          >
                            Ouvrir
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
      ) : null}

      {/* D — Qualité après commercial */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Qualité après passage commercial</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard
            label="Renvois à la quantification"
            value={quality.returnsInPeriod}
            hint={`Fiches concernées sur ${pl}`}
          />
          <KpiCard
            label="Requalifiés positivement après retour"
            value={quality.requalifiedPositiveInPeriod}
            hint="Au moins une qualification après un retour"
          />
          <KpiCard
            label="Hors cible après retour"
            value={quality.finalOotAfterReturnInPeriod}
            hint="Décision hors cible après un retour"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <HighlightCard
            title="Lots — plus de retours commerciaux (période)"
            rows={[...batches]
              .sort((a, b) => b.commercialReturnsInPeriod - a.commercialReturnsInPeriod)
              .slice(0, 8)
              .map((b) => ({
                label: `${b.ceeSheetCode ?? shortId(b.batchId)} · ${b.ownerDisplay ?? ""}`,
                sub: `${b.commercialReturnsInPeriod} retours · taux retour ${pct(b.returnRatePercent)}`,
              }))}
            empty="Aucun retour sur la période."
          />
          <HighlightCard
            title="Quantificateurs — retours vs qualifications"
            rows={[...quantifiers]
              .filter((q) => q.qualifiedEventsInPeriod > 0)
              .sort((a, b) => (b.returnRatePercent ?? 0) - (a.returnRatePercent ?? 0))
              .slice(0, 8)
              .map((q) => ({
                label: q.displayName,
                sub: `${q.commercialReturnsInPeriod} retours / ${q.qualifiedEventsInPeriod} qualif. (${pct(q.returnRatePercent)})`,
              }))}
            empty="Pas de qualifications sur la période."
          />
        </div>
      </section>

      {/* Lots potentiel / problème */}
      <section className="grid gap-4 lg:grid-cols-2">
        <HighlightCard
          title="Lots à fort potentiel (heuristique)"
          subtitle="Volume + taux de qualification correct + peu de retours"
          rows={highlights.topBatches.map((b) => ({
            label: `${b.ceeSheetCode ?? shortId(b.batchId)}`,
            sub: `${b.importedRaw} brut · qualif. ${pct(b.qualifyRatePercent)} · ${b.commercialReturnsInPeriod} retours`,
          }))}
          empty="Aucun lot ne correspond aux critères."
        />
        <HighlightCard
          title="Lots à problème (heuristique)"
          variant="warn"
          subtitle="Taux de qualification bas ou retours élevés"
          rows={highlights.problemBatches.map((b) => ({
            label: `${b.ceeSheetCode ?? shortId(b.batchId)}`,
            sub: `qualif. ${pct(b.qualifyRatePercent)} · retour ${pct(b.returnRatePercent)} · ${b.importedRaw} brut`,
          }))}
          empty="Aucun lot ne correspond aux critères."
        />
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  isText,
}: {
  label: string;
  value: string | number;
  hint?: string;
  isText?: boolean;
}) {
  return (
    <Card className="border-border/80 bg-card/60 shadow-sm">
      <CardHeader className="space-y-1 pb-2 pt-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        {hint ? <p className="text-[10px] leading-snug text-muted-foreground/90">{hint}</p> : null}
      </CardHeader>
      <CardContent className={cn("pb-4 pt-0", isText ? "text-lg font-semibold" : "text-2xl font-semibold tabular-nums")}>
        {value}
      </CardContent>
    </Card>
  );
}

function HighlightCard({
  title,
  subtitle,
  rows,
  empty,
  variant,
}: {
  title: string;
  subtitle?: string;
  rows: { label: string; sub: string }[];
  empty: string;
  variant?: "warn";
}) {
  return (
    <Card
      className={cn(
        "border-border/80 bg-card/50 shadow-sm",
        variant === "warn" && "border-amber-500/25 bg-amber-500/[0.04]",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">{empty}</p>
        ) : (
          rows.map((r, i) => (
            <div key={`${r.label}-${i}`} className="flex flex-col gap-0.5 border-b border-border/40 pb-2 last:border-0 last:pb-0">
              <span className="font-medium text-foreground">{r.label}</span>
              <span className="text-xs text-muted-foreground">{r.sub}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
