import type {
  CallbackAiContext,
  CallbackCallScriptParts,
  CallbackFollowupDraftParts,
} from "@/features/commercial-callbacks/ai/callback-ai-types";

function firstName(contactName: string): string {
  const t = contactName.trim();
  if (!t) return "";
  return t.split(/\s+/)[0] ?? t;
}

/** Déduit un scénario métier simple pour les templates. */
function inferScenario(ctx: CallbackAiContext): string {
  const pack = `${ctx.callbackComment} ${ctx.contextSummary ?? ""} ${ctx.callbackReason ?? ""}`.toLowerCase();
  if (/occup|busy|rappel.*demain|plus tard|demain|après/i.test(pack)) {
    return "busy_or_later";
  }
  if (ctx.attemptsCount >= 2 || /pas de réponse|joindre|absent|messagerie/i.test(pack)) {
    return "no_answer";
  }
  if (ctx.prospectTemperature === "cold") {
    return "cold";
  }
  if (ctx.prospectTemperature === "hot") {
    return "hot";
  }
  return "default";
}

function linesFromParts(parts: Omit<CallbackCallScriptParts, "lines">): string[] {
  return [parts.opening, parts.contextReminder, parts.openingQuestion, parts.nextStep].filter(
    (s) => s.trim().length > 0,
  );
}

function clampLines(lines: string[], max = 6): string[] {
  return lines.slice(0, max);
}

/**
 * Script d’appel de secours — toujours renvoie 3–6 lignes courtes.
 */
export function fallbackCallbackCallScript(ctx: CallbackAiContext): CallbackCallScriptParts {
  const prenom = firstName(ctx.contactName) || "monsieur";
  const societe = ctx.companyName;
  const scenario = inferScenario(ctx);

  let opening: string;
  let contextReminder: string;
  let openingQuestion: string;
  let nextStep: string;

  switch (scenario) {
    case "busy_or_later":
      opening = `Bonjour ${prenom}, c’est Effinor au sujet de ${societe}.`;
      contextReminder =
        "Je rappelle suite à votre demande de recontact — je vous prends deux minutes tout au plus.";
      openingQuestion = "Est-ce que c’est un bon moment, ou préférez-vous qu’on se cale un créneau précis ?";
      nextStep = "Si occupé : proposer demain matin ou après-midi avec une heure fixe.";
      break;
    case "no_answer":
      opening = `Bonjour ${prenom}, Effinor — toujours intéressé par votre projet sur ${societe}.`;
      contextReminder =
        ctx.attemptsCount > 0
          ? `Je repasse après ${ctx.attemptsCount} tentative(s) — je voulais m’assurer que le sujet est toujours d’actualité.`
          : "Je souhaitais faire le point rapidement avec vous.";
      openingQuestion = "Quel serait le meilleur moment pour vous cette semaine ?";
      nextStep = "Noter le créneau ou proposer un envoi par mail pour un premier échange écrit.";
      break;
    case "cold":
      opening = `Bonjour ${prenom}, Effinor pour ${societe}.`;
      contextReminder = "Je fais un court point : est-ce que l’optimisation énergétique est toujours un sujet pour vous ?";
      openingQuestion = "Si oui, qu’est-ce qui bloquerait aujourd’hui : budget, timing ou informations manquantes ?";
      nextStep = "Si peu d’intérêt : remercier et proposer de rester en contact par mail.";
      break;
    case "hot":
      opening = `Bonjour ${prenom}, Effinor — on avance sur ${societe}.`;
      contextReminder =
        ctx.contextSummary?.slice(0, 200) ||
        "Vous aviez un projet concret ; je voulais verrouiller la prochaine étape avec vous.";
      openingQuestion = "On peut valider ensemble la suite : est-ce qu’un chiffrage ou un rendez-vous vous arrange cette semaine ?";
      nextStep = "Proposer une date précise et ce dont vous avez besoin pour décider.";
      break;
    default:
      opening = `Bonjour ${prenom}, Effinor au sujet de ${societe}.`;
      contextReminder =
        ctx.contextSummary?.slice(0, 220) ||
        "Je vous appelle pour faire le point sur votre demande et voir comment on peut vous aider concrètement.";
      openingQuestion = "Où en êtes-vous sur le sujet, et qu’est-ce qui serait utile pour vous aujourd’hui ?";
      nextStep = "Proposer la suite logique : envoi d’info, rendez-vous, ou rappel à une date fixe.";
  }

  const lines = clampLines(linesFromParts({ opening, contextReminder, openingQuestion, nextStep }));
  return { opening, contextReminder, openingQuestion, nextStep, lines };
}

export function fallbackCallbackCallScriptText(ctx: CallbackAiContext): string {
  const { lines } = fallbackCallbackCallScript(ctx);
  return lines.join("\n");
}

export function fallbackCallbackFollowupDraft(ctx: CallbackAiContext): CallbackFollowupDraftParts {
  const prenom = firstName(ctx.contactName) || "";
  const societe = ctx.companyName;
  const scenario = inferScenario(ctx);

  let subject: string;
  let message: string;
  let cta: string;

  switch (scenario) {
    case "busy_or_later":
      subject = `${societe} — suite à notre échange`;
      message = `Bonjour${prenom ? ` ${prenom}` : ""},\n\nComme convenu, je reviens vers vous concernant votre projet. Dites-moi quand vous êtes disponible pour en parler 5 minutes, ou répondez simplement avec un créneau qui vous convient.`;
      cta = "Répondre avec un jour et une plage horaire.";
      break;
    case "no_answer":
      subject = `${societe} — prise de contact Effinor`;
      message = `Bonjour${prenom ? ` ${prenom}` : ""},\n\nJe n’ai pas réussi à vous joindre. Si le sujet est toujours d’actualité, indiquez-moi un moment pour vous rappeler, ou dites-moi si on clôt le dossier de notre côté.`;
      cta = "Répondre « rappeler le [date] » ou « plus d’actualité ».";
      break;
    case "cold":
      subject = `${societe} — point rapide`;
      message = `Bonjour${prenom ? ` ${prenom}` : ""},\n\nJe vous écris pour savoir si l’optimisation de vos installations reste un sujet. Si oui, je peux vous proposer une courte synthèse adaptée à votre situation.`;
      cta = "Répondre par oui/non + une disponibilité si intéressé.";
      break;
    case "hot":
      subject = `${societe} — prochaine étape`;
      message = `Bonjour${prenom ? ` ${prenom}` : ""},\n\nSuite à nos échanges, voici ce que je vous propose : on fixe une prochaine étape concrète (chiffrage ou rendez-vous) selon ce qui vous arrange.`;
      cta = "Répondre avec votre disponibilité cette semaine.";
      break;
    default:
      subject = `${societe} — suivi Effinor`;
      message = `Bonjour${prenom ? ` ${prenom}` : ""},\n\nJe reviens vers vous concernant votre demande. Dites-moi si vous souhaitez qu’on en discute par téléphone ou si vous préférez des éléments par écrit.`;
      cta = "Répondre avec votre préférence (appel / mail) et un créneau si besoin.";
  }

  const fullText = `Objet : ${subject}\n\n${message}\n\n— ${cta}`;
  return { subject, message, cta, fullText };
}
