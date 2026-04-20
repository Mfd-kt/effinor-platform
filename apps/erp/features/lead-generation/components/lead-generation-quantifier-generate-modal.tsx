"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { quantifierStartGoogleMapsApifyImportAction } from "../actions/quantifier-start-google-maps-apify-import-action";
import { DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY } from "../apify/google-maps-actor-input";
import { LeadGenerationGoogleMapsRegionSelect } from "./lead-generation-google-maps-region-select";
import { parseGoogleMapsSearchLines } from "../lib/parse-google-maps-search-lines";
import type { LeadGenerationCeeImportScope } from "../queries/get-lead-generation-cee-import-scope";

import { LeadGenerationCeeTeamPickers } from "./lead-generation-cee-team-pickers";

type Props = {
  ceeScope: LeadGenerationCeeImportScope;
};

export function LeadGenerationQuantifierGenerateModal({ ceeScope }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchLines, setSearchLines] = useState("");
  const [locationQuery, setLocationQuery] = useState(DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY);
  const [maxPlaces, setMaxPlaces] = useState("");
  const [ceeSheetId, setCeeSheetId] = useState("");
  const [targetTeamId, setTargetTeamId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setMessage(null);
    const searches = parseGoogleMapsSearchLines(searchLines);
    if (searches.length === 0) {
      setMessage("Indiquez au moins une recherche (une idée par ligne).");
      return;
    }
    const maxN = maxPlaces.trim() === "" ? undefined : Number.parseInt(maxPlaces, 10);
    if (maxN !== undefined && (Number.isNaN(maxN) || maxN < 1)) {
      setMessage("Nombre maximum invalide (≥ 1).");
      return;
    }
    if (!ceeSheetId.trim() || !targetTeamId.trim()) {
      setMessage("Choisissez une fiche CEE et une équipe cible.");
      return;
    }

    startTransition(async () => {
      const res = await quantifierStartGoogleMapsApifyImportAction({
        searchLines,
        locationQuery: locationQuery.trim() || undefined,
        ceeSheetId: ceeSheetId.trim(),
        targetTeamId: targetTeamId.trim(),
        ...(maxN !== undefined ? { maxCrawledPlacesPerSearch: maxN } : {}),
      });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setOpen(false);
      setSearchLines("");
      setMaxPlaces("");
      router.refresh();
    });
  }

  const searchCount = parseGoogleMapsSearchLines(searchLines).length;

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          Générer des leads
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Générer des leads (Google Maps)</DialogTitle>
          <DialogDescription>
            Les fiches créées arrivent en <strong>à valider</strong> : aucun commercial ne les reçoit tant qu’elles ne sont pas
            qualifiées. Même principe que sur le tableau de bord : une recherche par ligne, zone géographique standardisée.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <LeadGenerationCeeTeamPickers
            scope={ceeScope}
            ceeSheetId={ceeSheetId}
            targetTeamId={targetTeamId}
            onCeeSheetIdChange={setCeeSheetId}
            onTargetTeamIdChange={setTargetTeamId}
            disabled={pending}
            idPrefix="qg-cee"
          />
          <div className="space-y-2">
            <Label htmlFor="qg-search-lines">Recherches Google Maps</Label>
            <Textarea
              id="qg-search-lines"
              value={searchLines}
              onChange={(e) => setSearchLines(e.target.value)}
              placeholder={"Isolation thermique Lyon\nPlombier Grenoble"}
              rows={4}
              className="min-h-[96px] text-sm"
              disabled={pending}
            />
            <p className="text-[11px] text-muted-foreground">Une idée de recherche par ligne (comme sur Google Maps).</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qg-zone">Zone géographique</Label>
            <LeadGenerationGoogleMapsRegionSelect
              id="qg-zone"
              value={locationQuery}
              onValueChange={setLocationQuery}
              disabled={pending}
            />
            <p className="text-[11px] text-muted-foreground">
              Liste des régions — même réglage que sur le dashboard pour éviter les erreurs de ciblage.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qg-max">Nombre max. de fiches par recherche (optionnel)</Label>
            <Input
              id="qg-max"
              type="number"
              min={1}
              max={500}
              value={maxPlaces}
              onChange={(e) => setMaxPlaces(e.target.value)}
              placeholder="50"
              disabled={pending}
            />
          </div>
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={pending || searchCount === 0 || !ceeSheetId.trim() || !targetTeamId.trim()}
          >
            Lancer l’import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
