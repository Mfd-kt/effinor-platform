"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EligibilityResult } from "@/features/simulator-cee/domain/types";
import { cn } from "@/lib/utils";

export function PreliminaryResult({ result }: { result: EligibilityResult }) {
  const hasAny = result.pac.eligible || result.renov.eligible;

  return (
    <div className="space-y-4">
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-violet-950">
            {hasAny ? "Vérification : éligible 🎉" : "Vérification : non éligible"}
          </CardTitle>
          <CardDescription>
            {hasAny
              ? "Au moins une opération CEE est ouverte. Continuez pour finaliser le lead."
              : "Aucune opération CEE n’est ouverte sur cette configuration. Vous pouvez quand même garder ce prospect en base si nécessaire."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.cibleIdeale ? (
            <div className="flex items-start gap-3 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 p-3">
              <span className="text-2xl" aria-hidden>
                🌟
              </span>
              <div>
                <div className="text-sm font-bold text-amber-900">
                  Cible idéale — Prospect premium
                </div>
                <p className="text-xs text-amber-800">RAC minimal attendu via bonifications CEE.</p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Verdict
              ok={result.pac.eligible}
              title="PAC"
              badge={result.pac.eligible ? result.pac.operation : null}
              raison={result.pac.raison}
            />
            <Verdict
              ok={result.renov.eligible}
              title="Rénovation globale"
              badge={
                result.renov.eligible
                  ? `BAR-TH-174${result.renov.scenario ? ` (${result.renov.scenario})` : ""}`
                  : null
              }
              raison={result.renov.raison}
            />
          </div>

          {result.renov.eligible ? (
            <div
              className={cn(
                "rounded-xl border-2 p-3 text-center text-sm font-semibold",
                result.renov.financement === "cee_x2"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                  : result.renov.financement === "cee_simple"
                    ? "border-sky-300 bg-sky-50 text-sky-950"
                    : result.renov.financement === "anah_bascule"
                      ? "border-amber-400 bg-amber-50 text-amber-950"
                      : "border-slate-200 bg-slate-50 text-slate-700",
              )}
            >
              Financement : {result.renov.financementLabel}
            </div>
          ) : null}

          {result.renov.warnings.length ? (
            <div className="space-y-1">
              {result.renov.warnings.map((w, i) => (
                <p
                  key={i}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900"
                >
                  ⚠️ {w}
                </p>
              ))}
            </div>
          ) : null}

          {result.zone !== "unknown" ? (
            <p className="text-center text-xs text-slate-500">
              Zone détectée :{" "}
              <span className="font-medium text-slate-700">
                {result.zone === "idf" ? "Île-de-France" : "Hors Île-de-France"}
              </span>
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Verdict({
  ok,
  title,
  badge,
  raison,
}: {
  ok: boolean;
  title: string;
  badge: string | null;
  raison: string | null;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 p-3",
        ok ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        {badge ? (
          <Badge variant="secondary" className="rounded-full">
            {badge}
          </Badge>
        ) : null}
      </div>
      <p className={cn("mt-1 text-xs", ok ? "text-emerald-900" : "text-slate-500")}>
        {ok ? "Éligible" : raison ?? "Non éligible"}
      </p>
    </div>
  );
}
