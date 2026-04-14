"use client";

import { Bot } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { CockpitAiOrchestratorActivity } from "../types";

type Props = {
  activity: CockpitAiOrchestratorActivity;
};

export function CockpitAiOrchestratorActivityCard({ activity }: Props) {
  return (
    <Card className="overflow-hidden border-sky-500/25 bg-gradient-to-br from-sky-500/5 via-background to-background ring-1 ring-sky-500/15">
      <CardHeader className="border-b border-border py-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 rounded-md bg-sky-500/15 p-1.5 text-sky-700 dark:text-sky-300">
            <Bot className="size-4" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-sky-950 dark:text-sky-200">
              IA — activité automatique
            </CardTitle>
            <CardDescription className="text-xs">
              Exécutions déclenchées par l’orchestrateur (24 h) · audit dans les journaux IA.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="mb-3 flex flex-wrap gap-3 text-sm">
          <span>
            <span className="text-muted-foreground">Réussies : </span>
            <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{activity.executed24h}</span>
          </span>
          <span>
            <span className="text-muted-foreground">En attente : </span>
            <span className="font-semibold tabular-nums text-amber-800 dark:text-amber-300">{activity.pending24h}</span>
          </span>
          <span>
            <span className="text-muted-foreground">Erreurs : </span>
            <span className="font-semibold tabular-nums text-destructive">{activity.failed24h}</span>
          </span>
        </div>
        {activity.recent.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune action orchestrateur sur la fenêtre récente.</p>
        ) : (
          <ul className="max-h-56 space-y-2 overflow-y-auto text-xs">
            {activity.recent.map((r) => (
              <li key={r.id} className="rounded-md border border-border/80 bg-muted/30 px-2 py-1.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <span
                    className={
                      r.status === "success"
                        ? "font-bold text-emerald-700 dark:text-emerald-400"
                        : r.status === "failed"
                          ? "font-bold text-destructive"
                          : "font-bold text-amber-700 dark:text-amber-300"
                    }
                  >
                    {r.status}
                  </span>
                  <span className="font-medium">{r.actionType}</span>
                </div>
                {r.reason ? <p className="mt-0.5 text-muted-foreground">{r.reason}</p> : null}
                {r.errorMessage ? <p className="mt-0.5 text-destructive">{r.errorMessage}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
