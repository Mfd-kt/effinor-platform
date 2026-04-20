import type { Json } from "@/features/lead-generation/domain/json";
import type { LeadGenerationStockRow } from "@/features/lead-generation/domain/stock-row";
import type { LeadGenerationGptResearchPayload } from "@/features/lead-generation/domain/lead-generation-gpt-research";

import type { QualifiedLeadBuildingSignals, QualifiedLeadEmailContext } from "../domain/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseGptPayload(raw: Json | null | undefined): LeadGenerationGptResearchPayload | null {
  if (!raw || !isRecord(raw)) return null;
  if (typeof raw.company_name_confirmed !== "string") return null;
  return raw as LeadGenerationGptResearchPayload;
}

function splitContactName(raw: string | null | undefined): {
  first: string | null;
  last: string | null;
  full: string | null;
} {
  const t = raw?.trim();
  if (!t) return { first: null, last: null, full: null };
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { first: parts[0] ?? null, last: null, full: t };
  return {
    first: parts[0] ?? null,
    last: parts.slice(1).join(" ") || null,
    full: t,
  };
}

function buildActivity(stock: LeadGenerationStockRow, gpt: LeadGenerationGptResearchPayload | null): string | null {
  const parts: string[] = [];
  if (stock.category?.trim()) parts.push(stock.category.trim());
  if (stock.sub_category?.trim()) parts.push(stock.sub_category.trim());
  if (parts.length > 0) return parts.join(" · ");
  if (gpt?.activity_summary?.trim()) return gpt.activity_summary.trim().slice(0, 500);
  return null;
}

function buildBuildingSignals(
  stock: LeadGenerationStockRow,
  gpt: LeadGenerationGptResearchPayload | null,
): QualifiedLeadBuildingSignals {
  const out: QualifiedLeadBuildingSignals = {};
  if (stock.closing_reasons?.length) {
    out.other_notes = stock.closing_reasons.filter(Boolean).join(" · ").slice(0, 800);
  }

  if (!gpt) {
    return out;
  }

  const hs = gpt.height_signal?.value?.trim();
  const ss = gpt.surface_signal?.value?.trim();
  if (hs) out.height = hs;
  if (ss) out.surface = ss;
  const heat = [...(gpt.heating_signals ?? []), ...(gpt.qualification_signals ?? [])]
    .map((s) => s.trim())
    .filter(Boolean);
  if (heat.length) {
    out.heating_type = heat.slice(0, 4).join(" ; ");
  }
  const sector = gpt.sector;
  const btype = gpt.building_type;
  if (sector === "industrial" || btype === "industrial") {
    out.industrial_site = true;
  }
  if (sector === "tertiary" || btype === "tertiary") {
    out.tertiary_site = true;
  }
  if (sector === "mixed" || btype === "mixed") {
    out.industrial_site = true;
    out.tertiary_site = true;
  }
  const act = gpt.activity_summary?.toLowerCase() ?? "";
  if (/\batelier\b|workshop|production/i.test(act)) out.workshop = true;
  if (/\bgrand|volume|surface|entrep[oô]t|logistique/i.test(act + (ss ?? "") + (hs ?? ""))) {
    out.large_volume = true;
  }
  if (out.heating_type || heat.length) out.heated_building = true;

  return out;
}

/**
 * Construit le contexte envoyé au modèle : uniquement des faits présents sur la fiche / GPT.
 */
export function buildQualifiedLeadEmailContext(
  stock: LeadGenerationStockRow,
  qualificationNotes: string | null,
): QualifiedLeadEmailContext {
  const gpt = parseGptPayload(stock.research_gpt_payload ?? null);
  const dm = splitContactName(stock.decision_maker_name);
  const recipient = stock.enriched_email?.trim() || stock.email?.trim() || null;

  const enrichment_hints: Record<string, Json | undefined> = {};
  if (gpt) {
    enrichment_hints.gpt_company = gpt.company_name_confirmed;
    enrichment_hints.gpt_sector = gpt.sector;
    enrichment_hints.gpt_building_type = gpt.building_type;
    if (gpt.activity_summary?.trim()) {
      enrichment_hints.gpt_activity_excerpt = gpt.activity_summary.trim().slice(0, 400);
    }
  }
  if (stock.approach_hook?.trim()) enrichment_hints.approach_hook = stock.approach_hook.trim();
  if (stock.approach_angle?.trim()) enrichment_hints.approach_angle = stock.approach_angle.trim();

  return {
    company_name: stock.company_name?.trim() || null,
    activity: buildActivity(stock, gpt),
    city: stock.city?.trim() || null,
    postal_code: stock.postal_code?.trim() || null,
    contact_first_name: dm.first,
    contact_last_name: dm.last,
    contact_full_name: dm.full,
    contact_role: stock.decision_maker_role?.trim() || null,
    email: recipient,
    phone: stock.normalized_phone || stock.phone?.trim() || null,
    building_signals: buildBuildingSignals(stock, gpt),
    qualification_notes: qualificationNotes?.trim() || null,
    source: stock.source?.trim() || null,
    enrichment_hints,
  };
}
