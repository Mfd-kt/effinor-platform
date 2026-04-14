/** Pour `<input type="time">` : extrait HH:MM depuis une valeur Postgres `time`. */
export function timeForInput(t: string | null | undefined): string {
  if (!t?.trim()) return "";
  const m = t.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  const hh = m[1].padStart(2, "0");
  return `${hh}:${m[2]}`;
}
