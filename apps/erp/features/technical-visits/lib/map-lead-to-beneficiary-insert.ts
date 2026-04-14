import type { BeneficiaryInsertInput } from "@/features/beneficiaries/schemas/beneficiary.schema";
import type { LeadRow } from "@/features/leads/types";
import type { TechnicalVisitRow } from "@/features/technical-visits/types";
import { climateZoneFromWorksiteOrHeadOfficePostalCode } from "@/lib/fr-climate-zone";
import { regionFromWorksiteOrHeadOfficePostalCode } from "@/lib/fr-postal-region";

function trimOrUndef(s: string | null | undefined): string | undefined {
  const t = s?.trim();
  return t ? t : undefined;
}

function buildNotes(
  lead: LeadRow,
  vt: TechnicalVisitRow,
  internalNotesBlock?: string,
): string | undefined {
  const parts: string[] = [
    `Créé automatiquement depuis la visite technique ${vt.vt_reference} (lead ${lead.id}).`,
  ];
  if (internalNotesBlock?.trim()) {
    parts.push(`Notes internes (lead) :\n${internalNotesBlock.trim()}`);
  }
  if (vt.observations?.trim()) {
    parts.push(`Observations VT :\n${vt.observations.trim()}`);
  }
  const joined = parts.join("\n\n");
  return joined.length > 10_000 ? joined.slice(0, 10_000) : joined;
}

/**
 * Données bénéficiaire alignées sur le schéma réel : `beneficiaries` utilise
 * `contact_first_name` / `contact_last_name` ; le lead expose `first_name` / `last_name`.
 */
export function buildBeneficiaryInsertInputFromLeadAndVt(
  lead: LeadRow,
  vt: TechnicalVisitRow,
  internalNotesBlock?: string,
): BeneficiaryInsertInput {
  return {
    company_name: lead.company_name.trim(),
    siren: undefined,
    siret_head_office: trimOrUndef(lead.siret),
    siret_worksite: undefined,
    civility: trimOrUndef(lead.civility),
    contact_first_name: trimOrUndef(lead.first_name),
    contact_last_name: trimOrUndef(lead.last_name),
    contact_role: trimOrUndef(lead.contact_role),
    phone: trimOrUndef(lead.phone),
    landline: undefined,
    email: trimOrUndef(lead.email),
    head_office_address: trimOrUndef(lead.head_office_address),
    head_office_postal_code: trimOrUndef(lead.head_office_postal_code),
    head_office_city: trimOrUndef(lead.head_office_city),
    worksite_address: trimOrUndef(lead.worksite_address),
    worksite_postal_code: trimOrUndef(lead.worksite_postal_code),
    worksite_city: trimOrUndef(lead.worksite_city),
    climate_zone: climateZoneFromWorksiteOrHeadOfficePostalCode(
      lead.worksite_postal_code,
      lead.head_office_postal_code,
    ),
    /** CP travaux en priorité, sinon siège (aligné Airtable + fiche bénéficiaire). */
    region: regionFromWorksiteOrHeadOfficePostalCode(
      lead.worksite_postal_code,
      lead.head_office_postal_code,
    ),
    acquisition_source: lead.source as string,
    status: "prospect",
    notes: buildNotes(lead, vt, internalNotesBlock),
  };
}
