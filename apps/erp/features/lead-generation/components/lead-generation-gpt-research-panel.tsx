"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { runLeadGenerationGptResearchAction } from "../actions/run-lead-generation-gpt-research-action";
import type { LeadGenerationGptResearchPayload } from "../domain/lead-generation-gpt-research";
import { isLeadGenerationGptResearchSuccessful } from "../lib/lead-generation-gpt-research-terminal-status";
import { LeadGenerationGptCommercialInsightBlock } from "./lead-generation-gpt-commercial-insight-block";
import { LeadGenerationGptRecommendationBanner } from "./lead-generation-gpt-recommendation-banner";
import { useQuantificationGptPrefillContext } from "./lead-generation-quantification-gpt-prefill-context";

type Props = {
  stockId: string;
  canRun: boolean;
  researchGptStatus: string;
  researchGptRequestedAt: string | null;
  researchGptCompletedAt: string | null;
  researchGptLastError: string | null;
  researchGptSummary: string | null;
  researchGptPayload: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asPayload(v: unknown): LeadGenerationGptResearchPayload | null {
  if (!isRecord(v)) return null;
  if (typeof v.company_name_confirmed !== "string") return null;
  if (typeof v.qualification_reason !== "string") return null;
  return v as LeadGenerationGptResearchPayload;
}

function recoLabel(rec: string): string {
  if (rec === "good") return "Bon potentiel";
  if (rec === "review") return "À vérifier";
  if (rec === "out_of_target") return "Hors cible probable";
  return rec;
}

const GPT_PREFILL_NOTE = {
  good: "Pré-rempli depuis GPT : bon potentiel (activité / bâtiment compatibles).",
  review: "Pré-rempli depuis GPT : à vérifier (signaux insuffisants ou confiance moyenne).",
  out_of_target: "Pré-rempli depuis GPT : hors cible probable selon l’activité / bâtiment détectés.",
} as const;

function mapRecommendationToPrefillIntent(
  rec: string,
): keyof typeof GPT_PREFILL_NOTE | null {
  if (rec === "good" || rec === "review" || rec === "out_of_target") {
    return rec;
  }
  return null;
}

export function LeadGenerationGptResearchPanel({
  stockId,
  canRun,
  researchGptStatus,
  researchGptRequestedAt,
  researchGptCompletedAt,
  researchGptLastError,
  researchGptSummary,
  researchGptPayload,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [flash, setFlash] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const payload = asPayload(researchGptPayload);
  const busy = pending || researchGptStatus === "pending";
  const gptPrefillCtx = useQuantificationGptPrefillContext();
  const prefillIntent = payload ? mapRecommendationToPrefillIntent(payload.qualification_recommendation) : null;
  const showPrefillButton =
    isLeadGenerationGptResearchSuccessful(researchGptStatus) && Boolean(payload) && Boolean(prefillIntent) && Boolean(gptPrefillCtx);

  return (
    <Card className="border-border/80 bg-card/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recherche GPT</CardTitle>
        <CardDescription>
          Prépare un dossier de qualification (web + synthèse). La décision « Qualifier » / « Hors cible » reste humaine.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!canRun || busy}
            onClick={() => {
              setFlash(null);
              start(async () => {
                const res = await runLeadGenerationGptResearchAction(stockId);
                setFlash({ tone: res.ok ? "ok" : "err", text: res.message });
                router.refresh();
              });
            }}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Recherche…
              </>
            ) : (
              "Lancer la recherche GPT"
            )}
          </Button>
          {!canRun ? (
            <span className="text-xs text-muted-foreground">Réservé au pilotage ou au quantificateur.</span>
          ) : null}
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Statut : </span>
          <span className="font-medium">
            {researchGptStatus === "idle" && "Jamais lancée"}
            {researchGptStatus === "pending" && "En cours"}
            {researchGptStatus === "completed" && "Terminée"}
            {researchGptStatus === "completed_with_warning" && "Terminée (recherche incomplète)"}
            {researchGptStatus === "failed" && "Échec"}
            {!["idle", "pending", "completed", "completed_with_warning", "failed"].includes(researchGptStatus) && researchGptStatus}
          </span>
        </div>
        {researchGptRequestedAt ? (
          <p className="text-xs text-muted-foreground">
            Dernière demande : <span className="font-medium tabular-nums text-foreground">{formatDateTimeFr(researchGptRequestedAt)}</span>
          </p>
        ) : null}
        {researchGptCompletedAt ? (
          <p className="text-xs text-muted-foreground">
            Dernier résultat : <span className="font-medium tabular-nums text-foreground">{formatDateTimeFr(researchGptCompletedAt)}</span>
          </p>
        ) : null}
        {researchGptLastError ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{researchGptLastError}</p>
        ) : null}
        {flash ? (
          <p className={cn("text-xs", flash.tone === "ok" ? "text-emerald-700 dark:text-emerald-300" : "text-destructive")}>{flash.text}</p>
        ) : null}

        {isLeadGenerationGptResearchSuccessful(researchGptStatus) && payload ? <LeadGenerationGptRecommendationBanner payload={payload} /> : null}

        {showPrefillButton && prefillIntent && gptPrefillCtx ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-border/80 bg-muted/20 text-foreground hover:bg-muted/40"
              onClick={() => {
                gptPrefillCtx.applyGptPrefill(prefillIntent, GPT_PREFILL_NOTE[prefillIntent]);
              }}
            >
              Pré-remplir selon la reco GPT
            </Button>
            <span className="text-[11px] text-muted-foreground">
              Remplit uniquement le bloc Décision (local) — ne valide rien.
            </span>
          </div>
        ) : null}

        {payload?.gpt_research_quality?.completeness === "incomplete" && payload.gpt_research_quality.warnings.length ? (
          <div className="rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-50">
            <p className="font-semibold">Recherche incomplète</p>
            <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-amber-900/95 dark:text-amber-50/95">
              {payload.gpt_research_quality.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {payload && isLeadGenerationGptResearchSuccessful(researchGptStatus) ? (
          <LeadGenerationGptCommercialInsightBlock payload={payload} researchGptStatus={researchGptStatus} variant="quantifier" />
        ) : null}

        {researchGptSummary && isLeadGenerationGptResearchSuccessful(researchGptStatus) ? (
          <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground">{researchGptSummary}</p>
        ) : null}

        {payload && isLeadGenerationGptResearchSuccessful(researchGptStatus) ? (
          <div className="space-y-4 border-t border-border pt-4">
            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">A. Métier / activité</h3>
              <p className="text-sm font-medium">{payload.company_name_confirmed || "—"}</p>
              <p className="text-sm text-foreground/90">{payload.activity_summary || "—"}</p>
              <p className="text-xs text-muted-foreground">
                Secteur : {payload.sector} · Bâtiment probable : {payload.building_type}
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">B. Qualification bâtiment</h3>
              <ul className="list-inside list-disc text-sm text-foreground/90">
                <li>
                  Hauteur (signal) : {payload.height_signal?.value ?? "—"} ({payload.height_signal?.confidence}) —{" "}
                  {payload.height_signal?.evidence || "—"}
                </li>
                <li>
                  Surface / volume (signal) : {payload.surface_signal?.value ?? "—"} ({payload.surface_signal?.confidence}) —{" "}
                  {payload.surface_signal?.evidence || "—"}
                </li>
              </ul>
              {payload.heating_signals?.length ? (
                <p className="text-xs text-muted-foreground">Chauffage / clim : {payload.heating_signals.join(" · ")}</p>
              ) : null}
              {payload.qualification_signals?.length ? (
                <p className="text-xs text-muted-foreground">Autres signaux : {payload.qualification_signals.join(" · ")}</p>
              ) : null}
            </section>

            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">C. Contact / décideur (indicatif)</h3>
              <p className="text-sm">
                {(payload.decision_maker?.name || "—") + (payload.decision_maker?.role ? ` — ${payload.decision_maker.role}` : "")}
              </p>
              <p className="text-xs text-muted-foreground">
                {payload.decision_maker?.email || "—"} · {payload.decision_maker?.phone || "—"} · Source :{" "}
                {payload.decision_maker?.source || "—"} ({payload.decision_maker?.confidence})
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">D. Données entreprise (Pappers)</h3>
              <p className="text-xs text-muted-foreground">
                Confiance : {payload.pappers_match?.match_confidence} · SIREN {payload.pappers_match?.siren || "—"} · SIRET{" "}
                {payload.pappers_match?.siret || "—"}
              </p>
              <p className="text-sm font-medium">{payload.pappers_match?.legal_name || "—"}</p>
              <p className="text-sm">{payload.pappers_match?.head_office_address || "—"}</p>
              <p className="text-xs text-muted-foreground">{payload.pappers_match?.legal_form || "—"}</p>
              {payload.pappers_match?.directors?.length ? (
                <ul className="list-inside list-disc text-sm">
                  {payload.pappers_match.directors.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Dirigeants : —</p>
              )}
              {payload.pappers_match?.useful_company_data?.length ? (
                <p className="text-xs text-muted-foreground">{payload.pappers_match.useful_company_data.join(" · ")}</p>
              ) : null}
            </section>

            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">E. Recommandation GPT (indicative)</h3>
              <p className="text-sm font-medium">{recoLabel(payload.qualification_recommendation)}</p>
              <p className="text-sm text-foreground/90">{payload.qualification_reason || "—"}</p>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">F. Liens utiles / sources</h3>
              {payload.useful_links?.length ? (
                <ul className="space-y-1 text-sm">
                  {payload.useful_links.map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
                        {l.label || l.url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Aucun lien listé.</p>
              )}
              {payload.sources?.length ? (
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {payload.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
                        {s.title || s.url}
                      </a>
                      {s.note ? <span> — {s.note}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </div>
        ) : null}

        <details className="rounded-md border border-border/60 bg-muted/15 text-xs" open={debugOpen} onToggle={(e) => setDebugOpen(e.currentTarget.open)}>
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 font-medium">
            <ChevronDown className={cn("size-4 transition-transform", debugOpen && "rotate-180")} aria-hidden />
            Debug (JSON brut)
          </summary>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words px-3 pb-3 text-[11px] text-muted-foreground">
            {researchGptPayload ? JSON.stringify(researchGptPayload, null, 2) : "—"}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
