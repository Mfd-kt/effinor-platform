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

/** Charge `effinor-platform/.env*` en amont du build (évite NEXT_PUBLIC_* vides en local / Docker builder). */
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
