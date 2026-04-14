# Debian bookworm-slim : Playwright/Chromium (PDF) + Next.js `output: "standalone"`.
#
# Dokploy : préférer Dockerfile.erp à la racine du dépôt
#    (sinon l’UI peut limiter le contexte à apps/erp → « package-lock.json not found »).
#
# Build manuel depuis la racine : docker build -f apps/erp/Dockerfile .
#
# Build context Dokploy : racine du monorepo `effinor-platform` (pas `apps/erp` seul).
#
# Monorepo : la sortie standalone est sous `.next/standalone/apps/erp/` (pas `server.js` à la racine).
# Ne pas utiliser `next start` ni `npm run start` si la commande Dokploy pointe encore vers Next classique :
# la CMD ci-dessous est la source de vérité pour le runtime.
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

# Même besoin que Dockerfile.erp : tâches planifiées `docker exec … curl …`.
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY --from=builder /ms-playwright /ms-playwright

# Bundle tracé (node_modules à la racine du standalone + app sous apps/erp/).
COPY --from=builder /app/apps/erp/.next/standalone ./.next/standalone
# Fichiers statiques : attendus sous apps/erp/.next/static par le serveur après chdir.
COPY --from=builder /app/apps/erp/.next/static ./.next/standalone/apps/erp/.next/static
COPY --from=builder /app/apps/erp/public ./.next/standalone/apps/erp/public

# Le bundle standalone ne trace pas `playwright` ; le CLI nécessite aussi `playwright-core` (hoisté).
COPY --from=builder /app/node_modules/playwright /tmp/pw-install-deps/node_modules/playwright
COPY --from=builder /app/node_modules/playwright-core /tmp/pw-install-deps/node_modules/playwright-core
RUN node /tmp/pw-install-deps/node_modules/playwright/cli.js install-deps chromium \
  && rm -rf /tmp/pw-install-deps

EXPOSE 3000

CMD ["node", ".next/standalone/apps/erp/server.js"]
