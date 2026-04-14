"use server";

import type { DomainNotificationEvent } from "@/features/notifications/domain/types";
import { notifyDomainEvent } from "@/features/notifications/services/slack-notification-service";

/**
 * Point d’entrée serveur pour déclencher une notification à partir d’un événement domaine typé
 * (cron, jobs, autres actions serveur).
 * Ne pas appeler depuis le navigateur sans garde d’autorisation.
 */
export async function triggerNotificationFromDomainEvent(
  event: DomainNotificationEvent,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await notifyDomainEvent(event);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return { ok: false, message: msg };
  }
}
