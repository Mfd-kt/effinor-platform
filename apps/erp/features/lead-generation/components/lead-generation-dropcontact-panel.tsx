"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { enrichLeadWithDropcontactAction } from "../actions/enrich-lead-generation-stock-dropcontact-action";
import { pullLeadGenerationDropcontactResultAction } from "../actions/pull-lead-generation-dropcontact-result-action";
import { resetLeadGenerationDropcontactAction } from "../actions/reset-lead-generation-dropcontact-action";

function dropcontactStatusLabel(status: string): string {
  switch (status) {
    case "idle":
      return "Pas encore demandé";
    case "pending":
      return "En cours";
    case "completed":
      return "Terminé";
    case "failed":
      return "Sans résultat ou erreur";
    default:
      return status;
  }
}

type Props = {
  stockId: string;
  /** Pilotage lead gen : affiche le bouton de réinitialisation du cycle Dropcontact. */
  canResetDropcontact?: boolean;
  eligible: boolean;
  disabled: boolean;
  dropcontactStatus: string;
  /** Présent quand une requête Dropcontact est partie (permet la récupération GET si le webhook tarde). */
  dropcontactRequestId: string | null;
  dropcontactRequestedAt: string | null;
  dropcontactCompletedAt: string | null;
  dropcontactLastError: string | null;
  email: string | null;
  phone: string | null;
  decisionMakerName: string | null;
  decisionMakerRole: string | null;
  linkedinUrl: string | null;
};

export function LeadGenerationDropcontactPanel({
  stockId,
  canResetDropcontact = false,
  eligible,
  disabled,
  dropcontactStatus,
  dropcontactRequestId,
  dropcontactRequestedAt,
  dropcontactCompletedAt,
  dropcontactLastError,
  email,
  phone,
  decisionMakerName,
  decisionMakerRole,
  linkedinUrl,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resetPending, startResetTransition] = useTransition();
  const [pullPending, startPullTransition] = useTransition();
  const [flash, setFlash] = useState<{ tone: "ok" | "err" | "warn"; text: string } | null>(null);

  const isPending = dropcontactStatus === "pending";
  const busy = pending || resetPending || isPending;
  const canClick = eligible && !disabled && !busy;
  const hasDropcontactRequestId = Boolean(dropcontactRequestId?.trim());
  const canPullResult =
    dropcontactStatus === "pending" && hasDropcontactRequestId && !disabled && !pullPending && !pending;
  const showResetButton = canResetDropcontact && !disabled && dropcontactStatus !== "idle";

  return (
    <Card className="border-border/90 bg-card/60 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Enrichissement</CardTitle>
        <CardDescription>
          Après le clic, le serveur envoie un POST à Dropcontact puis interroge l’API en GET (comme un flow n8n) jusqu’à
          obtention du résultat ou fin de la fenêtre de polling. Le bouton « Récupérer le résultat » relance un GET si
          besoin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div className="space-y-2">
          <p>
            <span className="text-muted-foreground">Statut :</span>{" "}
            <span className="font-medium">{dropcontactStatusLabel(dropcontactStatus)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Dernière demande :{" "}
            {dropcontactRequestedAt ? formatDateTimeFr(dropcontactRequestedAt) : "—"}
            {dropcontactCompletedAt ? (
              <>
                {" · "}
                Réponse : {formatDateTimeFr(dropcontactCompletedAt)}
              </>
            ) : null}
          </p>
          {!eligible ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Renseignez au minimum le nom de l’entreprise et un site web (ou un site déjà suggéré sur la fiche).
            </p>
          ) : null}
          {dropcontactStatus === "pending" ? (
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
              Traitement Dropcontact en cours ou fenêtre de polling dépassée : utilisez « Récupérer le résultat » pour un
              nouveau GET sur le même request_id.
            </p>
          ) : null}
          {dropcontactStatus === "completed" ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">Fiche enrichie avec succès.</p>
          ) : null}
          {dropcontactLastError && dropcontactStatus === "failed" ? (
            <p className="text-xs text-muted-foreground">{dropcontactLastError}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-2"
            disabled={!canClick}
            onClick={() => {
              setFlash(null);
              startTransition(async () => {
                const res = await enrichLeadWithDropcontactAction(stockId);
                setFlash({
                  tone: res.ok ? (res.variant === "warn" ? "warn" : "ok") : "err",
                  text: res.message,
                });
                router.refresh();
              });
            }}
          >
            {pending || isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Enrichissement en cours…
              </>
            ) : (
              "Enrichir avec Dropcontact"
            )}
          </Button>
          {canPullResult || pullPending ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!canPullResult}
              onClick={() => {
                setFlash(null);
                startPullTransition(async () => {
                  const res = await pullLeadGenerationDropcontactResultAction(stockId);
                  setFlash({ tone: res.ok ? "ok" : "err", text: res.message });
                  router.refresh();
                });
              }}
            >
              {pullPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Récupération…
                </>
              ) : (
                "Récupérer le résultat"
              )}
            </Button>
          ) : null}
          {showResetButton ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-2"
              disabled={resetPending}
              onClick={() => {
                const ok = window.confirm(
                  "Réinitialiser le suivi Dropcontact sur cette fiche ? Vous pourrez relancer une demande d’enrichissement.",
                );
                if (!ok) return;
                setFlash(null);
                startResetTransition(async () => {
                  const res = await resetLeadGenerationDropcontactAction(stockId);
                  setFlash({ tone: res.ok ? "ok" : "err", text: res.message });
                  router.refresh();
                });
              }}
            >
              {resetPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Réinitialisation…
                </>
              ) : (
                "Réinitialiser le suivi (pilotage)"
              )}
            </Button>
          ) : null}
        </div>

        {flash ? (
          <p
            className={cn(
              "text-sm",
              flash.tone === "ok"
                ? "text-emerald-700 dark:text-emerald-400"
                : flash.tone === "warn"
                  ? "text-amber-900 dark:text-amber-100"
                  : "text-destructive",
            )}
          >
            {flash.text}
          </p>
        ) : null}

        <div className="border-t border-border pt-4 space-y-2">
          <h3 className="text-sm font-medium">Contact enrichi</h3>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">E-mail</p>
              <p className="break-words">{email?.trim() || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Téléphone</p>
              <p>{phone?.trim() || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nom</p>
              <p>{decisionMakerName?.trim() || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rôle</p>
              <p>{decisionMakerRole?.trim() || "—"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">LinkedIn</p>
              {linkedinUrl?.trim() ? (
                <a
                  href={linkedinUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline break-all"
                >
                  {linkedinUrl.trim()}
                </a>
              ) : (
                <p>—</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
