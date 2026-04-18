import { resolveYellowPagesApifyInputProfile } from "./client";

function normalizeGeoHint(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * Heuristique : zone de campagne manifestement FR / territoires français — incompatible avec les actors
 * type yellowpages.com (US).
 */
export function resolvedLocationLooksLikeFranceOrFrTerritory(resolvedLocation: string): boolean {
  const q = normalizeGeoHint(resolvedLocation);
  if (!q) return false;

  const frSubstrings = [
    "france",
    "francais",
    "francaise",
    "metropolitaine",
    "grand est",
    "ile-de-france",
    "bourgogne",
    "normandie",
    "bretagne",
    "occitanie",
    "nouvelle-aquitaine",
    "hauts-de-france",
    "auvergne",
    "rhone-alpes",
    "centre-val",
    "pays de la loire",
    "corse",
    "guadeloupe",
    "martinique",
    "reunion",
    "mayotte",
    "cote d'azur",
    "provence-alpes",
  ];

  for (const h of frSubstrings) {
    if (q.includes(normalizeGeoHint(h))) return true;
  }
  return false;
}

/**
 * Si l’actor PJ est le profil US (yellowpages.com) alors que la zone ressemble à la France, le run Apify
 * échouera systématiquement (0 résultat). On bloque avant lancement pour éviter un échec peu lisible.
 */
export function yellowPagesUsActorFranceMismatchMessage(
  actorId: string,
  resolvedLocation: string,
): string | null {
  if (resolveYellowPagesApifyInputProfile(actorId) !== "trudax_us") return null;
  if (!resolvedLocationLooksLikeFranceOrFrTerritory(resolvedLocation)) return null;

  return (
    "Pages Jaunes : l’actor configuré cible yellowpages.com (États-Unis), pas l’annuaire français. " +
    "Pour une zone comme « " +
    resolvedLocation.trim() +
    " », définissez `APIFY_YELLOW_PAGES_ACTOR_ID` avec un actor Pages Jaunes / annuaire **France** (ex. pagesjaunes.fr), " +
    "ou utilisez un actor US uniquement avec des lieux et requêtes compatibles yellowpages.com."
  );
}
