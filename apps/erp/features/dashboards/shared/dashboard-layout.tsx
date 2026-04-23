import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PeriodSelector } from "./period-selector";
import type { DashboardPeriod } from "./types";

type Props = {
  title: string;
  description?: ReactNode;
  /**
   * Période active. Si fournie, le sélecteur est rendu dans le header.
   * Si `undefined`, le sélecteur est masqué (dashboards sans temporalité).
   */
  period?: DashboardPeriod;
  /** Actions rapides (boutons CTA) à droite du header. */
  actions?: ReactNode;
  /** Bandeau d'alertes affiché juste sous le header. */
  alerts?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Squelette commun à tous les dashboards par rôle.
 * Header avec titre + description + (period selector | actions), puis alertes, puis contenu.
 */
export function DashboardLayout({
  title,
  description,
  period,
  actions,
  alerts,
  children,
  className,
}: Props) {
  return (
    <div className={cn("space-y-6", className)}>
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <div className="max-w-3xl text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {period ? <PeriodSelector value={period} /> : null}
          {actions}
        </div>
      </header>

      {alerts}

      <div className="space-y-6">{children}</div>
    </div>
  );
}

/**
 * Grille de KPIs responsive (1 → 2 → 4 → 5 colonnes).
 * `cols` = nombre maximum de colonnes au-delà du breakpoint xl.
 */
export function KpiGrid({
  children,
  cols = 4,
  className,
}: {
  children: ReactNode;
  cols?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  const colClass =
    cols === 5
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      : cols === 4
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        : cols === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2";
  return <div className={cn("grid gap-3", colClass, className)}>{children}</div>;
}

/** Grille principale 2/3 + 1/3 utilisée pour graph + side widget. */
export function DashboardSplitGrid({
  primary,
  secondary,
  className,
}: {
  primary: ReactNode;
  secondary: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 lg:grid-cols-3", className)}>
      <div className="lg:col-span-2">{primary}</div>
      <div className="lg:col-span-1">{secondary}</div>
    </div>
  );
}
