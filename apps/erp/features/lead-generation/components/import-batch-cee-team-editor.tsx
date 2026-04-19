"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { updateLeadGenerationImportBatchCeeTeamAction } from "../actions/update-lead-generation-import-batch-cee-team-action";
import type { LeadGenerationCeeImportScope } from "../queries/get-lead-generation-cee-import-scope";
import {
  LeadGenerationCeeTeamPickers,
  type LeadGenerationCeeTeamDisplayFallbacks,
} from "./lead-generation-cee-team-pickers";

type Props = {
  batchId: string;
  initialCeeSheetId: string | null;
  initialTargetTeamId: string | null;
  scope: LeadGenerationCeeImportScope;
  displayFallbacks?: LeadGenerationCeeTeamDisplayFallbacks;
};

export function ImportBatchCeeTeamEditor({
  batchId,
  initialCeeSheetId,
  initialTargetTeamId,
  scope,
  displayFallbacks,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const hasFullPair = Boolean(initialCeeSheetId?.trim() && initialTargetTeamId?.trim());
  const hasPartial = Boolean(initialCeeSheetId?.trim() || initialTargetTeamId?.trim()) && !hasFullPair;
  const [routingEnabled, setRoutingEnabled] = useState(hasFullPair || hasPartial);
  const [ceeSheetId, setCeeSheetId] = useState(initialCeeSheetId?.trim() ?? "");
  const [targetTeamId, setTargetTeamId] = useState(initialTargetTeamId?.trim() ?? "");

  useEffect(() => {
    const full = Boolean(initialCeeSheetId?.trim() && initialTargetTeamId?.trim());
    const partial = Boolean(initialCeeSheetId?.trim() || initialTargetTeamId?.trim()) && !full;
    setRoutingEnabled(full || partial);
    setCeeSheetId(initialCeeSheetId?.trim() ?? "");
    setTargetTeamId(initialTargetTeamId?.trim() ?? "");
  }, [initialCeeSheetId, initialTargetTeamId]);

  function onToggleRouting(checked: boolean) {
    setRoutingEnabled(checked);
    setMessage(null);
    if (!checked) {
      setCeeSheetId("");
      setTargetTeamId("");
    }
  }

  function onSave() {
    setMessage(null);
    startTransition(async () => {
      const res = await updateLeadGenerationImportBatchCeeTeamAction({
        batchId,
        ceeSheetId: routingEnabled ? ceeSheetId.trim() || null : null,
        targetTeamId: routingEnabled ? targetTeamId.trim() || null : null,
      });
      if (!res.ok) {
        setMessage({ type: "err", text: res.error });
        return;
      }
      setMessage({ type: "ok", text: "Rattachement enregistré." });
      router.refresh();
    });
  }

  const canSaveAttached = routingEnabled && ceeSheetId.trim() && targetTeamId.trim();
  const canSaveClear = !routingEnabled;

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Rattachement CEE</p>
          <p className="text-[11px] text-muted-foreground">
            Ce lot détermine quelle fiche et quelle équipe peuvent réclamer le stock « prêt maintenant » associé.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            className="size-4 rounded border border-input accent-primary"
            checked={routingEnabled}
            onChange={(e) => onToggleRouting(e.target.checked)}
            disabled={pending}
          />
          Rattacher à une fiche et une équipe
        </label>
      </div>

      {routingEnabled ? (
        <LeadGenerationCeeTeamPickers
          scope={scope}
          ceeSheetId={ceeSheetId}
          targetTeamId={targetTeamId}
          onCeeSheetIdChange={setCeeSheetId}
          onTargetTeamIdChange={setTargetTeamId}
          disabled={pending}
          idPrefix={`import-batch-${batchId}`}
          displayFallbacks={displayFallbacks}
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Sans rattachement : distribution du stock de ce lot selon les règles historiques (lots sans équipe cible ou
          éligibilité large). Enregistrez pour appliquer.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || (routingEnabled ? !canSaveAttached : !canSaveClear)}
          onClick={onSave}
        >
          {pending ? "Enregistrement…" : "Enregistrer le rattachement"}
        </Button>
      </div>

      {message ? (
        <p
          className={cn(
            "text-xs",
            message.type === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
          )}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
