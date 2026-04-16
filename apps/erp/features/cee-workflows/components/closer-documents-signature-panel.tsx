"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Clock, Copy, Download, Eye, Mail, RefreshCw, Send, Stamp } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createCloserFollowUp,
  prepareCloserCommercialDocuments,
  resendAgreement,
  sendAgreementForSignature,
  sendCloserAgreement,
} from "@/features/cee-workflows/actions/closer-actions";
import type { CloserWorkflowDetail } from "@/features/cee-workflows/queries/get-closer-workflow-detail";
import type { LeadEmailRow } from "@/features/leads/queries/get-lead-emails";
import type { EmailTrackingRow } from "@/features/leads/study-pdf/queries/get-email-tracking";

function freshUrl(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
}

function statusLabel(detail: CloserWorkflowDetail): string {
  if (detail.workflow.workflow_status === "agreement_signed") return "Signé";
  if (detail.workflow.workflow_status === "lost") return "Perdu";
  if (detail.workflow.agreement_signature_status) return detail.workflow.agreement_signature_status;
  if (detail.workflow.agreement_sent_at) return "Envoyé";
  return "Non envoyé";
}

/** Emails pack commercial / relance (mêmes sujets que `sendStudyEmail`). */
function isPackOrRelanceSubject(subject: string | null): boolean {
  const s = (subject ?? "").toLowerCase();
  return (
    s.includes("accord") ||
    s.includes("signature") ||
    s.includes("projet") ||
    s.includes("étude") ||
    s.includes("etude") ||
    s.includes("rappel") ||
    s.includes("validez")
  );
}

function SentEmailTrackingRow({
  email,
  tracking,
}: {
  email: LeadEmailRow;
  tracking: EmailTrackingRow | null;
}) {
  const openCount = tracking?.open_count ?? 0;
  const opened = tracking != null && (tracking.opened_at != null || openCount > 0);

  return (
    <div className="rounded-lg border border-border/80 bg-background px-3 py-2.5 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="line-clamp-2 font-medium leading-snug text-foreground">{email.subject || "(sans objet)"}</p>
          <p className="text-xs text-muted-foreground">
            → {email.to_email} · {new Date(email.email_date).toLocaleString("fr-FR")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {tracking ? (
            opened ? (
              <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-200">
                <Eye className="size-3" />
                Ouvert{openCount > 1 ? ` ×${openCount}` : ""}
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200">
                <Clock className="size-3" />
                Pas encore ouvert
              </Badge>
            )
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Suivi ouverture N/D
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">Envoi SMTP OK</span>
        </div>
      </div>
      {tracking?.last_opened_at ? (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Dernière ouverture enregistrée : {new Date(tracking.last_opened_at).toLocaleString("fr-FR")}
        </p>
      ) : null}
    </div>
  );
}

export function CloserDocumentsSignaturePanel({
  detail,
  onUpdated,
}: {
  detail: CloserWorkflowDetail;
  onUpdated: () => void;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const lead = detail.workflow.lead;
  const presentation = detail.leadDocuments.find((doc) => doc.document_type === "study_pdf") ?? null;
  const accord = detail.leadDocuments.find((doc) => doc.document_type === "accord_commercial") ?? null;
  const clientEmail = lead?.email ?? "";
  const clientName = lead?.contact_name ?? "";
  const companyName = lead?.company_name ?? "";
  const siteName =
    [lead?.worksite_address, lead?.worksite_postal_code, lead?.worksite_city].filter(Boolean).join(", ") || "";

  const trackingMap = useMemo(
    () => new Map(detail.emailTracking.map((t) => [t.id, t] as const)),
    [detail.emailTracking],
  );

  const sentEmailsForTracking = useMemo(() => {
    const sent = detail.leadEmails.filter((e) => e.direction === "sent");
    const packFirst = sent.filter((e) => isPackOrRelanceSubject(e.subject));
    const other = sent.filter((e) => !isPackOrRelanceSubject(e.subject));
    return [...packFirst, ...other].slice(0, 8);
  }, [detail.leadEmails]);

  const leadPageHref = `/leads/${detail.workflow.lead_id}`;

   function handleGeneratePack() {
    startTransition(async () => {
      setFeedback(null);
      const result = await prepareCloserCommercialDocuments({
        workflowId: detail.workflow.id,
        leadId: detail.workflow.lead_id,
      });
      if (result.ok) {
        setFeedback("Pack commercial généré.");
        toast.success("Pack commercial généré.");
      } else {
        setFeedback(result.message);
        toast.error(result.message);
      }
      if (result.ok) {
        onUpdated();
      }
    });
  }

  function run(
    mode: "send" | "resend" | "signature" | "followup",
  ) {
    if (!accord?.file_url || !presentation?.file_url || !clientEmail) {
      setFeedback("Impossible : documents ou email client manquants.");
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      const result =
        mode === "send"
          ? await sendCloserAgreement({
              workflowId: detail.workflow.id,
              leadId: detail.workflow.lead_id,
              clientEmail,
              clientName,
              companyName,
              siteName,
              presentationUrl: presentation.file_url,
              accordUrl: accord.file_url,
            })
          : mode === "resend"
            ? await resendAgreement({
                workflowId: detail.workflow.id,
                leadId: detail.workflow.lead_id,
                clientEmail,
                clientName,
                companyName,
                siteName,
                presentationUrl: presentation.file_url,
                accordUrl: accord.file_url,
              })
            : mode === "signature"
              ? await sendAgreementForSignature({
                  workflowId: detail.workflow.id,
                  leadId: detail.workflow.lead_id,
                  clientEmail,
                  clientName,
                  companyName,
                  siteName,
                  presentationUrl: presentation.file_url,
                  accordUrl: accord.file_url,
                })
              : await createCloserFollowUp({
                  workflowId: detail.workflow.id,
                  next_follow_up_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  comment: "Relance closer depuis le panneau signature",
                });

      if (result.ok) {
        setFeedback("Action enregistrée.");
        toast.success("Action enregistrée.");
      } else {
        setFeedback(result.message);
        toast.error(result.message);
      }
      if (result.ok) {
        onUpdated();
      }
    });
  }

  async function copyAgreementLink() {
    if (!accord?.file_url) return;
    await navigator.clipboard.writeText(accord.file_url);
    setFeedback("Lien de l’accord copié.");
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>Documents et signature</CardTitle>
        <CardDescription>
          Générez la présentation et l’accord à partir du lead, puis ouvrez-les, envoyez l’accord et suivez la signature ou
          la relance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleGeneratePack} disabled={isPending}>
            {isPending ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
            {presentation || accord ? "Régénérer le pack commercial" : "Générer le pack commercial"}
          </Button>
        </div>
        {feedback ? (
          <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {feedback}
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border px-3 py-3">
            <div className="font-medium">Présentation</div>
            <div className="text-xs text-muted-foreground">{presentation ? "Disponible" : "Absente"}</div>
            <div className="mt-3 flex gap-2">
              <Button size="icon-xs" variant="outline" disabled={!presentation} onClick={() => presentation && window.open(freshUrl(presentation.file_url), "_blank", "noopener,noreferrer")}>
                <Eye />
              </Button>
              <Button size="icon-xs" variant="outline" disabled={!presentation} onClick={() => presentation && (window.location.href = freshUrl(presentation.file_url))}>
                <Download />
              </Button>
            </div>
          </div>
          <div className="rounded-lg border px-3 py-3">
            <div className="font-medium">Accord</div>
            <div className="text-xs text-muted-foreground">{accord ? "Disponible" : "Absent"}</div>
            <div className="mt-3 flex gap-2">
              <Button size="icon-xs" variant="outline" disabled={!accord} onClick={() => accord && window.open(freshUrl(accord.file_url), "_blank", "noopener,noreferrer")}>
                <Eye />
              </Button>
              <Button size="icon-xs" variant="outline" disabled={!accord} onClick={() => accord && (window.location.href = freshUrl(accord.file_url))}>
                <Download />
              </Button>
              <Button size="icon-xs" variant="outline" disabled={!accord} onClick={() => void copyAgreementLink()}>
                <Copy />
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 px-3 py-3 text-sm">
          <div><strong>Statut signature :</strong> {statusLabel(detail)}</div>
          <div><strong>Accord envoyé :</strong> {detail.workflow.agreement_sent_at ? new Date(detail.workflow.agreement_sent_at).toLocaleString("fr-FR") : "Non"}</div>
          <div><strong>Dernier email :</strong> {detail.leadEmails[0]?.email_date ? new Date(detail.leadEmails[0].email_date).toLocaleString("fr-FR") : "Aucun"}</div>
        </div>

        <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Suivi des envois</h4>
              <p className="text-xs text-muted-foreground">
                Ouverture via pixel de tracking (comme sur la fiche lead). Actualisez après quelques minutes si besoin.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onUpdated()} disabled={isPending}>
                <RefreshCw className="mr-1.5 size-3.5" />
                Actualiser
              </Button>
              <Link
                href={leadPageHref}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Historique complet
              </Link>
            </div>
          </div>

          {sentEmailsForTracking.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun email sortant enregistré pour ce lead.</p>
          ) : (
            <ul className="space-y-2">
              {sentEmailsForTracking.map((email) => (
                <li key={email.id}>
                  <SentEmailTrackingRow
                    email={email}
                    tracking={email.tracking_id ? trackingMap.get(email.tracking_id) ?? null : null}
                  />
                </li>
              ))}
            </ul>
          )}

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <strong>Livraison / spam :</strong> si l’envoi a réussi côté serveur, le message apparaît ici ; nous ne
            recevons pas encore les accusés « délivré / boîte de réception / courrier indésirable » ni les rebonds
            (adresse invalide) depuis le fournisseur mail. Si le client ne voit rien, faites vérifier les spams ou corrigez
            l’email sur la fiche lead puis renvoyez. <strong>Ouverture :</strong> certains webmails bloquent les images —
            « Pas encore ouvert » peut être un faux négatif ; les mails envoyés avant la mise à jour du pixel doivent être
            renvoyés pour utiliser le nouveau lien de suivi.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run("send")} disabled={isPending || !clientEmail || !presentation || !accord}>
            <Send className="mr-2 size-4" />
            Envoyer accord
          </Button>
          <Button variant="outline" onClick={() => run("signature")} disabled={isPending || !clientEmail || !presentation || !accord}>
            <Stamp className="mr-2 size-4" />
            Envoyer à signature
          </Button>
          <Button variant="outline" onClick={() => run("resend")} disabled={isPending || !clientEmail || !presentation || !accord}>
            <Mail className="mr-2 size-4" />
            Relancer
          </Button>
          <Button variant="outline" onClick={() => run("followup")} disabled={isPending}>
            <RefreshCw className="mr-2 size-4" />
            Planifier relance
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          La signature électronique n’est pas entièrement branchée : le flux utilise pour l’instant un fallback email tracé dans l’historique.
        </div>

      </CardContent>
    </Card>
  );
}
