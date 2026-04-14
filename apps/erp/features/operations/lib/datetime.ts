/** Valeur pour un input `datetime-local` (sans fuseau). */
export function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Chaîne issue d’un `datetime-local` → ISO pour Supabase. */
export function datetimeLocalToIso(value: string | undefined): string | null {
  if (!value || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Valeur pour un input `date` (YYYY-MM-DD, jour local). */
export function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `YYYY-MM-DD` → ISO pour timestamptz (midi local). */
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

/** Affichage FR pour une valeur `YYYY-MM-DD` ou chaîne parsable (legacy). */
export function formatDateInputFr(value: string | undefined): string {
  if (!value?.trim()) return "—";
  const s = value.trim();
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, mo, day] = s.split("-").map(Number);
    d = new Date(y, mo - 1, day);
  } else {
    d = new Date(s);
  }
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
}
