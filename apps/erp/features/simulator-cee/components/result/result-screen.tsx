"use client";

import { Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  EligibilityResult,
  FinancementType,
  SimulationAnswers,
} from "@/features/simulator-cee/domain/types";
import { cn } from "@/lib/utils";
import { CategoryBadge } from "@/features/simulator-cee/components/result/category-badge";
import { EligibilityBanner } from "@/features/simulator-cee/components/result/eligibility-banner";
import { LeadInfoCard } from "@/features/simulator-cee/components/result/lead-info-card";
import { ProductCard } from "@/features/simulator-cee/components/result/product-card";
import { SciSummary } from "@/features/simulator-cee/components/result/sci-summary";
import { SummaryTable } from "@/features/simulator-cee/components/result/summary-table";

export function ResultScreen({
  answers,
  result,
}: {
  answers: SimulationAnswers;
  result: EligibilityResult;
}) {
  return (
    <div className="space-y-6 pb-28">
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" aria-hidden />
            <CardTitle className="text-xl text-violet-950">Synthèse simulateur CEE</CardTitle>
            <CategoryBadge tranche={answers.trancheRevenu} />
          </div>
          <CardDescription>
            Estimations indicatives à valider en étude — zone{" "}
            <span className="font-medium text-slate-800">
              {result.zone === "idf"
                ? "Île-de-France"
                : result.zone === "hors_idf"
                  ? "Hors Île-de-France"
                  : "indéterminée"}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.cibleIdeale ? (
            <div className="mb-2 flex items-start gap-3 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
              <div className="text-3xl" aria-hidden>
                🌟
              </div>
              <div>
                <div className="mb-1 text-base font-bold text-amber-900">
                  Cible idéale — Prospect premium
                </div>
                <div className="text-sm leading-relaxed text-amber-800">
                  Configuration optimale pour la rénovation globale : maison récente + sous-sol isolable +
                  BTD et VMC à poser + revenus éligibles aux bonifications CEE.{" "}
                  <strong>Reste à charge minimal attendu.</strong>
                </div>
              </div>
            </div>
          ) : null}
          {result.doNotDispatch ? (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <strong>Profil locataire.</strong> Pas de création de lead depuis ce parcours (non dispatch). Les
              montants ci-dessous sont donnés à titre informatif.
            </div>
          ) : null}
          {answers.raisonSociale?.trim() ? (
            <SciSummary raisonSociale={answers.raisonSociale} profil={answers.profil} />
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <EligibilityBanner
              eligible={result.pac.eligible}
              title={`PAC${result.pac.operation ? ` — ${result.pac.operation}` : ""}`}
              reasons={result.pac.eligible ? [] : result.pac.raison ? [result.pac.raison] : []}
              variant="pac"
            />
            <EligibilityBanner
              eligible={result.renov.eligible}
              title={`Rénovation globale — BAR-TH-174${result.renov.scenario ? ` (${result.renov.scenario})` : ""}`}
              reasons={result.renov.eligible ? [] : result.renov.raison ? [result.renov.raison] : []}
              variant="renov"
            />
          </div>

          {result.renov.eligible ? (
            <FinancementBadge
              type={result.renov.financement}
              label={result.renov.financementLabel}
            />
          ) : null}

          {result.renov.warnings.length ? (
            <div className="space-y-2">
              {result.renov.warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                >
                  <span aria-hidden>⚠️</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <ProductCard
              title="Prime PAC"
              subtitle="Basculer vers une pompe à chaleur"
              amountEur={null}
              active={result.pac.eligible}
              operation={result.pac.operation}
            />
            <ProductCard
              title="Rénovation globale"
              subtitle="Isolation + VMC + chauffage"
              amountEur={null}
              active={result.renov.eligible}
              operation={result.renov.eligible ? "BAR-TH-174" : null}
            />
          </div>

          <LeadInfoCard contact={answers.contact} adresse={answers.adresse} />

          <SummaryTable answers={answers} result={result} />
        </CardContent>
      </Card>
    </div>
  );
}

const FINANCEMENT_TONES: Record<FinancementType, string> = {
  cee_x2: "border-emerald-300 bg-emerald-50 text-emerald-950",
  cee_simple: "border-sky-300 bg-sky-50 text-sky-950",
  anah_bascule: "border-amber-400 bg-amber-50 text-amber-950",
  non_applicable: "border-slate-200 bg-slate-50 text-slate-700",
};

const FINANCEMENT_ICON: Record<FinancementType, string> = {
  cee_x2: "🎁",
  cee_simple: "💰",
  anah_bascule: "⚠️",
  non_applicable: "·",
};

function FinancementBadge({ type, label }: { type: FinancementType; label: string }) {
  return (
    <div className={cn("space-y-2 rounded-2xl border-2 p-4", FINANCEMENT_TONES[type])}>
      <div className="flex items-center gap-2 text-sm font-bold">
        <span className="text-lg" aria-hidden>
          {FINANCEMENT_ICON[type]}
        </span>
        <span>Financement : {label}</span>
      </div>
      {type === "anah_bascule" ? (
        <p className="text-xs leading-relaxed">
          Ce dossier <strong>n’est pas éligible aux CEE</strong>. Il relève du dispositif
          ANAH / MaPrimeRénov’. Orienter le client vers un conseiller France Rénov’.
        </p>
      ) : null}
    </div>
  );
}
