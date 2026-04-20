"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { enrichLeadWithDropcontactAction } from "../actions/enrich-lead-generation-stock-dropcontact-action";
import { pullLeadGenerationDropcontactResultAction } from "../actions/pull-lead-generation-dropcontact-result-action";
import { resetLeadGenerationDropcontactAction } from "../actions/reset-lead-generation-dropcontact-action";
import { updateQuantifierLeadGenerationContactFieldsAction } from "../actions/update-quantifier-lead-generation-contact-fields-action";

function QuantifierManualContactFields({
  stockId,
  email: initialEmail,
  phone: initialPhone,
  decisionMakerName: initialName,
  decisionMakerRole: initialRole,
  linkedinUrl: initialLinkedin,
}: Pick<
  Props,
  "stockId" | "email" | "phone" | "decisionMakerName" | "decisionMakerRole" | "linkedinUrl"
>) {
  const router = useRouter();
  const [savePending, startSave] = useTransition();
  const [saveFlash, setSaveFlash] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [dmName, setDmName] = useState(initialName ?? "");
  const [dmRole, setDmRole] = useState(initialRole ?? "");
  const [linkedin, setLinkedin] = useState(initialLinkedin ?? "");

  useEffect(() => {
    setEmail(initialEmail ?? "");
    setPhone(initialPhone ?? "");
    setDmName(initialName ?? "");
    setDmRole(initialRole ?? "");
    setLinkedin(initialLinkedin ?? "");
  }, [initialEmail, initialPhone, initialName, initialRole, initialLinkedin]);

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <h3 className="text-sm font-medium">Saisie manuelle</h3>
      <p className="text-[11px] text-muted-foreground">
        Complétez ou corrigez les coordonnées avant qualification ; elles remplacent les valeurs affichées sur la fiche
        et dans les exports.
      </p>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`lg-dc-email-${stockId}`}>E-mail</Label>
          <Input
            id={`lg-dc-email-${stockId}`}
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@exemple.fr"
            disabled={savePending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`lg-dc-phone-${stockId}`}>Téléphone</Label>
          <Input
            id={`lg-dc-phone-${stockId}`}
            type="tel"
            autoComplete="off"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33 …"
            disabled={savePending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`lg-dc-dm-${stockId}`}>Nom (décideur)</Label>
          <Input
            id={`lg-dc-dm-${stockId}`}
            value={dmName}
            onChange={(e) => setDmName(e.target.value)}
            disabled={savePending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`lg-dc-role-${stockId}`}>Rôle</Label>
          <Input
            id={`lg-dc-role-${stockId}`}
            value={dmRole}
            onChange={(e) => setDmRole(e.target.value)}
            disabled={savePending}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`lg-dc-li-${stockId}`}>LinkedIn (URL complète)</Label>
          <Input
            id={`lg-dc-li-${stockId}`}
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://www.linkedin.com/in/…"
            disabled={savePending}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={savePending}
          onClick={() => {
            setSaveFlash(null);
            startSave(async () => {
              const res = await updateQuantifierLeadGenerationContactFieldsAction({
                stockId,
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                decisionMakerName: dmName.trim() || undefined,
                decisionMakerRole: dmRole.trim() || undefined,
                linkedinUrl: linkedin.trim() || undefined,
              });
              if (!res.ok) {
                setSaveFlash({ tone: "err", text: res.error });
                return;
              }
              setSaveFlash({ tone: "ok", text: "Coordonnées enregistrées." });
              router.refresh();
            });
          }}
        >
          {savePending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Enregistrement…
            </>
          ) : (
            "Enregistrer les coordonnées"
          )}
        </Button>
      </div>
      {saveFlash ? (
        <p
          className={cn(
            "text-xs",
            saveFlash.tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-destructive",
          )}
        >
          {saveFlash.text}
        </p>
      ) : null}
    </div>
  );
}

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
  /** Libellés adaptés à l’écran quantificateur. */
  context?: "pilotage" | "quantification";
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
  context = "pilotage",
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
  const isQuant = context === "quantification";

  return (
    <Card className="border-border/90 bg-card/60 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{isQuant ? "Dropcontact (optionnel)" : "Enrichissement"}</CardTitle>
        <CardDescription>
          {isQuant ? (
            <>
              Lance une recherche de contacts si l’e-mail ou le décideur manque avant de qualifier. Le serveur interroge
              Dropcontact puis met à jour la fiche ; « Récupérer le résultat » relance la lecture si besoin.
            </>
          ) : (
            <>
              Après le clic, le serveur envoie un POST à Dropcontact puis interroge l’API en GET (comme un flow n8n)
              jusqu’à obtention du résultat ou fin de la fenêtre de polling. Le bouton « Récupérer le résultat » relance
              un GET si besoin.
            </>
          )}
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
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              {isQuant ? "Données Dropcontact intégrées à la fiche." : "Fiche enrichie avec succès."}
            </p>
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
                  "Réinitialiser le suivi Dropcontact sur cette fiche ? Vous pourrez relancer une demande.",
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
                isQuant ? "Réinitialiser Dropcontact" : "Réinitialiser le suivi (pilotage)"
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
          <h3 className="text-sm font-medium">{isQuant ? "Données Dropcontact" : "Contact enrichi"}</h3>
          {isQuant ? (
            <QuantifierManualContactFields
              stockId={stockId}
              email={email}
              phone={phone}
              decisionMakerName={decisionMakerName}
              decisionMakerRole={decisionMakerRole}
              linkedinUrl={linkedinUrl}
            />
          ) : (
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
