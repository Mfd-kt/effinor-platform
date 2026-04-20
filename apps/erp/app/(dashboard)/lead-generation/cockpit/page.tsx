import { redirect } from "next/navigation";

/**
 * Ancienne URL du cockpit : redirige vers la vue fusionnée « Pilotage équipe ».
 */
export default async function LeadGenerationCockpitRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = new URLSearchParams();

  next.set("view", "cockpit");

  const period = sp.period;
  if (typeof period === "string" && (period === "24h" || period === "7d" || period === "30d")) {
    next.set("period", period);
  }

  const agent = sp.agent;
  if (typeof agent === "string" && agent.trim().length > 0) {
    next.set("agent", agent.trim());
  }

  redirect(`/lead-generation/management?${next.toString()}`);
}
