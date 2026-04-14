/** Alimente first_name / last_name pour map-to-db (contact_name = jointure). */
export function splitContactName(full: string): { first_name: string; last_name: string } {
  const t = full.trim();
  if (!t) return { first_name: "", last_name: "" };
  const space = t.indexOf(" ");
  if (space === -1) return { first_name: t, last_name: "" };
  return {
    first_name: t.slice(0, space).trim(),
    last_name: t.slice(space + 1).trim(),
  };
}
