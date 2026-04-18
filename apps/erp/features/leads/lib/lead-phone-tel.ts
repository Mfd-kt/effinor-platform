/** Prépare un lien `tel:` pour le numéro affiché sur la fiche (France 0x xx xx xx xx → +33). */
export function leadPhoneToTelHref(phone: string | null | undefined): string | null {
  const raw = phone?.replace(/[\s.-]/g, "").trim();
  if (!raw) return null;
  if (raw.toLowerCase().startsWith("tel:")) return raw;
  if (raw.startsWith("+")) return `tel:${raw}`;
  if (raw.startsWith("00") && raw.length > 4) return `tel:+${raw.slice(2)}`;
  if (/^0\d{9}$/.test(raw)) return `tel:+33${raw.slice(1)}`;
  return `tel:${raw}`;
}
