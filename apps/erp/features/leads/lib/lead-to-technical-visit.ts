import { normalizeHeatingModesFromDb } from "@/features/leads/lib/heating-modes";
import type { LeadRow } from "@/features/leads/types";
import { EMPTY_TECHNICAL_VISIT_FORM } from "@/features/technical-visits/lib/form-defaults";
import type { TechnicalVisitInsertInput } from "@/features/technical-visits/schemas/technical-visit.schema";
import { regionFromWorksiteOrHeadOfficePostalCode } from "@/lib/fr-postal-region";

/**
 * Préremplit une visite technique à partir d’un lead qualifié (champs terrain).
 * @param opts.internalNotesBlock — notes internes concaténées (hors colonne lead).
 */
export function buildTechnicalVisitDefaultsFromLead(
  lead: LeadRow,
  opts?: { internalNotesBlock?: string },
): TechnicalVisitInsertInput {
  const region = regionFromWorksiteOrHeadOfficePostalCode(
    lead.worksite_postal_code,
    lead.head_office_postal_code,
  );

  const observationsParts: string[] = [];
  if (opts?.internalNotesBlock?.trim()) {
    observationsParts.push(`Notes internes (lead) :\n${opts.internalNotesBlock.trim()}`);
  }
  if (lead.head_office_address?.trim() || lead.head_office_postal_code || lead.head_office_city) {
    const siège = [
      lead.head_office_address?.trim(),
      [lead.head_office_postal_code, lead.head_office_city].filter(Boolean).join(" ").trim(),
    ]
      .filter(Boolean)
      .join(" — ");
    if (siège) observationsParts.push(`Siège : ${siège}`);
  }

  return {
    ...EMPTY_TECHNICAL_VISIT_FORM,
    lead_id: lead.id,
    status: "to_schedule",
    worksite_address: lead.worksite_address?.trim() || undefined,
    worksite_postal_code: lead.worksite_postal_code?.trim() || undefined,
    worksite_city: lead.worksite_city?.trim() || undefined,
    region,
    surface_m2: lead.surface_m2 ?? undefined,
    ceiling_height_m: lead.ceiling_height_m ?? undefined,
    heating_type: (() => {
      const modes = normalizeHeatingModesFromDb(lead.heating_type);
      return modes.length ? modes : undefined;
    })(),
    observations: observationsParts.length ? observationsParts.join("\n\n") : undefined,
  };
}
