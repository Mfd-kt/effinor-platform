"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import type { LeadGenerationCockpitPeriod } from "../domain/lead-generation-cockpit";

type AgentOption = { id: string; displayName: string };

const PERIODS: { value: LeadGenerationCockpitPeriod; label: string }[] = [
  { value: "24h", label: "24 h" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
];

type Props = {
  /** Liste complète des agents commerciaux (filtre optionnel). */
  agents: AgentOption[];
  className?: string;
};

function parsePeriod(raw: string | null): LeadGenerationCockpitPeriod {
  if (raw === "24h" || raw === "7d" || raw === "30d") {
    return raw;
  }
  return "7d";
}

export function LeadGenerationCockpitFilters({ agents, className }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const period = parsePeriod(searchParams.get("period"));
  const agentId = searchParams.get("agent")?.trim() || "";

  const push = useCallback(
    (next: { period?: LeadGenerationCockpitPeriod; agent?: string }) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("view", "cockpit");
      if (next.period != null) {
        p.set("period", next.period);
      }
      if (next.agent !== undefined) {
        if (next.agent) {
          p.set("agent", next.agent);
        } else {
          p.delete("agent");
        }
      }
      startTransition(() => {
        router.push(`/lead-generation/management?${p.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 sm:flex-row sm:flex-wrap sm:items-end",
        className,
      )}
    >
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Période d’analyse</p>
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              disabled={pending}
              onClick={() => push({ period: value })}
              className={cn(
                buttonVariants({ variant: period === value ? "default" : "outline", size: "sm" }),
                "h-8",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5 sm:min-w-[220px]">
        <label htmlFor="lg-cockpit-agent" className="text-xs font-medium text-muted-foreground">
          Agent
        </label>
        <select
          id="lg-cockpit-agent"
          disabled={pending}
          value={agentId}
          onChange={(e) => push({ agent: e.target.value })}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs",
            "focus-visible:ring-[3px] focus-visible:ring-ring/50",
          )}
        >
          <option value="">Tous les agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.displayName}
            </option>
          ))}
        </select>
      </div>
      {pending ? <p className="text-xs text-muted-foreground">Mise à jour…</p> : null}
    </div>
  );
}
