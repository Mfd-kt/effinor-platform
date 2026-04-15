"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requestBrowserGeolocationForVisitStart } from "@/features/technical-visits/geo/request-browser-geolocation";
import {
  startTechnicalVisit,
  completeTechnicalVisit,
  lockTechnicalVisit,
  unlockTechnicalVisit,
  validateTechnicalVisit,
  cancelTechnicalVisit,
  reopenTechnicalVisitForFieldwork,
} from "@/features/technical-visits/lifecycle/actions";
import type { VisitPermissions } from "@/features/technical-visits/lifecycle/rules";
import { cn } from "@/lib/utils";

type Props = {
  visitId: string;
  permissions: VisitPermissions;
  isLocked: boolean;
  isStarted: boolean;
  isCompleted: boolean;
  /** Barre collée en bas sur mobile (safe area). */
  mobileSticky?: boolean;
};

export function TechnicalVisitLifecycleToolbar({
  visitId,
  permissions,
  isLocked,
  isStarted,
  isCompleted,
  mobileSticky = true,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function exec(action: (id: string) => Promise<{ ok: boolean; message?: string; notice?: string }>) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await action(visitId);
      if (!result.ok && "message" in result) {
        setError(result.message ?? "Erreur inattendue.");
      } else {
        if (result.ok && "notice" in result && result.notice) {
          setNotice(result.notice);
        }
        router.refresh();
      }
    });
  }

  function startWithGeolocation() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const geo = await requestBrowserGeolocationForVisitStart();
      const result = await startTechnicalVisit(visitId, geo);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.notice) {
        setNotice(result.notice);
      }
      router.refresh();
    });
  }

  const hasAnyAction =
    permissions.start ||
    permissions.complete ||
    permissions.lock ||
    permissions.unlock ||
    permissions.validate ||
    permissions.cancel ||
    permissions.reopenFieldwork;

  if (!hasAnyAction && !isLocked) return null;

  const inner = (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {isLocked ? (
          <Badge variant="outline" className="rounded-md border-amber-500/50 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            Visite verrouillée
          </Badge>
        ) : null}

        {isStarted && !isCompleted ? (
          <Badge variant="outline" className="rounded-md border-sky-500/50 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
            En cours de visite
          </Badge>
        ) : null}

        {permissions.start ? (
          <Button
            size="lg"
            className="min-h-12 w-full font-semibold sm:w-auto sm:min-h-10 sm:text-sm"
            disabled={isPending}
            onClick={() => startWithGeolocation()}
          >
            {isPending ? "Localisation…" : "Démarrer la visite"}
          </Button>
        ) : null}

        {permissions.complete ? (
          <Button
            size="lg"
            className="min-h-12 w-full font-semibold sm:w-auto sm:min-h-10 sm:text-sm"
            disabled={isPending}
            onClick={() => exec(completeTechnicalVisit)}
          >
            {isPending ? "…" : "Terminer la visite"}
          </Button>
        ) : null}

        {permissions.validate ? (
          <Button
            size="lg"
            variant="outline"
            className="min-h-12 w-full border-emerald-500/50 font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 sm:w-auto sm:min-h-10 sm:text-sm"
            disabled={isPending}
            onClick={() => exec(validateTechnicalVisit)}
          >
            {isPending ? "…" : "Valider"}
          </Button>
        ) : null}

        {permissions.reopenFieldwork ? (
          <Button
            size="lg"
            variant="outline"
            className="min-h-12 w-full border-amber-500/50 font-semibold text-amber-900 hover:bg-amber-50 dark:text-amber-200 dark:hover:bg-amber-950/30 sm:w-auto sm:min-h-10 sm:text-sm"
            disabled={isPending}
            onClick={() => {
              const ok = window.confirm(
                "Remettre cette visite à effectuer ? Les marqueurs « visite démarrée / terminée » et la date « effectuée » seront effacés. La date planifiée et l’affectation technicien sont conservés.",
              );
              if (!ok) return;
              exec(reopenTechnicalVisitForFieldwork);
            }}
          >
            {isPending ? "…" : "Remettre à effectuer"}
          </Button>
        ) : null}

        {permissions.lock ? (
          <Button
            size="lg"
            variant="outline"
            className="min-h-12 w-full sm:w-auto sm:min-h-10 sm:text-sm"
            disabled={isPending}
            onClick={() => exec(lockTechnicalVisit)}
          >
            {isPending ? "…" : "Verrouiller"}
          </Button>
        ) : null}

        {permissions.unlock ? (
          <Button
            size="lg"
            variant="outline"
            className="min-h-12 w-full sm:w-auto sm:min-h-10 sm:text-sm"
            disabled={isPending}
            onClick={() => exec(unlockTechnicalVisit)}
          >
            {isPending ? "…" : "Déverrouiller"}
          </Button>
        ) : null}

        {permissions.cancel ? (
          <Button
            size="lg"
            variant="outline"
            className="min-h-12 w-full border-destructive/50 text-destructive hover:bg-destructive/5 sm:w-auto sm:min-h-10 sm:text-sm"
            disabled={isPending}
            onClick={() => exec(cancelTechnicalVisit)}
          >
            {isPending ? "…" : "Annuler la visite"}
          </Button>
        ) : null}
      </div>

      {notice ? (
        <p className="rounded-md border border-emerald-500/35 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-950 dark:bg-emerald-950/35 dark:text-emerald-100">
          {notice}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );

  if (!mobileSticky) {
    return inner;
  }

  return (
    <div
      className={cn(
        "md:static md:z-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none",
        "sticky bottom-0 z-30 -mx-4 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-background/85",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))] md:mx-0 md:pb-0",
      )}
    >
      {inner}
    </div>
  );
}
