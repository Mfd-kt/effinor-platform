"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runImportEnrichFullPipelineAction } from "@/features/lead-generation/actions/run-import-enrich-full-pipeline-action";
import { startGoogleMapsApifyImportAction } from "@/features/lead-generation/actions/start-google-maps-apify-import-action";
import { DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY } from "@/features/lead-generation/apify/google-maps-actor-input";
import type { LeadGenerationCeeImportScope } from "@/features/lead-generation/queries/get-lead-generation-cee-import-scope";

import { LeadGenerationCeeTeamPickers } from "./lead-generation-cee-team-pickers";

function parseSearchLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Bloc unique « lancer un scraping » (sync import déplacé vers la liste des imports récents).
 */
export function ApifyGoogleMapsImportPanel({ ceeScope }: { ceeScope: LeadGenerationCeeImportScope }) {
  const router = useRouter();
  const [lines, setLines] = useState("");
  const [locationQuery, setLocationQuery] = useState(DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY);
  const [maxPlaces, setMaxPlaces] = useState("");
  const [ceeSheetId, setCeeSheetId] = useState("");
  const [targetTeamId, setTargetTeamId] = useState("");
  const [startMessage, setStartMessage] = useState<string | null>(null);
  const [startResult, setStartResult] = useState<string | null>(null);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<string | null>(null);
  const [pendingStart, startTransition] = useTransition();
  const [pendingPipeline, startPipelineTransition] = useTransition();

  function runStart() {
    setStartMessage(null);
    setStartResult(null);
    const searchStrings = parseSearchLines(lines);
    const maxN = maxPlaces.trim() === "" ? undefined : Number.parseInt(maxPlaces, 10);
    if (maxN !== undefined && (Number.isNaN(maxN) || maxN < 1)) {
      setStartMessage("Indiquez un nombre d’établissements maximum valide (≥ 1).");
      return;
    }

    startTransition(async () => {
      const res = await startGoogleMapsApifyImportAction({
        searchStrings,
        locationQuery: locationQuery.trim() || undefined,
        ceeSheetId,
        targetTeamId,
        ...(maxN !== undefined ? { maxCrawledPlacesPerSearch: maxN } : {}),
      });
      if (!res.ok) {
        setStartMessage(res.error);
        return;
      }
      setStartResult(
        [
          "Scraping lancé. Les résultats arrivent progressivement côté Apify.",
          "Quand le traitement est terminé, utilisez « Synchroniser » sur la ligne correspondante dans « Suivre les imports » (ou la page Imports).",
          "",
          "Si la configuration serveur est incomplète, vérifiez avec votre administrateur : variables APIFY (token + actor).",
        ].join("\n"),
      );
      setLines("");
      router.refresh();
    });
  }

  function runFullPipeline() {
    setPipelineMessage(null);
    setPipelineResult(null);
    const searchStrings = parseSearchLines(lines);
    const maxN = maxPlaces.trim() === "" ? undefined : Number.parseInt(maxPlaces, 10);
    if (maxN !== undefined && (Number.isNaN(maxN) || maxN < 1)) {
      setPipelineMessage("Indiquez un nombre d’établissements maximum valide (≥ 1).");
      return;
    }
    startPipelineTransition(async () => {
      const res = await runImportEnrichFullPipelineAction({
        searchStrings,
        locationQuery: locationQuery.trim() || undefined,
        ceeSheetId,
        targetTeamId,
        ...(maxN !== undefined ? { maxCrawledPlacesPerSearch: maxN } : {}),
      });
      if (!res.ok) {
        setPipelineMessage(res.error);
        return;
      }
      const d = res.data;
      const linesOut = [
        d.timedOutWaitingApify
          ? "⚠ Délais Apify dépassés — terminez la synchronisation depuis la liste Imports."
          : "✓ Import Google Maps terminé.",
        `Lot : ${d.coordinatorBatchId}`,
        `Fiches acceptées : ${d.fusionAcceptedCount}`,
        `Scores commerciaux recalculés : ${d.commercialScoredTotal}`,
        "",
        "Consultez le stock trié par score commercial : page Stock ou Préparer les leads.",
      ];
      setPipelineResult(linesOut.join("\n"));
      setLines("");
      router.refresh();
    });
  }

  const anyPending = pendingStart || pendingPipeline;

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Lancer un scraping Google Maps</h3>
        <p className="text-xs text-muted-foreground">
          Saisissez vos requêtes comme sur Google Maps : une idée de recherche par ligne (ex. secteur +
          ville). La zone géographique par défaut est la France métropolitaine ; vous pouvez l’ajuster.
        </p>
        <LeadGenerationCeeTeamPickers
          scope={ceeScope}
          ceeSheetId={ceeSheetId}
          targetTeamId={targetTeamId}
          onCeeSheetIdChange={setCeeSheetId}
          onTargetTeamIdChange={setTargetTeamId}
          disabled={anyPending}
          idPrefix="apify-cee"
        />
        <div className="space-y-2">
          <Label htmlFor="apify-search-lines">Recherches Google Maps</Label>
          <Textarea
            id="apify-search-lines"
            value={lines}
            onChange={(e) => setLines(e.target.value)}
            placeholder={"Plombier Lyon\nIsolation Grenoble"}
            rows={4}
            className="min-h-[96px] text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apify-location-query">Zone géographique</Label>
          <Input
            id="apify-location-query"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            placeholder={DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY}
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apify-max-places">Nombre max. de fiches par recherche (optionnel)</Label>
          <Input
            id="apify-max-places"
            type="number"
            min={1}
            max={500}
            value={maxPlaces}
            onChange={(e) => setMaxPlaces(e.target.value)}
            placeholder="50"
          />
        </div>

        <div className="space-y-3 rounded-md border border-primary/25 bg-primary/5 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">Import complet (recommandé)</h4>
          <p className="text-xs text-muted-foreground">
            Une seule action : lancement du scraping Google Maps, attente de la fin du run côté Apify, ingestion des
            fiches et recalcul des scores commerciaux. Peut prendre plusieurs minutes.
          </p>
          <Button
            type="button"
            onClick={runFullPipeline}
            disabled={
              pendingPipeline ||
              parseSearchLines(lines).length === 0 ||
              !ceeSheetId.trim() ||
              !targetTeamId.trim()
            }
            className="font-medium"
          >
            {pendingPipeline ? "Import en cours…" : "Importer & scorer (Google Maps)"}
          </Button>
          {pipelineMessage ? <p className="text-sm text-destructive">{pipelineMessage}</p> : null}
          {pipelineResult ? (
            <pre className="whitespace-pre-wrap rounded-md bg-background/80 p-3 text-xs text-foreground">{pipelineResult}</pre>
          ) : null}
        </div>

        <Button
          type="button"
          onClick={runStart}
          disabled={
            pendingStart ||
            parseSearchLines(lines).length === 0 ||
            !ceeSheetId.trim() ||
            !targetTeamId.trim()
          }
        >
          Lancer le scraping
        </Button>
        {startMessage ? <p className="text-sm text-destructive">{startMessage}</p> : null}
        {startResult ? (
          <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs text-foreground">{startResult}</pre>
        ) : null}
      </div>
    </div>
  );
}
