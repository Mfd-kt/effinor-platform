"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  dismissTechnicalVisitAlertAction,
  resolveTechnicalVisitAlertAction,
} from "@/features/technical-visits/actions/technical-visit-alerts-actions";
import type { TechnicalVisitAlertRow } from "@/features/technical-visits/queries/get-technical-visit-alerts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

function severityStyles(severity: string): string {
  if (severity === "critical") {
    return "border-destructive/50 bg-destructive/5";
  }
  if (severity === "warning") {
    return "border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20";
  }
  return "border-sky-500/35 bg-sky-50/35 dark:bg-sky-950/15";
}

function severityBadgeVariant(
  severity: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (severity === "critical") return "destructive";
  if (severity === "warning") return "outline";
  return "secondary";
}

type Props = {
  alerts: TechnicalVisitAlertRow[];
};

export function TechnicalVisitPilotageAlertsPanel({ alerts }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (alerts.length === 0) {
    return null;
  }

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, okMsg: string) => {
    startTransition(() => {
      void (async () => {
        const res = await fn();
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success(okMsg);
        router.refresh();
      })();
    });
  };

  return (
    <Card className="shadow-sm border-amber-500/25">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
          <CardTitle className="text-lg font-semibold tracking-tight md:text-base">
            Alertes pilotage
          </CardTitle>
          <Badge variant="secondary" className="font-normal">
            {alerts.length} ouverte{alerts.length > 1 ? "s" : ""}
          </Badge>
        </div>
        <CardDescription>
          Signaux terrain (GPS, audio, compte-rendu). Les alertes se mettent à jour automatiquement ; vous pouvez les
          ignorer ou les marquer comme traitées.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={cn(
              "space-y-3 rounded-lg border px-4 py-3",
              severityStyles(a.severity),
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <p className="font-semibold leading-snug text-foreground">{a.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{a.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateFr(a.created_at)} · {a.alert_type}
                </p>
              </div>
              <Badge variant={severityBadgeVariant(a.severity)} className="shrink-0 capitalize">
                {a.severity}
              </Badge>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 flex-1"
                disabled={pending}
                onClick={() =>
                  run(() => dismissTechnicalVisitAlertAction(a.id), "Alerte ignorée.")
                }
              >
                Ignorer
              </Button>
              <Button
                type="button"
                size="sm"
                className="min-h-10 flex-1"
                disabled={pending}
                onClick={() =>
                  run(() => resolveTechnicalVisitAlertAction(a.id), "Alerte marquée comme traitée.")
                }
              >
                Marquer traité
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
