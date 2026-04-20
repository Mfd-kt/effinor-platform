"use client";

import { useRouter } from "next/navigation";
import { startTransition as scheduleUiPrefill, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { markLeadGenerationStockOutOfTargetAction } from "../actions/mark-lead-generation-stock-out-of-target-action";
import { quantifierQualifyLeadGenerationStockAction } from "../actions/quantifier-qualify-lead-generation-stock-action";
import {
  LEAD_GEN_OUT_OF_TARGET_REASON_CODES,
  type LeadGenOutOfTargetReasonCode,
} from "../lib/out-of-target";
import {
  useQuantificationGptPrefillContext,
  type QuantificationGptPrefillIntent,
} from "./lead-generation-quantification-gpt-prefill-context";

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
  className?: string;
};

function replaceWithNextQuantificationOrList(
  router: ReturnType<typeof useRouter>,
  nextStockId: string | null,
) {
  if (nextStockId) {
    router.replace(`/lead-generation/quantification/${nextStockId}`);
  } else {
    router.replace("/lead-generation/quantification");
  }
}

function staleServerActionMessage(err: unknown): string | null {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (
    (msg.includes("server action") && (msg.includes("was not found") || msg.includes("not found on the server"))) ||
    msg.includes("failed-to-find-server-action") ||
    msg.includes("failed to find server action")
  ) {
    return "La page est désynchronisée avec le serveur (souvent après une mise à jour). Rechargez la page (rechargement forcé : Cmd+Shift+R ou Ctrl+Shift+R), puis recliquez.";
  }
  return null;
}

function mapGptIntentToUi(
  intent: QuantificationGptPrefillIntent,
): "qualify" | "review" | "out_of_target" {
  if (intent === "good") return "qualify";
  if (intent === "review") return "review";
  return "out_of_target";
}

export function LeadGenerationQuantificationActions({ stockId, className }: Props) {
  const router = useRouter();
  const gptPrefillCtx = useQuantificationGptPrefillContext();
  const [pending, startServerActionTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [ootReason, setOotReason] = useState<LeadGenOutOfTargetReasonCode>("oot:non_precise");
  const [qualifyComment, setQualifyComment] = useState("");
  const [gptIntentHint, setGptIntentHint] = useState<"qualify" | "review" | "out_of_target" | null>(null);
  const [gptPrefillFlash, setGptPrefillFlash] = useState(false);

  useEffect(() => {
    const p = gptPrefillCtx?.prefill;
    if (!p) return;
    scheduleUiPrefill(() => {
      setQualifyComment(p.note);
      setGptIntentHint(mapGptIntentToUi(p.intent));
      if (p.intent === "out_of_target") {
        setOotReason("oot:activite_non_cible");
      }
      setGptPrefillFlash(true);
    });
  }, [gptPrefillCtx?.prefill]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {gptIntentHint === "review" ? (
        <p className="rounded-md border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-xs text-amber-100 dark:text-amber-50">
          À vérifier — aucune action finale pré-sélectionnée. Complétez votre analyse puis choisissez Qualifier ou Hors cible.
        </p>
      ) : null}
      {gptPrefillFlash ? (
        <p className="text-[11px] text-muted-foreground">Décision pré-remplie selon la recommandation GPT.</p>
      ) : null}
      <div className="flex flex-col gap-1">
        <Label htmlFor={`lg-q-comment-${stockId}`} className="text-[11px] text-muted-foreground">
          Commentaire (optionnel)
        </Label>
        <Textarea
          id={`lg-q-comment-${stockId}`}
          value={qualifyComment}
          onChange={(e) => setQualifyComment(e.target.value)}
          disabled={pending}
          placeholder="Note pour l’équipe ou le suivi (visible dans l’historique de revue)."
          className="min-h-[72px] max-h-[200px] resize-y text-sm"
          maxLength={4000}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <div
          className={cn(
            "rounded-md p-0.5 transition-shadow",
            gptIntentHint === "qualify" && "ring-2 ring-emerald-500/45 ring-offset-2 ring-offset-background dark:ring-emerald-400/35",
          )}
        >
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => {
              setFeedback(null);
              startServerActionTransition(async () => {
                try {
                  const res = await quantifierQualifyLeadGenerationStockAction(stockId, {
                    comment: qualifyComment,
                  });
                  if (res.ok) {
                    setQualifyComment("");
                    setFeedback({ tone: "ok", text: res.message });
                    replaceWithNextQuantificationOrList(router, res.nextStockId);
                  } else {
                    setFeedback({ tone: "err", text: res.message });
                  }
                } catch (e) {
                  const hint = staleServerActionMessage(e);
                  setFeedback({
                    tone: "err",
                    text: hint ?? (e instanceof Error ? e.message : "Action impossible."),
                  });
                }
              });
            }}
          >
            Qualifier
          </Button>
        </div>
        <div
          className={cn(
            "flex flex-wrap items-end gap-2 rounded-md p-0.5",
            gptIntentHint === "out_of_target" &&
              "ring-2 ring-red-500/35 ring-offset-2 ring-offset-background dark:ring-red-400/30",
          )}
        >
          <div className="flex min-w-[200px] flex-col gap-1">
            <Label htmlFor={`lg-q-oot-${stockId}`} className="text-[11px] text-muted-foreground">
              Motif hors cible
            </Label>
            <Select
              value={ootReason}
              onValueChange={(v) => setOotReason(v as LeadGenOutOfTargetReasonCode)}
              disabled={pending}
            >
              <SelectTrigger id={`lg-q-oot-${stockId}`} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_GEN_OUT_OF_TARGET_REASON_CODES.map((code) => (
                  <SelectItem key={code} value={code} className="text-xs">
                    {OOT_REASON_LABEL_FR[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            disabled={pending}
            onClick={() => {
              setFeedback(null);
              startServerActionTransition(async () => {
                try {
                  const res = await markLeadGenerationStockOutOfTargetAction(stockId, {
                    outOfTargetReasonCode: ootReason,
                  });
                  if (res.ok) {
                    setFeedback({ tone: "ok", text: res.message ?? "Hors cible enregistré." });
                    replaceWithNextQuantificationOrList(router, res.nextStockId);
                  } else {
                    setFeedback({ tone: "err", text: res.message ?? "Action impossible." });
                  }
                } catch (e) {
                  const hint = staleServerActionMessage(e);
                  setFeedback({
                    tone: "err",
                    text: hint ?? (e instanceof Error ? e.message : "Action impossible."),
                  });
                }
              });
            }}
          >
            Hors cible
          </Button>
        </div>
      </div>
      {feedback ? (
        <p
          className={cn(
            "text-sm",
            feedback.tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
          )}
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
