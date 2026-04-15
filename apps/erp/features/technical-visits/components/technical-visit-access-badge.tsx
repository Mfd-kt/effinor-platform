import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { TechnicalVisitFieldAccessLevel } from "@/features/technical-visits/types";

export function TechnicalVisitAccessBadge({
  level,
  className,
  showWhenFull = false,
}: {
  level: TechnicalVisitFieldAccessLevel | undefined;
  className?: string;
  /** Par défaut seul l’état « limité » est affiché (moins de bruit pour les profils bureau). */
  showWhenFull?: boolean;
}) {
  if (!level || level === "full") {
    if (!showWhenFull) return null;
    return (
      <Badge
        variant="outline"
        className={cn(
          "shrink-0 rounded-md border-emerald-500/40 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-200",
          className,
        )}
      >
        Détail complet
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 rounded-md border-amber-500/50 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-950 dark:bg-amber-950/40 dark:text-amber-100",
        className,
      )}
    >
      Accès limité
    </Badge>
  );
}
