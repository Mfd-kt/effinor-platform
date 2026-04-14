# Debian bookworm-slim : Playwright/Chromium (PDF) + build Next.js `output: "standalone"`.
# Standalone : ne pas utiliser `next start` ni `npm run start` — exécuter `server.js` du bundle tracé.
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
RUN npm ci

RUN npx playwright install --with-deps chromium

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Runtime : bundle minimal Next + mêmes browsers Playwright ───────────────
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY --from=builder /ms-playwright /ms-playwright

# Structure explicite : le serveur résout `.next/static` et `public` depuis ce répertoire.
COPY --from=builder /app/.next/standalone ./.next/standalone
COPY --from=builder /app/.next/static ./.next/standalone/.next/static
COPY --from=builder /app/public ./.next/standalone/public

RUN node ./.next/standalone/node_modules/playwright/cli.js install-deps chromium

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]
