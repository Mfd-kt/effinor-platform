/**
 * URL de base publique (HTTPS en prod) : pixels de suivi email, liens absolus.
 * Préfère `APP_URL` (runtime Docker / Dokploy), puis `NEXT_PUBLIC_APP_URL`, puis les en-têtes de la requête courante.
 */
export function resolvePublicAppBaseUrl(requestHeaders: {
  get(name: string): string | null;
}): string {
  const fromEnv = (
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    ""
  ).replace(/\/+$/, "");
  if (fromEnv) return fromEnv;

  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const proto =
    forwardedProto ||
    (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");

  return `${proto}://${host}`;
}
