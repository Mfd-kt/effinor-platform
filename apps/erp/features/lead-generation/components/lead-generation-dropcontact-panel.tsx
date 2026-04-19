"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { enrichLeadWithDropcontactAction } from "../actions/enrich-lead-generation-stock-dropcontact-action";

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
  eligible: boolean;
  disabled: boolean;
  dropcontactStatus: string;
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
  eligible,
  disabled,
  dropcontactStatus,
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
  const [flash, setFlash] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const isPending = dropcontactStatus === "pending";
  const busy = pending || isPending;
  const canClick = eligible && !disabled && !busy;

  return (
    <Card className="border-border/90 bg-card/60 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Enrichissement</CardTitle>
        <CardDescription>
          Une requête part vers Dropcontact ; le résultat revient sur le serveur via un webhook (pas dans le navigateur).
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
              Le résultat arrive par webhook : l’URL doit être joignable depuis Internet (pas{" "}
              <span className="font-mono text-[11px]">localhost</span> sans tunnel). Sinon le statut reste sur « En
              cours ». Configurez <span className="font-mono text-[11px]">DROPCONTACT_WEBHOOK_CALLBACK_URL</span> ou un
              déploiement public.
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
                setFlash({ tone: res.ok ? "ok" : "err", text: res.message });
                router.refresh();
              });
            }}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Enrichissement en cours…
              </>
            ) : (
              "Enrichir avec Dropcontact"
            )}
          </Button>
        </div>

        {flash ? (
          <p
            className={cn(
              "text-sm",
              flash.tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
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
