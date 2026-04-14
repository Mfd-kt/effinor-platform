"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  CircleDollarSign,
  Cog,
  GitBranch,
  Phone,
  RefreshCw,
  UserCog,
  Zap,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import type { CockpitAiRecommendation } from "../types";
import { CockpitConvertButton } from "./cockpit-convert-button";
import { CockpitRecommendationExecuteButton } from "./cockpit-recommendation-execute-button";

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function categoryIcon(cat: CockpitAiRecommendation["category"]) {
  switch (cat) {
    case "callback":
      return Phone;
    case "cash":
      return CircleDollarSign;
    case "lead":
      return Zap;
    case "workflow":
      return GitBranch;
    case "staffing":
      return UserCog;
    case "automation":
      return Cog;
    case "config":
      return Cog;
    default:
      return Bot;
  }
}

function priorityBadge(p: CockpitAiRecommendation["priority"]): { cls: string; label: string } {
  if (p === "critical") return { cls: "bg-destructive/15 text-destructive", label: "Critique" };
  if (p === "important") return { cls: "bg-amber-500/15 text-amber-900 dark:text-amber-300", label: "Importante" };
  return { cls: "bg-muted text-muted-foreground", label: "Opportunité" };
}

type Props = {
  recommendations: CockpitAiRecommendation[];
  heuristicOnly: boolean;
};

function RecommendationRow({
  r,
  rank,
  emphasize,
}: {
  r: CockpitAiRecommendation;
  rank?: number;
  emphasize?: boolean;
}) {
  const Icon = categoryIcon(r.category);
  const pr = priorityBadge(r.priority);
  return (
    <li
      className={cn(
        "flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between",
        emphasize && "border-l-4 border-violet-500 bg-violet-500/[0.07]",
      )}
    >
      <div className="min-w-0 flex gap-2.5">
        {rank != null ? (
          <span
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-violet-600 text-xs font-bold text-white"
            aria-hidden
          >
            {rank}
          </span>
        ) : (
          <Icon className="mt-0.5 size-4 shrink-0 text-violet-600/80 dark:text-violet-400" aria-hidden />
        )}
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {rank == null ? null : (
              <Icon className="size-3.5 shrink-0 text-violet-600/80 dark:text-violet-400" aria-hidden />
            )}
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", pr.cls)}>{pr.label}</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
              {r.category}
            </span>
            {r.impactEuro != null ? (
              <span className="text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {eur.format(r.impactEuro)}
              </span>
            ) : null}
            <span className="text-[10px] tabular-nums text-muted-foreground">Conf. {r.confidence}%</span>
          </div>
          <p className="text-sm font-medium leading-snug">{r.title}</p>
          <p className="text-xs text-muted-foreground">{r.description}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-1.5 sm:pl-2">
        {r.phone ? (
          <a href={`tel:${r.phone.replace(/\s/g, "")}`} className={buttonVariants({ variant: "default", size: "xs" })}>
            Appeler
          </a>
        ) : null}
        {r.actionHref && r.actionLabel ? (
          r.actionHref.startsWith("tel:") ? (
            <a href={r.actionHref} className={buttonVariants({ variant: "default", size: "xs" })}>
              {r.actionLabel}
            </a>
          ) : (
            <Link href={r.actionHref} className={buttonVariants({ variant: "secondary", size: "xs" })}>
              {r.actionLabel}
            </Link>
          )
        ) : null}
        {r.actionType !== "convert_callback" &&
        r.relatedEntityType === "callback" &&
        r.relatedEntityId &&
        r.canConvertCallback ? (
          <CockpitConvertButton callbackId={r.relatedEntityId} size="xs" />
        ) : null}
        <CockpitRecommendationExecuteButton recommendation={r} />
      </div>
    </li>
  );
}

export function CockpitAiRecommendations({ recommendations, heuristicOnly }: Props) {
  const router = useRouter();
  const top3 = recommendations.slice(0, 3);
  const rest = recommendations.slice(3);

  return (
    <Card className="overflow-hidden border-violet-500/25 bg-gradient-to-br from-violet-500/5 via-background to-background ring-1 ring-violet-500/20">
      <CardHeader className="border-b border-border py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 rounded-md bg-violet-500/15 p-1.5 text-violet-700 dark:text-violet-300">
              <Bot className="size-4" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-violet-950 dark:text-violet-200">
                IA CEO — Priorités du moment
              </CardTitle>
              <CardDescription className="text-xs">
                Décisions actionnables (données réelles) ·{" "}
                {heuristicOnly ? "mode règles métier — ajoutez OPENAI_API_KEY pour affiner le texte" : "texte affiné (OpenAI)"}
              </CardDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.refresh()}
            className={cn(buttonVariants({ variant: "outline", size: "xs" }), "shrink-0 gap-1")}
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Rafraîchir
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {recommendations.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Aucune priorité détectée sur les signaux actuels.</p>
        ) : (
          <div>
            {top3.length > 0 ? (
              <div className="border-b border-border bg-violet-500/[0.04]">
                <p className="px-3 pt-3 text-[11px] font-bold uppercase tracking-wide text-violet-900 dark:text-violet-200">
                  Top 3 — à faire maintenant
                </p>
                <ul className="divide-y divide-border">
                  {top3.map((r, i) => (
                    <RecommendationRow key={r.id} r={r} rank={i + 1} emphasize />
                  ))}
                </ul>
              </div>
            ) : null}
            {rest.length > 0 ? (
              <ul className="divide-y divide-border">
                {rest.map((r) => (
                  <RecommendationRow key={r.id} r={r} />
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
