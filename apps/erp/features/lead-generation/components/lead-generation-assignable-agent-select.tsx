"use client";

import { cn } from "@/lib/utils";

import type { LeadGenerationAssignableAgent } from "../queries/get-lead-generation-assignable-agents";

type Props = {
  id: string;
  agents: LeadGenerationAssignableAgent[];
  value: string;
  onValueChange: (agentId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function optionLabel(a: LeadGenerationAssignableAgent): string {
  const bits = [a.displayName, a.email].filter(Boolean);
  const base = bits.join(" · ");
  if (a.activeStock !== undefined) {
    return `${base} — stock ${a.activeStock}`;
  }
  return base;
}

export function LeadAssignableAgentSelect({
  id,
  agents,
  value,
  onValueChange,
  placeholder = "Choisir un collaborateur…",
  disabled,
  className,
}: Props) {
  return (
    <select
      id={id}
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
        className,
      )}
      value={value}
      disabled={disabled}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {agents.map((a) => (
        <option key={a.id} value={a.id}>
          {optionLabel(a)}
        </option>
      ))}
    </select>
  );
}
