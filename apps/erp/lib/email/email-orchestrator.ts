import { createAdminClient } from "@/lib/supabase/admin";

import type { EmailType } from "./email-types";

type SendEmailInput = {
  type: EmailType;
  recipient: string;
  context?: Record<string, unknown>;
  metadata?: {
    provider?: string;
    sourceModule?: string;
  };
  execute?: () => Promise<{ ok: boolean; error?: string | null }>;
};

type SendEmailResult =
  | { ok: true; status: "sent" }
  | { ok: false; status: "failed"; error: string };

async function logEmailEvent(input: {
  emailType: EmailType;
  recipientEmail: string;
  status: "sent" | "failed";
  provider: string;
  error: string | null;
  sourceModule: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("email_events").insert({
      email_type: input.emailType,
      recipient_email: input.recipientEmail,
      status: input.status,
      provider: input.provider,
      error: input.error,
      source_module: input.sourceModule,
    });
  } catch (e) {
    console.error("[email-orchestrator] event log failed", e);
  }
}

async function executeByType(input: SendEmailInput): Promise<{ ok: boolean; error?: string | null }> {
  if (input.execute) {
    return input.execute();
  }

  switch (input.type) {
    case "QUALIFIED_PROSPECT": {
      const subject = String(input.context?.subject ?? "");
      const text = String(input.context?.text ?? "");
      const html = String(input.context?.html ?? "");
      if (!subject || !text || !html) {
        return { ok: false, error: "Context incomplet pour QUALIFIED_PROSPECT." };
      }
      const mod = await import("@/features/lead-emails/services/send-qualified-prospect-email-smtp");
      const res = await mod.sendQualifiedProspectEmailViaSmtp({
        to: input.recipient,
        subject,
        text,
        html,
      });
      return res.ok ? { ok: true } : { ok: false, error: res.error };
    }
    default:
      return {
        ok: false,
        error: `Aucun executeur configure pour le type ${input.type}.`,
      };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const recipient = input.recipient.trim();
  const provider = input.metadata?.provider ?? "smtp";
  const sourceModule = input.metadata?.sourceModule ?? "unknown";

  console.info("[email-orchestrator] before_send", {
    type: input.type,
    recipient,
    sourceModule,
  });

  try {
    const result = await executeByType(input);
    if (!result.ok) {
      const error = result.error?.trim() || "Email send failed.";
      await logEmailEvent({
        emailType: input.type,
        recipientEmail: recipient,
        status: "failed",
        provider,
        error,
        sourceModule,
      });
      console.error("[email-orchestrator] send_failed", {
        type: input.type,
        recipient,
        error,
      });
      return { ok: false, status: "failed", error };
    }

    await logEmailEvent({
      emailType: input.type,
      recipientEmail: recipient,
      status: "sent",
      provider,
      error: null,
      sourceModule,
    });
    console.info("[email-orchestrator] send_success", {
      type: input.type,
      recipient,
    });
    return { ok: true, status: "sent" };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Email send failed.";
    await logEmailEvent({
      emailType: input.type,
      recipientEmail: recipient,
      status: "failed",
      provider,
      error,
      sourceModule,
    });
    console.error("[email-orchestrator] send_error", {
      type: input.type,
      recipient,
      error,
    });
    return { ok: false, status: "failed", error };
  }
}
