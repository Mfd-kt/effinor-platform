"use server";

import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";

export type GenerateEmailDraftResult =
  | { ok: true; subject: string; body: string }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `Tu es un assistant commercial pour Effinor, entreprise spécialisée en performance énergétique (déstratification d'air, certificats CEE, partenaire TotalEnergies).

Tu rédiges des emails professionnels, chaleureux et orientés action pour les chargés d'affaires qui contactent des prospects/clients.

Contexte : le commercial utilise un CRM et tu reçois les informations du lead (entreprise, contact, adresse, statut, historique, simulation économique, emails précédents).

Règles :
- Ton professionnel mais humain, pas corporate froid
- En français, vouvoiement
- Court et efficace (max 150 mots pour le corps)
- Toujours personnaliser avec le nom du contact et de l'entreprise
- Adapter le ton au contexte (relance = plus direct, premier contact = plus doux, post-signature = enthousiaste)
- Ne jamais mentionner les termes techniques internes (CEE interne, scoring, etc.)
- Terminer par une invitation à l'action claire
- Signer "L'équipe Effinor" ou le nom du commercial si disponible

Tu dois répondre UNIQUEMENT en JSON valide :
{
  "subject": "Objet de l'email (court, accrocheur, personnalisé)",
  "body": "Corps de l'email (texte brut, avec des sauts de ligne \\n\\n pour les paragraphes)"
}`;

function getOpenAI(): OpenAI | null {
   const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function getModel(): string {
  return (
    process.env.OPENAI_CHAT_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini"
  );
}

function eur(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export async function generateEmailDraft(input: {
  leadId: string;
  userPrompt?: string;
}): Promise<GenerateEmailDraftResult> {
  const openai = getOpenAI();
  if (!openai) {
    return { ok: false, error: "Clé API OpenAI non configurée (OPENAI_API_KEY)." };
  }

  const supabase = createAdminClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", input.leadId)
    .single();

  if (!lead) {
    return { ok: false, error: "Lead introuvable." };
  }

  const { data: recentEmails } = await supabase
    .from("lead_emails")
    .select("direction, subject, text_body, email_date, ai_analysis")
    .eq("lead_id", input.leadId)
    .order("email_date", { ascending: false })
    .limit(5);

  const leadContext = [
    `## Fiche Lead`,
    `- Entreprise : ${lead.company_name || "Non renseigné"}`,
    `- Contact : ${lead.contact_name || "Non renseigné"}`,
    `- Email : ${lead.email || "Non renseigné"}`,
    `- Téléphone : ${lead.phone || "Non renseigné"}`,
    `- Statut : ${lead.lead_status || "new"}`,
    `- Source : ${lead.source || "Non renseigné"}`,
    lead.worksite_address ? `- Adresse travaux : ${[lead.worksite_address, lead.worksite_postal_code, lead.worksite_city].filter(Boolean).join(", ")}` : "",
    lead.head_office_address ? `- Siège : ${[lead.head_office_address, lead.head_office_postal_code, lead.head_office_city].filter(Boolean).join(", ")}` : "",
    lead.building_type ? `- Type bâtiment : ${lead.building_type}` : "",
    lead.surface_m2 ? `- Surface : ${lead.surface_m2} m²` : "",
    lead.ceiling_height_m ? `- Hauteur plafond : ${lead.ceiling_height_m} m` : "",
    "",
    `## Simulation économique`,
    lead.sim_saving_eur_30_selected ? `- Économies annuelles estimées : ${eur(lead.sim_saving_eur_30_selected)}` : "",
    lead.sim_install_total_price ? `- Coût installation : ${eur(lead.sim_install_total_price)}` : "",
    lead.sim_rest_to_charge != null ? `- Reste à charge : ${lead.sim_rest_to_charge <= 0 ? "0 € (financé à 100%)" : eur(lead.sim_rest_to_charge)}` : "",
    lead.sim_cee_prime_estimated ? `- Prime CEE estimée : ${eur(lead.sim_cee_prime_estimated)}` : "",
    lead.sim_co2_saved_tons ? `- CO2 évité/an : ${lead.sim_co2_saved_tons}t` : "",
    lead.sim_needed_destrat ? `- Nombre déstratificateurs : ${lead.sim_needed_destrat}` : "",
    lead.ai_lead_summary ? `\n## Résumé IA du lead\n${lead.ai_lead_summary}` : "",
    lead.recording_notes ? `\n## Notes d'appel\n${lead.recording_notes.slice(0, 500)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  let emailHistory = "";
  if (recentEmails && recentEmails.length > 0) {
    emailHistory = "\n## Historique des derniers emails\n" +
      recentEmails
        .map((e) => {
          const dir = e.direction === "sent" ? "ENVOYÉ" : "REÇU";
          const body = e.text_body?.slice(0, 200) || "(contenu HTML)";
          const ai = e.ai_analysis as { summary?: string } | null;
          const summary = ai?.summary ? ` [IA: ${ai.summary}]` : "";
          return `[${dir}] ${e.email_date} — ${e.subject || "(sans objet)"}${summary}\n${body}`;
        })
        .join("\n---\n");
  }

  const userMessage = [
    leadContext,
    emailHistory,
    "",
    input.userPrompt
      ? `## Instructions du commercial\n${input.userPrompt}`
      : "## Instructions\nRédige un email adapté au contexte actuel du lead. Choisis le ton et l'angle les plus appropriés en fonction du statut, de l'historique et des données disponibles.",
  ].join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      max_completion_tokens: 1024,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return { ok: false, error: "Le modèle n'a pas renvoyé de contenu." };
    }

    const cleaned = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned) as { subject: string; body: string };

    return {
      ok: true,
      subject: parsed.subject || "",
      body: parsed.body || "",
    };
  } catch (err) {
    console.error("[generateEmailDraft] error:", err);
    const msg = err instanceof Error ? err.message : "Erreur lors de la génération.";
    return { ok: false, error: msg };
  }
}
