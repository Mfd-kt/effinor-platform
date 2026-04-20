"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { LeadGenerationGptResearchPayload } from "../domain/lead-generation-gpt-research";
import { isLeadGenerationGptResearchSuccessful } from "../lib/lead-generation-gpt-research-terminal-status";

function scoreTier(score: number): { label: string; className: string } {
  if (score >= 80) return { label: "Très fort", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" };
  if (score >= 55) return { label: "Bon", className: "border-sky-500/40 bg-sky-500/10 text-sky-100" };
  if (score >= 35) return { label: "Moyen", className: "border-amber-500/40 bg-amber-500/10 text-amber-100" };
  return { label: "Faible", className: "border-red-500/35 bg-red-950/30 text-red-100" };
}

function actionLabel(a: string): string {
  if (a === "call") return "Appeler";
  if (a === "review") return "À vérifier";
  if (a === "discard") return "Jeter";
  return a;
}

function priorityLabel(p: string): string {
  if (p === "high") return "Priorité haute";
  if (p === "medium") return "Priorité moyenne";
  if (p === "low") return "Priorité basse";
  return p;
}

function hasCommercialExtension(payload: LeadGenerationGptResearchPayload): boolean {
  return typeof payload.lead_score === "number";
}

/** Pour afficher la carte agent uniquement si le payload contient le score commercial. */
export function shouldShowLeadGenerationGptCommercialInsight(payload: unknown): boolean {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }
  return typeof (payload as { lead_score?: unknown }).lead_score === "number";
}

type Props = {
  payload: LeadGenerationGptResearchPayload | null;
  researchGptStatus: string;
  variant: "quantifier" | "agent";
  className?: string;
};

/**
 * Priorisation commerciale issue de la recherche GPT (indicatif — pas d’action auto).
 */
export function LeadGenerationGptCommercialInsightBlock({
  payload,
  researchGptStatus,
  variant,
  className,
}: Props) {
  const [copied, setCopied] = useState(false);

  if (!isLeadGenerationGptResearchSuccessful(researchGptStatus) || !payload || !hasCommercialExtension(payload)) {
    return null;
  }

  const score = Math.min(100, Math.max(0, Math.round(payload.lead_score)));
  const tier = scoreTier(score);
  const action = payload.commercial_action_recommendation;
  const ct = payload.commercial_contact_target;

  const copyScript = async () => {
    const text = payload.commercial_call_script?.trim() ?? "";
    if (!text || !navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-gradient-to-br from-muted/40 via-card to-card p-4 shadow-sm dark:from-muted/20",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Score lead</p>
            <p className="text-4xl font-bold tabular-nums leading-none text-foreground">{score}</p>
            <p className="text-[10px] text-muted-foreground">/ 100 (indicatif)</p>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold uppercase tracking-wide",
              tier.className,
            )}
          >
            {tier.label}
          </span>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Action suggérée</p>
          <span className="text-lg font-semibold text-foreground">{actionLabel(action)}</span>
          <span className="text-xs text-muted-foreground">{priorityLabel(payload.commercial_priority)}</span>
        </div>
      </div>

      {payload.commercial_action_reason?.trim() ? (
        <p className="mt-3 text-sm text-foreground/90">{payload.commercial_action_reason.trim()}</p>
      ) : null}

      {variant === "quantifier" && payload.lead_score_breakdown?.length ? (
        <ul className="mt-3 space-y-1 border-t border-border/50 pt-3 text-xs text-muted-foreground">
          {payload.lead_score_breakdown.map((row, i) => (
            <li key={`${row.line}-${i}`}>• {row.line}</li>
          ))}
        </ul>
      ) : null}

      {payload.commercial_call_angle?.trim() ? (
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/90">Angle : </span>
          {payload.commercial_call_angle.trim()}
        </p>
      ) : null}

      <div className="mt-4 border-t border-border/50 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Contact cible (appel)</p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {(ct?.name ?? "").trim() || "—"}
          {(ct?.role ?? "").trim() ? ` — ${(ct?.role ?? "").trim()}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {[ct?.email?.trim(), ct?.phone?.trim()].filter(Boolean).join(" · ") || "—"}
          {ct?.source ? ` · ${ct.source}` : ""}
          {ct?.confidence ? ` (${ct.confidence})` : ""}
        </p>
      </div>

      {payload.commercial_call_script?.trim() ? (
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Script d’appel (GPT)</p>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => void copyScript()}>
              {copied ? (
                <>
                  <Check className="mr-1 size-3.5" aria-hidden />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="mr-1 size-3.5" aria-hidden />
                  Copier
                </>
              )}
            </Button>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/[0.04] px-3 py-3 text-sm leading-relaxed text-foreground">
            {payload.commercial_call_script.trim()}
          </div>
        </div>
      ) : null}

      {variant === "agent" ? (
        <p className="mt-3 text-[10px] text-muted-foreground">
          Suggestions générées automatiquement — ne remplacent pas le jugement commercial.
        </p>
      ) : null}
    </div>
  );
}
