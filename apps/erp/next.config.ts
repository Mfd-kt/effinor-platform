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

/** Charge `effinor-platform/.env*` avant tout le reste (sinon NEXT_PUBLIC_* peut rester vide côté client malgré `envDir`). */
loadEnvConfig(monorepoRoot, process.env.NODE_ENV !== "production", undefined, true);

/** `envDir` est pris en charge par Next.js en runtime ; les types stables peuvent le manquer. */
const nextConfig: NextConfig & { envDir: string } = {
  /** Un seul `.env.local` à la racine `effinor-platform/` pour toutes les apps. */
  envDir: monorepoRoot,
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
