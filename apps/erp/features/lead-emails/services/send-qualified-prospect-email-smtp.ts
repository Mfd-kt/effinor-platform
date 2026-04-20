import nodemailer from "nodemailer";

import { getFromAddress, getMailTransport } from "@/lib/email/gmail-transport";

export type SendQualifiedProspectEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type SendQualifiedProspectEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function getReplyTo(): string | undefined {
  const r = process.env.SMTP_REPLY_TO?.trim();
  return r || undefined;
}

/**
 * From : priorité QUALIFIED_LEAD_EMAIL_FROM puis SMTP_FROM_EMAIL puis comportement global (MAIL_FROM / SMTP_USER).
 */
function getQualifiedFromHeader(): string {
  const explicit =
    process.env.QUALIFIED_LEAD_EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM_EMAIL?.trim() ||
    process.env.MAIL_FROM?.trim();
  const name =
    process.env.QUALIFIED_LEAD_EMAIL_FROM_NAME?.trim() ||
    process.env.SMTP_FROM_NAME?.trim() ||
    process.env.MAIL_FROM_NAME?.trim() ||
    "Effinor";

  if (explicit && /^[^\s<]+@[^\s>]+\.[^\s>]+$/i.test(explicit)) {
    return `"${name}" <${explicit}>`;
  }

  return getFromAddress();
}

export async function sendQualifiedProspectEmailViaSmtp(input: SendQualifiedProspectEmailInput): Promise<SendQualifiedProspectEmailResult> {
  try {
    const transport = getMailTransport() as nodemailer.Transporter;
    const from = getQualifiedFromHeader();
    const replyTo = getReplyTo();

    const info = await transport.sendMail({
      from,
      to: input.to,
      replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    const messageId = typeof info.messageId === "string" ? info.messageId : "";
    return { ok: true, messageId: messageId || "(no-id)" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.slice(0, 2000) };
  }
}
