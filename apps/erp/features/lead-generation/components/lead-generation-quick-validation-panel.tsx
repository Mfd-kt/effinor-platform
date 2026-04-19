"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { markLeadGenerationStockOutOfTargetAction } from "../actions/mark-lead-generation-stock-out-of-target-action";

type Props = {
  stockId: string;
  mapsUrl: string | null;
  showMapsLink: boolean;
  disabled: boolean;
  /** Désactive « Hors cible » (ex. vue support lecture seule). */
  disableOutOfTarget?: boolean;
};

export function LeadGenerationQuickValidationPanel({
  stockId,
  mapsUrl,
  showMapsLink,
  disabled,
  disableOutOfTarget = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const canMaps = Boolean(mapsUrl) && showMapsLink;

  return (
    <Card className="border-border/90 bg-card/60 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Validation rapide</CardTitle>
        <CardDescription>
          Ouvrez la fiche sur Maps, vérifiez l’éligibilité terrain, puis classez la prospection.
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
                const res = await markLeadGenerationStockOutOfTargetAction(stockId);
                if (res.ok) {
                  setMessage({ tone: "ok", text: res.message });
                  router.refresh();
                } else {
                  setMessage({ tone: "err", text: res.message });
                }
              });
            }}
          >
            Hors cible
          </Button>
        </div>

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
