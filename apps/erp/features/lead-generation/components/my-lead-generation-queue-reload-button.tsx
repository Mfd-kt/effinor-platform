"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { dispatchLeadGenerationMyQueueChunkAction } from "../actions/dispatch-lead-generation-my-queue-chunk-action";
import {
  MY_QUEUE_MANUAL_CHUNK_DEFAULT,
  MY_QUEUE_MAX_ACTIVE_STOCK,
} from "../lib/my-queue-manual-dispatch";

type Props = {
  /** Nombre affiché dans « Fiches actives » (file courante), pour borner le lot au plafond. */
  activeStockCount: number;
  /** Variante compacte pour la barre d’outils. */
  className?: string;
};

export function MyLeadGenerationQueueReloadButton({ activeStockCount, className }: Props) {
  const headroom = Math.max(0, MY_QUEUE_MAX_ACTIVE_STOCK - activeStockCount);
  const chunkSize = Math.min(MY_QUEUE_MANUAL_CHUNK_DEFAULT, headroom);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function onClick() {
    if (chunkSize <= 0) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const res = await dispatchLeadGenerationMyQueueChunkAction({ chunkSize });
      if (!res.ok) {
        setMessage({ type: "err", text: res.error });
        return;
      }
      const { assignedCount, remainingNeed, requestedCount } = res.data;
      if (assignedCount === 0) {
        const atCap = res.data.previousStock >= MY_QUEUE_MAX_ACTIVE_STOCK;
        setMessage({
          type: "ok",
          text: atCap
            ? `Vous avez atteint la limite de ${MY_QUEUE_MAX_ACTIVE_STOCK} fiches actives. Traitez ou libérez des fiches avant d’en récupérer d’autres.`
            : "Aucune fiche disponible pour l’instant (carnet « prêt maintenant » vide ou déjà attribué).",
        });
        router.refresh();
        return;
      }
      const extra =
        remainingNeed > 0
          ? ` — ${remainingNeed} place${remainingNeed > 1 ? "s" : ""} non pourvue${remainingNeed > 1 ? "s" : ""} (stock insuffisant).`
          : "";
      setMessage({
        type: "ok",
        text: `${assignedCount} fiche${assignedCount > 1 ? "s" : ""} ajoutée${assignedCount > 1 ? "s" : ""} (lot demandé : ${requestedCount}).${extra}`,
      });
      router.refresh();
    });
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending || chunkSize <= 0}
          onClick={onClick}
          className="gap-2"
        >
          <RefreshCw className={cn("size-4", pending && "animate-spin")} aria-hidden />
          {pending
            ? "Récupération…"
            : chunkSize <= 0
              ? `Plafond ${MY_QUEUE_MAX_ACTIVE_STOCK} fiches`
              : `Récupérer ${chunkSize} fiche${chunkSize > 1 ? "s" : ""}`}
        </Button>
        <p className="text-[11px] text-muted-foreground sm:max-w-[280px]">
          Depuis le carnet <span className="font-medium text-foreground/90">prêt maintenant</span> (téléphone renseigné,
          non attribué).
        </p>
      </div>
      {message ? (
        <p
          className={`mt-2 text-xs ${message.type === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
