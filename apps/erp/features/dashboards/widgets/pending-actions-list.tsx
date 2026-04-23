import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type PendingAction = {
  id: string;
  icon?: LucideIcon;
  title: string;
  /** Contexte court (date d'échéance, entité, statut). */
  meta?: string;
  href: string;
  /** Niveau de priorité (affecte la pastille latérale). */
  priority?: "high" | "medium" | "low";
};

const PRIORITY_DOT = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

/**
 * Liste d'actions en attente nécessitant une intervention de l'utilisateur.
 * Chaque item est un lien explicite vers la page de traitement.
 */
export function PendingActionsList({ actions }: { actions: PendingAction[] }) {
  if (actions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
        Aucune action en attente
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <li key={action.id}>
            <Link
              href={action.href}
              className="flex items-center gap-3 px-2 py-2.5 transition-colors hover:bg-muted/50"
            >
              {action.priority ? (
                <span
                  className={cn("size-2 shrink-0 rounded-full", PRIORITY_DOT[action.priority])}
                  aria-label={`Priorité ${action.priority}`}
                />
              ) : null}
              {Icon ? (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-3.5" aria-hidden />
                </span>
              ) : null}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-sm text-foreground">{action.title}</p>
                {action.meta ? (
                  <p className="truncate text-xs text-muted-foreground">{action.meta}</p>
                ) : null}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
