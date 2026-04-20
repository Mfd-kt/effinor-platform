/** Une idée de recherche Maps par ligne (aligné dashboard / quantificateur). */
export function parseGoogleMapsSearchLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}
