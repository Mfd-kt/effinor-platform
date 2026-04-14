"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Mail,
  MailOpen,
  Clock,
  Send,
  RefreshCw,
  Check,
  X,
  ExternalLink,
  Eye,
  Inbox,
  ArrowUpRight,
  ArrowDownLeft,
  FileSignature,
  PenLine,
  Sparkles,
  Paperclip,
  Download,
  FileText,
  AlertTriangle,
  PhoneCall,
  BadgeCheck,
  MessageCircleQuestion,
  ThumbsDown,
  Bot,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  sendStudyEmail,
  type EmailVariant,
  type EmailType,
} from "@/features/leads/study-pdf/actions/send-study-email";
import { getEmailTrackingAction } from "@/features/leads/study-pdf/actions/get-email-tracking-action";
import { syncLeadEmails } from "@/features/leads/actions/sync-lead-emails";
import { generateEmailDraft } from "@/features/leads/actions/generate-email-draft";
import { getLeadEmailsAction } from "@/features/leads/actions/get-lead-emails-action";
import { useRealtimeRows } from "@/lib/supabase/use-realtime";
import type { EmailTrackingRow } from "@/features/leads/study-pdf/queries/get-email-tracking";
import type { LeadEmailRow, EmailAiAnalysis } from "@/features/leads/queries/get-lead-emails";

type Props = {
  leadId: string;
  clientEmail?: string;
  clientName?: string;
  companyName?: string;
  siteName?: string;
  presentationUrl?: string;
  accordUrl?: string;
  initialTracking: EmailTrackingRow[];
  initialEmails: LeadEmailRow[];
};

/** Remove tracking pixel <img> tags from HTML so the preview doesn't count as an open */
function stripTrackingPixel(html: string): string {
  return html
    .replace(/<img[^>]*\/api\/open\/[^>]*>/gi, "")
    .replace(/<img[^>]*\/api\/email\/track\/[^>]*>/gi, "");
}

function dt(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  return dt(iso);
}

/* ────────────────────────── Email preview modal ────────────────────────── */

function EmailPreviewDialog({
  email,
  open,
  onClose,
}: {
  email: LeadEmailRow | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!email) return null;
  const isSent = email.direction === "sent";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isSent ? (
              <div className="flex size-7 items-center justify-center rounded-full bg-indigo-50">
                <ArrowUpRight className="size-3.5 text-indigo-600" />
              </div>
            ) : (
              <div className="flex size-7 items-center justify-center rounded-full bg-emerald-50">
                <ArrowDownLeft className="size-3.5 text-emerald-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base truncate">
                {email.subject || "(sans objet)"}
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                {isSent ? "Envoyé à" : "Reçu de"}{" "}
                <strong>{isSent ? email.to_email : email.from_email}</strong>
                {" · "}
                {dt(email.email_date)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-4 text-xs text-muted-foreground border-b border-border pb-3">
          <span>
            <strong>De :</strong> {email.from_email}
          </span>
          <span>
            <strong>À :</strong> {email.to_email}
          </span>
        </div>

        {email.attachments && email.attachments.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <Paperclip className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground mr-1">
              {email.attachments.length} pièce{email.attachments.length > 1 ? "s" : ""} jointe{email.attachments.length > 1 ? "s" : ""}
            </span>
            {email.attachments.map((att, i) => (
              <a
                key={i}
                href={att.storageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
              >
                <FileText className="size-3 text-muted-foreground shrink-0" />
                <span className="max-w-[180px] truncate">{att.filename}</span>
                <Download className="size-3 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-auto rounded-lg border border-border bg-white">
          {email.html_body ? (
            <iframe
              srcDoc={stripTrackingPixel(email.html_body)}
              title="Contenu email"
              className="w-full min-h-[400px] h-full border-0"
              sandbox="allow-same-origin"
            />
          ) : email.text_body ? (
            <pre className="whitespace-pre-wrap p-4 text-sm text-foreground font-sans leading-relaxed">
              {email.text_body}
            </pre>
          ) : (
            <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
              Aucun contenu disponible
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────── Timeline row ────────────────────────── */

function EmailTimelineRow({
  email,
  trackingMap,
  onView,
}: {
  email: LeadEmailRow;
  trackingMap: Map<string, EmailTrackingRow>;
  onView: () => void;
}) {
  const isSent = email.direction === "sent";
  const tracking = email.tracking_id
    ? trackingMap.get(email.tracking_id)
    : null;
  const isOpened =
    tracking != null &&
    (tracking.opened_at != null || (tracking.open_count ?? 0) > 0);
  const hasContent = !!email.html_body || !!email.text_body;
  const attachments = email.attachments ?? [];
  const ai = email.ai_analysis as EmailAiAnalysis | null;

  return (
    <div className="group flex gap-3 px-4 py-3 transition-colors hover:bg-muted/30 border-b border-border/50 last:border-b-0">
      <div className="shrink-0 pt-0.5">
        {isSent ? (
          <div className="flex size-9 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/30">
            <ArrowUpRight className="size-4 text-indigo-600" />
          </div>
        ) : (
          <div className="flex size-9 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
            <ArrowDownLeft className="size-4 text-emerald-600" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
              isSent
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
            }`}
          >
            {isSent ? "Envoyé" : "Reçu"}
          </span>
          <p className="truncate text-sm font-medium text-foreground">
            {email.subject || "(sans objet)"}
          </p>
          {attachments.length > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-950/30 dark:text-violet-400">
              <Paperclip className="size-2.5" />
              {attachments.length}
            </span>
          )}
        </div>

        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {isSent ? `→ ${email.to_email}` : `← ${email.from_email}`}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span>{relativeTime(email.email_date)}</span>
        </div>

        {attachments.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {attachments.map((att, i) => (
              <a
                key={i}
                href={att.storageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                <FileText className="size-3 text-muted-foreground" />
                <span className="max-w-[120px] truncate">{att.filename}</span>
                <Download className="size-2.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}

        {ai && (
          <div className="mt-1.5 space-y-1">
            <div className="flex flex-wrap gap-1">
              {ai.signed && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <BadgeCheck className="size-2.5" /> Signé
                </span>
              )}
              {ai.urgent && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 dark:bg-red-950/40 dark:text-red-300">
                  <AlertTriangle className="size-2.5" /> Urgent
                </span>
              )}
              {ai.callbackRequested && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <PhoneCall className="size-2.5" /> À rappeler
                </span>
              )}
              {ai.questionsAsked && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                  <MessageCircleQuestion className="size-2.5" /> Questions
                </span>
              )}
              {ai.negative && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/30 dark:text-red-400">
                  <ThumbsDown className="size-2.5" /> Objection
                </span>
              )}
            </div>
            {ai.summary && (
              <p className="flex items-start gap-1 text-[11px] leading-snug text-muted-foreground">
                <Bot className="mt-0.5 size-3 shrink-0 text-primary/60" />
                {ai.summary}
              </p>
            )}
            {ai.recommendedAction && (
              <p className="text-[11px] leading-snug font-medium text-primary/80">
                → {ai.recommendedAction}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isSent && tracking && (
          <>
            {isOpened ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <Eye className="size-3" />
                Ouvert
                {(tracking.open_count ?? 0) > 1
                  ? ` ${tracking.open_count}×`
                  : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                <Clock className="size-3" />
                En attente
              </span>
            )}
          </>
        )}

        {hasContent && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onView}
            title="Voir le contenu"
          >
            <Eye className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────── Email type card ────────────────────────── */

const EMAIL_TYPE_OPTIONS: {
  type: EmailType;
  icon: typeof Sparkles;
  label: string;
  description: string;
}[] = [
  {
    type: "premier_contact",
    icon: UserPlus,
    label: "Premier contact",
    description: "Présentation Effinor et prise de contact initiale",
  },
  {
    type: "study",
    icon: Sparkles,
    label: "Étude & Accord",
    description: "Envoi des documents projet avec email A/B optimisé",
  },
  {
    type: "relance_signature",
    icon: FileSignature,
    label: "Relance signature",
    description: "Rappel pour signer l'accord de principe",
  },
  {
    type: "libre",
    icon: PenLine,
    label: "Email libre",
    description: "Rédigez librement votre message au client",
  },
];

/* ────────────────────────── Main component ────────────────────────── */

export function LeadEmailHistory({
  leadId,
  clientEmail,
  clientName,
  companyName,
  siteName,
  presentationUrl,
  accordUrl,
  initialTracking,
  initialEmails,
}: Props) {
  const router = useRouter();

  // ── Realtime : emails ──
  const { rows: emails, refresh: refreshEmails } = useRealtimeRows<LeadEmailRow & { id: string }>({
    table: "lead_emails",
    filter: `lead_id=eq.${leadId}`,
    initialData: initialEmails as (LeadEmailRow & { id: string })[],
    onEvent: (event, row) => {
      if (event === "INSERT" && row.direction === "received") {
        toast.info("Nouvel email reçu", {
          description: row.subject || "(sans objet)",
        });
      }
      if (event === "DELETE") {
        toast("Email supprimé", { description: "L'historique a été mis à jour." });
      }
    },
  });

  // ── Realtime : tracking ──
  const { rows: tracking, refresh: refreshTracking } = useRealtimeRows<EmailTrackingRow & { id: string }>({
    table: "email_tracking",
    filter: `lead_id=eq.${leadId}`,
    initialData: initialTracking as (EmailTrackingRow & { id: string })[],
    onEvent: (event, row) => {
      if (event === "UPDATE" && row.opened_at) {
        toast.success("Email ouvert !", {
          description: `${row.recipient} a ouvert l'email`,
        });
        router.refresh();
      }
    },
  });

  const [showCompose, setShowCompose] = useState(false);
  const [emailType, setEmailType] = useState<EmailType>("study");
  const [emailTo, setEmailTo] = useState(clientEmail ?? "");
  const [emailVariant, setEmailVariant] = useState<EmailVariant>("A");
  const [freeSubject, setFreeSubject] = useState("");
  const [freeBody, setFreeBody] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, startGenerating] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

  const [isSending, startSending] = useTransition();
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [sendError, setSendError] = useState<string | null>(null);

  const [isSyncing, startSyncing] = useTransition();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [viewEmail, setViewEmail] = useState<LeadEmailRow | null>(null);

  const hasDocuments = !!presentationUrl || !!accordUrl;

  const totalSent = emails.filter((e) => e.direction === "sent").length;
  const totalReceived = emails.filter((e) => e.direction === "received").length;
  const totalOpened = tracking.filter((t) => !!t.opened_at).length;

  const trackingMap = new Map(tracking.map((t) => [t.id, t]));

  const refreshAll = useCallback(async () => {
    const [freshTracking, freshEmails] = await Promise.all([
      getEmailTrackingAction(leadId),
      getLeadEmailsAction(leadId),
    ]);
    refreshTracking(freshTracking as (EmailTrackingRow & { id: string })[]);
    refreshEmails(freshEmails as (LeadEmailRow & { id: string })[]);
  }, [leadId, refreshTracking, refreshEmails]);

  const runSync = useCallback(async (silent = false) => {
    if (!clientEmail) return;
    const res = await syncLeadEmails(leadId, clientEmail);
    if (!res.ok) {
      if (!silent) setSyncMessage(`Erreur : ${res.error}`);
      return;
    }
    const parts: string[] = [];
    if (res.synced > 0) {
      parts.push(`${res.synced} email${res.synced > 1 ? "s" : ""} synchronisé${res.synced > 1 ? "s" : ""}`);
    }
    if (res.deleted > 0) {
      parts.push(`${res.deleted} supprimé${res.deleted > 1 ? "s" : ""}`);
    }
    if (res.attachmentsSaved > 0) {
      parts.push(`${res.attachmentsSaved} pièce${res.attachmentsSaved > 1 ? "s" : ""} jointe${res.attachmentsSaved > 1 ? "s" : ""} enregistrée${res.attachmentsSaved > 1 ? "s" : ""}`);
    }
    const aiParts: string[] = [];
    if (res.aiFlags?.signed) aiParts.push("Document signé détecté");
    if (res.aiFlags?.urgent) aiParts.push("Email urgent");
    if (res.aiFlags?.callbackRequested) aiParts.push("Client à rappeler");
    if (aiParts.length > 0) parts.push(aiParts.join(" · "));

    if (parts.length > 0 && !silent) {
      toast.info("Synchronisation Gmail", { description: parts.join(" · ") });
    }

    if (!silent) {
      setSyncMessage(parts.length > 0 ? parts.join(" · ") : "Déjà à jour");
      setTimeout(() => setSyncMessage(null), 3000);
    }

    await refreshAll();
  }, [clientEmail, leadId, refreshAll]);

  // Sync à l’ouverture de la fiche (silencieux). La sync continue en arrière-plan via
  // GET/POST /api/cron/lead-email-sync (Dokploy + même secret que l’automation).
  useEffect(() => {
    if (!clientEmail) return;
    runSync(true);
  }, [clientEmail, runSync]);

  function onSync() {
    if (!clientEmail) return;
    setSyncMessage(null);
    startSyncing(async () => {
      await runSync(false);
    });
  }

  function onSend() {
    setSendStatus("idle");
    setSendError(null);
    startSending(async () => {
      const res = await sendStudyEmail({
        to: emailTo.trim(),
        leadId,
        clientName: clientName ?? "",
        companyName: companyName ?? "",
        siteName: siteName ?? "",
        presentationUrl: presentationUrl ?? null,
        accordUrl: accordUrl ?? null,
        variant: emailVariant,
        emailType,
        freeSubject: emailType === "libre" ? freeSubject : undefined,
        freeBody: emailType === "libre" ? freeBody : undefined,
      });
      if (!res.ok) {
        setSendStatus("error");
        setSendError(res.error);
        return;
      }
      setSendStatus("success");
      await refreshAll();
      router.refresh();
      setTimeout(() => {
        setShowCompose(false);
        setSendStatus("idle");
        setFreeSubject("");
        setFreeBody("");
      }, 2500);
    });
  }

  function openCompose(type?: EmailType) {
    if (type) setEmailType(type);
    setShowCompose(true);
    setSendStatus("idle");
    setSendError(null);
    setAiError(null);
    if (!emailTo && clientEmail) setEmailTo(clientEmail);
  }

  function onGenerateDraft() {
    setAiError(null);
    startGenerating(async () => {
      const res = await generateEmailDraft({
        leadId,
        userPrompt: aiPrompt.trim() || undefined,
      });
      if (!res.ok) {
        setAiError(res.error);
        return;
      }
      setFreeSubject(res.subject);
      setFreeBody(res.body);
    });
  }

  const canSend =
    emailTo.trim() &&
    (emailType !== "libre" || freeBody.trim()) &&
    (emailType !== "study" || hasDocuments);

  return (
    <>
      <div className="space-y-4">
        {/* ── Stats + Actions bar ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowUpRight className="size-3 text-indigo-500" />
              {totalSent} envoyé{totalSent > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <ArrowDownLeft className="size-3 text-emerald-500" />
              {totalReceived} reçu{totalReceived > 1 ? "s" : ""}
            </span>
            {totalOpened > 0 && (
              <span className="flex items-center gap-1">
                <MailOpen className="size-3 text-emerald-500" />
                {totalOpened} ouvert{totalOpened > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {clientEmail && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSync}
                disabled={isSyncing}
                title="Synchroniser avec Gmail"
              >
                {isSyncing ? (
                  <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Inbox className="mr-1.5 size-3.5" />
                )}
                {isSyncing ? "Sync..." : "Synchroniser"}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => openCompose()}
            >
              <Send className="mr-1.5 size-3.5" />
              Nouvel email
            </Button>
          </div>
        </div>

        {syncMessage && (
          <div className={`rounded-md border px-3 py-2 text-xs ${
            syncMessage.includes("🚨") || syncMessage.includes("📝") || syncMessage.includes("📞")
              ? "border-amber-200 bg-amber-50 text-amber-900 font-medium dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
              : "border-border bg-muted/30 text-muted-foreground"
          }`}>
            {syncMessage}
          </div>
        )}

        {/* ── Composer ── */}
        {showCompose && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Nouvel email</p>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowCompose(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2">
              {EMAIL_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = emailType === opt.type;
                const disabled = opt.type === "study" && !hasDocuments;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    disabled={disabled}
                    onClick={() => setEmailType(opt.type)}
                    className={`group/card relative flex flex-col items-start rounded-lg border p-3 text-left text-xs transition-all ${
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : disabled
                          ? "cursor-not-allowed border-border bg-muted/30 opacity-50"
                          : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <Icon className={`mb-1.5 size-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-semibold leading-tight">{opt.label}</span>
                    <span className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{opt.description}</span>
                  </button>
                );
              })}
            </div>

            {/* Destinataire */}
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="email@client.fr"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Study variant selector */}
            {emailType === "study" && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Version du template
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailVariant("A")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      emailVariant === "A"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-background hover:bg-muted/50"
                    }`}
                  >
                    <span className="font-semibold">A — Closing</span>
                    <br />
                    <span className="text-muted-foreground">
                      Court, ROI, impact
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailVariant("B")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      emailVariant === "B"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-background hover:bg-muted/50"
                    }`}
                  >
                    <span className="font-semibold">B — Persuasion</span>
                    <br />
                    <span className="text-muted-foreground">
                      Progressif, rassurant
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Free email fields */}
            {emailType === "libre" && (
              <div className="space-y-3">
                {/* AI generation */}
                <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <span className="text-xs font-semibold">Assistant IA</span>
                    <span className="text-[10px] text-muted-foreground">— génère l'objet et le message à partir du contexte du lead</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Ex: relancer pour planifier la visite technique, remercier pour la signature..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="flex-1 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          onGenerateDraft();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={onGenerateDraft}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <><RefreshCw className="mr-1.5 size-3.5 animate-spin" />Génération...</>
                      ) : (
                        <><Sparkles className="mr-1.5 size-3.5" />Générer</>
                      )}
                    </Button>
                  </div>
                  {aiError && (
                    <p className="text-xs text-destructive">{aiError}</p>
                  )}
                </div>

                <Input
                  type="text"
                  placeholder="Objet de l'email"
                  value={freeSubject}
                  onChange={(e) => setFreeSubject(e.target.value)}
                />
                <Textarea
                  placeholder="Rédigez votre message ici..."
                  value={freeBody}
                  onChange={(e) => setFreeBody(e.target.value)}
                  rows={6}
                  className="resize-y"
                />
              </div>
            )}

            {/* Attachments hint for non-libre */}
            {emailType !== "libre" && hasDocuments && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {presentationUrl && (
                  <span className="flex items-center gap-1">
                    <ExternalLink className="size-3" /> Présentation
                  </span>
                )}
                {accordUrl && (
                  <span className="flex items-center gap-1">
                    <ExternalLink className="size-3" /> Accord
                  </span>
                )}
                <span>en pièces jointes</span>
              </div>
            )}

            {/* Send button */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompose(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={onSend}
                disabled={isSending || !canSend}
                size="sm"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                    Envoi...
                  </>
                ) : sendStatus === "success" ? (
                  <>
                    <Check className="mr-1.5 size-3.5" />
                    Envoyé !
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 size-3.5" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>

            {sendStatus === "success" && (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-sm text-emerald-700">
                <Check className="size-4" />
                Email envoyé à {emailTo}
              </div>
            )}

            {sendStatus === "error" && sendError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-sm text-destructive">
                {sendError}
              </div>
            )}
          </div>
        )}

        {/* ── Timeline ── */}
        {emails.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border">
            {emails.map((email) => (
              <EmailTimelineRow
                key={email.id}
                email={email}
                trackingMap={trackingMap}
                onView={() => setViewEmail(email)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
            <Mail className="mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              Aucun email
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Envoyez les documents ou synchronisez la boîte Gmail.
            </p>
          </div>
        )}
      </div>

      <EmailPreviewDialog
        email={viewEmail}
        open={viewEmail != null}
        onClose={() => setViewEmail(null)}
      />
    </>
  );
}
