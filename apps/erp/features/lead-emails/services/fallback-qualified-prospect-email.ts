import type { QualifiedLeadEmailContext } from "../domain/types";

/**
 * Texte minimal si OpenAI indisponible — uniquement à partir de champs certains.
 */
export function buildFallbackQualifiedProspectEmail(ctx: QualifiedLeadEmailContext): {
  subject: string;
  email_body: string;
  used_signals: string[];
} {
  const company = ctx.company_name?.trim();
  const city = ctx.city?.trim();
  const activity = ctx.activity?.trim();

  const bits: string[] = [];
  if (company) bits.push(`concernant ${company}`);
  if (city) bits.push(`(${city})`);
  const leadIn = bits.length ? ` ${bits.join(" ")}` : "";

  let hook = "Bonjour,";
  if (ctx.contact_full_name?.trim()) {
    hook = `Bonjour ${ctx.contact_full_name.trim()},`;
  }

  const obs: string[] = [];
  if (activity) obs.push(`Nous identifions votre activité comme : ${activity}.`);
  else if (company) obs.push(`Nous reprenons contact suite à l’identification de votre structure.`);

  const cee =
    "Dans le cadre des dispositifs d’efficacité énergétique soutenus par TotalEnergies, nous accompagnons les sites sur des leviers de performance énergétique.";

  const ask =
    "Seriez-vous ouvert à un court échange pour vérifier si votre site peut être concerné par ces dispositifs ?";

  const body = [hook, "", ...obs, "", cee, "", ask, "", "Merci pour votre retour éventuel."].join("\n");

  const used: string[] = [];
  if (company) used.push("company_name");
  if (city) used.push("city");
  if (activity) used.push("activity");
  if (ctx.contact_full_name) used.push("contact_full_name");

  const subject =
    company && city
      ? `${company} — efficacité énergétique (${city})`
      : company
        ? `${company} — efficacité énergétique`
        : "Votre site — efficacité énergétique (CEE)";

  return {
    subject: subject.slice(0, 180),
    email_body: body,
    used_signals: used.length ? used : ["minimal_context"],
  };
}
