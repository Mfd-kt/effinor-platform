"use server";

import { markAgreementSent as markAgreementSentInService } from "@/features/cee-workflows/services/workflow-service";
import { resolvePublicAppBaseUrl } from "@/lib/app-public-url";
import { getFromAddress, getMailTransport } from "@/lib/email/gmail-transport";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";

export type EmailVariant = "A" | "B";
export type EmailType = "study" | "relance_signature" | "libre" | "premier_contact";

export type SendStudyEmailResult =
  | { ok: true; trackingId: string }
  | { ok: false; error: string };

type SendStudyEmailInput = {
  to: string;
  leadId: string;
  clientName: string;
  companyName: string;
  siteName: string;
  presentationUrl: string | null;
  accordUrl: string | null;
  variant: EmailVariant;
  emailType?: EmailType;
  freeSubject?: string;
  freeBody?: string;
};

type EconomicData = {
  economiesAnnuelles: number | null;
  coutProjet: number | null;
  resteACharge: number | null;
  co2Saved: number | null;
  ceePrime: number | null;
  neededDestrat: number | null;
};

export async function sendStudyEmail(
  input: SendStudyEmailInput,
): Promise<SendStudyEmailResult> {
  const {
    to,
    leadId,
    clientName,
    companyName,
    siteName,
    presentationUrl,
    accordUrl,
    variant,
    emailType = "study",
    freeSubject,
    freeBody,
  } = input;

  if (!to || !to.includes("@")) {
    return { ok: false, error: "Adresse email invalide." };
  }

  if (emailType === "study" && !presentationUrl && !accordUrl) {
    return { ok: false, error: "Aucun document à envoyer." };
  }

  if (emailType === "libre" && !freeBody?.trim()) {
    return { ok: false, error: "Le contenu de l'email est vide." };
  }

  if (emailType === "premier_contact" && !companyName?.trim()) {
    return { ok: false, error: "Nom de la société requis pour l'email de premier contact." };
  }

  try {
    const supabase = createAdminClient();

    // Fetch economic data from lead
    const { data: lead } = await supabase
      .from("leads")
      .select(
        "sim_saving_eur_30_selected, sim_install_total_price, sim_rest_to_charge, sim_co2_saved_tons, sim_cee_prime_estimated, sim_needed_destrat, current_workflow_id",
      )
      .eq("id", leadId)
      .single();

    const eco: EconomicData = {
      economiesAnnuelles: lead?.sim_saving_eur_30_selected ?? null,
      coutProjet: lead?.sim_install_total_price ?? null,
      resteACharge: lead?.sim_rest_to_charge ?? null,
      co2Saved: lead?.sim_co2_saved_tons ?? null,
      ceePrime: lead?.sim_cee_prime_estimated ?? null,
      neededDestrat: lead?.sim_needed_destrat ?? null,
    };

    let subject: string;
    if (emailType === "premier_contact") {
      subject = `${companyName ? `${companyName} — ` : ""}Bienvenue chez Effinor · performance énergétique & CEE`;
    } else if (emailType === "libre") {
      subject = freeSubject?.trim() || `${companyName ? `${companyName} — ` : ""}Message de Effinor`;
    } else if (emailType === "relance_signature") {
      subject = `${companyName ? `${companyName} — ` : ""}Rappel : votre accord de principe est en attente de signature`;
    } else {
      const subjectMap: Record<EmailVariant, string> = {
        A: `${companyName ? `${companyName} — ` : ""}Votre projet est prêt, validez maintenant`,
        B: `${companyName ? `${companyName} — ` : ""}Votre étude d'économies d'énergie est prête`,
      };
      subject = subjectMap[variant];
    }

    const { data: tracking } = await supabase
      .from("email_tracking")
      .insert({
        lead_id: leadId || null,
        recipient: to,
        subject: `[${emailType === "study" ? variant : emailType}] ${subject}`,
      })
      .select("id")
      .single();

    const trackingId = tracking?.id ?? null;

    const h = await headers();
    const baseUrl = resolvePublicAppBaseUrl(h);
    const pixelUrl = trackingId
      ? `${baseUrl}/api/open/${trackingId}`
      : null;

    const attachments: { filename: string; path: string }[] = [];
    if (emailType === "study") {
      if (presentationUrl) {
        attachments.push({
          filename: "Effinor-Presentation-Projet.pdf",
          path: presentationUrl,
        });
      }
      if (accordUrl) {
        attachments.push({
          filename: "Effinor-Accord-de-Principe.pdf",
          path: accordUrl,
        });
      }
    }

    const templateData: TemplateData = {
      clientName,
      companyName,
      siteName,
      presentationUrl,
      accordUrl,
      pixelUrl,
      eco,
    };

    let html: string;
    if (emailType === "premier_contact") {
      html = buildPremierContact(templateData);
    } else if (emailType === "relance_signature") {
      html = buildRelanceSignature(templateData);
    } else if (emailType === "libre") {
      html = buildFreeEmail(templateData, freeBody ?? "", freeSubject ?? "");
    } else {
      html = variant === "A"
        ? buildVersionA(templateData)
        : buildVersionB(templateData);
    }

    const transport = getMailTransport();
    const sendResult = await transport.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html,
      attachments,
    });

    const gmailMessageId = sendResult.messageId ?? null;

    if (leadId) {
      const newStatus = emailType === "premier_contact" ? "contacted" : "dossier_sent";
      await supabase
        .from("leads")
        .update({ lead_status: newStatus })
        .eq("id", leadId);

      const fromAddr = process.env.GMAIL_USER ?? "noreply@effinor.fr";
      await supabase.from("lead_emails").insert({
        lead_id: leadId,
        direction: "sent",
        from_email: fromAddr,
        to_email: to,
        subject,
        html_body: html,
        email_date: new Date().toISOString(),
        tracking_id: trackingId,
        gmail_message_id: gmailMessageId,
      });

      if ((emailType === "study" || emailType === "relance_signature") && lead?.current_workflow_id) {
        await markAgreementSentInService(supabase, {
          workflowId: lead.current_workflow_id,
          signatureProvider: "email",
          signatureRequestId: trackingId,
          signatureStatus: "sent",
        });
      }
    }

    return { ok: true, trackingId: trackingId ?? "" };
  } catch (err) {
    console.error("[sendStudyEmail] Error:", err);
    const message =
      err instanceof Error ? err.message : "Erreur inconnue lors de l'envoi.";
    return { ok: false, error: message };
  }
}

// ─── Shared helpers ───

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function eur(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

type TemplateData = {
  clientName: string;
  companyName: string;
  siteName: string;
  presentationUrl: string | null;
  accordUrl: string | null;
  pixelUrl: string | null;
  eco: EconomicData;
};

function greeting(name: string): string {
  return name
    ? `Bonjour <strong>${esc(name)}</strong>,`
    : "Bonjour,";
}

// ─── Shared blocks ───

function headerBlock(): string {
  return `
<!-- ═══ HEADER ═══ -->
<tr>
  <td style="background:#0F172A;padding:36px 40px 28px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:left;vertical-align:middle">
          <div style="margin-bottom:6px">
            <span style="display:inline-block;background:linear-gradient(135deg,#35E0A1,#1EC8B0);color:#0F172A;font-size:22px;font-weight:900;letter-spacing:2px;padding:8px 14px;border-radius:10px">E</span>
          </div>
          <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:3px;margin-bottom:3px">EFFINOR</div>
          <div style="color:#35E0A1;font-size:10px;letter-spacing:3px;font-weight:600">PERFORMANCE ÉNERGÉTIQUE</div>
        </td>
        <td style="text-align:right;vertical-align:middle">
          <div style="background:#ffffff;border-radius:8px;padding:8px 14px;display:inline-block">
            <img src="https://upload.wikimedia.org/wikipedia/fr/thumb/f/f7/Logo_TotalEnergies.svg/960px-Logo_TotalEnergies.svg.png" alt="TotalEnergies" width="120" style="display:block;height:auto" />
          </div>
          <div style="color:#64748B;font-size:9px;margin-top:5px;letter-spacing:0.5px;text-align:right">Partenaire CEE</div>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function footerBlock(pixelUrl: string | null): string {
  return `
<!-- ═══ CONTACT ═══ -->
<tr>
  <td style="background:#0F172A;padding:24px 40px;text-align:center">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr>
        <td style="padding:0 12px;text-align:center">
          <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:4px">Téléphone</div>
          <a href="tel:+33978455063" style="color:#35E0A1;font-size:13px;text-decoration:none;font-weight:600">+33 9 78 45 50 63</a>
        </td>
        <td style="width:1px;background:#1E293B;padding:0"></td>
        <td style="padding:0 12px;text-align:center">
          <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:4px">Email</div>
          <a href="mailto:contact@effinor.fr" style="color:#35E0A1;font-size:13px;text-decoration:none;font-weight:600">contact@effinor.fr</a>
        </td>
        <td style="width:1px;background:#1E293B;padding:0"></td>
        <td style="padding:0 12px;text-align:center">
          <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:4px">Adresse</div>
          <span style="color:#94A3B8;font-size:12px">1 Av. de l'Europe, 94320 Thiais</span>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- ═══ LEGAL ═══ -->
<tr>
  <td style="background:#0F172A;padding:0 40px 20px;text-align:center;border-top:1px solid #1E293B">
    <p style="font-size:9px;color:#475569;margin:12px 0 0;line-height:1.5">
      EFFINOR LIGHTING - EF ECPS &middot; SASU au capital de 115&nbsp;900,00&nbsp;&euro; &middot; SIRET 907 547 665 00022<br/>
      RCS Cr&eacute;teil 907 547 665 &middot; TVA FR59907547665 &middot; Garantie d&eacute;cennale M-TPE 2025 / Police N&deg; PRW2501390
    </p>
  </td>
</tr>
</table>
</td></tr>
</table>
${pixelUrl ? `<img src="${esc(pixelUrl)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0" />` : ""}
</body>
</html>`;
}

function shell(inner: string, pixelUrl: string | null): string {
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;color:#111827;-webkit-font-smoothing:antialiased">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
${headerBlock()}
${inner}
${footerBlock(pixelUrl)}`;
}

function heroKpis(eco: EconomicData): string {
  const items: string[] = [];
  if (eco.economiesAnnuelles != null) {
    items.push(
      `<td style="text-align:center;padding:0 8px">
        <div style="font-size:28px;font-weight:900;color:#0F172A;line-height:1.1">${eur(eco.economiesAnnuelles)}</div>
        <div style="font-size:11px;color:#64748B;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">d'&eacute;conomies / an</div>
      </td>`,
    );
  }
  if (eco.resteACharge != null) {
    const label =
      eco.resteACharge <= 0
        ? "Financ&eacute; &agrave; 100%"
        : `Reste &agrave; charge : ${eur(eco.resteACharge)}`;
    items.push(
      `<td style="text-align:center;padding:0 8px">
        <div style="font-size:28px;font-weight:900;color:#0F172A;line-height:1.1">${eco.resteACharge <= 0 ? "0&nbsp;&euro;" : eur(eco.resteACharge)}</div>
        <div style="font-size:11px;color:#64748B;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${label}</div>
      </td>`,
    );
  }
  if (eco.co2Saved != null) {
    items.push(
      `<td style="text-align:center;padding:0 8px">
        <div style="font-size:28px;font-weight:900;color:#0F172A;line-height:1.1">${eco.co2Saved.toFixed(1)}t</div>
        <div style="font-size:11px;color:#64748B;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">CO2 &eacute;vit&eacute; / an</div>
      </td>`,
    );
  }
  if (items.length === 0) return "";
  return `
<!-- ═══ HERO KPIs ═══ -->
<tr>
  <td style="background:linear-gradient(135deg,#35E0A1,#1EC8B0);padding:28px 40px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>${items.join(`<td style="width:1px;background:rgba(15,23,42,0.12);padding:0"></td>`)}</tr>
    </table>
  </td>
</tr>`;
}

function reassuranceBlock(): string {
  const items = [
    ["&#10004;", "&Eacute;tude bas&eacute;e sur des donn&eacute;es techniques r&eacute;elles"],
    ["&#10004;", "Dimensionnement sur mesure pour votre site"],
    ["&#10004;", "Sans engagement &agrave; ce stade"],
  ];
  return `
<tr>
  <td style="padding:0 40px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px">
      <tr><td style="padding:18px 22px">
        ${items
          .map(
            ([icon, text]) =>
              `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px"><tr>
              <td style="width:24px;vertical-align:top;color:#16a34a;font-size:16px;font-weight:700">${icon}</td>
              <td style="font-size:14px;color:#15803d;line-height:1.5;padding-left:6px">${text}</td>
            </tr></table>`,
          )
          .join("")}
      </td></tr>
    </table>
  </td>
</tr>`;
}

function urgencyBlock(): string {
  return `
<tr>
  <td style="padding:0 40px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px">
      <tr><td style="padding:14px 18px">
        <p style="margin:0;font-size:13px;line-height:1.55;color:#92400E">
          &#9888;&#65039; Les conditions de financement &eacute;voluent r&eacute;guli&egrave;rement. Nous vous recommandons de valider rapidement votre projet pour s&eacute;curiser votre prise en charge.
        </p>
      </td></tr>
    </table>
  </td>
</tr>`;
}

function clientInfoBlock(companyName: string, siteName: string): string {
  const companyLine = companyName ? esc(companyName) : "";
  const siteLine = siteName ? esc(siteName) : "";
  if (!companyLine && !siteLine) return "";
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:0 0 24px">
  <tr><td style="padding:16px 20px">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${companyLine ? `<tr><td style="font-size:11px;color:#64748B;padding:3px 0;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Soci&eacute;t&eacute;</td><td style="font-size:14px;color:#111827;font-weight:600;padding:3px 0;text-align:right">${companyLine}</td></tr>` : ""}
      ${siteLine ? `<tr><td style="font-size:11px;color:#64748B;padding:3px 0;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Adresse du site</td><td style="font-size:14px;color:#111827;font-weight:600;padding:3px 0;text-align:right">${siteLine}</td></tr>` : ""}
    </table>
  </td></tr>
</table>`;
}

function docsBlock(presentationUrl: string | null, accordUrl: string | null): string {
  return `
<p style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">
  &#128206;&nbsp; Documents inclus
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px">
  ${presentationUrl ? `
  <tr>
    <td style="padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:36px;vertical-align:middle"><span style="font-size:22px">&#128196;</span></td>
          <td style="vertical-align:middle">
            <div style="font-size:14px;font-weight:700;color:#0F172A">Pr&eacute;sentation projet</div>
            <div style="font-size:12px;color:#64748B">Comprendre vos &eacute;conomies et le dimensionnement</div>
          </td>
          <td style="vertical-align:middle;text-align:right"><span style="font-size:10px;color:#94A3B8;background:#f1f5f9;padding:3px 8px;border-radius:4px;font-weight:600">PDF</span></td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="height:8px"></td></tr>` : ""}
  ${accordUrl ? `
  <tr>
    <td style="padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:36px;vertical-align:middle"><span style="font-size:22px">&#9989;</span></td>
          <td style="vertical-align:middle">
            <div style="font-size:14px;font-weight:700;color:#0F172A">Accord de principe</div>
            <div style="font-size:12px;color:#64748B">Valider et lancer votre projet</div>
          </td>
          <td style="vertical-align:middle;text-align:right"><span style="font-size:10px;color:#94A3B8;background:#f1f5f9;padding:3px 8px;border-radius:4px;font-weight:600">PDF</span></td>
        </tr>
      </table>
    </td>
  </tr>` : ""}
</table>`;
}

function ctaButtons(
  presentationUrl: string | null,
  accordUrl: string | null,
): string {
  const btnSecondary = `display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.3px;background:#0F172A`;
  const btnPrimary = `display:inline-block;padding:16px 32px;font-size:15px;font-weight:800;color:#0F172A;text-decoration:none;border-radius:10px;letter-spacing:0.3px;background:linear-gradient(135deg,#35E0A1,#1EC8B0);box-shadow:0 4px 14px rgba(53,224,161,0.3)`;

  const presBtn = presentationUrl
    ? `<a href="${esc(presentationUrl)}" target="_blank" style="${btnSecondary}">&#128269;&nbsp; Voir mon &eacute;tude d&eacute;taill&eacute;e</a>`
    : "";
  const accordBtn = accordUrl
    ? `<a href="${esc(accordUrl)}" target="_blank" style="${btnPrimary}">&#9989;&nbsp; Valider mon projet maintenant</a>`
    : "";

  return `
<tr>
  <td style="padding:8px 40px 32px;text-align:center">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr>
        ${presBtn ? `<td style="padding:0 6px">${presBtn}</td>` : ""}
        ${accordBtn ? `<td style="padding:0 6px">${accordBtn}</td>` : ""}
      </tr>
    </table>
  </td>
</tr>`;
}

function closingBlock(name: string): string {
  const n = name ? esc(name) : "";
  return `
<tr>
  <td style="padding:0 40px 28px">
    <p style="font-size:14px;line-height:1.65;color:#374151;margin:0 0 16px">
      ${n ? `${n}, n` : "N"}ous restons &agrave; votre disposition pour &eacute;changer sur votre projet ou planifier les prochaines &eacute;tapes.
    </p>
    <p style="font-size:13px;color:#94A3B8;margin:0 0 4px">Cordialement,</p>
    <p style="font-size:15px;font-weight:700;color:#0F172A;margin:0">L'&eacute;quipe Effinor</p>
    <p style="font-size:12px;color:#64748B;margin:4px 0 0">Performance &eacute;nerg&eacute;tique &middot; D&eacute;stratification d'air</p>
  </td>
</tr>`;
}

// ══════════════════════════════════════════════════════════════════
// VERSION A — Closing direct : court, impactant, ROI
// ══════════════════════════════════════════════════════════════════

function buildVersionA(p: TemplateData): string {
  const inner = `
${heroKpis(p.eco)}

<!-- ═══ BODY ═══ -->
<tr>
  <td style="padding:32px 40px 20px">
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;color:#111827">
      ${greeting(p.clientName)}
    </p>

    <p style="font-size:15px;line-height:1.7;color:#374151;margin:0 0 6px">
      Votre &eacute;tude est finalis&eacute;e.${p.eco.economiesAnnuelles != null ? ` Nous avons identifi&eacute; <strong style="color:#0F172A">${eur(p.eco.economiesAnnuelles)} d'&eacute;conomies annuelles</strong> sur votre site.` : " Nous avons identifi&eacute; un potentiel d'&eacute;conomies significatif sur votre site."}
    </p>
    ${p.eco.ceePrime != null && p.eco.ceePrime > 0 ? `<p style="font-size:14px;line-height:1.6;color:#374151;margin:0 0 20px">&#9889; Projet &eacute;ligible &agrave; un financement via le dispositif CEE${p.eco.resteACharge != null && p.eco.resteACharge <= 0 ? " — <strong style=\"color:#16a34a\">prise en charge &agrave; 100&nbsp;%</strong>" : ""}.</p>` : ""}

    ${clientInfoBlock(p.companyName, p.siteName)}

    ${docsBlock(p.presentationUrl, p.accordUrl)}
  </td>
</tr>

${ctaButtons(p.presentationUrl, p.accordUrl)}

${reassuranceBlock()}

${urgencyBlock()}

<!-- ═══ SÉPARATEUR ═══ -->
<tr><td style="padding:0 40px"><div style="height:1px;background:#e2e8f0"></div></td></tr>

${closingBlock(p.clientName)}`;

  return shell(inner, p.pixelUrl);
}

// ══════════════════════════════════════════════════════════════════
// VERSION B — Psychologie & persuasion : progressive, rassurante
// ══════════════════════════════════════════════════════════════════

function buildVersionB(p: TemplateData): string {
  const inner = `
<!-- ═══ BANDEAU VERT ═══ -->
<tr>
  <td style="background:linear-gradient(135deg,#35E0A1,#1EC8B0);padding:18px 40px;text-align:center">
    <span style="color:#0F172A;font-size:15px;font-weight:700;letter-spacing:0.3px">Votre &eacute;tude d'&eacute;conomies d'&eacute;nergie est pr&ecirc;te</span>
  </td>
</tr>

<!-- ═══ BODY ═══ -->
<tr>
  <td style="padding:36px 40px 20px">
    <p style="font-size:16px;line-height:1.6;margin:0 0 20px;color:#111827">
      ${greeting(p.clientName)}
    </p>

    <!-- Storytelling -->
    <p style="font-size:15px;line-height:1.75;color:#374151;margin:0 0 16px">
      Comme beaucoup d'entreprises, votre b&acirc;timent perd de l'&eacute;nergie sans que cela soit visible. La chaleur monte et s'accumule en hauteur, pendant que vos &eacute;quipes au sol subissent un inconfort thermique — et votre facture augmente.
    </p>

    <p style="font-size:15px;line-height:1.75;color:#374151;margin:0 0 20px">
      Apr&egrave;s analyse de votre site, nous avons dimensionn&eacute; une solution de <strong>d&eacute;stratification d'air</strong> adapt&eacute;e &agrave; votre configuration. Les r&eacute;sultats sont concrets&nbsp;:
    </p>

    ${clientInfoBlock(p.companyName, p.siteName)}
  </td>
</tr>

${heroKpis(p.eco)}

<!-- ═══ PROJECTION ═══ -->
<tr>
  <td style="padding:28px 40px 20px">
    ${p.eco.economiesAnnuelles != null ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:12px;overflow:hidden">
      <tr><td style="padding:22px 26px">
        <p style="font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin:0 0 10px">Projection sur 5 ans</p>
        <p style="font-size:26px;font-weight:900;color:#35E0A1;margin:0 0 6px;line-height:1.1">${eur(p.eco.economiesAnnuelles * 5)}</p>
        <p style="font-size:13px;color:#94A3B8;margin:0 0 14px">d'&eacute;conomies cumul&eacute;es sur votre site</p>
        <div style="height:1px;background:#1E293B;margin:0 0 14px"></div>
        <p style="font-size:13px;color:#CBD5E1;line-height:1.55;margin:0">
          &#8987; <strong style="color:#FCD34D">Chaque mois sans action</strong> repr&eacute;sente <strong style="color:#ffffff">${eur(p.eco.economiesAnnuelles / 12)}</strong> de pertes &eacute;vitables sur votre facture &eacute;nerg&eacute;tique.
        </p>
      </td></tr>
    </table>` : ""}
  </td>
</tr>

<!-- ═══ DOCUMENTS ═══ -->
<tr>
  <td style="padding:8px 40px 20px">
    <p style="font-size:15px;line-height:1.7;color:#374151;margin:0 0 18px">
      Nous vous avons pr&eacute;par&eacute; deux documents pour vous accompagner dans votre d&eacute;cision&nbsp;:
    </p>
    ${docsBlock(p.presentationUrl, p.accordUrl)}
  </td>
</tr>

${ctaButtons(p.presentationUrl, p.accordUrl)}

${reassuranceBlock()}

${urgencyBlock()}

<!-- ═══ SÉPARATEUR ═══ -->
<tr><td style="padding:0 40px"><div style="height:1px;background:#e2e8f0"></div></td></tr>

<!-- ═══ TEXTE DE CLÔTURE ═══ -->
<tr>
  <td style="padding:28px 40px">
    <p style="font-size:14px;line-height:1.65;color:#374151;margin:0 0 14px">
      Ce projet a &eacute;t&eacute; con&ccedil;u sur mesure pour votre site. Notre &eacute;quipe technique est &agrave; votre disposition pour r&eacute;pondre &agrave; vos questions et vous accompagner dans chaque &eacute;tape.
    </p>
    <p style="font-size:14px;line-height:1.65;color:#374151;margin:0 0 20px">
      <strong>Un simple clic suffit pour lancer votre projet.</strong>
    </p>
    <p style="font-size:13px;color:#94A3B8;margin:0 0 4px">Cordialement,</p>
    <p style="font-size:15px;font-weight:700;color:#0F172A;margin:0">L'&eacute;quipe Effinor</p>
    <p style="font-size:12px;color:#64748B;margin:4px 0 0">Performance &eacute;nerg&eacute;tique &middot; D&eacute;stratification d'air</p>
  </td>
</tr>`;

  return shell(inner, p.pixelUrl);
}

// ══════════════════════════════════════════════════════════════════
// RELANCE SIGNATURE — Email de rappel pour signer l'accord
// ══════════════════════════════════════════════════════════════════

function buildRelanceSignature(p: TemplateData): string {
  const btnPrimary = `display:inline-block;padding:16px 32px;font-size:15px;font-weight:800;color:#0F172A;text-decoration:none;border-radius:10px;letter-spacing:0.3px;background:linear-gradient(135deg,#35E0A1,#1EC8B0);box-shadow:0 4px 14px rgba(53,224,161,0.3)`;

  const inner = `
<!-- ═══ BANDEAU ═══ -->
<tr>
  <td style="background:linear-gradient(135deg,#35E0A1,#1EC8B0);padding:18px 40px;text-align:center">
    <span style="color:#0F172A;font-size:15px;font-weight:700;letter-spacing:0.3px">&#128221; Rappel : votre accord de principe est en attente</span>
  </td>
</tr>

<!-- ═══ BODY ═══ -->
<tr>
  <td style="padding:36px 40px 20px">
    <p style="font-size:16px;line-height:1.6;margin:0 0 20px;color:#111827">
      ${greeting(p.clientName)}
    </p>

    <p style="font-size:15px;line-height:1.75;color:#374151;margin:0 0 16px">
      Nous faisons suite &agrave; notre pr&eacute;c&eacute;dent envoi concernant votre <strong>projet de d&eacute;stratification d'air</strong>.
    </p>

    <p style="font-size:15px;line-height:1.75;color:#374151;margin:0 0 20px">
      Votre &eacute;tude technique personnalis&eacute;e et votre accord de principe ont &eacute;t&eacute; pr&eacute;par&eacute;s et sont toujours disponibles. 
      ${p.eco.economiesAnnuelles != null ? `Les <strong style="color:#0F172A">${eur(p.eco.economiesAnnuelles)} d'&eacute;conomies annuelles</strong> identifi&eacute;es sur votre site restent d'actualit&eacute;.` : "Le potentiel d'&eacute;conomies identifi&eacute; sur votre site reste d'actualit&eacute;."}
    </p>

    ${clientInfoBlock(p.companyName, p.siteName)}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;border-radius:12px;overflow:hidden;margin:0 0 24px">
      <tr><td style="padding:22px 26px">
        <p style="font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin:0 0 10px">Pour finaliser votre projet</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:28px;vertical-align:top;color:#35E0A1;font-size:18px;font-weight:700;padding-top:2px">1</td>
            <td style="font-size:14px;color:#CBD5E1;line-height:1.6;padding:0 0 8px 8px">Consultez votre &eacute;tude d&eacute;taill&eacute;e en pi&egrave;ce jointe</td>
          </tr>
          <tr>
            <td style="width:28px;vertical-align:top;color:#35E0A1;font-size:18px;font-weight:700;padding-top:2px">2</td>
            <td style="font-size:14px;color:#CBD5E1;line-height:1.6;padding:0 0 8px 8px">Signez l'accord de principe (document joint)</td>
          </tr>
          <tr>
            <td style="width:28px;vertical-align:top;color:#35E0A1;font-size:18px;font-weight:700;padding-top:2px">3</td>
            <td style="font-size:14px;color:#CBD5E1;line-height:1.6;padding:0 0 0 8px">Retournez-le par email ou contactez-nous</td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td>
</tr>

<!-- ═══ CTA ═══ -->
<tr>
  <td style="padding:0 40px 28px;text-align:center">
    ${p.accordUrl ? `<a href="${esc(p.accordUrl)}" target="_blank" style="${btnPrimary}">&#9989;&nbsp; Consulter et signer mon accord</a>` : ""}
  </td>
</tr>

${urgencyBlock()}

<!-- ═══ SÉPARATEUR ═══ -->
<tr><td style="padding:0 40px"><div style="height:1px;background:#e2e8f0"></div></td></tr>

${closingBlock(p.clientName)}`;

  return shell(inner, p.pixelUrl);
}

// ══════════════════════════════════════════════════════════════════
// EMAIL LIBRE — Contenu personnalisé avec branding Effinor
// ══════════════════════════════════════════════════════════════════

function buildFreeEmail(p: TemplateData, body: string, _subject: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map(
      (para) =>
        `<p style="font-size:15px;line-height:1.75;color:#374151;margin:0 0 16px">${esc(para).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("\n    ");

  const inner = `
<!-- ═══ BODY ═══ -->
<tr>
  <td style="padding:36px 40px 28px">
    <p style="font-size:16px;line-height:1.6;margin:0 0 20px;color:#111827">
      ${greeting(p.clientName)}
    </p>

    ${paragraphs}
  </td>
</tr>

<!-- ═══ SÉPARATEUR ═══ -->
<tr><td style="padding:0 40px"><div style="height:1px;background:#e2e8f0"></div></td></tr>

${closingBlock(p.clientName)}`;

  return shell(inner, p.pixelUrl);
}

// ══════════════════════════════════════════════════════════════════
// PREMIER CONTACT — Email de bienvenue après 1er contact (tél. ou formulaire)
// ══════════════════════════════════════════════════════════════════

function buildPremierContact(p: TemplateData): string {
  const btnPrimary = `display:inline-block;padding:16px 32px;font-size:15px;font-weight:800;color:#0F172A;text-decoration:none;border-radius:10px;letter-spacing:0.3px;background:linear-gradient(135deg,#35E0A1,#1EC8B0);box-shadow:0 4px 14px rgba(53,224,161,0.3)`;
  const company = esc(p.companyName);
  const site = p.siteName ? esc(p.siteName) : "";
  const mailSubject = encodeURIComponent(
    `Re: Bienvenue Effinor — ${p.companyName}`.trim(),
  );

  const inner = `
<!-- ═══ HERO ═══ -->
<tr>
  <td style="background:linear-gradient(135deg,#0F172A 0%,#1E293B 100%);padding:32px 40px;text-align:center">
    <p style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 8px;letter-spacing:-0.3px">
      Bienvenue chez Effinor
    </p>
    <p style="font-size:14px;color:#94A3B8;margin:0;line-height:1.5">
      Merci pour votre int&eacute;r&ecirc;t &middot; D&eacute;stratification d'air, CEE et partenariat <strong style="color:#CBD5E1">TotalEnergies</strong>
    </p>
  </td>
</tr>

<!-- ═══ BODY ═══ -->
<tr>
  <td style="padding:36px 40px 20px">
    <p style="font-size:16px;line-height:1.6;margin:0 0 20px;color:#111827">
      ${greeting(p.clientName)}
    </p>

    <p style="font-size:15px;line-height:1.75;color:#374151;margin:0 0 16px">
      Suite &agrave; votre premier &eacute;change avec notre &eacute;quipe (t&eacute;l&eacute;phone ou formulaire sur notre site),
      nous avons le plaisir de vous confirmer la prise en compte de votre demande concernant
      <strong>${company}</strong>${site ? ` (${site})` : ""}.
    </p>

    <p style="font-size:15px;line-height:1.75;color:#374151;margin:0 0 16px">
      <strong>Effinor</strong> accompagne les entreprises et les sites industriels ou tertiaires dans leurs
      <strong>&eacute;conomies d'&eacute;nergie</strong>, notamment gr&acirc;ce &agrave; la <strong>d&eacute;stratification d'air</strong>
      et au financement via les <strong>Certificats d'&Eacute;conomies d'&Eacute;nergie (CEE)</strong>.
      Nous sommes <strong>partenaires officiels de TotalEnergies</strong> sur les certificats CEE, ce qui renforce la
      fiabilit&eacute; et la conformit&eacute; de nos dossiers.
    </p>

    <p style="font-size:15px;line-height:1.75;color:#374151;margin:0 0 16px">
      Les gains d&eacute;pendent de chaque b&acirc;timent&nbsp;: ils sont souvent substantiels sur la facture de chauffage
      et seront <strong>affin&eacute;s lors d'une &eacute;tude gratuite</strong> adapt&eacute;e &agrave; votre site.
    </p>
  </td>
</tr>

<!-- ═══ AVANTAGES ═══ -->
<tr>
  <td style="padding:0 40px 24px">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <tr>
        <td style="background:#F8FAFC;padding:20px 24px">
          <p style="font-size:14px;font-weight:700;color:#0F172A;margin:0 0 12px">
            Ce qu'Effinor vous propose
          </p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6">
                &#10003;&nbsp;&nbsp;<strong>Diagnostic et &eacute;tude gratuits</strong>, personnalis&eacute;s pour votre site
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6">
                &#10003;&nbsp;&nbsp;<strong>Financement CEE</strong> (jusqu'&agrave; 100&nbsp;% du projet selon &eacute;ligibilit&eacute;)
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6">
                &#10003;&nbsp;&nbsp;<strong>Mise en &oelig;uvre encadr&eacute;e</strong>, avec une installation pens&eacute;e pour limiter l'impact sur votre activit&eacute;
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6">
                &#10003;&nbsp;&nbsp;<strong>Effinor &times; TotalEnergies</strong>&nbsp;: partenariat CEE reconnu pour vos dossiers
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- ═══ CTA ═══ -->
<tr>
  <td style="padding:8px 40px 32px;text-align:center">
    <p style="font-size:15px;line-height:1.65;color:#374151;margin:0 0 20px">
      Si vous le souhaitez, nous pouvons encha&icirc;ner sur un <strong>bref &eacute;change</strong> pour r&eacute;pondre &agrave; vos questions
      et pr&eacute;senter la suite &agrave; votre rythme.
    </p>
    <a href="mailto:contact@effinor.fr?subject=${mailSubject}" style="${btnPrimary}">
      &#128226;&nbsp; Reprendre contact avec nous
    </a>
  </td>
</tr>

<!-- ═══ SÉPARATEUR ═══ -->
<tr><td style="padding:0 40px"><div style="height:1px;background:#e2e8f0"></div></td></tr>

${closingBlock(p.clientName)}`;

  return shell(inner, p.pixelUrl);
}
