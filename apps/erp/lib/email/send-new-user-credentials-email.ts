import { headers } from "next/headers";
import { createHash, randomUUID } from "node:crypto";

import { resolvePublicAppBaseUrl } from "@/lib/app-public-url";
import { sendEmail } from "@/lib/email/email-orchestrator";
import { getEmailSignature } from "@/lib/email/signature";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getFromAddressForUserCreation,
  getMailTransportForUserCreation,
  hasUserCreationSmtpConfigured,
  isGmailOnlyMailBackend,
  primaryAddressFromFromHeader,
} from "@/lib/email/gmail-transport";

export type SendNewUserCredentialsResult = { ok: true } | { ok: false; error: string };

function hintForSmtpErrorMessage(msg: string): string {
  if (/535|authentication failed|invalid login|5\.7\.8/i.test(msg)) {
    return `${msg} — Indications : USER_CREATION_SMTP_USER doit être l’e-mail complet de la boîte (ex. no-reply@effinor.app) ; le mot de passe est celui de cette boîte dans Hostinger (ou un mot de passe d’application si vous l’avez activé). Essayez port 587 avec USER_CREATION_SMTP_SECURE=false si 465 échoue. Vérifiez qu’il n’y a pas d’espace en trop dans Dokploy / .env.`;
  }
  return msg;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

/**
 * Envoie un lien sécurisé de configuration de mot de passe initial.
 * À n’appeler que depuis un contexte serveur (Server Action / Route Handler).
 */
export async function sendNewUserCredentialsEmail(params: {
  to: string;
  userId: string;
  displayName?: string | null;
}): Promise<SendNewUserCredentialsResult> {
  const { to, userId, displayName } = params;

  if (!to || !to.includes("@")) {
    return { ok: false, error: "Adresse e-mail invalide." };
  }

  try {
    const h = await headers();
    const baseUrl = resolvePublicAppBaseUrl(h);
    const rawToken = randomUUID();
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const setupPasswordUrl = `${baseUrl}/login/setup-password?token=${encodeURIComponent(rawToken)}`;

    const admin = createAdminClient();
    await admin.from("user_password_setup_tokens").insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    const greeting = displayName?.trim() ? `Bonjour ${displayName.trim()},` : "Bonjour,";

    const subject = "Effinor ERP — configurez votre mot de passe";
    const text = `${greeting}

Votre compte Effinor ERP a été créé.
Pour activer votre accès, définissez votre mot de passe via ce lien sécurisé (valable 24h) :

${setupPasswordUrl}

Si le lien a expiré, demandez une nouvelle invitation à un administrateur.
${getEmailSignature({ style: "text" })}`;

    const html = `<p>${escapeHtml(greeting)}</p>
<p>Votre compte Effinor ERP a été créé.</p>
<p>Pour activer votre accès, définissez votre mot de passe via ce lien sécurisé (valable 24h) :</p>
<p><a href="${escapeAttr(setupPasswordUrl)}">Configurer mon mot de passe</a></p>
<p style="font-size:0.9em;color:#666;">Si le lien a expiré, demandez une nouvelle invitation à un administrateur.</p>
${getEmailSignature({ style: "html" })}`;

    const fromHeader = getFromAddressForUserCreation();

    const allowGmailSendAs =
      process.env.EFFINOR_ALLOW_GMAIL_SEND_AS_FOR_USER_CREATION === "true";

    if (
      isGmailOnlyMailBackend() &&
      !hasUserCreationSmtpConfigured() &&
      !allowGmailSendAs
    ) {
      const gmailUser = process.env.GMAIL_USER!.trim().toLowerCase();
      const fromAddr = primaryAddressFromFromHeader(fromHeader);
      if (fromAddr !== null && fromAddr !== gmailUser) {
        return {
          ok: false,
          error:
            "Gmail affiche en général l’adresse GMAIL_USER comme expéditeur (sauf alias « Envoyer en tant que » validé). " +
            "Pour no-reply@…, configurez USER_CREATION_SMTP_* (ex. Hostinger avec la boîte no-reply). " +
            "Si vous utilisez un alias Gmail déjà autorisé dans Google, définissez EFFINOR_ALLOW_GMAIL_SEND_AS_FOR_USER_CREATION=true.",
        };
      }
    }

    if (hasUserCreationSmtpConfigured()) {
      const host = process.env.USER_CREATION_SMTP_HOST?.trim() ?? "";
      const hostingerFamily = /hostinger|titan\.email/i.test(host);
      const smtpUser = process.env.USER_CREATION_SMTP_USER?.trim().toLowerCase() ?? "";
      const fromAddr = primaryAddressFromFromHeader(fromHeader);
      if (
        hostingerFamily &&
        smtpUser &&
        fromAddr !== null &&
        fromAddr !== smtpUser
      ) {
        return {
          ok: false,
          error:
            "L’expéditeur (From) ne correspond pas à USER_CREATION_SMTP_USER. " +
            "Chez Hostinger / Titan, l’expéditeur affiché suit le compte SMTP : utilisez la boîte no-reply " +
            "comme USER_CREATION_SMTP_USER (mot de passe de cette boîte) et le même e-mail dans " +
            "USER_CREATION_MAIL_FROM, ou laissez USER_CREATION_MAIL_FROM vide.",
        };
      }
    }

    const send = await sendEmail({
      type: "INTERNAL_CREDENTIALS",
      recipient: to,
      metadata: {
        provider: hasUserCreationSmtpConfigured() ? "smtp_user_creation" : "smtp",
        sourceModule: "admin-users",
      },
      execute: async () => {
        const transport = getMailTransportForUserCreation();
        await transport.sendMail({
          from: fromHeader,
          to,
          subject,
          text,
          html,
        });
        return { ok: true };
      },
    });

    if (!send.ok) {
      return { ok: false, error: send.error };
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur d’envoi d’e-mail.";
    return { ok: false, error: hintForSmtpErrorMessage(msg) };
  }
}
