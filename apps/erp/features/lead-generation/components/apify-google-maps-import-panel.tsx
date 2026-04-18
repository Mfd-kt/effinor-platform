"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runImportEnrichFullPipelineAction } from "@/features/lead-generation/actions/run-import-enrich-full-pipeline-action";
import { startGoogleMapsApifyImportAction } from "@/features/lead-generation/actions/start-google-maps-apify-import-action";
import { startLinkedInEnrichmentApifyImportAction } from "@/features/lead-generation/actions/start-linkedin-enrichment-apify-import-action";
import { startMultiSourceLeadGenerationAction } from "@/features/lead-generation/actions/start-multi-source-lead-generation-action";
import { DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY } from "@/features/lead-generation/apify/google-maps-actor-input";

function parseSearchLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Bloc unique « lancer un scraping » (sync import déplacé vers la liste des imports récents).
 */
export function ApifyGoogleMapsImportPanel() {
  const router = useRouter();
  const [lines, setLines] = useState("");
  const [locationQuery, setLocationQuery] = useState(DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY);
  const [maxPlaces, setMaxPlaces] = useState("");
  const [startMessage, setStartMessage] = useState<string | null>(null);
  const [startResult, setStartResult] = useState<string | null>(null);
  const [multiMessage, setMultiMessage] = useState<string | null>(null);
  const [multiResult, setMultiResult] = useState<string | null>(null);
  const [liMessage, setLiMessage] = useState<string | null>(null);
  const [liResult, setLiResult] = useState<string | null>(null);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<string | null>(null);
  const [pendingStart, startTransition] = useTransition();
  const [pendingMulti, startMultiTransition] = useTransition();
  const [pendingPipeline, startPipelineTransition] = useTransition();
  const [pendingLi, startLiTransition] = useTransition();

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
        ...(maxN !== undefined ? { maxCrawledPlacesPerSearch: maxN, maxYellowPagesResults: maxN } : {}),
      });
      if (!res.ok) {
        setPipelineMessage(res.error);
        return;
      }
      const d = res.data;
      const li = d.linkedIn;
      const linesOut = [
        d.timedOutWaitingApify
          ? "⚠ Délais Apify dépassés — terminez la synchronisation depuis la liste Imports."
          : "✓ Fusion import terminée.",
        `Coordinateur : ${d.coordinatorBatchId}`,
        `Fiches acceptées (fusion) : ${d.fusionAcceptedCount}`,
        `Scores commerciaux recalculés : ${d.commercialScoredTotal}`,
        "",
        li.status === "completed"
          ? `LinkedIn : ${li.stocksUpdated ?? 0} fiche(s) mise(s) à jour (batch ${li.batchId}).`
          : li.status === "pending_sync"
            ? `LinkedIn : ${li.note ?? "En attente"}${li.batchId ? ` — batch ${li.batchId}` : ""}`
            : `LinkedIn : ${li.reason ?? "Non lancé ou ignoré."}`,
        "",
        "Consultez le stock trié par score commercial : page Stock ou Préparer les leads.",
      ];
      setPipelineResult(linesOut.join("\n"));
      setLines("");
      router.refresh();
    });
  }

  function runMultiSource() {
    setMultiMessage(null);
    setMultiResult(null);
    const searchStrings = parseSearchLines(lines);
    const maxN = maxPlaces.trim() === "" ? undefined : Number.parseInt(maxPlaces, 10);
    if (maxN !== undefined && (Number.isNaN(maxN) || maxN < 1)) {
      setMultiMessage("Indiquez un nombre d’établissements maximum valide (≥ 1).");
      return;
    }
    startMultiTransition(async () => {
      const res = await startMultiSourceLeadGenerationAction({
        searchStrings,
        locationQuery: locationQuery.trim() || undefined,
        ...(maxN !== undefined ? { maxCrawledPlacesPerSearch: maxN, maxYellowPagesResults: maxN } : {}),
      });
      if (!res.ok) {
        setMultiMessage(res.error);
        return;
      }
      setMultiResult(
        [
          "Pipelines lancés (Google Maps + Pages Jaunes si configuré).",
          `Coordinateur : ${res.data.coordinatorBatchId}`,
          `Maps : ${res.data.mapsBatchId}`,
          res.data.ypSkipped
            ? "Pages Jaunes : ignoré (actor non configuré ou indisponible)."
            : `Pages Jaunes : ${res.data.yellowPagesBatchId ?? "—"}`,
          "",
          "Synchronisez les imports : d’abord les lots enfants (Maps / YP), puis le coordinateur fusionnera automatiquement.",
        ].join("\n"),
      );
      router.refresh();
    });
  }

  function runLinkedInEnrich() {
    setLiMessage(null);
    setLiResult(null);
    startLiTransition(async () => {
      const res = await startLinkedInEnrichmentApifyImportAction();
      if (!res.ok) {
        setLiMessage(res.error);
        return;
      }
      setLiResult(
        [
          `Run LinkedIn démarré — ${res.data.targetCount} fiche(s) ciblée(s).`,
          `Batch : ${res.data.batchId}`,
          "Synchronisez ce batch une fois Apify terminé (même flux que les autres imports).",
        ].join("\n"),
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Lancer un scraping Google Maps</h3>
      <p className="text-xs text-muted-foreground">
        Saisissez vos requêtes comme sur Google Maps : une idée de recherche par ligne (ex. secteur +
        ville). La zone géographique par défaut est la France métropolitaine ; vous pouvez l’ajuster.
      </p>
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
        <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">Parcours complet (recommandé)</h4>
        <p className="text-xs text-muted-foreground">
          Une seule action : <strong>Maps + Pages Jaunes</strong> (si{" "}
          <code className="text-[10px]">APIFY_YELLOW_PAGES_ACTOR_ID</code>), attente Apify,{" "}
          <strong>fusion</strong>, <strong>scores commerciaux</strong>, puis <strong>LinkedIn</strong> (si{" "}
          <code className="text-[10px]">APIFY_LINKEDIN_ENRICHMENT_ACTOR_ID</code> et fiches éligibles). Peut prendre
          plusieurs minutes.
        </p>
        <Button
          type="button"
          onClick={runFullPipeline}
          disabled={pendingPipeline || parseSearchLines(lines).length === 0}
          className="font-medium"
        >
          {pendingPipeline ? "Import & enrichissement en cours…" : "Importer & enrichir (Maps + PJ + LinkedIn)"}
        </Button>
        {pipelineMessage ? <p className="text-sm text-destructive">{pipelineMessage}</p> : null}
        {pipelineResult ? (
          <pre className="whitespace-pre-wrap rounded-md bg-background/80 p-3 text-xs text-foreground">{pipelineResult}</pre>
        ) : null}
      </div>

      <Button type="button" onClick={runStart} disabled={pendingStart || parseSearchLines(lines).length === 0}>
        Lancer le scraping
      </Button>
      {startMessage ? <p className="text-sm text-destructive">{startMessage}</p> : null}
      {startResult ? (
        <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs text-foreground">{startResult}</pre>
      ) : null}
    </div>

    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Multi-source (Maps + Pages Jaunes)</h3>
      <p className="text-xs text-muted-foreground">
        Réutilise les recherches et la zone ci-dessus. Définissez <code className="text-[10px]">APIFY_YELLOW_PAGES_ACTOR_ID</code> pour activer Pages Jaunes ; sinon seul Maps est scrapé puis fusionné.
        La fusion réduit les doublons par entreprise + ville et calcule un score source.
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={runMultiSource}
        disabled={pendingMulti || parseSearchLines(lines).length === 0}
      >
        Lancer Maps + Pages Jaunes (fusion)
      </Button>
      {multiMessage ? <p className="text-sm text-destructive">{multiMessage}</p> : null}
      {multiResult ? (
        <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs text-foreground">{multiResult}</pre>
      ) : null}
    </div>

    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Enrichissement LinkedIn (lot limité)</h3>
      <p className="text-xs text-muted-foreground">
        Réservé aux fiches prêtes avec score signal ≥ 45 ou score commercial ≥ 58, sans enrichissement LinkedIn final.
        Input selon l’actor : <code className="text-[10px]">companies</code>, <code className="text-[10px]">targets</code>{" "}
        ou <code className="text-[10px]">profileUrls</code> (URLs déjà sur la fiche).
      </p>
      <Button type="button" variant="outline" onClick={runLinkedInEnrich} disabled={pendingLi}>
        Lancer un lot LinkedIn
      </Button>
      {liMessage ? <p className="text-sm text-destructive">{liMessage}</p> : null}
      {liResult ? (
        <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs text-foreground">{liResult}</pre>
      ) : null}
    </div>
    </div>
  );
}
