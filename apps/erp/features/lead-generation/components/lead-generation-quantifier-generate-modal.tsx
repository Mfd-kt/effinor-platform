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

import { quantifierStartGoogleMapsApifyImportAction } from "../actions/quantifier-start-google-maps-apify-import-action";
import { DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY } from "../apify/google-maps-actor-input";
import type { LeadGenerationCeeImportScope } from "../queries/get-lead-generation-cee-import-scope";

import { LeadGenerationCeeTeamPickers } from "./lead-generation-cee-team-pickers";

type Props = {
  ceeScope: LeadGenerationCeeImportScope;
};

export function LeadGenerationQuantifierGenerateModal({ ceeScope }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [locationQuery, setLocationQuery] = useState(DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY);
  const [maxPlaces, setMaxPlaces] = useState("50");
  const [ceeSheetId, setCeeSheetId] = useState("");
  const [targetTeamId, setTargetTeamId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setMessage(null);
    const kw = keyword.trim();
    if (!kw) {
      setMessage("Indiquez un mot-clé.");
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
        keyword: kw,
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
      setKeyword("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            qualifiées.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="qg-keyword">Mot-clé</Label>
            <Input
              id="qg-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Ex. isolation thermique"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qg-zone">Ville / zone</Label>
            <Input
              id="qg-zone"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Ex. Lyon"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qg-max">Nombre max de résultats</Label>
            <Input
              id="qg-max"
              type="number"
              min={1}
              max={500}
              value={maxPlaces}
              onChange={(e) => setMaxPlaces(e.target.value)}
            />
          </div>
          <LeadGenerationCeeTeamPickers
            scope={ceeScope}
            ceeSheetId={ceeSheetId}
            targetTeamId={targetTeamId}
            onCeeSheetIdChange={setCeeSheetId}
            onTargetTeamIdChange={setTargetTeamId}
            disabled={pending}
            idPrefix="qg-cee"
          />
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Annuler
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            Lancer l’import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
