import type { Json } from "../domain/json";
import type {
  LeadGenerationGptPappersEnrichment,
  LeadGenerationGptPappersMatch,
  LeadGenerationGptResearchInput,
} from "../domain/lead-generation-gpt-research";

export function getPappersApiKey(): string | null {
  const k = process.env.PAPPERS_API_KEY?.trim();
  return k && k.length > 0 ? k : null;
}

function pappersBaseUrl(): string {
  return (process.env.PAPPERS_API_BASE_URL ?? "https://api.pappers.fr/v2").replace(/\/$/, "");
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function pickDirectorsFromEntreprise(data: Record<string, unknown>): string[] {
  const out: string[] = [];
  const reps = data.representants ?? data.representatives;
  if (Array.isArray(reps)) {
    for (const r of reps) {
      if (!isRecord(r)) continue;
      const nom = str(r.nom ?? r.nom_patronymique);
      const prenom = str(r.prenom);
      const qual = str(r.qualite ?? r.qualite_representant ?? r.qualite_representant_legal);
      const label = [prenom, nom].filter(Boolean).join(" ").trim();
      if (label) {
        out.push(qual ? `${label} — ${qual}` : label);
      }
    }
  }
  return out.slice(0, 12);
}

function pickHeadOfficeAddress(data: Record<string, unknown>): string {
  const siege = data.siege;
  if (isRecord(siege)) {
    const parts = [
      str(siege.adresse_ligne_1 ?? siege.adresse),
      str(siege.code_postal),
      str(siege.ville),
    ].filter(Boolean);
    if (parts.length) return parts.join(", ");
  }
  const addr = str(data.adresse ?? data.adresse_ligne_1);
  const cp = str(data.code_postal);
  const ville = str(data.ville);
  return [addr, [cp, ville].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

/**
 * CA / effectif publics si présents dans la fiche entreprise Pappers (libellés variables selon API).
 */
function appendFinanceAndEffectifLines(data: Record<string, unknown>, useful: string[]): void {
  const tranche = str(
    data.tranche_effectif_salarie ?? data.tranche_effectif ?? data.effectif_salarie ?? data.effectif,
  );
  if (tranche) {
    useful.push(`Effectif (tranche / déclaration) : ${tranche}`);
  }

  const caDirect = str(
    data.chiffre_affaires ?? data.dernier_chiffre_affaires ?? data.ca ?? data.chiffre_affaires_consolide,
  );
  if (caDirect) {
    useful.push(`Chiffre d’affaires (indicateur API) : ${caDirect}`);
  }

  const finances = data.finances ?? data.financials;
  if (Array.isArray(finances) && finances.length > 0) {
    const first = finances[0];
    if (isRecord(first)) {
      const y = str(first.annee ?? first.year ?? first.date_cloture);
      const ca = str(first.chiffre_affaires ?? first.ca ?? first.chiffre_d_affaires);
      if (ca || y) {
        useful.push(`Finances (extrait) : ${y ? `clôture ${y} — ` : ""}${ca || "détail partiel"}`);
      }
    }
  }

  const siege = data.siege;
  if (isRecord(siege)) {
    const effSiege = str(siege.effectif ?? siege.tranche_effectif);
    if (effSiege && !tranche) {
      useful.push(`Effectif (siège) : ${effSiege}`);
    }
  }
}

function pickSiretSiege(data: Record<string, unknown>): string {
  const siege = data.siege;
  if (isRecord(siege)) {
    const st = str(siege.siret);
    if (/^\d{14}$/.test(st)) return st;
  }
  const etabs = data.etablissements;
  if (Array.isArray(etabs)) {
    for (const e of etabs) {
      if (!isRecord(e)) continue;
      if (str(e.code_postal) && str(e.ville)) {
        const st = str(e.siret);
        if (/^\d{14}$/.test(st)) return st;
      }
    }
  }
  return "";
}

function normalizeSirenSiret(raw: string | null | undefined): { siren: string | null; siret14: string | null } {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 14) {
    return { siren: digits.slice(0, 9), siret14: digits };
  }
  if (digits.length === 9) {
    return { siren: digits, siret14: null };
  }
  return { siren: null, siret14: null };
}

function emptyMatch(): LeadGenerationGptPappersMatch {
  return {
    match_confidence: "none",
    siren: "",
    siret: "",
    legal_name: "",
    head_office_address: "",
    legal_form: "",
    directors: [],
    useful_company_data: [],
  };
}

async function fetchJson(url: string, timeoutMs: number): Promise<Json> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "GET", signal: ctrl.signal, headers: { Accept: "application/json" } });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Pappers HTTP ${res.status} : ${text.slice(0, 200)}`);
    }
    return JSON.parse(text) as Json;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Recherche puis fiche entreprise Pappers (données légales publiques).
 * Sans clé API : correspondance `none`, pas d’appel.
 */
export async function fetchPappersLeadGenerationEnrichment(
  input: LeadGenerationGptResearchInput,
): Promise<LeadGenerationGptPappersEnrichment> {
  const apiKey = getPappersApiKey();
  const timeoutMs = Math.max(5_000, parseInt(process.env.PAPPERS_API_TIMEOUT_MS ?? "20000", 10) || 20_000);
  const base = pappersBaseUrl();

  const empty: LeadGenerationGptPappersEnrichment = {
    match: emptyMatch(),
    raw_search: null,
    raw_entreprise: null,
  };

  if (!apiKey) {
    return empty;
  }

  const fromStock = normalizeSirenSiret(input.siret);
  let sirenTarget = fromStock.siren;
  let rawSearch: Json | null = null;
  let rawEnt: Json | null = null;

  try {
    if (sirenTarget) {
      const u = `${base}/entreprise?api_token=${encodeURIComponent(apiKey)}&siren=${encodeURIComponent(sirenTarget)}`;
      rawEnt = await fetchJson(u, timeoutMs);
    } else {
      const q = [input.company_name, input.city].filter((x) => (x ?? "").trim().length > 0).join(" ").trim();
      if (q.length < 2) {
        return empty;
      }
      const u = `${base}/recherche?api_token=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(q)}&par_page=5&page=1`;
      rawSearch = await fetchJson(u, timeoutMs);
      if (!isRecord(rawSearch)) {
        return { ...empty, raw_search: rawSearch };
      }
      const results = rawSearch.resultats ?? rawSearch.results;
      if (!Array.isArray(results) || results.length === 0) {
        return { ...empty, raw_search: rawSearch };
      }
      const first = results[0];
      if (!isRecord(first)) {
        return { ...empty, raw_search: rawSearch };
      }
      const s = str(first.siren);
      if (!/^\d{9}$/.test(s)) {
        return { ...empty, raw_search: rawSearch };
      }
      sirenTarget = s;
      const u2 = `${base}/entreprise?api_token=${encodeURIComponent(apiKey)}&siren=${encodeURIComponent(sirenTarget)}`;
      rawEnt = await fetchJson(u2, timeoutMs);
    }

    if (!isRecord(rawEnt)) {
      return { ...empty, raw_search: rawSearch, raw_entreprise: rawEnt };
    }

    const siren = str(rawEnt.siren ?? sirenTarget ?? "");
    const legalName = str(rawEnt.denomination ?? rawEnt.nom_entreprise ?? rawEnt.nom_commercial);
    const legalForm = str(rawEnt.forme_juridique ?? rawEnt.forme_juridique_code ?? "");
    const addr = pickHeadOfficeAddress(rawEnt);
    const siret = pickSiretSiege(rawEnt) || fromStock.siret14 || "";
    const directors = pickDirectorsFromEntreprise(rawEnt);
    const cap = str(rawEnt.capital);
    const dateCrea = str(rawEnt.date_creation ?? rawEnt.date_creation_entreprise);
    const useful: string[] = [];
    if (cap) useful.push(`Capital : ${cap}`);
    if (dateCrea) useful.push(`Création : ${dateCrea}`);
    if (str(rawEnt.code_naf)) useful.push(`NAF : ${str(rawEnt.code_naf)} ${str(rawEnt.libelle_code_naf)}`.trim());
    appendFinanceAndEffectifLines(rawEnt, useful);

    let matchConfidence: LeadGenerationGptPappersMatch["match_confidence"] = "medium";
    if (!siren || !legalName) {
      matchConfidence = "low";
    }
    if (fromStock.siren && siren && fromStock.siren === siren) {
      matchConfidence = "high";
    }

    const match: LeadGenerationGptPappersMatch = {
      match_confidence: matchConfidence,
      siren,
      siret,
      legal_name: legalName,
      head_office_address: addr,
      legal_form: legalForm,
      directors,
      useful_company_data: useful.filter(Boolean),
    };

    return { match, raw_search: rawSearch, raw_entreprise: rawEnt };
  } catch {
    const low: LeadGenerationGptPappersMatch = {
      ...emptyMatch(),
      match_confidence: "low",
    };
    return { match: low, raw_search: rawSearch, raw_entreprise: rawEnt };
  }
}
