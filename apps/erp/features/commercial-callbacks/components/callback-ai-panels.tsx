"use client";

import { useTransition } from "react";
import { Copy, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { regenerateCallbackCallScript } from "@/features/commercial-callbacks/actions/regenerate-callback-call-script";
import { regenerateCallbackFollowupDraft } from "@/features/commercial-callbacks/actions/regenerate-callback-followup-draft";
import { buildCallbackAgentContextSections, buildCallbackAiContext } from "@/features/commercial-callbacks/ai/build-callback-ai-context";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

function formatGeneratedAt(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return null;
  }
}

type CallbackAiPanelsProps = {
  row: CommercialCallbackRow;
  /** Après succès (refresh parent). */
  onUpdated?: () => void;
  /** Variante compacte pour le dialog d’appel. */
  compact?: boolean;
};

export function CallbackAiPanels({ row, onUpdated, compact }: CallbackAiPanelsProps) {
  const [pending, startTransition] = useTransition();
  const ctx = buildCallbackAiContext(row);
  const sections = buildCallbackAgentContextSections(ctx);
  const generatedAt = formatGeneratedAt(row.ai_last_generated_at);

  function regenScript() {
    startTransition(async () => {
      const res = await regenerateCallbackCallScript({ callbackId: row.id });
      if (!res.ok) {
        toast.error("Script", { description: res.error });
        return;
      }
      toast.success(
        res.source === "openai" ? "Script généré (IA)." : "Script généré (mode hors ligne).",
      );
      onUpdated?.();
    });
  }

  function regenFollowup() {
    startTransition(async () => {
      const res = await regenerateCallbackFollowupDraft({ callbackId: row.id });
      if (!res.ok) {
        toast.error("Brouillon", { description: res.error });
        return;
      }
      toast.success(
        res.source === "openai" ? "Brouillon prêt (IA)." : "Brouillon prêt (mode hors ligne).",
      );
      onUpdated?.();
    });
  }

  function copyFollowup() {
    const t = row.ai_followup_draft?.trim();
    if (!t) {
      toast.message("Rien à copier", { description: "Générez d’abord un brouillon." });
      return;
    }
    void navigator.clipboard.writeText(t).then(
      () => toast.success("Copié dans le presse-papiers."),
      () => toast.error("Copie impossible."),
    );
  }

  const summaryBlock = (
    <div className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Résumé pour l’appel
      </p>
      <dl className="mt-2 space-y-2 text-xs">
        {sections.slice(0, compact ? 4 : sections.length).map((s, i) => (
          <div key={`${s.title}-${i}`}>
            <dt className="font-medium text-foreground/90">{s.title}</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{s.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  const scriptBlock = (
    <div className="rounded-lg border bg-card px-3 py-2.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="size-3.5" />
          Script conseillé
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          disabled={pending}
          onClick={() => regenScript()}
        >
          <RefreshCw className="size-3" />
          Régénérer
        </Button>
      </div>
      {generatedAt ? (
        <p className="mt-1 text-[10px] text-muted-foreground">Dernière génération : {generatedAt}</p>
      ) : null}
      <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
        {row.ai_script_text?.trim() ||
          "Aucun script encore — cliquez sur « Régénérer » pour en générer un (IA ou mode hors ligne)."}
      </pre>
    </div>
  );

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {compact ? (
        <>
          {scriptBlock}
          {summaryBlock}
        </>
      ) : (
        <>
          {summaryBlock}
          {scriptBlock}
        </>
      )}

      <div className="rounded-lg border bg-card px-3 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Brouillon de relance
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 gap-1 text-xs"
              disabled={pending}
              onClick={() => regenFollowup()}
            >
              Générer brouillon
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              disabled={pending || !row.ai_followup_draft?.trim()}
              onClick={() => copyFollowup()}
            >
              <Copy className="size-3" />
              Copier
            </Button>
          </div>
        </div>
        <pre className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground">
          {row.ai_followup_draft?.trim() ||
            "Générez un brouillon mail / message après l’appel."}
        </pre>
      </div>
    </div>
  );
}

