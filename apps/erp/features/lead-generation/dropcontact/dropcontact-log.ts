/**
 * Logs serveur structurés pour le flux Dropcontact (grep: `[dropcontact:`).
 * Ne pas y placer de secrets (token, corps complet des contacts).
 */

export type DropcontactLogStage =
  | "enrich"
  | "webhook"
  | "pull"
  | "client_post"
  | "client_get"
  | "revalidate"
  | "refresh_ui"
  | "reset";

export function logDropcontact(stage: DropcontactLogStage, message: string, meta?: Record<string, unknown>): void {
  const line = `[dropcontact:${stage}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    console.log(line, meta);
  } else {
    console.log(line);
  }
}
