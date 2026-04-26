# ============================================================
# Dockerfile — apps/landing-pac (pompe-a-chaleur.effinor.fr)
# Strategy : Next.js 16 standalone multi-stage
# Base : node:20-alpine
# ============================================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ────────────────────────────────────────────────────────────
# Stage 1 : DEPS — installation des dépendances
# ────────────────────────────────────────────────────────────
FROM base AS deps

COPY package.json package-lock.json ./
COPY packages/design-system/package.json ./packages/design-system/package.json
COPY packages/lib/package.json ./packages/lib/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/landing-pac/package.json ./apps/landing-pac/package.json

RUN npm ci --ignore-scripts

# ────────────────────────────────────────────────────────────
# Stage 2 : BUILDER — compilation Next.js standalone
# ────────────────────────────────────────────────────────────
FROM base AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

COPY packages/ ./packages/
COPY apps/landing-pac/ ./apps/landing-pac/
COPY package.json package-lock.json ./

# Variables d'environnement de build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL=https://pompe-a-chaleur.effinor.fr

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

WORKDIR /app/apps/landing-pac
RUN npm run build

# ────────────────────────────────────────────────────────────
# Stage 3 : RUNNER — image de production minimale
# ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3003
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Fichiers Next.js standalone
# En monorepo avec outputFileTracingRoot, server.js est à apps/landing-pac/server.js
# et Next.js cherche public/ RELATIF au server.js → apps/landing-pac/public.
COPY --from=builder --chown=nextjs:nodejs /app/apps/landing-pac/public ./apps/landing-pac/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/landing-pac/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/landing-pac/.next/static ./apps/landing-pac/.next/static

USER nextjs

EXPOSE 3003

CMD ["node", "apps/landing-pac/server.js"]
