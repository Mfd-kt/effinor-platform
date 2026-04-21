export const DEFAULT_GOOGLE_MAPS_COUNTRY = "France";
export const DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY = DEFAULT_GOOGLE_MAPS_COUNTRY;

export type LeadGenGoogleMapsGeoOption = {
  value: string;
  label: string;
  kind: "department" | "territory";
  departmentCode?: string;
  postalPrefixes?: string[];
  aliases?: string[];
};

function normalizeGeoText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .trim();
}

const DEPARTMENT_OPTIONS: LeadGenGoogleMapsGeoOption[] = [
  { value: "Ain", label: "01 Ain", kind: "department", departmentCode: "01", postalPrefixes: ["01"] },
  { value: "Aisne", label: "02 Aisne", kind: "department", departmentCode: "02", postalPrefixes: ["02"] },
  { value: "Allier", label: "03 Allier", kind: "department", departmentCode: "03", postalPrefixes: ["03"] },
  {
    value: "Alpes-de-Haute-Provence",
    label: "04 Alpes-de-Haute-Provence",
    kind: "department",
    departmentCode: "04",
    postalPrefixes: ["04"],
  },
  { value: "Hautes-Alpes", label: "05 Hautes-Alpes", kind: "department", departmentCode: "05", postalPrefixes: ["05"] },
  {
    value: "Alpes-Maritimes",
    label: "06 Alpes-Maritimes",
    kind: "department",
    departmentCode: "06",
    postalPrefixes: ["06"],
  },
  { value: "Ardeche", label: "07 Ardèche", kind: "department", departmentCode: "07", postalPrefixes: ["07"], aliases: ["ardèche"] },
  { value: "Ardennes", label: "08 Ardennes", kind: "department", departmentCode: "08", postalPrefixes: ["08"] },
  { value: "Ariege", label: "09 Ariège", kind: "department", departmentCode: "09", postalPrefixes: ["09"], aliases: ["ariège"] },
  { value: "Aube", label: "10 Aube", kind: "department", departmentCode: "10", postalPrefixes: ["10"] },
  { value: "Aude", label: "11 Aude", kind: "department", departmentCode: "11", postalPrefixes: ["11"] },
  { value: "Aveyron", label: "12 Aveyron", kind: "department", departmentCode: "12", postalPrefixes: ["12"] },
  {
    value: "Bouches-du-Rhone",
    label: "13 Bouches-du-Rhône",
    kind: "department",
    departmentCode: "13",
    postalPrefixes: ["13"],
    aliases: ["bouches-du-rhône"],
  },
  { value: "Calvados", label: "14 Calvados", kind: "department", departmentCode: "14", postalPrefixes: ["14"] },
  { value: "Cantal", label: "15 Cantal", kind: "department", departmentCode: "15", postalPrefixes: ["15"] },
  { value: "Charente", label: "16 Charente", kind: "department", departmentCode: "16", postalPrefixes: ["16"] },
  {
    value: "Charente-Maritime",
    label: "17 Charente-Maritime",
    kind: "department",
    departmentCode: "17",
    postalPrefixes: ["17"],
  },
  { value: "Cher", label: "18 Cher", kind: "department", departmentCode: "18", postalPrefixes: ["18"] },
  { value: "Correze", label: "19 Corrèze", kind: "department", departmentCode: "19", postalPrefixes: ["19"], aliases: ["corrèze"] },
  { value: "Cote-d'Or", label: "21 Côte-d'Or", kind: "department", departmentCode: "21", postalPrefixes: ["21"], aliases: ["côte-d'or"] },
  {
    value: "Cotes-d'Armor",
    label: "22 Côtes-d'Armor",
    kind: "department",
    departmentCode: "22",
    postalPrefixes: ["22"],
    aliases: ["côtes-d'armor"],
  },
  { value: "Creuse", label: "23 Creuse", kind: "department", departmentCode: "23", postalPrefixes: ["23"] },
  { value: "Dordogne", label: "24 Dordogne", kind: "department", departmentCode: "24", postalPrefixes: ["24"] },
  { value: "Doubs", label: "25 Doubs", kind: "department", departmentCode: "25", postalPrefixes: ["25"] },
  { value: "Drome", label: "26 Drôme", kind: "department", departmentCode: "26", postalPrefixes: ["26"], aliases: ["drôme"] },
  { value: "Eure", label: "27 Eure", kind: "department", departmentCode: "27", postalPrefixes: ["27"] },
  {
    value: "Eure-et-Loir",
    label: "28 Eure-et-Loir",
    kind: "department",
    departmentCode: "28",
    postalPrefixes: ["28"],
  },
  { value: "Finistere", label: "29 Finistère", kind: "department", departmentCode: "29", postalPrefixes: ["29"], aliases: ["finistère"] },
  {
    value: "Corse-du-Sud",
    label: "2A Corse-du-Sud",
    kind: "department",
    departmentCode: "2A",
    postalPrefixes: ["20"],
  },
  {
    value: "Haute-Corse",
    label: "2B Haute-Corse",
    kind: "department",
    departmentCode: "2B",
    postalPrefixes: ["20"],
  },
  { value: "Gard", label: "30 Gard", kind: "department", departmentCode: "30", postalPrefixes: ["30"] },
  {
    value: "Haute-Garonne",
    label: "31 Haute-Garonne",
    kind: "department",
    departmentCode: "31",
    postalPrefixes: ["31"],
  },
  { value: "Gers", label: "32 Gers", kind: "department", departmentCode: "32", postalPrefixes: ["32"] },
  { value: "Gironde", label: "33 Gironde", kind: "department", departmentCode: "33", postalPrefixes: ["33"] },
  { value: "Herault", label: "34 Hérault", kind: "department", departmentCode: "34", postalPrefixes: ["34"], aliases: ["hérault"] },
  {
    value: "Ille-et-Vilaine",
    label: "35 Ille-et-Vilaine",
    kind: "department",
    departmentCode: "35",
    postalPrefixes: ["35"],
  },
  { value: "Indre", label: "36 Indre", kind: "department", departmentCode: "36", postalPrefixes: ["36"] },
  {
    value: "Indre-et-Loire",
    label: "37 Indre-et-Loire",
    kind: "department",
    departmentCode: "37",
    postalPrefixes: ["37"],
  },
  { value: "Isere", label: "38 Isère", kind: "department", departmentCode: "38", postalPrefixes: ["38"], aliases: ["isère"] },
  { value: "Jura", label: "39 Jura", kind: "department", departmentCode: "39", postalPrefixes: ["39"] },
  { value: "Landes", label: "40 Landes", kind: "department", departmentCode: "40", postalPrefixes: ["40"] },
  {
    value: "Loir-et-Cher",
    label: "41 Loir-et-Cher",
    kind: "department",
    departmentCode: "41",
    postalPrefixes: ["41"],
  },
  { value: "Loire", label: "42 Loire", kind: "department", departmentCode: "42", postalPrefixes: ["42"] },
  {
    value: "Haute-Loire",
    label: "43 Haute-Loire",
    kind: "department",
    departmentCode: "43",
    postalPrefixes: ["43"],
  },
  {
    value: "Loire-Atlantique",
    label: "44 Loire-Atlantique",
    kind: "department",
    departmentCode: "44",
    postalPrefixes: ["44"],
  },
  { value: "Loiret", label: "45 Loiret", kind: "department", departmentCode: "45", postalPrefixes: ["45"] },
  { value: "Lot", label: "46 Lot", kind: "department", departmentCode: "46", postalPrefixes: ["46"] },
  {
    value: "Lot-et-Garonne",
    label: "47 Lot-et-Garonne",
    kind: "department",
    departmentCode: "47",
    postalPrefixes: ["47"],
  },
  { value: "Lozere", label: "48 Lozère", kind: "department", departmentCode: "48", postalPrefixes: ["48"], aliases: ["lozère"] },
  {
    value: "Maine-et-Loire",
    label: "49 Maine-et-Loire",
    kind: "department",
    departmentCode: "49",
    postalPrefixes: ["49"],
  },
  { value: "Manche", label: "50 Manche", kind: "department", departmentCode: "50", postalPrefixes: ["50"] },
  { value: "Marne", label: "51 Marne", kind: "department", departmentCode: "51", postalPrefixes: ["51"] },
  {
    value: "Haute-Marne",
    label: "52 Haute-Marne",
    kind: "department",
    departmentCode: "52",
    postalPrefixes: ["52"],
  },
  { value: "Mayenne", label: "53 Mayenne", kind: "department", departmentCode: "53", postalPrefixes: ["53"] },
  {
    value: "Meurthe-et-Moselle",
    label: "54 Meurthe-et-Moselle",
    kind: "department",
    departmentCode: "54",
    postalPrefixes: ["54"],
  },
  { value: "Meuse", label: "55 Meuse", kind: "department", departmentCode: "55", postalPrefixes: ["55"] },
  { value: "Morbihan", label: "56 Morbihan", kind: "department", departmentCode: "56", postalPrefixes: ["56"] },
  { value: "Moselle", label: "57 Moselle", kind: "department", departmentCode: "57", postalPrefixes: ["57"] },
  { value: "Nievre", label: "58 Nièvre", kind: "department", departmentCode: "58", postalPrefixes: ["58"], aliases: ["nièvre"] },
  { value: "Nord", label: "59 Nord", kind: "department", departmentCode: "59", postalPrefixes: ["59"] },
  { value: "Oise", label: "60 Oise", kind: "department", departmentCode: "60", postalPrefixes: ["60"] },
  { value: "Orne", label: "61 Orne", kind: "department", departmentCode: "61", postalPrefixes: ["61"] },
  {
    value: "Pas-de-Calais",
    label: "62 Pas-de-Calais",
    kind: "department",
    departmentCode: "62",
    postalPrefixes: ["62"],
  },
  { value: "Puy-de-Dome", label: "63 Puy-de-Dôme", kind: "department", departmentCode: "63", postalPrefixes: ["63"], aliases: ["puy-de-dôme"] },
  {
    value: "Pyrenees-Atlantiques",
    label: "64 Pyrénées-Atlantiques",
    kind: "department",
    departmentCode: "64",
    postalPrefixes: ["64"],
    aliases: ["pyrénées-atlantiques"],
  },
  {
    value: "Hautes-Pyrenees",
    label: "65 Hautes-Pyrénées",
    kind: "department",
    departmentCode: "65",
    postalPrefixes: ["65"],
    aliases: ["hautes-pyrénées"],
  },
  {
    value: "Pyrenees-Orientales",
    label: "66 Pyrénées-Orientales",
    kind: "department",
    departmentCode: "66",
    postalPrefixes: ["66"],
    aliases: ["pyrénées-orientales"],
  },
  { value: "Bas-Rhin", label: "67 Bas-Rhin", kind: "department", departmentCode: "67", postalPrefixes: ["67"] },
  { value: "Haut-Rhin", label: "68 Haut-Rhin", kind: "department", departmentCode: "68", postalPrefixes: ["68"] },
  { value: "Rhone", label: "69 Rhône", kind: "department", departmentCode: "69", postalPrefixes: ["69"], aliases: ["rhône"] },
  {
    value: "Haute-Saone",
    label: "70 Haute-Saône",
    kind: "department",
    departmentCode: "70",
    postalPrefixes: ["70"],
    aliases: ["haute-saône"],
  },
  {
    value: "Saone-et-Loire",
    label: "71 Saône-et-Loire",
    kind: "department",
    departmentCode: "71",
    postalPrefixes: ["71"],
    aliases: ["saône-et-loire"],
  },
  { value: "Sarthe", label: "72 Sarthe", kind: "department", departmentCode: "72", postalPrefixes: ["72"] },
  { value: "Savoie", label: "73 Savoie", kind: "department", departmentCode: "73", postalPrefixes: ["73"] },
  {
    value: "Haute-Savoie",
    label: "74 Haute-Savoie",
    kind: "department",
    departmentCode: "74",
    postalPrefixes: ["74"],
  },
  { value: "Paris", label: "75 Paris", kind: "department", departmentCode: "75", postalPrefixes: ["75"] },
  {
    value: "Seine-Maritime",
    label: "76 Seine-Maritime",
    kind: "department",
    departmentCode: "76",
    postalPrefixes: ["76"],
  },
  {
    value: "Seine-et-Marne",
    label: "77 Seine-et-Marne",
    kind: "department",
    departmentCode: "77",
    postalPrefixes: ["77"],
  },
  { value: "Yvelines", label: "78 Yvelines", kind: "department", departmentCode: "78", postalPrefixes: ["78"] },
  {
    value: "Deux-Sevres",
    label: "79 Deux-Sèvres",
    kind: "department",
    departmentCode: "79",
    postalPrefixes: ["79"],
    aliases: ["deux-sèvres"],
  },
  { value: "Somme", label: "80 Somme", kind: "department", departmentCode: "80", postalPrefixes: ["80"] },
  { value: "Tarn", label: "81 Tarn", kind: "department", departmentCode: "81", postalPrefixes: ["81"] },
  {
    value: "Tarn-et-Garonne",
    label: "82 Tarn-et-Garonne",
    kind: "department",
    departmentCode: "82",
    postalPrefixes: ["82"],
  },
  { value: "Var", label: "83 Var", kind: "department", departmentCode: "83", postalPrefixes: ["83"] },
  { value: "Vaucluse", label: "84 Vaucluse", kind: "department", departmentCode: "84", postalPrefixes: ["84"] },
  { value: "Vendee", label: "85 Vendée", kind: "department", departmentCode: "85", postalPrefixes: ["85"], aliases: ["vendée"] },
  { value: "Vienne", label: "86 Vienne", kind: "department", departmentCode: "86", postalPrefixes: ["86"] },
  {
    value: "Haute-Vienne",
    label: "87 Haute-Vienne",
    kind: "department",
    departmentCode: "87",
    postalPrefixes: ["87"],
  },
  { value: "Vosges", label: "88 Vosges", kind: "department", departmentCode: "88", postalPrefixes: ["88"] },
  { value: "Yonne", label: "89 Yonne", kind: "department", departmentCode: "89", postalPrefixes: ["89"] },
  {
    value: "Territoire de Belfort",
    label: "90 Territoire de Belfort",
    kind: "department",
    departmentCode: "90",
    postalPrefixes: ["90"],
  },
  { value: "Essonne", label: "91 Essonne", kind: "department", departmentCode: "91", postalPrefixes: ["91"] },
  {
    value: "Hauts-de-Seine",
    label: "92 Hauts-de-Seine",
    kind: "department",
    departmentCode: "92",
    postalPrefixes: ["92"],
  },
  {
    value: "Seine-Saint-Denis",
    label: "93 Seine-Saint-Denis",
    kind: "department",
    departmentCode: "93",
    postalPrefixes: ["93"],
  },
  {
    value: "Val-de-Marne",
    label: "94 Val-de-Marne",
    kind: "department",
    departmentCode: "94",
    postalPrefixes: ["94"],
  },
  {
    value: "Val-d'Oise",
    label: "95 Val-d'Oise",
    kind: "department",
    departmentCode: "95",
    postalPrefixes: ["95"],
  },
  {
    value: "Guadeloupe",
    label: "971 Guadeloupe",
    kind: "department",
    departmentCode: "971",
    postalPrefixes: ["971"],
  },
  {
    value: "Martinique",
    label: "972 Martinique",
    kind: "department",
    departmentCode: "972",
    postalPrefixes: ["972"],
  },
  { value: "Guyane", label: "973 Guyane", kind: "department", departmentCode: "973", postalPrefixes: ["973"] },
  {
    value: "La Reunion",
    label: "974 La Réunion",
    kind: "department",
    departmentCode: "974",
    postalPrefixes: ["974"],
    aliases: ["la réunion", "reunion", "réunion"],
  },
  { value: "Mayotte", label: "976 Mayotte", kind: "department", departmentCode: "976", postalPrefixes: ["976"] },
];

const TERRITORY_OPTIONS: LeadGenGoogleMapsGeoOption[] = [
  { value: "Saint-Barthelemy", label: "Saint-Barthélemy", kind: "territory", aliases: ["saint-barthélemy"] },
  { value: "Saint-Martin", label: "Saint-Martin", kind: "territory" },
  {
    value: "Saint-Pierre-et-Miquelon",
    label: "Saint-Pierre-et-Miquelon",
    kind: "territory",
  },
  { value: "Wallis-et-Futuna", label: "Wallis-et-Futuna", kind: "territory" },
  {
    value: "Polynesie francaise",
    label: "Polynésie française",
    kind: "territory",
    aliases: ["polynésie française"],
  },
  {
    value: "Nouvelle-Caledonie",
    label: "Nouvelle-Calédonie",
    kind: "territory",
    aliases: ["nouvelle-calédonie"],
  },
  {
    value: "Terres australes et antarctiques francaises",
    label: "Terres australes et antarctiques françaises",
    kind: "territory",
    aliases: ["terres australes et antarctiques françaises"],
  },
];

export const LEAD_GEN_GOOGLE_MAPS_DEPARTMENT_OPTIONS = DEPARTMENT_OPTIONS;
export const LEAD_GEN_GOOGLE_MAPS_OVERSEAS_TERRITORY_OPTIONS = TERRITORY_OPTIONS;
export const LEAD_GEN_GOOGLE_MAPS_GEO_OPTIONS: LeadGenGoogleMapsGeoOption[] = [
  ...DEPARTMENT_OPTIONS,
  ...TERRITORY_OPTIONS,
];

/** Compat: ancien nom conservé. */
export const LEAD_GEN_GOOGLE_MAPS_REGION_OPTIONS = LEAD_GEN_GOOGLE_MAPS_GEO_OPTIONS;

const OPTION_BY_VALUE = new Map(LEAD_GEN_GOOGLE_MAPS_GEO_OPTIONS.map((o) => [o.value, o]));
const GEO_VALUE_SET = new Set<string>([
  DEFAULT_APIFY_GOOGLE_MAPS_LOCATION_QUERY,
  ...LEAD_GEN_GOOGLE_MAPS_GEO_OPTIONS.map((o) => o.value),
]);

export function getLeadGenGoogleMapsGeoOption(value?: string | null): LeadGenGoogleMapsGeoOption | null {
  if (!value) return null;
  return OPTION_BY_VALUE.get(value.trim()) ?? null;
}

export function isLeadGenGoogleMapsGeoValue(value: string): boolean {
  return GEO_VALUE_SET.has(value.trim());
}

/** Compat: ancien helper conservé. */
export function isLeadGenGoogleMapsRegionValue(value: string): boolean {
  return isLeadGenGoogleMapsGeoValue(value);
}

function containsNormalized(haystack: string, needle: string): boolean {
  const h = normalizeGeoText(haystack);
  const n = normalizeGeoText(needle);
  return h.length > 0 && n.length > 0 && h.includes(n);
}

export function injectGeoTargetInSearchStrings(searchStrings: string[], geoTarget?: string | null): string[] {
  const target = geoTarget?.trim();
  if (!target || target === DEFAULT_GOOGLE_MAPS_COUNTRY) {
    return searchStrings.map((s) => s.trim()).filter((s) => s.length > 0);
  }
  return searchStrings
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((line) => (containsNormalized(line, target) ? line : `${line} ${target}`));
}

function compactPostalCode(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, "").trim();
}

export function isApifyItemInGeoTarget(item: Record<string, unknown>, geoTarget: string): boolean {
  const option = getLeadGenGoogleMapsGeoOption(geoTarget);
  if (!option) {
    // France par défaut: on ne rejette rien.
    return true;
  }

  const textFields: string[] = [];
  for (const key of ["address", "fullAddress", "city", "cityName", "locality", "state", "region", "county"]) {
    const v = item[key];
    if (typeof v === "string" && v.trim()) textFields.push(v);
  }
  const fullText = textFields.join(" | ");
  const aliases = [option.value, option.label, ...(option.aliases ?? [])];
  const hasAliasMatch = aliases.some((alias) => containsNormalized(fullText, alias));
  if (hasAliasMatch) return true;

  const postalCode = compactPostalCode(item.postalCode ?? item.zipCode ?? item.postcode);
  if (!postalCode) return false;

  return (option.postalPrefixes ?? []).some((prefix) => postalCode.startsWith(prefix));
}
