"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { markLeadGenerationStockOutOfTargetAction } from "../actions/mark-lead-generation-stock-out-of-target-action";
import { returnLeadGenerationStockToQuantificationAction } from "../actions/return-lead-generation-stock-to-quantification-action";
import {
  LEAD_GEN_OUT_OF_TARGET_REASON_CODES,
  type LeadGenOutOfTargetReasonCode,
} from "../lib/out-of-target";

const OOT_REASON_LABEL_FR: Record<LeadGenOutOfTargetReasonCode, string> = {
  "oot:batiment_non_eligible": "Bâtiment non éligible",
  "oot:activite_non_cible": "Activité non cible",
  "oot:residentiel": "Résidentiel",
  "oot:pas_de_hauteur": "Pas de hauteur / volume",
  "oot:pas_de_chauffage_visible": "Pas de chauffage visible",
  "oot:doublon_hors_cible": "Doublon hors cible",
  "oot:retour_terrain_non_cible": "Retour terrain non cible",
  "oot:non_precise": "Non précisé",
};

type Props = {
  stockId: string;
  mapsUrl: string | null;
  showMapsLink: boolean;
  disabled: boolean;
  /** Désactive l’action destructive / structurante (ex. vue support lecture seule). */
  disableOutOfTarget?: boolean;
  /** `quantifier` : validation terrain. `hub` : pilotage stock. `agent` : file commerciale. */
  variant?: "agent" | "quantifier" | "hub";
};

export function LeadGenerationQuickValidationPanel({
  stockId,
  mapsUrl,
  showMapsLink,
  disabled,
  disableOutOfTarget = false,
  variant = "agent",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [returnNote, setReturnNote] = useState("");
  const [ootReason, setOotReason] = useState<LeadGenOutOfTargetReasonCode>("oot:non_precise");

  const canMaps = Boolean(mapsUrl) && showMapsLink;
  const showReturn = variant === "agent";
  const showOot = variant === "quantifier" || variant === "hub";

  return (
    <Card className="border-border/90 bg-card/60 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {variant === "quantifier" ? "Validation rapide" : variant === "hub" ? "Repère & hors cible" : "Repère avant appel"}
        </CardTitle>
        <CardDescription>
          {variant === "quantifier" ? (
            <>
              Ouvrez la carte pour vérifier l’éligibilité ; classez en hors cible avec un motif structuré si le prospect ne
              correspond pas au ciblage produit.
            </>
          ) : variant === "hub" ? (
            <>
              Pilotage : vérifiez sur la carte puis classez en hors cible avec un motif standardisé si la fiche doit être
              exclue durablement du pipe.
            </>
          ) : (
            <>
              La carte aide à préparer l’appel. Si la fiche semble mal ciblée ou douteuse, renvoyez-la en quantification pour
              relecture — sans la marquer hors cible.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {canMaps ? (
            <a
              href={mapsUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-secondary px-4 text-sm font-medium text-secondary-foreground shadow-sm",
                "ring-offset-background transition-colors hover:bg-secondary/80",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              <ExternalLink className="size-4 shrink-0 opacity-80" aria-hidden />
              Ouvrir sur Google Maps
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">Adresse ou repère carte indisponible pour ouvrir Maps.</p>
          )}
        </div>

        {showReturn ? (
          <div className="space-y-2">
            <Label htmlFor="lg-return-note" className="text-xs text-muted-foreground">
              Motif du renvoi (optionnel)
            </Label>
            <Textarea
              id="lg-return-note"
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              disabled={disabled || pending || disableOutOfTarget}
              placeholder="Ex. adresse incohérente, secteur douteux…"
              className="min-h-[72px] resize-y text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-amber-600/40 text-amber-900 hover:bg-amber-500/10 dark:text-amber-200"
                disabled={disabled || pending || disableOutOfTarget}
                onClick={() => {
                  setMessage(null);
                  startTransition(async () => {
                    const res = await returnLeadGenerationStockToQuantificationAction(stockId, returnNote);
                    if (res.ok) {
                      setMessage({ tone: "ok", text: res.message });
                      router.refresh();
                    } else {
                      setMessage({ tone: "err", text: res.message });
                    }
                  });
                }}
              >
                Retour quantification
              </Button>
            </div>
          </div>
        ) : null}

        {showOot ? (
          <div className="space-y-2">
            <Label htmlFor="lg-oot-reason" className="text-xs text-muted-foreground">
              Motif hors cible
            </Label>
            <Select
              value={ootReason}
              onValueChange={(v) => setOotReason(v as LeadGenOutOfTargetReasonCode)}
              disabled={disabled || pending || disableOutOfTarget}
            >
              <SelectTrigger id="lg-oot-reason" className="h-9 w-full max-w-md text-left text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_GEN_OUT_OF_TARGET_REASON_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {OOT_REASON_LABEL_FR[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                disabled={disabled || pending || disableOutOfTarget}
                onClick={() => {
                  setMessage(null);
                  startTransition(async () => {
                    const res = await markLeadGenerationStockOutOfTargetAction(stockId, {
                      outOfTargetReasonCode: ootReason,
                    });
                    if (res.ok) {
                      setMessage({ tone: "ok", text: res.message });
                      if (variant === "quantifier") {
                        if (res.nextStockId) {
                          router.replace(`/lead-generation/quantification/${res.nextStockId}`);
                        } else {
                          router.replace("/lead-generation/quantification");
                        }
                      } else {
                        router.refresh();
                      }
                    } else {
                      setMessage({ tone: "err", text: res.message });
                    }
                  });
                }}
              >
                Hors cible
              </Button>
            </div>
          </div>
        ) : null}

        {message ? (
          <p
            className={cn(
              "text-sm",
              message.tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
            )}
          >
            {message.text}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
