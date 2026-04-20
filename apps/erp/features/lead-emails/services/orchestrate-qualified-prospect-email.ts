import { createClient } from "@/lib/supabase/server";

import type { Json } from "@/features/lead-generation/domain/json";
import { lgTable } from "@/features/lead-generation/lib/lg-db";
import { getLeadGenerationStockById } from "@/features/lead-generation/queries/get-lead-generation-stock-by-id";

import type { OpenAiGeneratedQualifiedEmail } from "../domain/types";
import { buildQualifiedLeadEmailContext } from "../lib/build-qualified-lead-email-context";
import { isQualifiedProspectEmailEnabled } from "../lib/qualified-prospect-email-config";
import { renderQualifiedEmailHtmlFromBodyText } from "../lib/render-qualified-email-html";
import { renderQualifiedEmailPlainText } from "../lib/render-qualified-email-text";
import { validateGeneratedQualifiedEmail } from "../lib/validate-generated-email";
import { buildFallbackQualifiedProspectEmail } from "./fallback-qualified-prospect-email";
import { generateQualifiedProspectEmailWithOpenAI } from "./generate-qualified-prospect-email";
import { sendQualifiedProspectEmailViaSmtp } from "./send-qualified-prospect-email-smtp";

type PipelineStatus = "skipped" | "validation_failed" | "sent" | "failed" | "openai_failed";
type GenSource = "openai" | "fallback" | "none";

async function insertEmailLog(input: {
  stockId: string;
  manualReviewId: string;
  recipientEmail: string;
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  usedSignals: string[];
  confidence: string | null;
  generationSource: GenSource;
  pipelineStatus: PipelineStatus;
  skipReason: string | null;
  smtpMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const t = lgTable(supabase, "lead_generation_qualified_prospect_emails");
  const { error } = await t.insert({
    stock_id: input.stockId,
    manual_review_id: input.manualReviewId,
    recipient_email: input.recipientEmail,
    subject: input.subject,
    body_text: input.bodyText,
    body_html: input.bodyHtml,
    used_signals: input.usedSignals as unknown as Json,
    confidence: input.confidence,
    generation_source: input.generationSource,
    pipeline_status: input.pipelineStatus,
    skip_reason: input.skipReason,
    smtp_message_id: input.smtpMessageId,
    error_message: input.errorMessage,
    sent_at: input.sentAt,
  });
  if (error) {
    console.error("[qualified-prospect-email] insert log failed", error.message);
  }
}

/**
 * Enchaîne contexte → OpenAI → validation → rendu → SMTP → journal.
 * Ne propage pas d’erreur : journalise. Appeler depuis `after()` ou équivalent.
 */
export async function orchestrateQualifiedProspectEmailAfterQuantifierQualify(input: {
  stockId: string;
  manualReviewId: string;
  qualificationNotes: string | null;
}): Promise<void> {
  const { stockId, manualReviewId, qualificationNotes } = input;

  const supabase = await createClient();
  const existing = lgTable(supabase, "lead_generation_qualified_prospect_emails");
  const { data: dup } = await existing.select("id").eq("manual_review_id", manualReviewId).maybeSingle();
  if (dup) {
    return;
  }

  if (!isQualifiedProspectEmailEnabled()) {
    await insertEmailLog({
      stockId,
      manualReviewId,
      recipientEmail: "—",
      subject: null,
      bodyText: null,
      bodyHtml: null,
      usedSignals: [],
      confidence: null,
      generationSource: "none",
      pipelineStatus: "skipped",
      skipReason: "QUALIFIED_LEAD_PROSPECT_EMAIL_ENABLED désactivé.",
      smtpMessageId: null,
      errorMessage: null,
      sentAt: null,
    });
    return;
  }

  const detail = await getLeadGenerationStockById(stockId);
  if (!detail) {
    await insertEmailLog({
      stockId,
      manualReviewId,
      recipientEmail: "—",
      subject: null,
      bodyText: null,
      bodyHtml: null,
      usedSignals: [],
      confidence: null,
      generationSource: "none",
      pipelineStatus: "skipped",
      skipReason: "Fiche stock introuvable.",
      smtpMessageId: null,
      errorMessage: null,
      sentAt: null,
    });
    return;
  }

  const ctx = buildQualifiedLeadEmailContext(detail.stock, qualificationNotes);
  const to = ctx.email?.trim();
  if (!to) {
    await insertEmailLog({
      stockId,
      manualReviewId,
      recipientEmail: "—",
      subject: null,
      bodyText: null,
      bodyHtml: null,
      usedSignals: [],
      confidence: null,
      generationSource: "none",
      pipelineStatus: "skipped",
      skipReason: "Aucune adresse e-mail destinataire (email / enriched_email).",
      smtpMessageId: null,
      errorMessage: null,
      sentAt: null,
    });
    return;
  }

  let gen: OpenAiGeneratedQualifiedEmail | null = null;
  let source: GenSource = "openai";
  let openAiError: string | null = null;

  try {
    gen = await generateQualifiedProspectEmailWithOpenAI(ctx);
  } catch (e) {
    openAiError = e instanceof Error ? e.message : String(e);
    gen = null;
  }

  if (gen) {
    const v = validateGeneratedQualifiedEmail(gen, ctx);
    if (v.ok) {
      const html = renderQualifiedEmailHtmlFromBodyText(gen.email_body);
      const text = renderQualifiedEmailPlainText(gen.email_body);
      const send = await sendQualifiedProspectEmailViaSmtp({
        to,
        subject: gen.subject,
        text,
        html,
      });
      if (send.ok) {
        await insertEmailLog({
          stockId,
          manualReviewId,
          recipientEmail: to,
          subject: gen.subject,
          bodyText: text,
          bodyHtml: html,
          usedSignals: gen.used_signals,
          confidence: gen.confidence,
          generationSource: "openai",
          pipelineStatus: "sent",
          skipReason: null,
          smtpMessageId: send.messageId,
          errorMessage: null,
          sentAt: new Date().toISOString(),
        });
        return;
      }
      await insertEmailLog({
        stockId,
        manualReviewId,
        recipientEmail: to,
        subject: gen.subject,
        bodyText: text,
        bodyHtml: html,
        usedSignals: gen.used_signals,
        confidence: gen.confidence,
        generationSource: "openai",
        pipelineStatus: "failed",
        skipReason: null,
        smtpMessageId: null,
        errorMessage: send.error,
        sentAt: null,
      });
      return;
    }
  }

  const fb = buildFallbackQualifiedProspectEmail(ctx);
  const genFb: OpenAiGeneratedQualifiedEmail = {
    subject: fb.subject,
    email_body: fb.email_body,
    used_signals: fb.used_signals,
    confidence: "medium",
  };
  const vf = validateGeneratedQualifiedEmail(genFb, ctx, { isFallback: true });

  if (!vf.ok) {
    await insertEmailLog({
      stockId,
      manualReviewId,
      recipientEmail: to,
      subject: gen?.subject ?? null,
      bodyText: gen?.email_body ?? null,
      bodyHtml: null,
      usedSignals: gen?.used_signals ?? [],
      confidence: gen?.confidence ?? null,
      generationSource: gen ? "openai" : "none",
      pipelineStatus: "validation_failed",
      skipReason: vf.reason + (openAiError ? ` | OpenAI: ${openAiError}` : ""),
      smtpMessageId: null,
      errorMessage: openAiError,
      sentAt: null,
    });
    return;
  }

  const html = renderQualifiedEmailHtmlFromBodyText(genFb.email_body);
  const text = renderQualifiedEmailPlainText(genFb.email_body);
  const send = await sendQualifiedProspectEmailViaSmtp({
    to,
    subject: genFb.subject,
    text,
    html,
  });

  if (send.ok) {
    await insertEmailLog({
      stockId,
      manualReviewId,
      recipientEmail: to,
      subject: genFb.subject,
      bodyText: text,
      bodyHtml: html,
      usedSignals: genFb.used_signals,
      confidence: "medium",
      generationSource: "fallback",
      pipelineStatus: "sent",
      skipReason: openAiError ? `Fallback après OpenAI: ${openAiError}` : null,
      smtpMessageId: send.messageId,
      errorMessage: openAiError,
      sentAt: new Date().toISOString(),
    });
    return;
  }

  await insertEmailLog({
    stockId,
    manualReviewId,
    recipientEmail: to,
    subject: genFb.subject,
    bodyText: text,
    bodyHtml: html,
    usedSignals: genFb.used_signals,
    confidence: "medium",
    generationSource: "fallback",
    pipelineStatus: "failed",
    skipReason: null,
    smtpMessageId: null,
    errorMessage: send.error,
    sentAt: null,
  });
}
