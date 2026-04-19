"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { dispatchLeadGenerationMyQueueChunkAction } from "../actions/dispatch-lead-generation-my-queue-chunk-action";
import {
  formatMyQueueCeeSheetOptionLabel,
  MY_QUEUE_NO_CEE_SHEET_LABEL,
  MY_QUEUE_NO_CEE_SHEET_SENTINEL,
  type LeadGenerationMyQueueCeeSheetOption,
} from "../lib/my-queue-cee-sheet-option";
import { writeMyQueueSelectedCeeSheetId } from "../lib/my-queue-cee-sheet-preference";
import {
  LEAD_GEN_MAX_ACTIVE_STOCK_PER_CEE_SHEET,
  MY_QUEUE_MANUAL_CHUNK_DEFAULT,
} from "../lib/my-queue-manual-dispatch";

const CEE_SELECT_NONE = "__lg_my_queue_cee_none__";

type Props = {
  /** Stock actif servant au plafond 100 (par fiche, ou total si « sans fiche CEE »). */
  stockForPlafond: number;
  className?: string;
  ceeSheetOptions: LeadGenerationMyQueueCeeSheetOption[];
  selectedCeeSheetId: string;
  onSelectedCeeSheetIdChange: (id: string) => void;
  viewerUserId: string;
  /** Au moins une entrée du select doit être choisie avant toute récupération. */
  ceeSelectionMandatory: boolean;
};

export function MyLeadGenerationQueueReloadButton({
  stockForPlafond,
  className,
  ceeSheetOptions,
  selectedCeeSheetId,
  onSelectedCeeSheetIdChange,
  viewerUserId,
  ceeSelectionMandatory,
}: Props) {
  const maxCap = LEAD_GEN_MAX_ACTIVE_STOCK_PER_CEE_SHEET;
  const headroom = Math.max(0, maxCap - stockForPlafond);
  const chunkSize = Math.min(MY_QUEUE_MANUAL_CHUNK_DEFAULT, headroom);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const trimmedCee = selectedCeeSheetId.trim();
  const isNoCeeSelected = trimmedCee === MY_QUEUE_NO_CEE_SHEET_SENTINEL;
  const selectedCeeOption = ceeSheetOptions.find((o) => o.id === trimmedCee) ?? null;
  const valueForSelect = isNoCeeSelected
    ? MY_QUEUE_NO_CEE_SHEET_SENTINEL
    : selectedCeeOption
      ? selectedCeeOption.id
      : CEE_SELECT_NONE;

  const mustPick = ceeSelectionMandatory && ceeSheetOptions.length > 0;
  const globalScope = ceeSheetOptions.length === 0;
  const selectionOk = !mustPick || Boolean(selectedCeeOption) || isNoCeeSelected;
  const perCeeRetrieve = Boolean(selectedCeeOption) && !isNoCeeSelected;
  const atCap = selectionOk && stockForPlafond >= maxCap;

  function onClick() {
    if (chunkSize <= 0 || !selectionOk || atCap) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const res = await dispatchLeadGenerationMyQueueChunkAction({
        chunkSize,
        ...(isNoCeeSelected
          ? { ceeSheetId: MY_QUEUE_NO_CEE_SHEET_SENTINEL }
          : selectedCeeOption
            ? { ceeSheetId: trimmedCee }
            : {}),
      });
      if (!res.ok) {
        setMessage({ type: "err", text: res.error });
        return;
      }
      const { assignedCount, remainingNeed, requestedCount } = res.data;
      if (assignedCount === 0) {
        const capReached = res.data.previousStock >= maxCap;
        setMessage({
          type: "ok",
          text: capReached
            ? perCeeRetrieve
              ? "Stock maximum atteint pour cette fiche CEE. Traitez ou libérez des fiches avant d’en ajouter."
              : `Vous avez atteint la limite de ${maxCap} prospections actives au total. Traitez ou libérez des fiches avant d’en récupérer d’autres.`
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
      {ceeSheetOptions.length > 0 ? (
        <div className="mb-3 space-y-1.5">
          <Label htmlFor="my-queue-cee-sheet" className="text-xs font-medium">
            Je travaille sur la fiche CEE
          </Label>
          <Select
            value={valueForSelect}
            onValueChange={(v) => {
              const raw = v ?? CEE_SELECT_NONE;
              const id = raw === CEE_SELECT_NONE ? "" : raw;
              onSelectedCeeSheetIdChange(id);
              if (viewerUserId.trim()) {
                writeMyQueueSelectedCeeSheetId(viewerUserId, id);
              }
            }}
            disabled={pending}
          >
            <SelectTrigger id="my-queue-cee-sheet" className="h-9 w-full max-w-md text-left text-sm sm:w-[min(100%,420px)]">
              <SelectValue placeholder="Choisir une fiche dans la liste">
                {isNoCeeSelected
                  ? MY_QUEUE_NO_CEE_SHEET_LABEL
                  : selectedCeeOption
                    ? formatMyQueueCeeSheetOptionLabel(selectedCeeOption)
                    : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {mustPick ? (
                <SelectItem value={CEE_SELECT_NONE}>Choisir une fiche…</SelectItem>
              ) : null}
              <SelectItem value={MY_QUEUE_NO_CEE_SHEET_SENTINEL}>{MY_QUEUE_NO_CEE_SHEET_LABEL}</SelectItem>
              {ceeSheetOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {formatMyQueueCeeSheetOptionLabel(o)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mustPick && !selectionOk ? (
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
              Choisissez une fiche CEE ou « {MY_QUEUE_NO_CEE_SHEET_LABEL} » pour afficher vos prospections et en récupérer.
            </p>
          ) : isNoCeeSelected ? (
            <p className="text-[11px] text-muted-foreground">
              Fiches du carnet « prêt maintenant » sans fiche CEE liée. Le plafond de {maxCap} prospections actives
              s’applique à votre total (toutes fiches confondues).
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Seules les fiches du carnet « prêt maintenant » liées à cette fiche vous sont proposées (selon vos équipes).
            </p>
          )}
        </div>
      ) : (
        <p className="mb-3 text-[11px] text-muted-foreground">
          Aucune fiche CEE n’est associée à votre profil : vous pouvez récupérer des prospections sur le carnet prêt dont
          vous héritez.
        </p>
      )}

      <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending || !selectionOk || atCap || chunkSize <= 0}
          onClick={onClick}
          className="gap-2"
          title={
            atCap
              ? perCeeRetrieve
                ? "Stock maximum atteint pour cette fiche CEE"
                : `Limite de ${maxCap} prospections au total`
              : undefined
          }
        >
          <RefreshCw className={cn("size-4", pending && "animate-spin")} aria-hidden />
          {pending
            ? "Récupération…"
            : atCap
              ? perCeeRetrieve
                ? "Stock maximum atteint pour cette fiche CEE"
                : `Limite de ${maxCap} prospections au total`
              : !selectionOk
                ? "Choisir un périmètre d’abord"
                : chunkSize <= 0
                  ? `Limite de ${maxCap} prospections atteinte`
                  : globalScope
                    ? "Récupérer des fiches prêtes à appeler"
                    : isNoCeeSelected
                      ? "Récupérer des fiches sans fiche CEE"
                      : "Récupérer des fiches pour cette fiche"}
        </Button>
        <p className="text-[11px] text-muted-foreground sm:max-w-[280px]">
          Source : carnet <span className="font-medium text-foreground/90">prêt maintenant</span> (téléphone renseigné,
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
