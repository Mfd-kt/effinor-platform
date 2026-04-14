import type { LeadInsertInput } from "@/features/leads/schemas/lead.schema";

/**
 * L’autosave envoie tout le formulaire : si `heating_type` est vide dans l’état RHF alors que
 * l’utilisateur n’a pas touché au champ, on réinjecte le dernier état connu pour ne pas écraser la base.
 */
export function mergeLeadPayloadPreservingUntouchedHeating(
  payload: LeadInsertInput,
  opts: { heatingFieldDirty: boolean; lastCommittedHeating: LeadInsertInput["heating_type"] },
): LeadInsertInput {
  if (
    !opts.heatingFieldDirty &&
    opts.lastCommittedHeating?.length &&
    !payload.heating_type?.length
  ) {
    return { ...payload, heating_type: [...opts.lastCommittedHeating] };
  }
  return payload;
}
