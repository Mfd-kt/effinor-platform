import { handleLeadEmailSyncCronHttp } from "@/features/leads/lib/lead-email-sync-cron-http";

/** Alias court (même logique que `/api/cron/lead-email-sync`) — utile si un proxy bloque un chemin. */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  return handleLeadEmailSyncCronHttp(request);
}

export async function POST(request: Request) {
  return handleLeadEmailSyncCronHttp(request);
}
