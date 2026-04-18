import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { LeadGenerationLeadTier } from "../domain/lead-tier";

type Confidence = "high" | "medium" | "low" | string | null | undefined;

const CONF_STYLE: Record<string, { label: string; className: string }> = {
  high: {
    label: "Confiance décideur : forte",
    className: "border-emerald-500/35 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
  },
  medium: {
    label: "Confiance décideur : moyenne",
    className: "border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  },
  low: {
    label: "Confiance décideur : faible",
    className: "border-border bg-muted/40 text-muted-foreground",
  },
};

export function LeadGenerationPremiumLeadBadge({
  tier,
  compact,
  className,
}: {
  tier: LeadGenerationLeadTier | string | null | undefined;
  compact?: boolean;
  className?: string;
}) {
  if (tier !== "premium") return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-violet-500/40 bg-violet-500/10 font-normal text-violet-950 dark:text-violet-100",
        compact && "px-1.5 py-0 text-[10px]",
        className,
      )}
    >
      Lead premium
    </Badge>
  );
}

export function LeadGenerationDecisionMakerIdentifiedBadge({
  hasName,
  compact,
  className,
}: {
  hasName: boolean;
  compact?: boolean;
  className?: string;
}) {
  if (!hasName) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-sky-500/35 bg-sky-500/10 font-normal text-sky-950 dark:text-sky-100",
        compact && "px-1.5 py-0 text-[10px]",
        className,
      )}
    >
      Décideur identifié
    </Badge>
  );
}

export function LeadGenerationDecisionMakerConfidenceBadge({
  confidence,
  compact,
  className,
}: {
  confidence: Confidence;
  compact?: boolean;
  className?: string;
}) {
  const key = (confidence ?? "low").toLowerCase();
  const cfg = CONF_STYLE[key] ?? CONF_STYLE.low;
  return (
    <Badge
      variant="outline"
      className={cn(cfg.className, "font-normal", compact && "px-1.5 py-0 text-[10px]", className)}
    >
      {cfg.label}
    </Badge>
  );
}

export function LeadGenerationTierOutlineBadge({
  tier,
  compact,
  className,
}: {
  tier: LeadGenerationLeadTier | string | null | undefined;
  compact?: boolean;
  className?: string;
}) {
  const t = (tier ?? "raw") as string;
  const label = t === "premium" ? "Premium" : t === "workable" ? "Travaillable" : "Brut";
  const style =
    t === "premium"
      ? "border-violet-500/30 text-violet-950 dark:text-violet-100"
      : t === "workable"
        ? "border-border text-foreground"
        : "border-muted-foreground/25 text-muted-foreground";
  return (
    <Badge
      variant="outline"
      className={cn("bg-background/60 font-normal", style, compact && "px-1.5 py-0 text-[10px]", className)}
    >
      Tier {label}
    </Badge>
  );
}
