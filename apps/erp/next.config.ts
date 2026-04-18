import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

import type { NextConfig } from "next";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
/** En Docker (contexte `apps/erp` seul), la racine monorepo n’existe pas : on reste sur `appRoot`. */
const monorepoRootCandidate = path.resolve(appRoot, "..", "..");
const monorepoRoot = fs.existsSync(path.join(monorepoRootCandidate, "package.json"))
  ? monorepoRootCandidate
  : appRoot;

/**
 * Ordre important : d’abord `apps/erp/.env*`, puis la racine du monorepo.
 * Le second chargement **écrase** le premier pour les clés en double : ainsi le fichier
 * principal `effinor-platform/.env.local` reste la source de vérité (Supabase, etc.)
 * et n’est pas écrasé par un `apps/erp/.env.local` partiel ou vide.
 */
if (monorepoRoot !== appRoot) {
  loadEnvConfig(appRoot, process.env.NODE_ENV !== "production", undefined, true);
}
loadEnvConfig(monorepoRoot, process.env.NODE_ENV !== "production", undefined, true);

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },
  experimental: {
    /** Uploads médias lead (Server Actions) jusqu’à 50 Mo par fichier. */
    serverActions: {
      bodySizeLimit: "55mb",
    },
  },
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
