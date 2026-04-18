import { Badge } from "@/components/ui/badge";
import type { LeadGenerationEnrichmentConfidence } from "@/features/lead-generation/domain/statuses";
import { cn } from "@/lib/utils";

const CONF: Record<
  LeadGenerationEnrichmentConfidence,
  { label: string; short: string; className: string }
> = {
  low: {
    label: "Fiabilité faible · non vérifié",
    short: "Faible",
    className:
      "border-amber-500/35 bg-amber-500/10 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100",
  },
  medium: {
    label: "Fiabilité moyenne",
    short: "Moyenne",
    className: "border-sky-500/35 bg-sky-500/10 text-sky-950 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-100",
  },
  high: {
    label: "Fiabilité élevée",
    short: "Élevée",
    className:
      "border-emerald-600/35 bg-emerald-600/10 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100",
  },
};

type Props = {
  level: LeadGenerationEnrichmentConfidence;
  /** Tableau : libellé court. */
  compact?: boolean;
  className?: string;
};

export function LeadGenerationEnrichmentConfidenceBadge({ level, compact, className }: Props) {
  const c = CONF[level] ?? CONF.low;
  return (
    <Badge variant="outline" className={cn(c.className, "font-normal", compact && "text-[10px] leading-tight", className)}>
      {compact ? c.short : c.label}
    </Badge>
  );
}
