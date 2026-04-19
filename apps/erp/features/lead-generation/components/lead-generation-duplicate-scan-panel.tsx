"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { dedupeLeadGenerationStockStrictAction } from "@/features/lead-generation/actions/dedupe-lead-generation-stock-strict-action";
import { scanLeadGenerationStockDuplicatesAction } from "@/features/lead-generation/actions/scan-lead-generation-stock-duplicates-action";
import type { DedupeLeadGenerationStockStrictResult } from "@/features/lead-generation/services/dedupe-lead-generation-stock-strict-phone-and-name";
import type {
  LeadGenerationDuplicateGroup,
  ScanLeadGenerationStockDuplicatesResult,
} from "@/features/lead-generation/services/scan-lead-generation-stock-duplicates";
import { humanizeLeadGenerationActionError } from "@/features/lead-generation/lib/humanize-lead-generation-action-error";
import { cn } from "@/lib/utils";

function DuplicateGroupBlock({
  title,
  groups,
  keyLabel,
}: {
  title: string;
  groups: LeadGenerationDuplicateGroup[];
  keyLabel: string;
}) {
  if (groups.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="mt-1 text-xs text-muted-foreground">Aucun doublon détecté sur ce critère.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">
        {title}{" "}
        <span className="font-normal text-muted-foreground">({groups.length} groupe{groups.length > 1 ? "s" : ""})</span>
      </h4>
      <ul className="max-h-[min(50vh,360px)] space-y-3 overflow-y-auto rounded-md border border-border bg-muted/20 p-3 text-sm">
        {groups.map((g) => (
          <li key={`${keyLabel}-${g.key}`} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
            <p className="text-xs font-medium text-muted-foreground">
              {keyLabel} : <span className="break-all text-foreground">{g.key}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {g.count} fiche{g.count > 1 ? "s" : ""}
              {g.omittedIdsCount > 0 ? ` — liste tronquée (${g.omittedIdsCount} id. non affiché${g.omittedIdsCount > 1 ? "s" : ""})` : null}
            </p>
            {g.sampleCompanyNames.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Ex. : {g.sampleCompanyNames.join(" · ")}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
              {g.stockIds.map((id) => (
                <Link
                  key={id}
                  href={`/lead-generation/${id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-7 text-[11px] font-mono",
                  )}
                >
                  {id.slice(0, 8)}…
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LeadGenerationDuplicateScanPanel() {
  const [scanPending, startScan] = useTransition();
  const [dedupePending, startDedupe] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanLeadGenerationStockDuplicatesResult | null>(null);
  const [dedupeResult, setDedupeResult] = useState<DedupeLeadGenerationStockStrictResult | null>(null);

  const busy = scanPending || dedupePending;

  useEffect(() => {
    if (!dedupePending && !scanPending) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dedupePending, scanPending]);

  function runScan() {
    setMessage(null);
    setResult(null);
    setDedupeResult(null);
    startScan(async () => {
      const res = await scanLeadGenerationStockDuplicatesAction();
      if (!res.ok) {
        setMessage(humanizeLeadGenerationActionError(res.error));
        return;
      }
      setResult(res.data);
    });
  }

  function runDedupe() {
    const ok = window.confirm(
      "Fusionner les doublons ? (2 passes)\n\n" +
        "1) Même téléphone normalisé ET même nom de société normalisé.\n" +
        "2) Même téléphone normalisé seul (plusieurs fiches partagent le numéro).\n\n" +
        "À chaque groupe : une fiche est conservée (priorité fiche liée au CRM / convertie, sinon la plus ancienne), " +
        "les champs sont fusionnés (meilleur score, champs complétés), les assignations / activités / tâches / leads " +
        "sont réaffectés vers cette fiche, puis les fiches doublons sont supprimées.\n\n" +
        "Groupes avec plusieurs leads CRM distincts sur le même numéro sont ignorés.\n\n" +
        "Plafond : 20 000 fiches doublons retirées par exécution — relancez si besoin.\n\n" +
        "Action irréversible.",
    );
    if (!ok) return;

    setMessage(null);
    setDedupeResult(null);
    startDedupe(async () => {
      const res = await dedupeLeadGenerationStockStrictAction();
      if (!res.ok) {
        setMessage(humanizeLeadGenerationActionError(res.error));
        return;
      }
      setDedupeResult(res.data);
      setResult(null);
    });
  }

  const totalGroups = result ? result.byPhone.length + result.byCompany.length : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Doublons (scan complet)</h3>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            Analyse <strong className="text-foreground">tout le stock</strong> : mêmes clés qu’à l’import —{" "}
            <code className="rounded bg-muted px-1 text-[11px]">normalized_phone</code> et{" "}
            <code className="rounded bg-muted px-1 text-[11px]">normalized_company_name</code>. Le scan est en lecture
            seule ; <strong className="text-foreground">Fusionner doublons</strong> enchaîne deux passes : d’abord même tél.{" "}
            <strong className="text-foreground">et</strong> même nom, puis même tél. seul (une société peut avoir
            plusieurs agences avec des numéros différents ; le même numéro est regroupé sur une seule fiche).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void runScan()}>
            {scanPending ? "Analyse…" : "Scanner toute la base"}
          </Button>
          <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={() => void runDedupe()}>
            {dedupePending ? "Fusion…" : "Fusionner doublons"}
          </Button>
        </div>
      </div>

      {message ? <p className="mt-3 text-sm text-destructive">{message}</p> : null}

      {scanPending ? (
        <div className="mt-4 space-y-2 rounded-md border border-border bg-muted/30 px-3 py-3">
          <p className="text-sm font-medium text-foreground">Analyse du stock en cours…</p>
          <p className="text-xs text-muted-foreground">
            Parcours de toute la base en plusieurs lots. Gardez cet onglet ouvert ; le navigateur vous avertira en cas
            de fermeture.
          </p>
          <div
            className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-busy="true"
            aria-valuetext="Analyse du stock en cours"
          >
            <div
              className="absolute inset-y-0 w-[38%] rounded-full bg-primary"
              style={{ animation: "lg-dedupe-indeterminate 1.35s ease-in-out infinite" }}
            />
          </div>
        </div>
      ) : null}

      {dedupePending ? (
        <div className="mt-4 space-y-2 rounded-md border border-border bg-muted/30 px-3 py-3">
          <p className="text-sm font-medium text-foreground">Fusion des doublons en cours…</p>
          <p className="text-xs text-muted-foreground">
            Lecture du stock, fusions et suppressions côté serveur — cela peut prendre plusieurs minutes. Gardez cet
            onglet ouvert ; une confirmation s’affiche si vous tentez de fermer la page.
          </p>
          <div
            className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-busy="true"
            aria-valuetext="Fusion des doublons en cours"
          >
            <div
              className="absolute inset-y-0 w-[38%] rounded-full bg-primary"
              style={{ animation: "lg-dedupe-indeterminate 1.35s ease-in-out infinite" }}
            />
          </div>
        </div>
      ) : null}

      {dedupeResult ? (
        <div className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-3 text-sm">
          <p className="font-medium text-foreground">Résultat du nettoyage</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
            <li>
              Passes 1 et 2 :{" "}
              <span className="text-foreground">{dedupeResult.scannedRowsPass1}</span> puis{" "}
              <span className="text-foreground">{dedupeResult.scannedRowsPass2}</span> fiches lues
            </li>
            <li>
              <span className="text-foreground">{dedupeResult.strictDuplicateGroups}</span> groupe
              {dedupeResult.strictDuplicateGroups > 1 ? "s" : ""} (tél. + nom) —{" "}
              <span className="text-foreground">{dedupeResult.deletedCountStrict}</span> fiche
              {dedupeResult.deletedCountStrict !== 1 ? "s" : ""} doublon retirée
              {dedupeResult.deletedCountStrict !== 1 ? "s" : ""} après fusion
            </li>
            <li>
              <span className="text-foreground">{dedupeResult.phoneOnlyDuplicateGroups}</span> groupe
              {dedupeResult.phoneOnlyDuplicateGroups > 1 ? "s" : ""} (même tél. seul) —{" "}
              <span className="text-foreground">{dedupeResult.deletedCountPhoneOnly}</span> fiche
              {dedupeResult.deletedCountPhoneOnly !== 1 ? "s" : ""} doublon retirée
              {dedupeResult.deletedCountPhoneOnly !== 1 ? "s" : ""} après fusion
            </li>
            <li>
              Total fiches doublons retirées :{" "}
              <span className="text-foreground">
                {dedupeResult.deletedCountStrict + dedupeResult.deletedCountPhoneOnly}
              </span>
            </li>
            <li>
              <span className="text-foreground">{dedupeResult.skippedIncompatibleGroups}</span> groupe
              {dedupeResult.skippedIncompatibleGroups > 1 ? "s" : ""} ignoré
              {dedupeResult.skippedIncompatibleGroups > 1 ? "s" : ""} (conflit CRM / données incompatibles)
            </li>
            {dedupeResult.stoppedAtBudget ? (
              <li className="text-foreground">Plafond atteint — relancez pour continuer.</li>
            ) : null}
          </ul>
          {dedupeResult.errors.length > 0 ? (
            <div className="mt-2 text-xs text-destructive">
              <p className="font-medium">Erreurs partielles</p>
              <ul className="mt-1 list-inside list-disc">
                {dedupeResult.errors.map((e, i) => (
                  <li key={`${i}-${e.slice(0, 24)}`}>{e}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-6 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{result.scannedRows}</span> ligne{result.scannedRows > 1 ? "s" : ""}{" "}
            parcourue{result.scannedRows > 1 ? "s" : ""}.
            {totalGroups === 0 ? (
              <span> Aucun groupe de doublons trouvé.</span>
            ) : (
              <span>
                {" "}
                {totalGroups} groupe{totalGroups > 1 ? "s" : ""} potentiel{totalGroups > 1 ? "s" : ""} listé
                {totalGroups > 1 ? "s" : ""}.
              </span>
            )}
            {result.groupsTruncated ? (
              <span className="block text-muted-foreground">
                Limite d’affichage atteinte : les plus gros groupes sont listés en premier ; affinez avec les filtres
                stock si besoin.
              </span>
            ) : null}
          </p>
          <DuplicateGroupBlock
            title="Même n° de téléphone normalisé"
            groups={result.byPhone}
            keyLabel="Téléphone"
          />
          <DuplicateGroupBlock
            title="Même nom de société normalisé"
            groups={result.byCompany}
            keyLabel="Société (clé)"
          />
        </div>
      ) : null}
    </div>
  );
}
