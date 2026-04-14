# Debian bookworm-slim : Playwright/Chromium (PDF) + Next.js `output: "standalone"`.
# Build context Dokploy : racine du monorepo `effinor-platform` (pas `apps/erp` seul).
# Standalone : ne pas utiliser `next start` — CMD ci-dessous.
FROM node:20-bookworm-slim AS builder

WORKDIR /app

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

ENV DEBIAN_FRONTEND=noninteractive
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# `npm ci` monorepo : package-lock.json à la racine + chaque workspace référencé dans ce lockfile.
COPY package.json package-lock.json ./
COPY apps/erp/package.json apps/erp/
COPY apps/website/package.json apps/website/
COPY apps/landing-pac/package.json apps/landing-pac/
COPY apps/landing-destratification/package.json apps/landing-destratification/
COPY packages/ui/package.json packages/ui/
COPY packages/lib/package.json packages/lib/

RUN npm ci

RUN npx playwright install --with-deps chromium

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @effinor/erp

# ── Runtime ─────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY --from=builder /ms-playwright /ms-playwright

COPY --from=builder /app/apps/erp/.next/standalone ./.next/standalone
COPY --from=builder /app/apps/erp/.next/static ./.next/standalone/.next/static
COPY --from=builder /app/apps/erp/public ./.next/standalone/public

RUN node ./.next/standalone/node_modules/playwright/cli.js install-deps chromium

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]
