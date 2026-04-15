import type { LeadRow } from "@/features/leads/types";
import { resolveWorksiteStringsFromRowAndLead } from "@/features/technical-visits/lib/form-defaults";
import type { TechnicalVisitRow } from "@/features/technical-visits/types";

import type { DynamicAnswers } from "./visibility";

function trimOrUndef(s: string | null | undefined): string | undefined {
  const t = s?.trim();
  return t ? t : undefined;
}

function leadContactDisplayName(lead: LeadRow): string | undefined {
  const cn = trimOrUndef(lead.contact_name);
  if (cn) return cn;
  const parts = [trimOrUndef(lead.first_name), trimOrUndef(lead.last_name)].filter(Boolean) as string[];
  if (parts.length === 0) return undefined;
  return parts.join(" ");
}

type VisitWorksitePick = Pick<
  TechnicalVisitRow,
  "worksite_address" | "worksite_postal_code" | "worksite_city" | "worksite_latitude" | "worksite_longitude"
>;

/**
 * Section « Informations générales » du template BAT-TH-142 : complète `form_answers_json`
 * depuis le lead et les colonnes travaux de la VT. Les clés déjà présentes dans `form_answers_json`
 * (même chaîne vide) ne sont pas modifiées.
 */
export function mergeBatTh142GeneralAnswersFromLeadAndVisit(
  existing: DynamicAnswers | null | undefined,
  lead: LeadRow | null | undefined,
  visit: VisitWorksitePick | null | undefined,
): DynamicAnswers {
  const base: DynamicAnswers =
    existing && typeof existing === "object" && !Array.isArray(existing) ? { ...existing } : {};

  const setIfMissing = (key: string, value: string | undefined) => {
    if (value === undefined || value === "") return;
    if (Object.hasOwn(base, key)) return;
    base[key] = value;
  };

  if (lead) {
    setIfMissing("contact_name", leadContactDisplayName(lead));
    setIfMissing("contact_phone", trimOrUndef(lead.phone));
    setIfMissing("contact_email", trimOrUndef(lead.email));
  }

  const ws = resolveWorksiteStringsFromRowAndLead(visit ?? null, lead ?? null);
  setIfMissing("site_address", ws.worksite_address);
  setIfMissing("site_postal_code", ws.worksite_postal_code);
  setIfMissing("site_city", ws.worksite_city);

  if (visit?.worksite_latitude != null && visit?.worksite_longitude != null) {
    setIfMissing("site_gps", `${visit.worksite_latitude}, ${visit.worksite_longitude}`);
  }

  return base;
}
