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
import { MY_QUEUE_MANUAL_CHUNK_DEFAULT } from "../lib/my-queue-manual-dispatch";

const CEE_SELECT_NONE = "__lg_my_queue_cee_none__";

type SharedProps = {
  ceeSheetOptions: LeadGenerationMyQueueCeeSheetOption[];
  selectedCeeSheetId: string;
  onSelectedCeeSheetIdChange: (id: string) => void;
  viewerUserId: string;
  ceeSelectionMandatory: boolean;
  /** Même plafond que le dispatch serveur pour cet agent. */
  effectiveStockCap: number;
};

type FetchProps = SharedProps & {
  /** Stock neuf (pipeline Nouveau) pour le plafond (par fiche, ou total si « sans fiche CEE »). */
  stockForPlafond: number;
  className?: string;
};

function deriveSelection(p: SharedProps) {
  const maxCap = p.effectiveStockCap;
  const trimmedCee = p.selectedCeeSheetId.trim();
  const isNoCeeSelected = trimmedCee === MY_QUEUE_NO_CEE_SHEET_SENTINEL;
  const selectedCeeOption = p.ceeSheetOptions.find((o) => o.id === trimmedCee) ?? null;
  const valueForSelect = isNoCeeSelected
    ? MY_QUEUE_NO_CEE_SHEET_SENTINEL
    : selectedCeeOption
      ? selectedCeeOption.id
      : CEE_SELECT_NONE;

  const mustPick = p.ceeSelectionMandatory && p.ceeSheetOptions.length > 0;
  const selectionOk = !mustPick || Boolean(selectedCeeOption) || isNoCeeSelected;
  const perCeeRetrieve = Boolean(selectedCeeOption) && !isNoCeeSelected;

  return {
    maxCap,
    trimmedCee,
    isNoCeeSelected,
    selectedCeeOption,
    valueForSelect,
    mustPick,
    selectionOk,
    perCeeRetrieve,
  };
}

/** Filtre « sur quel produit CEE le carnet est chargé » — ne confond pas avec l’écran dossier Agent. */
export function MyLeadQueueCeeSheetPicker({
  ceeSheetOptions,
  selectedCeeSheetId,
  onSelectedCeeSheetIdChange,
  viewerUserId,
  ceeSelectionMandatory,
  effectiveStockCap,
  pending = false,
  className,
}: SharedProps & { pending?: boolean; className?: string }) {
  const { maxCap, isNoCeeSelected, selectedCeeOption, valueForSelect, mustPick, selectionOk } = deriveSelection({
    ceeSheetOptions,
    selectedCeeSheetId,
    onSelectedCeeSheetIdChange,
    viewerUserId,
    ceeSelectionMandatory,
    effectiveStockCap,
  });

  return (
    <div className={className}>
      {ceeSheetOptions.length > 0 ? (
        <div className="space-y-1.5">
          <Label htmlFor="my-queue-cee-sheet" className="text-xs font-medium">
            Filtrer le carnet par fiche CEE
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
              Contacts disponibles sans fiche CEE liée. Plafond de {maxCap} fiches actives sur votre total.
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Liste filtrée sur ce produit CEE (fiches disponibles et attribuées à vous).
            </p>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Aucune fiche CEE associée : vous pouvez récupérer des contacts disponibles pour votre équipe.
        </p>
      )}
    </div>
  );
}

export function MyLeadQueueReadyPoolFetchButton({
  stockForPlafond,
  className,
  ceeSheetOptions,
  selectedCeeSheetId,
  onSelectedCeeSheetIdChange,
  viewerUserId,
  ceeSelectionMandatory,
  effectiveStockCap,
}: FetchProps) {
  const maxCap = effectiveStockCap;
  const headroom = Math.max(0, maxCap - stockForPlafond);
  const chunkSize = Math.min(MY_QUEUE_MANUAL_CHUNK_DEFAULT, headroom);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const { trimmedCee, isNoCeeSelected, selectedCeeOption, selectionOk, perCeeRetrieve } = deriveSelection({
    ceeSheetOptions,
    selectedCeeSheetId,
    onSelectedCeeSheetIdChange,
    viewerUserId,
    ceeSelectionMandatory,
    effectiveStockCap,
  });

  const globalScope = ceeSheetOptions.length === 0;
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
      const { assignedCount, remainingNeed, requestedCount, dispatchBlockedReason } = res.data;
      if (assignedCount === 0) {
        if (dispatchBlockedReason?.trim()) {
          setMessage({
            type: "err",
            text: dispatchBlockedReason,
          });
          router.refresh();
          return;
        }
        const capReached = res.data.previousStock >= maxCap;
        setMessage({
          type: "ok",
          text: capReached
            ? perCeeRetrieve
              ? "Stock maximum atteint pour cette fiche CEE. Traitez ou libérez des fiches avant d’en ajouter."
              : `Vous avez atteint la limite de ${maxCap} prospections actives au total. Traitez ou libérez des fiches avant d’en récupérer d’autres.`
            : "Aucune fiche disponible pour l’instant (file vide ou déjà attribuée).",
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
          disabled={pending || !selectionOk || atCap || chunkSize <= 0}
          onClick={onClick}
          className="gap-2 shrink-0"
          title={
            atCap
              ? perCeeRetrieve
                ? "Plafond atteint : traitez les fiches ci-dessus ou libérez-en avant d’en récupérer."
                : `Limite de ${maxCap} prospections au total`
              : undefined
          }
        >
          <RefreshCw className={cn("size-4", pending && "animate-spin")} aria-hidden />
          {pending
            ? "Récupération…"
            : atCap
              ? "Plafond atteint — voir la liste"
              : !selectionOk
                ? "Choisir un périmètre d’abord"
                : chunkSize <= 0
                  ? `Limite de ${maxCap} prospections atteinte`
                  : globalScope
                    ? "Récupérer des fiches prêtes à appeler"
                    : isNoCeeSelected
                      ? "Récupérer des fiches sans fiche CEE"
                      : "Récupérer d’autres fiches pour ce produit"}
        </Button>
        <p className="text-[11px] text-muted-foreground sm:max-w-[320px]">
          Ajoute des contacts validés et encore disponibles (téléphone renseigné, non attribué). Les fiches déjà dans le
          tableau restent visibles même si le plafond est atteint.
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
