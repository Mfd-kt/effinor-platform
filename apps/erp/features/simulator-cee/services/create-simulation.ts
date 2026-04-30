import { computeResult } from "@/features/simulator-cee/domain/eligibility-rules";
import type { SimulationAnswers } from "@/features/simulator-cee/domain/types";
import { normalizeFrPhoneToE164 } from "@/features/simulator-cee/lib/phone";
import type { SubmitSimulationInput } from "@/features/simulator-cee/schemas/simulation.schema";
import { sendEmail } from "@/lib/email/email-orchestrator";
import {
  buildFromAddress,
  getEmailTemplateForSource,
  getReplyToAddress,
} from "@/lib/email/email-router";
import { getMailTransport } from "@/lib/email/gmail-transport";
import { createAdminClient } from "@/lib/supabase/admin";

function mapChauffageToHeatingDb(
  chauffage: SubmitSimulationInput["chauffage"],
): string[] | null {
  switch (chauffage) {
    case "gaz":
    case "gaz_cond":
    case "fioul":
      return ["chaudiere_eau"];
    case "elec":
      return ["electrique_direct"];
    case "pac_air_eau":
      return ["pac_air_eau"];
    case "pac_air_air":
      return ["pac_air_air"];
    case "bois":
    case "granules":
      return ["autre_inconnu"];
    default:
      return ["autre_inconnu"];
  }
}

function buildCompanyName(data: SubmitSimulationInput): string {
  const rs = (data.raisonSociale ?? "").trim();
  if (rs) return rs;
  if (data.profil === "sci") return "SCI (simulateur CEE)";
  if (data.profil === "bailleur") return "Bailleur (simulateur CEE)";
  const c = data.contact;
  if (c) {
    return `${c.prenom} ${c.nom}`.trim() || "Prospect simulateur CEE";
  }
  return "Prospect simulateur CEE";
}

export async function createSimulation(args: {
  userId: string;
  answers: SubmitSimulationInput;
  /** Override agent — enregistre même si non éligible (suivi commercial). */
  savedDespiteNonEligible?: boolean;
}): Promise<{ leadId: string; simulationId: string }> {
  const admin = createAdminClient();
  const answers = args.answers as unknown as SimulationAnswers;
  const result = computeResult(answers);
  const savedDespite = args.savedDespiteNonEligible === true;

  const contact = args.answers.contact;
  const phone = contact ? normalizeFrPhoneToE164(contact.telephone) : null;
  if (contact && !phone) {
    throw new Error("Numéro de téléphone invalide");
  }

  const companyName = buildCompanyName(args.answers);
  const firstName = contact?.prenom?.trim() ?? "";
  const lastName = contact?.nom?.trim().toUpperCase() ?? "";
  const contactName =
    firstName || lastName ? `${firstName} ${lastName}`.trim() : null;

  const { data: leadRow, error: leadErr } = await admin
    .from("leads")
    .insert({
      source: "simulator_cee",
      lead_status: "new",
      qualification_status: "pending",
      company_name: companyName,
      first_name: firstName || null,
      last_name: lastName || null,
      civility: contact?.civilite?.trim() ?? null,
      contact_name: contactName,
      email: contact?.email?.trim() ?? null,
      phone,
      worksite_address: args.answers.adresse.adresse.trim(),
      worksite_postal_code: args.answers.adresse.codePostal.trim(),
      worksite_city: args.answers.adresse.ville.trim(),
      head_office_address: args.answers.adresse.adresse.trim(),
      head_office_postal_code: args.answers.adresse.codePostal.trim(),
      head_office_city: args.answers.adresse.ville.trim(),
      latitude: args.answers.adresse.latitude ?? null,
      longitude: args.answers.adresse.longitude ?? null,
      pac_eligible: result.pac.eligible,
      renov_eligible: result.renov.eligible,
      next_callback_date: args.answers.rappel?.date ?? null,
      next_callback_time: args.answers.rappel?.heure ?? null,
      created_by_agent_id: args.userId,
      assigned_to: args.userId,
      heating_type: mapChauffageToHeatingDb(args.answers.chauffage),
    })
    .select("id")
    .single();

  if (leadErr || !leadRow?.id) {
    console.error("createSimulation lead insert", leadErr);
    throw new Error("Impossible de créer le lead");
  }

  // Auto-send du premier contact via le router B2C — fire-and-forget.
  // Pas de await : l'échec d'envoi ne doit pas faire échouer la création
  // du lead ni l'enregistrement de la simulation qui suit.
  const leadEmail = contact?.email?.trim();
  if (leadEmail && leadEmail.includes("@")) {
    void (async () => {
      try {
        let agentPrenom = "L'équipe";
        if (args.userId) {
          const { data: profile } = await admin
            .from("profiles")
            .select("full_name")
            .eq("id", args.userId)
            .maybeSingle();
          const fullName = (profile?.full_name as string | null | undefined)?.trim();
          const first = fullName?.split(/\s+/)[0];
          if (first) agentPrenom = first;
        }

        const appBaseUrl = (
          process.env.APP_URL?.trim() ||
          process.env.NEXT_PUBLIC_APP_URL?.trim() ||
          ""
        ).replace(/\/+$/, "");
        const lienAction = appBaseUrl
          ? `${appBaseUrl}/leads/${leadRow.id}`
          : "https://effinor.fr/contact";

        const rendered = getEmailTemplateForSource("simulator_cee", {
          agentPrenom,
          destinataireEmail: leadEmail,
          destinatairePrenom: firstName || "vous",
          lienAction,
        });

        await sendEmail({
          type: rendered.emailType,
          recipient: leadEmail,
          metadata: {
            provider: "smtp",
            sourceModule: `simulator-cee/create-simulation/${rendered.templateId}`,
          },
          context: {
            leadId: leadRow.id,
            leadSource: "simulator_cee",
            templateId: rendered.templateId,
          },
          execute: async () => {
            const transport = getMailTransport();
            const info = await transport.sendMail({
              from: buildFromAddress(agentPrenom),
              replyTo: getReplyToAddress(),
              to: leadEmail,
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
            });
            return info?.accepted?.length
              ? { ok: true }
              : { ok: false, error: "SMTP rejected" };
          },
        });
      } catch (err) {
        console.error(
          "[createSimulation] auto premier_contact email failed:",
          err,
        );
      }
    })();
  }

  const zoneForDb =
    result.zone === "idf" || result.zone === "hors_idf" ? result.zone : null;

  const { data: simRow, error: simErr } = await admin
    .from("cee_simulations")
    .insert({
      lead_id: leadRow.id,
      created_by: args.userId,
      raw_answers: args.answers as unknown as Record<string, unknown>,
      result_snapshot: result as unknown as Record<string, unknown>,
      pac_eligible: result.pac.eligible,
      renov_eligible: result.renov.eligible,
      zone: zoneForDb,
      income_category: args.answers.trancheRevenu,
      profil: args.answers.profil,
      type_logement: args.answers.typeLogement ?? null,
      periode_construction: args.answers.periodeConstruction ?? null,
      ite_iti_recente: args.answers.iteItiRecente ?? null,
      fenetres: args.answers.fenetres ?? null,
      sous_sol: args.answers.sousSol ?? null,
      btd_installe: args.answers.btdInstalle ?? null,
      vmc_installee: args.answers.vmcInstallee ?? null,
      chauffage: args.answers.chauffage,
      dpe: args.answers.dpe,
      travaux_cee_recus: args.answers.travauxCeeRecus ?? null,
      patrimoine_type: args.answers.patrimoineType ?? null,
      nb_logements: args.answers.nbLogements ?? null,
      surface_totale_m2: args.answers.surfaceTotaleM2 ?? null,
      raison_sociale: args.answers.raisonSociale?.trim() || null,
      package_recommande: result.renov.package,
      cible_ideale: result.cibleIdeale,
      saved_despite_non_eligible: savedDespite,
      chauffage_24_mois: args.answers.chauffage24Mois ?? null,
      age_logement: args.answers.ageLogement ?? null,
      financement: result.renov.financement,
      financement_label: result.renov.financementLabel,
    })
    .select("id")
    .single();

  if (simErr || !simRow?.id) {
    console.error("createSimulation cee_simulations insert", simErr);
    throw new Error("Impossible d’enregistrer la simulation");
  }

  return { leadId: leadRow.id, simulationId: simRow.id };
}
