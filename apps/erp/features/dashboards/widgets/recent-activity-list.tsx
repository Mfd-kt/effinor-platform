import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ActivityItem = {
  id: string;
  icon: LucideIcon;
  /** Tonalité visuelle de l'icône. */
  tone?: "default" | "positive" | "negative" | "warning";
  title: string;
  /** Sous-titre optionnel (entité concernée, agent…). */
  subtitle?: string;
  timestampLabel: string;
  href?: string;
};

const TONE_CLASS = {
  default: "bg-muted text-muted-foreground",
  positive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  negative: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

/**
 * Liste verticale d'activités récentes (timeline « passée »).
 * Utiliser comme bloc latéral d'un dashboard ou comme widget pleine largeur.
 */
export function RecentActivityList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
        Aucune activité récente
      </div>
    );
  }
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const baseClass = cn(
          "flex items-start gap-3 rounded-md px-2 py-2 text-sm",
          item.href && "transition-colors hover:bg-muted/50",
        );
        const inner = (
          <>
            <span
              className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                TONE_CLASS[item.tone ?? "default"],
              )}
            >
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="truncate text-foreground">{item.title}</p>
              {item.subtitle ? (
                <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
              ) : null}
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {item.timestampLabel}
            </span>
          </>
        );
        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className={baseClass}>
                {inner}
              </Link>
            ) : (
              <div className={baseClass}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
