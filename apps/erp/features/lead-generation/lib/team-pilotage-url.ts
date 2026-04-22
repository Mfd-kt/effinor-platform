/** Vue fusionnée Suivi quantificateurs + Cockpit manager + Analytics (`/lead-generation/management`). */

export type TeamPilotageView = "suivi" | "cockpit" | "analytics";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseTeamPilotageView(raw: string | undefined): TeamPilotageView {
  if (raw === "cockpit") return "cockpit";
  if (raw === "analytics") return "analytics";
  return "suivi";
}

function firstString(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key];
  return typeof v === "string" ? v : undefined;
}

/** Préserve filtres des trois onglets dans l’URL pour pouvoir basculer sans perdre les réglages. */
export function buildTeamPilotageTabHrefs(
  sp: Record<string, string | string[] | undefined>,
): {
  view: TeamPilotageView;
  suiviHref: string;
  cockpitHref: string;
  analyticsHref: string;
} {
  const view = parseTeamPilotageView(firstString(sp, "view"));

  const pRaw = firstString(sp, "p");
  const p = pRaw === "today" || pRaw === "7d" || pRaw === "30d" ? pRaw : "7d";
  const qRaw = firstString(sp, "q");
  const q = qRaw && UUID_RE.test(qRaw) ? qRaw : null;
  const ceeRaw = firstString(sp, "cee");
  const cee = ceeRaw && UUID_RE.test(ceeRaw) ? ceeRaw : null;

  const periodRaw = firstString(sp, "period");
  const period = periodRaw === "24h" || periodRaw === "7d" || periodRaw === "30d" ? periodRaw : "7d";
  const agentRaw = firstString(sp, "agent")?.trim();
  const agent = agentRaw && agentRaw.length > 0 ? agentRaw : null;

  const baseSuivi = new URLSearchParams();
  baseSuivi.set("view", "suivi");
  baseSuivi.set("p", p);
  if (q) {
    baseSuivi.set("q", q);
  }
  if (cee) {
    baseSuivi.set("cee", cee);
  }
  baseSuivi.set("period", period);
  if (agent) {
    baseSuivi.set("agent", agent);
  }

  const baseCockpit = new URLSearchParams();
  baseCockpit.set("view", "cockpit");
  baseCockpit.set("period", period);
  if (agent) {
    baseCockpit.set("agent", agent);
  }
  baseCockpit.set("p", p);
  if (q) {
    baseCockpit.set("q", q);
  }
  if (cee) {
    baseCockpit.set("cee", cee);
  }

  const baseAnalytics = new URLSearchParams();
  baseAnalytics.set("view", "analytics");
  baseAnalytics.set("p", p);
  if (q) {
    baseAnalytics.set("q", q);
  }
  if (cee) {
    baseAnalytics.set("cee", cee);
  }
  baseAnalytics.set("period", period);
  if (agent) {
    baseAnalytics.set("agent", agent);
  }

  return {
    view,
    suiviHref: `/lead-generation/management?${baseSuivi.toString()}`,
    cockpitHref: `/lead-generation/management?${baseCockpit.toString()}`,
    analyticsHref: `/lead-generation/management?${baseAnalytics.toString()}`,
  };
}
