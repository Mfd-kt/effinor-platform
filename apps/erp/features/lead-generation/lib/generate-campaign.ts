/** Limite alignée sur l’import Apify (lots cockpit). */
export const MAX_GENERATE_QUERIES = 20;

/**
 * Métiers / secteurs proposés pour cadrer la génération (évite les lancements « tout venant »).
 * La dernière option invite à passer par les requêtes personnalisées.
 */
export const LEAD_GENERATION_SECTOR_OPTIONS = [
  // Finance, assurance, patrimoine
  "Courtier en prêt immobilier",
  "Conseiller en gestion de patrimoine",
  "Agent général d’assurances",
  "Courtier en assurance (pro / entreprise)",
  "Notaire / office notarial",
  "Banque — conseiller entreprises / PME",
  // Comptabilité, audit, juridique
  "Expert-comptable",
  "Commissaire aux comptes / audit",
  "Avocat (cabinet)",
  "Juriste / conseil juridique entreprise",
  "Huissier de justice",
  // Immobilier professionnel
  "Agence immobilière — transaction",
  "Promoteur immobilier",
  "Syndic de copropriété",
  "Gestion locative / administrateur de biens",
  "Diagnostiqueur immobilier",
  // BTP, second œuvre, paysage
  "Architecte / bureau d’études",
  "Bureau d’études techniques (structure, fluides)",
  "Entreprise BTP / rénovation",
  "Maçonnerie / gros œuvre",
  "Charpente / ossature bois",
  "Couvreur / zingueur",
  "Menuisier / agencement intérieur",
  "Électricien / installation électrique",
  "Peintre / façadier",
  "Paysagiste / aménagement espaces verts",
  "Terrassement / VRD",
  // Énergie, fluides
  "Installateur panneaux solaires / photovoltaïque",
  "Installateur pompe à chaleur / thermodynamique",
  "Isolation thermique par l’extérieur (ITE)",
  "Chauffage / plomberie / climatisation",
  "Bornes de recharge — installation électrique",
  // Restauration, hôtellerie, commerce alimentaire
  "Restaurant / restauration collective",
  "Traiteur / restauration événementielle",
  "Boulangerie — artisan / point de vente",
  "Hôtel / hébergement",
  "Camping / hébergement touristique",
  // Automobile, mobilité
  "Concession automobile / garage",
  "Carrossier / réparation automobile",
  "Location véhicules utilitaires / LLD pro",
  // Tech, marketing, conseil
  "SaaS / éditeur logiciel",
  "ESN / SSII / intégrateur informatique",
  "Cybersécurité / prestataire MSSP",
  "Agence marketing / communication",
  "Agence web / studio digital",
  "Conseil data / analytique",
  "Cabinet conseil / stratégie entreprise",
  // Santé, bien-être, social
  "Cabinet médical / médecin libéral",
  "Chirurgien-dentiste / cabinet dentaire",
  "Pharmacie d’officine",
  "Laboratoire d’analyses médicales",
  "Kinésithérapeute / cabinet paramédical",
  "Vétérinaire / clinique vétérinaire",
  "EHPAD / résidence seniors",
  "Opticien / audioprothésiste",
  // Commerce, distribution, industrie
  "Commerce de gros / grossiste",
  "Grande distribution / commerce indépendant",
  "Industrie manufacturière / sous-traitance",
  "Métallurgie / chaudronnerie",
  "Plasturgie / injection",
  "Agroalimentaire / transformation",
  // Services aux entreprises
  "Nettoyage / propreté entreprise",
  "Sécurité privée / gardiennage",
  "Facility management / maintenance multi-technique",
  "Recrutement / cabinet RH",
  "Travail temporaire / intérim",
  "Organisme de formation professionnelle",
  "Transport routier / messagerie",
  "Logistique / entreposage",
  // Agriculture, événementiel, autres B2B
  "Viticulture / exploitation viticole",
  "Élevage / production agricole",
  "Pépinière / horticulture production",
  "Événementiel / agence événementielle",
  "Imprimerie / signalétique / packaging",
  "Autre — préciser dans les requêtes personnalisées",
] as const;

export type LeadGenerationSectorValue = (typeof LEAD_GENERATION_SECTOR_OPTIONS)[number];

/**
 * Régions françaises (découpage administratif : métropole + DOM) pour cadrer les requêtes Maps.
 * « France métropolitaine » = cible élargie sur l’ensemble du territoire métropolitain.
 */
export const LEAD_GENERATION_ZONE_OPTIONS = [
  "France métropolitaine",
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Guadeloupe",
  "Guyane",
  "Hauts-de-France",
  "Île-de-France",
  "La Réunion",
  "Martinique",
  "Mayotte",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d’Azur",
] as const;

export type LeadGenerationZonePreset = (typeof LEAD_GENERATION_ZONE_OPTIONS)[number];

export function getDefaultGenerateCampaignConfig(): {
  campaignName: string;
  sector: LeadGenerationSectorValue;
  zone: string;
  maxCrawledPlacesPerSearch: number;
  maxTotalPlaces: number;
  customQueriesText: string;
  includeWebResults: boolean;
  ceeSheetId: string;
  targetTeamId: string;
} {
  return {
    campaignName: "",
    sector: LEAD_GENERATION_SECTOR_OPTIONS[0],
    zone: LEAD_GENERATION_ZONE_OPTIONS[0],
    maxCrawledPlacesPerSearch: 50,
    maxTotalPlaces: 500,
    customQueriesText: "",
    includeWebResults: false,
    ceeSheetId: "",
    targetTeamId: "",
  };
}

/** Secteur « Autre » : pas de requêtes auto, il faut des lignes personnalisées. */
export function sectorNeedsCustomQueries(sector: string): boolean {
  return sector.includes("Autre");
}

export function parseCustomQueries(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, MAX_GENERATE_QUERIES);
}

export function buildAutoQueriesFromSectorAndZone(sector: string, zone: string): string[] {
  const s = sector.trim();
  const z = zone.trim();
  if (sectorNeedsCustomQueries(s)) return [];
  if (!s || !z) return [];
  const base = [`${s} ${z}`, `${s} professionnel ${z}`, `${s} entreprise ${z}`];
  return base.slice(0, MAX_GENERATE_QUERIES);
}

export function resolveRawSearchStrings(params: {
  sector: string;
  zone: string;
  customQueriesText: string;
}): string[] {
  const custom = parseCustomQueries(params.customQueriesText);
  if (custom.length > 0) return custom;
  return buildAutoQueriesFromSectorAndZone(params.sector, params.zone);
}

/** Nombre max de requêtes compatibles avec le plafond total (approximation côté actor). */
export function maxQueriesForTotalCap(maxTotalPlaces: number, maxPerSearch: number): number {
  const per = Math.max(1, maxPerSearch);
  const total = Math.max(1, maxTotalPlaces);
  return Math.min(MAX_GENERATE_QUERIES, Math.max(1, Math.floor(total / per)));
}

/**
 * Applique le plafond « max total » en limitant le nombre de requêtes et, si besoin, le max par recherche.
 */
export function applyTotalCapToQueries(
  queries: string[],
  maxTotalPlaces: number,
  maxCrawledPlacesPerSearch: number,
): { searchStrings: string[]; effectiveMaxPerSearch: number } {
  if (queries.length === 0) {
    return { searchStrings: [], effectiveMaxPerSearch: Math.max(1, maxCrawledPlacesPerSearch) };
  }
  const per = Math.max(1, Math.min(maxCrawledPlacesPerSearch, 500));
  const total = Math.max(1, maxTotalPlaces);

  if (total < per) {
    return {
      searchStrings: [queries[0]!],
      effectiveMaxPerSearch: Math.max(1, total),
    };
  }

  const n = maxQueriesForTotalCap(total, per);
  return {
    searchStrings: queries.slice(0, n),
    effectiveMaxPerSearch: per,
  };
}

export function estimateCampaignVolume(
  queryCount: number,
  maxPerSearch: number,
  maxTotalPlaces: number,
): number {
  if (queryCount === 0) return 0;
  return Math.min(queryCount * maxPerSearch, maxTotalPlaces);
}

export type GenerateCampaignPlan = {
  rawQueries: string[];
  searchStrings: string[];
  effectiveMaxPerSearch: number;
  estimatedVolume: number;
};

export function buildGenerateCampaignPlan(input: {
  sector: string;
  zone: string;
  customQueriesText: string;
  maxCrawledPlacesPerSearch: number;
  maxTotalPlaces: number;
}): GenerateCampaignPlan {
  const rawQueries = resolveRawSearchStrings({
    sector: input.sector,
    zone: input.zone,
    customQueriesText: input.customQueriesText,
  });
  const { searchStrings, effectiveMaxPerSearch } = applyTotalCapToQueries(
    rawQueries,
    input.maxTotalPlaces,
    input.maxCrawledPlacesPerSearch,
  );
  const estimatedVolume = estimateCampaignVolume(
    searchStrings.length,
    effectiveMaxPerSearch,
    input.maxTotalPlaces,
  );
  return { rawQueries, searchStrings, effectiveMaxPerSearch, estimatedVolume };
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slugQuerySegmentFromText(text: string, zone: string): string {
  let s = text.trim();
  if (!s) return "";
  const z = stripAccents(zone.trim().toLowerCase());
  if (z.length >= 2) {
    const esc = z.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${esc}\\b`, "gi");
    s = s.replace(re, " ").replace(/\s+/g, " ").trim();
  }
  const words = s
    .split(/\s+/)
    .filter((w) => w.replace(/[^a-z0-9À-ÿ]/gi, "").length > 0)
    .slice(0, 5);
  const chunk = words.join(" ");
  const slug = stripAccents(chunk.toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug.slice(0, 55);
}

function fallbackSectorSlug(sector: string): string {
  const main = sector.split("/")[0]!.trim();
  const slug = slugQuerySegmentFromText(main, "");
  return slug || "campagne";
}

/**
 * Propositions « nom de campagne » et « nom de preset » à partir de la 1ʳᵉ requête Maps retenue + la zone
 * (ex. `fabrication-grand est`). Respecte la limite 120 car. du schéma campagne.
 */
export function buildAutoCampaignLabels(input: {
  zone: string;
  searchStrings: string[];
  sector: string;
}): { campaignName: string; presetName: string } {
  const zoneRaw = input.zone.trim();
  const regionPart =
    stripAccents(zoneRaw.toLowerCase())
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "zone";

  let queryPart: string;
  if (input.searchStrings.length > 0 && input.searchStrings[0]!.trim()) {
    queryPart = slugQuerySegmentFromText(input.searchStrings[0]!, zoneRaw);
  } else {
    queryPart = "";
  }
  if (!queryPart) {
    queryPart = fallbackSectorSlug(input.sector);
  }

  const base = `${queryPart}-${regionPart}`.replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
  const campaignName = base.slice(0, 120).trim();
  return { campaignName, presetName: campaignName };
}
