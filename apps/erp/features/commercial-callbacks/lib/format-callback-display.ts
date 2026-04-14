/** Affichage court d’une heure Postgres `time`. */
export function formatCallbackTimeDisplay(t: string | null | undefined): string {
  if (!t?.trim()) return "—";
  const m = t.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t.trim();
  return `${m[1]}:${m[2]}`;
}
