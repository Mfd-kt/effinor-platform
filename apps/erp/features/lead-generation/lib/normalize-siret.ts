/**
 * SIRET : 14 chiffres ; espaces et séparateurs retirés.
 */
export function normalizeSiret(input: string | null | undefined): string | null {
  if (input == null) {
    return null;
  }
  const d = input.replace(/\D/g, "");
  if (d.length !== 14) {
    return null;
  }
  return d;
}
