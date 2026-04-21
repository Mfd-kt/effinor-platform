import { createClient } from "@/lib/supabase/server";

/**
 * Règles métier (traçabilité `lead_generation_stock` → `leads` → opérations / VT / installations) :
 *
 * - **Lead converti** : fiche stock avec `converted_lead_id` non nul ; le lead `leads.id` correspondant est pris en
 *   compte si `created_at >= periodStart` et `deleted_at` nul (période = date de création de la fiche commerciale).
 * - **RDV obtenu** : `leads.callback_at` renseigné (rendez-vous / rappel planifié côté CRM).
 * - **Accord commercial** : `leads.lead_status` ∈ `accord_received` | `converted` **ou** opération liée au lead avec
 *   `sales_status` ∈ `quote_signed` | `won` (via `operations.lead_id`).
 * - **Visite technique** : au moins une ligne `technical_visits` pour le lead, `deleted_at` nul, statut ni `cancelled`
 *   ni `refused`.
 * - **Installation** : au moins une ligne `installations` pour une opération liée au lead (`installations.status`
 *   ≠ `cancelled`). Opérations : première opération trouvée pour `operations.lead_id` (ordre défini par la requête).
 */

export type BusinessOutcomeCounts = {
  /** Fiches commerciales créées depuis le stock (périmètre + période sur `leads.created_at`). */
  convertedLeads: number;
  /** Sous-ensemble avec `callback_at` renseigné. */
  withRdv: number;
  /** Accord au sens statut lead ou vente opération (voir doc module). */
  withAccord: number;
  /** Au moins une VT « réelle » (non annulée / refusée). */
  withVt: number;
  /** Au moins une installation non annulée sur une opération du lead. */
  withInstallation: number;
};

export type BusinessOutcomeRates = {
  rdvVsConverted: number | null;
  accordVsConverted: number | null;
  vtVsConverted: number | null;
  installationVsConverted: number | null;
};

export type BusinessOutcomesBundle = {
  global: BusinessOutcomeCounts & { rates: BusinessOutcomeRates };
  byOwnerUserId: Record<string, BusinessOutcomeCounts & { rates: BusinessOutcomeRates }>;
  byBatchId: Record<string, BusinessOutcomeCounts & { rates: BusinessOutcomeRates }>;
};

const ACCORD_LEAD_STATUSES = new Set(["accord_received", "converted"]);
const ACCORD_SALES_STATUSES = new Set(["quote_signed", "won"]);
const VT_EXCLUDED = new Set(["cancelled", "refused"]);

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function ratesFromCounts(c: BusinessOutcomeCounts): BusinessOutcomeRates {
  const d = c.convertedLeads;
  if (d <= 0) {
    return { rdvVsConverted: null, accordVsConverted: null, vtVsConverted: null, installationVsConverted: null };
  }
  return {
    rdvVsConverted: round1((100 * c.withRdv) / d),
    accordVsConverted: round1((100 * c.withAccord) / d),
    vtVsConverted: round1((100 * c.withVt) / d),
    installationVsConverted: round1((100 * c.withInstallation) / d),
  };
}

function emptyCounts(): BusinessOutcomeCounts {
  return {
    convertedLeads: 0,
    withRdv: 0,
    withAccord: 0,
    withVt: 0,
    withInstallation: 0,
  };
}

/** Ligne tableau / agrégat avec taux null si dénominateur nul. */
export function emptyBusinessOutcomesPadded(): BusinessOutcomeCounts & { rates: BusinessOutcomeRates } {
  const z = emptyCounts();
  return { ...z, rates: ratesFromCounts(z) };
}

function addInto(target: BusinessOutcomeCounts, delta: BusinessOutcomeCounts) {
  target.convertedLeads += delta.convertedLeads;
  target.withRdv += delta.withRdv;
  target.withAccord += delta.withAccord;
  target.withVt += delta.withVt;
  target.withInstallation += delta.withInstallation;
}

type LeadRow = {
  id: string;
  callback_at: string | null;
  lead_status: string;
  created_at: string;
};

export async function getLeadGenerationManagementBusinessOutcomes(input: {
  batchIds: string[];
  batchIdToOwnerUserId: Map<string, string>;
  periodStartIso: string;
}): Promise<BusinessOutcomesBundle> {
  const emptyGlobal: BusinessOutcomesBundle = {
    global: { ...emptyCounts(), rates: ratesFromCounts(emptyCounts()) },
    byOwnerUserId: {},
    byBatchId: {},
  };

  if (input.batchIds.length === 0) {
    return emptyGlobal;
  }

  const supabase = await createClient();
  const CHUNK = 150;

  type StockLink = { import_batch_id: string; converted_lead_id: string };
  const links: StockLink[] = [];

  for (let i = 0; i < input.batchIds.length; i += CHUNK) {
    const chunk = input.batchIds.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("lead_generation_stock")
      .select("import_batch_id, converted_lead_id")
      .in("import_batch_id", chunk)
      .not("converted_lead_id", "is", null);
    if (error) {
      throw new Error(`Stock convertis (management business) : ${error.message}`);
    }
    for (const r of data ?? []) {
      const row = r as { import_batch_id: string; converted_lead_id: string };
      if (row.import_batch_id && row.converted_lead_id) {
        links.push({ import_batch_id: row.import_batch_id, converted_lead_id: row.converted_lead_id });
      }
    }
  }

  const leadToBatch = new Map<string, string>();
  for (const l of links) {
    if (!leadToBatch.has(l.converted_lead_id)) {
      leadToBatch.set(l.converted_lead_id, l.import_batch_id);
    }
  }

  const candidateLeadIds = [...leadToBatch.keys()];
  if (candidateLeadIds.length === 0) {
    return emptyGlobal;
  }

  const leadsInPeriod: LeadRow[] = [];
  for (let i = 0; i < candidateLeadIds.length; i += CHUNK) {
    const chunk = candidateLeadIds.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("leads")
      .select("id, callback_at, lead_status, created_at")
      .in("id", chunk)
      .is("deleted_at", null)
      .gte("created_at", input.periodStartIso);
    if (error) {
      throw new Error(`Leads (management business) : ${error.message}`);
    }
    for (const r of data ?? []) {
      leadsInPeriod.push(r as LeadRow);
    }
  }

  const filteredLeadIds = leadsInPeriod.map((l) => l.id);
  if (filteredLeadIds.length === 0) {
    return emptyGlobal;
  }

  const leadById = new Map(leadsInPeriod.map((l) => [l.id, l] as const));

  const vtLeadIds = new Set<string>();
  for (let i = 0; i < filteredLeadIds.length; i += CHUNK) {
    const chunk = filteredLeadIds.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("technical_visits")
      .select("lead_id, status")
      .in("lead_id", chunk)
      .is("deleted_at", null);
    if (error) {
      throw new Error(`VT (management business) : ${error.message}`);
    }
    for (const r of data ?? []) {
      const row = r as { lead_id: string; status: string };
      if (!VT_EXCLUDED.has(row.status)) {
        vtLeadIds.add(row.lead_id);
      }
    }
  }

  const operationByLead = new Map<string, { id: string; sales_status: string }>();
  for (let i = 0; i < filteredLeadIds.length; i += CHUNK) {
    const chunk = filteredLeadIds.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("operations")
      .select("id, lead_id, sales_status")
      .in("lead_id", chunk)
      .is("deleted_at", null);
    if (error) {
      throw new Error(`Operations par lead (management business) : ${error.message}`);
    }
    for (const r of data ?? []) {
      const row = r as { id: string; lead_id: string; sales_status: string };
      if (!row.lead_id) {
        continue;
      }
      if (!operationByLead.has(row.lead_id)) {
        operationByLead.set(row.lead_id, { id: row.id, sales_status: row.sales_status });
      }
    }
  }

  function operationForLead(lead: LeadRow): { id: string; sales_status: string } | null {
    return operationByLead.get(lead.id) ?? null;
  }

  function leadHasAccord(lead: LeadRow): boolean {
    if (ACCORD_LEAD_STATUSES.has(lead.lead_status)) {
      return true;
    }
    const op = operationForLead(lead);
    return op != null && ACCORD_SALES_STATUSES.has(op.sales_status);
  }

  const operationIdsForInstall = new Set<string>();
  for (const l of leadsInPeriod) {
    const op = operationForLead(l);
    if (op) {
      operationIdsForInstall.add(op.id);
    }
  }

  const opsWithInstallation = new Set<string>();
  if (operationIdsForInstall.size > 0) {
    const opList = [...operationIdsForInstall];
    for (let i = 0; i < opList.length; i += CHUNK) {
      const chunk = opList.slice(i, i + CHUNK);
      const { data, error } = await supabase
        .from("installations")
        .select("operation_id, status")
        .in("operation_id", chunk);
      if (error) {
        throw new Error(`Installations (management business) : ${error.message}`);
      }
      for (const r of data ?? []) {
        const row = r as { operation_id: string; status: string };
        if (row.status !== "cancelled") {
          opsWithInstallation.add(row.operation_id);
        }
      }
    }
  }

  function leadHasInstallation(lead: LeadRow): boolean {
    const op = operationForLead(lead);
    return op != null && opsWithInstallation.has(op.id);
  }

  function metricsForLead(leadId: string): BusinessOutcomeCounts {
    const lead = leadById.get(leadId);
    if (!lead) {
      return emptyCounts();
    }
    const op = operationForLead(lead);
    return {
      convertedLeads: 1,
      withRdv: lead.callback_at ? 1 : 0,
      withAccord: leadHasAccord(lead) ? 1 : 0,
      withVt: vtLeadIds.has(leadId) ? 1 : 0,
      withInstallation: leadHasInstallation(lead) ? 1 : 0,
    };
  }

  const global = emptyCounts();
  const byBatch: Record<string, BusinessOutcomeCounts> = {};
  const byOwner: Record<string, BusinessOutcomeCounts> = {};

  for (const leadId of filteredLeadIds) {
    const batchId = leadToBatch.get(leadId);
    if (!batchId) {
      continue;
    }
    const m = metricsForLead(leadId);
    addInto(global, m);

    if (!byBatch[batchId]) {
      byBatch[batchId] = emptyCounts();
    }
    addInto(byBatch[batchId], m);

    const owner = input.batchIdToOwnerUserId.get(batchId);
    if (owner) {
      if (!byOwner[owner]) {
        byOwner[owner] = emptyCounts();
      }
      addInto(byOwner[owner], m);
    }
  }

  const wrap = (c: BusinessOutcomeCounts): BusinessOutcomeCounts & { rates: BusinessOutcomeRates } => ({
    ...c,
    rates: ratesFromCounts(c),
  });

  const byBatchId: BusinessOutcomesBundle["byBatchId"] = {};
  for (const [bid, c] of Object.entries(byBatch)) {
    byBatchId[bid] = wrap(c);
  }
  const byOwnerUserId: BusinessOutcomesBundle["byOwnerUserId"] = {};
  for (const [uid, c] of Object.entries(byOwner)) {
    byOwnerUserId[uid] = wrap(c);
  }

  return {
    global: wrap(global),
    byBatchId,
    byOwnerUserId,
  };
}
