"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Download, Eye, RefreshCw, Send, Check, Mail, Inbox } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRealtimeRows } from "@/lib/supabase/use-realtime";
import { generateLeadStudyPdf } from "@/features/leads/study-pdf/actions/generate-lead-study-pdf";
import { sendStudyEmail, type EmailVariant } from "@/features/leads/study-pdf/actions/send-study-email";
import type { LeadStudyDocumentRow } from "@/features/leads/study-pdf/domain/types";

type LeadStudyPdfCardProps = {
  leadId: string;
  documents: LeadStudyDocumentRow[];
  clientEmail?: string;
  clientName?: string;
  companyName?: string;
  siteName?: string;
};

function dt(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

function freshUrl(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${Date.now()}`;
}

function DocRow({ doc, label, received }: { doc: LeadStudyDocumentRow; label: string; received?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-lg border p-3 ${
      received
        ? "border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/20"
        : "border-border/70 bg-muted/20"
    }`}>
      <div className="flex items-center gap-3">
        {received ? (
          <Inbox className="size-5 text-violet-600" />
        ) : (
          <FileText className="size-5 text-primary" />
        )}
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{dt(doc.created_at)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => window.open(freshUrl(doc.file_url), "_blank", "noopener,noreferrer")}
        >
          <Eye />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => { window.location.href = freshUrl(doc.file_url); }}
        >
          <Download />
        </Button>
      </div>
    </div>
  );
}

export function LeadStudyPdfCard({ leadId, documents, clientEmail, clientName, companyName, siteName }: LeadStudyPdfCardProps) {
  const router = useRouter();

  // ── Realtime : documents ──
  const { rows: allDocs } = useRealtimeRows<LeadStudyDocumentRow & { id: string }>({
    table: "lead_documents",
    filter: `lead_id=eq.${leadId}`,
    initialData: documents as (LeadStudyDocumentRow & { id: string })[],
    onEvent: (event, row) => {
      if (event === "INSERT" && row.document_type === "received_document") {
        toast.info("Document reçu du client", { description: row.title });
      }
    },
  });

  const presentation = allDocs.find((d) => d.document_type === "study_pdf") ?? null;
  const accord = allDocs.find((d) => d.document_type === "accord_commercial") ?? null;
  const receivedDocs = allDocs.filter((d) => d.document_type === "received_document");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  const [showSendAccord, setShowSendAccord] = useState(false);
  const [accordEmail, setAccordEmail] = useState(clientEmail ?? "");
  const [accordVariant, setAccordVariant] = useState<EmailVariant>("A");
  const [isSendingAccord, startSendingAccord] = useTransition();
  const [accordStatus, setAccordStatus] = useState<"idle" | "success" | "error">("idle");
  const [accordError, setAccordError] = useState<string | null>(null);

  const hasDocuments = presentation != null || accord != null;

  function onGenerate() {
    setError(null);
    setMissing([]);
    startTransition(async () => {
      const res = await generateLeadStudyPdf(leadId);
      if (!res.ok) {
        setError(res.error);
        setMissing(res.missing ?? []);
        return;
      }
      router.refresh();
      window.open(res.presentation.file_url, "_blank", "noopener,noreferrer");
    });
  }

  function onSendAccord() {
    setAccordStatus("idle");
    setAccordError(null);
    startSendingAccord(async () => {
      const res = await sendStudyEmail({
        to: accordEmail.trim(),
        leadId,
        clientName: clientName ?? "",
        companyName: companyName ?? "",
        siteName: siteName ?? "",
        presentationUrl: presentation?.file_url ?? null,
        accordUrl: accord?.file_url ?? null,
        variant: accordVariant,
      });
      if (!res.ok) {
        setAccordStatus("error");
        setAccordError(res.error);
        return;
      }
      setAccordStatus("success");
      router.refresh();
      setTimeout(() => {
        setShowSendAccord(false);
        setAccordStatus("idle");
      }, 2500);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onGenerate} disabled={isPending}>
          {isPending ? (
            <>
              <RefreshCw className="mr-1.5 size-4 animate-spin" />
              Génération...
            </>
          ) : hasDocuments ? (
            "Régénérer les documents"
          ) : (
            "Générer les documents"
          )}
        </Button>

        {hasDocuments && (
          <Button
            variant="outline"
            onClick={() => {
              setShowSendAccord(!showSendAccord);
              setAccordStatus("idle");
              setAccordError(null);
              if (!accordEmail && clientEmail) setAccordEmail(clientEmail);
            }}
          >
            <Mail className="mr-1.5 size-4" />
            Envoyer au client
          </Button>
        )}
      </div>

      {showSendAccord && hasDocuments && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-semibold">Envoyer les documents au client</p>
          <div className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="email@client.fr"
              value={accordEmail}
              onChange={(e) => setAccordEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={onSendAccord}
              disabled={isSendingAccord || !accordEmail.trim()}
              size="sm"
            >
              {isSendingAccord ? (
                <><RefreshCw className="mr-1.5 size-3.5 animate-spin" />Envoi...</>
              ) : accordStatus === "success" ? (
                <><Check className="mr-1.5 size-3.5" />Envoyé !</>
              ) : (
                <><Send className="mr-1.5 size-3.5" />Envoyer</>
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            {(["A", "B"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAccordVariant(v)}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  accordVariant === v
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <span className="font-semibold">{v === "A" ? "Closing direct" : "Persuasion"}</span>
              </button>
            ))}
          </div>

          {accordStatus === "success" && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
              <Check className="size-4" /> Envoyé à {accordEmail}
            </div>
          )}
          {accordStatus === "error" && accordError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
              {accordError}
            </div>
          )}
        </div>
      )}

      {hasDocuments ? (
        <div className="space-y-2">
          {presentation ? <DocRow doc={presentation} label="Présentation projet" /> : null}
          {accord ? <DocRow doc={accord} label="Accord de principe" /> : null}
        </div>
      ) : (
        <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
          Aucun document généré
        </div>
      )}

      {receivedDocs.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Inbox className="size-3.5" />
            Documents reçus du client
          </p>
          {receivedDocs.map((doc) => (
            <DocRow key={doc.id} doc={doc} label={doc.title} received />
          ))}
        </div>
      )}

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <p>{error}</p>
          {missing.length ? (
            <ul className="mt-2 list-disc pl-5">
              {missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
