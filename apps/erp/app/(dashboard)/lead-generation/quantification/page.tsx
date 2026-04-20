import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { LeadGenerationQualificationQualityDashboard } from "@/features/lead-generation/components/lead-generation-qualification-quality-dashboard";
import { LeadGenerationQuantificationActions } from "@/features/lead-generation/components/lead-generation-quantification-actions";
import { ImportBatchSyncButton } from "@/features/lead-generation/components/import-batch-sync-button";
import { LeadGenerationQuantifierGenerateModal } from "@/features/lead-generation/components/lead-generation-quantifier-generate-modal";
import { buildLeadGenerationStreetViewModel } from "@/features/lead-generation/lib/lead-generation-street-view";
import { resolveQuantificationImportBatchScope } from "@/features/lead-generation/lib/quantification-viewer-scope";
import { getLeadGenerationCeeImportScope } from "@/features/lead-generation/queries/get-lead-generation-cee-import-scope";
import type { LeadGenerationStockRow } from "@/features/lead-generation/domain/stock-row";
import { getLeadGenerationQualificationQualityStats } from "@/features/lead-generation/queries/get-lead-generation-qualification-quality-stats";
import { getLeadGenerationQuantificationQueue } from "@/features/lead-generation/queries/get-lead-generation-quantification-queue";
import { getLeadGenerationQuantificationStats } from "@/features/lead-generation/queries/get-lead-generation-quantification-stats";
import { getLeadGenerationQuantifierCeeOverview } from "@/features/lead-generation/queries/get-lead-generation-quantifier-cee-overview";
import { getLeadGenerationQuantifierPilotage } from "@/features/lead-generation/queries/get-lead-generation-quantifier-pilotage";
import { getAccessContext } from "@/lib/auth/access-context";
import {
  canAccessLeadGenerationHub,
  canAccessLeadGenerationQuantification,
  canAccessLeadGenerationQuantifierImports,
} from "@/lib/auth/module-access";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function phoneDisplay(phone: string | null | undefined, normalized: string | null | undefined): string {
  const p = (phone ?? normalized ?? "").trim();
  return p || "—";
}

function qualificationStatusLabel(stock: LeadGenerationStockRow): { label: string; className: string } {
  if (stock.returned_from_commercial_at) {
    return {
      label: "À revoir",
      className: "bg-orange-500/15 text-orange-900 dark:text-orange-200",
    };
  }
  if (stock.qualification_status === "to_validate") {
    return {
      label: "À qualifier",
      className: "bg-amber-500/15 text-amber-900 dark:text-amber-200",
    };
  }
  if (stock.qualification_status === "pending") {
    return {
      label: "À qualifier",
      className: "bg-sky-500/15 text-sky-900 dark:text-sky-200",
    };
  }
  return {
    label: stock.qualification_status,
    className: "bg-muted text-muted-foreground",
  };
}

export default async function LeadGenerationQuantificationPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationQuantification(access)) {
    notFound();
  }

  const batchScope = await resolveQuantificationImportBatchScope(access);
  if (!batchScope) {
    notFound();
  }
  const hubView = await canAccessLeadGenerationHub(access);

  let ceeScope = { sheets: [] as { id: string; code: string; label: string }[], teams: [] as { id: string; ceeSheetId: string; name: string }[] };
  try {
    ceeScope = await getLeadGenerationCeeImportScope();
  } catch {
    ceeScope = { sheets: [], teams: [] };
  }

  const [rows, stats, qualityStats, ceeOverview, pilotage] = await Promise.all([
    getLeadGenerationQuantificationQueue(200, batchScope),
    getLeadGenerationQuantificationStats(batchScope),
    getLeadGenerationQualificationQualityStats(batchScope),
    getLeadGenerationQuantifierCeeOverview(batchScope),
    getLeadGenerationQuantifierPilotage(batchScope, { recentBatchLimit: 25 }),
  ]);

  const showImportsLink = canAccessLeadGenerationQuantifierImports(access);
  const scopeDescription = hubView
    ? "Vue globale (pilotage) : tous les lots et toutes les fiches à qualifier."
    : "Uniquement les leads issus de vos propres lots Apify / imports. Chaque lot est rattaché à vous via le champ « créé par » du lot.";

  return (
    <div className="space-y-6">
      <PageHeader
        title={hubView ? "Quantification — vue globale" : "Mes lots à qualifier"}
        description={scopeDescription}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <LeadGenerationQuantifierGenerateModal ceeScope={ceeScope} />
            {showImportsLink ? (
              <Link
                href="/lead-generation/imports"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Mes imports
              </Link>
            ) : null}
          </div>
        }
      />

      <LeadGenerationQualificationQualityDashboard stats={qualityStats} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/80 bg-card/50 px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">À qualifier (file)</p>
          <p className="text-2xl font-semibold tabular-nums">{qualityStats.toQualifyNow}</p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card/50 px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Qualifiées aujourd’hui</p>
          <p className="text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {stats.qualifiedTodayCount}
          </p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card/50 px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Hors cible aujourd’hui</p>
          <p className="text-2xl font-semibold tabular-nums text-destructive">{stats.outOfTargetTodayCount}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/80 bg-card/40 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">
          {hubView ? "Synthèse tous lots (stocks liés à un import)" : "Vos indicateurs (tous vos lots)"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Lots comptabilisés : {pilotage.lifetime.batchCount}. Taux de qualification (décisions prises) :{" "}
          {pilotage.lifetime.avgQualificationRatePercent != null
            ? `${pilotage.lifetime.avgQualificationRatePercent} %`
            : "—"}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground">Brut importé (lots)</p>
            <p className="text-lg font-semibold tabular-nums">{pilotage.lifetime.importedRawSum}</p>
          </div>
          <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground">Qualifiés (cumul)</p>
            <p className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              {pilotage.lifetime.qualifiedCount}
            </p>
          </div>
          <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground">Hors cible (cumul)</p>
            <p className="text-lg font-semibold tabular-nums text-destructive">{pilotage.lifetime.rejectedCount}</p>
          </div>
          <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground">Reste file à qualifier</p>
            <p className="text-lg font-semibold tabular-nums">{pilotage.lifetime.pendingWorkCount}</p>
          </div>
          <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground">Lots créés</p>
            <p className="text-lg font-semibold tabular-nums">{pilotage.lifetime.batchCount}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/80 shadow-sm">
        <table className="w-full min-w-[1080px] text-sm">
          <thead className="border-b border-border/80 bg-muted/40">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">Lot</th>
              {hubView ? <th className="px-3 py-2.5 text-left font-medium">Créé par</th> : null}
              <th className="px-3 py-2.5 text-left font-medium">Date</th>
              <th className="px-3 py-2.5 text-left font-medium">CEE</th>
              <th className="px-3 py-2.5 text-left font-medium">Zone / recherche</th>
              <th className="px-3 py-2.5 text-right font-medium">Brut import</th>
              <th className="px-3 py-2.5 text-right font-medium">Acceptés</th>
              <th className="px-3 py-2.5 text-right font-medium">Qualifiés</th>
              <th className="px-3 py-2.5 text-right font-medium">Hors cible</th>
              <th className="px-3 py-2.5 text-right font-medium">À traiter</th>
              <th className="px-3 py-2.5 text-right font-medium">Taux qualif.</th>
              <th className="px-3 py-2.5 text-right font-medium">Détail</th>
            </tr>
          </thead>
          <tbody>
            {pilotage.recentBatches.length === 0 ? (
              <tr>
                <td
                  colSpan={hubView ? 12 : 11}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  Aucun lot récent sur ce périmètre. Lancez un import Maps pour créer un lot.
                </td>
              </tr>
            ) : (
              pilotage.recentBatches.map((b) => (
                <tr key={b.batchId} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2.5">
                    <span className="font-medium">{(b.sourceLabel ?? "").trim() || "—"}</span>
                  </td>
                  {hubView ? (
                    <td className="px-3 py-2.5 text-muted-foreground">{(b.ownerDisplay ?? "").trim() || "—"}</td>
                  ) : null}
                  <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                    {formatDateTimeFr(b.createdAt)}
                  </td>
                  <td className="px-3 py-2.5">{(b.ceeSheetCode ?? "").trim() || "—"}</td>
                  <td className="max-w-[280px] px-3 py-2.5 text-xs text-muted-foreground">
                    {(b.searchSummary ?? "").trim() || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{b.importedRaw}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{b.acceptedCount}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-400">
                    {b.qualifiedCount}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-destructive">{b.rejectedCount}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{b.pendingWorkCount}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {b.qualificationRatePercent != null ? `${b.qualificationRatePercent} %` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={`/lead-generation/imports/${b.batchId}`}
                        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8")}
                      >
                        Lot
                      </Link>
                      {b.importSource === "apify_google_maps" ? (
                        <ImportBatchSyncButton batchId={b.batchId} compact />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {ceeOverview.length > 0 ? (
        <div className="rounded-lg border border-border/80 bg-card/40 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Stock par fiche CEE</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Plafond actif par commercial et par fiche : {ceeOverview[0]?.perAgentActiveCap ?? 100} fiches. « Places
            restantes » = marge du commercial le plus chargé sur cette fiche.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border/80 bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Fiche CEE</th>
                  <th className="px-3 py-2 text-right font-medium">À valider</th>
                  <th className="px-3 py-2 text-right font-medium">Pool qualifié (prêt)</th>
                  <th className="px-3 py-2 text-right font-medium">Charge max (agent)</th>
                  <th className="px-3 py-2 text-right font-medium">Places restantes</th>
                </tr>
              </thead>
              <tbody>
                {ceeOverview.map((row) => (
                  <tr key={row.ceeSheetId} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2 font-medium">{row.ceeSheetCode}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.toValidateCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.qualifiedReadyNowPool}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.maxActiveAssignmentsAmongAgents ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.remainingSlotsBottleneck ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border/80 shadow-sm">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="border-b border-border/80 bg-muted/40">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">Société</th>
              <th className="px-3 py-2.5 text-left font-medium">Téléphone</th>
              <th className="px-3 py-2.5 text-left font-medium">Ville</th>
              <th className="px-3 py-2.5 text-left font-medium">Fiche CEE</th>
              {hubView ? <th className="px-3 py-2.5 text-left font-medium">Lot (créateur)</th> : null}
              <th className="px-3 py-2.5 text-left font-medium">Dernière revue</th>
              <th className="px-3 py-2.5 text-left font-medium">Maps</th>
              <th className="px-3 py-2.5 text-left font-medium">Statut</th>
              <th className="px-3 py-2.5 text-left font-medium">Origine</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={hubView ? 10 : 9} className="px-3 py-8 text-center text-muted-foreground">
                  Aucun lead à qualifier pour le moment sur ce périmètre.
                </td>
              </tr>
            ) : (
              rows.map(({ stock, cee_sheet_code, import_created_by_display, qualified_by_display }) => {
                const maps = buildLeadGenerationStreetViewModel(stock);
                const st = qualificationStatusLabel(stock);
                return (
                  <tr key={stock.id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/lead-generation/quantification/${stock.id}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {stock.company_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{phoneDisplay(stock.phone, stock.normalized_phone)}</td>
                    <td className="px-3 py-2.5">{(stock.city ?? "").trim() || "—"}</td>
                    <td className="px-3 py-2.5">{(cee_sheet_code ?? "").trim() || "—"}</td>
                    {hubView ? (
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {(import_created_by_display ?? "").trim() || "—"}
                      </td>
                    ) : null}
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {qualified_by_display || stock.manually_reviewed_at
                        ? [
                            qualified_by_display?.trim() || null,
                            stock.manually_reviewed_at ? formatDateTimeFr(stock.manually_reviewed_at) : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {maps.canShowSection ? (
                        <a
                          href={maps.openMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          Ouvrir
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-medium",
                          st.className,
                        )}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-medium",
                          stock.returned_from_commercial_at
                            ? "bg-violet-500/15 text-violet-900 dark:text-violet-200"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {stock.returned_from_commercial_at ? "Retourné par le commercial" : "Nouveau"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          href={`/lead-generation/quantification/${stock.id}`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          Ouvrir
                        </Link>
                        <LeadGenerationQuantificationActions stockId={stock.id} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
