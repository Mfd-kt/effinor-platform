import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import type { DashboardAlert } from "./types";

const SEVERITY_CONFIG = {
  info: {
    Icon: Info,
    container: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-100",
    iconTone: "text-sky-600 dark:text-sky-300",
  },
  warning: {
    Icon: AlertTriangle,
    container:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100",
    iconTone: "text-amber-600 dark:text-amber-300",
  },
  critical: {
    Icon: ShieldAlert,
    container:
      "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100",
    iconTone: "text-rose-600 dark:text-rose-300",
  },
  success: {
    Icon: CheckCircle2,
    container:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100",
    iconTone: "text-emerald-600 dark:text-emerald-300",
  },
} as const;

/**
 * Bannière d'alerte affichée en haut d'un dashboard.
 * Empilable : passer un tableau et `map` côté parent.
 */
export function AlertBanner({ alert, className }: { alert: DashboardAlert; className?: string }) {
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.Icon;

  const content = (
    <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", config.container, className)}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", config.iconTone)} aria-hidden />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-medium">{alert.title}</p>
        {alert.description ? (
          <p className="text-xs opacity-80">{alert.description}</p>
        ) : null}
      </div>
      {alert.href ? (
        <span className="inline-flex shrink-0 items-center gap-1 self-center text-xs font-medium">
          {alert.ctaLabel ?? "Voir"}
          <ChevronRight className="size-3.5" aria-hidden />
        </span>
      ) : null}
    </div>
  );

  if (alert.href) {
    return (
      <Link href={alert.href} className="block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }
  return content;
}

export function AlertBannerStack({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <AlertBanner key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
