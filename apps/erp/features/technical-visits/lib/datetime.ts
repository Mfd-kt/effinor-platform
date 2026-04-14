/** Valeur pour un input `datetime-local` (sans fuseau). */
export function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Valeur pour un input `date` (YYYY-MM-DD, jour local). */
export function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Chaîne issue d’un `datetime-local` → ISO pour Supabase. */
export function datetimeLocalToIso(value: string | undefined): string | null {
  if (!value || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Chaîne issue d’un `date` (YYYY-MM-DD) → ISO (midi local, sans heure affichée côté UI). */
export function dateInputToIso(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const local = new Date(y, mo - 1, day, 12, 0, 0, 0);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}
