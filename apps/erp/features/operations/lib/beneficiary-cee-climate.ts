import { climateZoneFromWorksiteOrHeadOfficePostalCode } from "@/lib/fr-climate-zone";

/**
 * Zone H1/H2/H3 pour préremplissage CEE : zone enregistrée sur le bénéficiaire si valide,
 * sinon calcul depuis le code postal travaux puis siège (même logique que la fiche bénéficiaire).
 */
export function resolveBeneficiaryCeeClimateZone(row: {
  climate_zone?: string | null;
  worksite_postal_code?: string | null;
  head_office_postal_code?: string | null;
}): string | null {
  const s = row.climate_zone?.trim();
  if (s && /^H[123]$/i.test(s)) return s.toUpperCase();
  const d = climateZoneFromWorksiteOrHeadOfficePostalCode(
    row.worksite_postal_code,
    row.head_office_postal_code,
  );
  if (d && /^H[123]$/.test(d)) return d;
  return null;
}
