"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OperationCee } from "@/features/simulator-cee/domain/types";
import { cn } from "@/lib/utils";

export function ProductCard({
  title,
  subtitle,
  amountEur,
  active,
  operation,
}: {
  title: string;
  subtitle: string;
  amountEur: number | null;
  active: boolean;
  operation?: OperationCee | null;
}) {
  return (
    <Card
      className={cn(
        "rounded-2xl border-2 shadow-none transition-colors",
        active ? "border-violet-500 bg-white" : "border-violet-100 bg-violet-50/30 opacity-80",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-violet-950">{title}</CardTitle>
          {active && operation ? (
            <Badge
              variant="secondary"
              className="rounded-full bg-violet-100 text-violet-900 hover:bg-violet-100"
            >
              {operation}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </CardHeader>
      <CardContent>
        {active ? (
          <p className="text-sm text-slate-600">
            Éligible — montant à calculer en étude.
          </p>
        ) : (
          <p className="text-sm text-slate-500">Non éligible sur ce scénario</p>
        )}
        {amountEur != null ? (
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {amountEur.toLocaleString("fr-FR")} €{" "}
            <span className="text-sm font-normal text-slate-500">estim.</span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
