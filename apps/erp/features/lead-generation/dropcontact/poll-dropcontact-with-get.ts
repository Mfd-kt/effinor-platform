import { fetchDropcontactEnrichmentResult } from "./client";
import { logDropcontact } from "./dropcontact-log";

export type PollDropcontactOutcome =
  | { outcome: "ready"; contacts: Record<string, unknown>[] }
  | { outcome: "timeout" }
  | { outcome: "failed"; message: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Intervalle et durée max (aligné n8n : GET jusqu’à résultat prêt).
 * Borné pour rester sous les timeouts serverless usuels.
 */
export function getDropcontactPollConfig(): { intervalMs: number; maxWaitMs: number } {
  const rawInterval = Number(process.env.DROPCONTACT_POLL_INTERVAL_MS ?? 4000);
  const rawMax = Number(process.env.DROPCONTACT_POLL_MAX_MS ?? 55000);
  const intervalMs =
    Number.isFinite(rawInterval) && rawInterval >= 2000 ? Math.min(Math.floor(rawInterval), 10_000) : 4000;
  const maxWaitMs =
    Number.isFinite(rawMax) && rawMax >= 15_000 ? Math.min(Math.floor(rawMax), 120_000) : 55_000;
  return { intervalMs, maxWaitMs };
}

/**
 * Enchaîne des GET /v1/enrich/all/{request_id} jusqu’à succès, erreur définitive, ou timeout.
 */
export async function pollDropcontactUntilReady(
  requestId: string,
  ctx: { leadId: string },
): Promise<PollDropcontactOutcome> {
  const rid = requestId.trim();
  if (!rid) {
    return { outcome: "failed", message: "Identifiant Dropcontact manquant." };
  }

  const { intervalMs, maxWaitMs } = getDropcontactPollConfig();
  const deadline = Date.now() + maxWaitMs;
  let attempt = 0;

  logDropcontact("poll", "Démarrage polling GET", {
    leadId: ctx.leadId,
    requestId: rid,
    intervalMs,
    maxWaitMs,
  });

  while (Date.now() < deadline) {
    attempt += 1;
    const polled = await fetchDropcontactEnrichmentResult(rid);

    if (polled.kind === "ready") {
      logDropcontact("poll", "GET success (polling)", {
        leadId: ctx.leadId,
        requestId: rid,
        attempt,
        itemCount: polled.contacts.length,
      });
      return { outcome: "ready", contacts: polled.contacts };
    }

    if (polled.kind === "failed") {
      logDropcontact("poll", "GET failed (polling)", {
        leadId: ctx.leadId,
        requestId: rid,
        attempt,
        code: polled.code,
      });
      return { outcome: "failed", message: polled.message };
    }

    logDropcontact("poll", "GET not_ready", {
      leadId: ctx.leadId,
      requestId: rid,
      attempt,
      reason: polled.reason,
    });

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    const wait = Math.min(intervalMs, remaining);
    if (wait > 0) {
      await sleep(wait);
    }
  }

  logDropcontact("poll", "Polling timeout (fenêtre dépassée)", {
    leadId: ctx.leadId,
    requestId: rid,
    attempts: attempt,
  });
  return { outcome: "timeout" };
}
