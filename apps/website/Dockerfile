# ============================================================
# Dockerfile — apps/website (effinor.fr)
# Strategy : Next.js 16 standalone multi-stage
# Base : node:20-alpine (légère, compatible standalone)
# ============================================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ────────────────────────────────────────────────────────────
# Stage 1 : DEPS — installation des dépendances
# ────────────────────────────────────────────────────────────
FROM base AS deps

# Copie les fichiers de dépendances du monorepo
COPY package.json package-lock.json ./
COPY packages/design-system/package.json ./packages/design-system/package.json
COPY packages/lib/package.json ./packages/lib/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/website/package.json ./apps/website/package.json

# Installation CI (lockfile strict, pas de scripts)
RUN npm ci --ignore-scripts

# ────────────────────────────────────────────────────────────
# Stage 2 : BUILDER — compilation Next.js standalone
# ────────────────────────────────────────────────────────────
FROM base AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Copie des sources
COPY packages/ ./packages/
COPY apps/website/ ./apps/website/
COPY package.json package-lock.json ./

# Variables d'environnement de build
# (NEXT_PUBLIC_* doivent être présentes au build)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL=https://effinor.fr

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js
WORKDIR /app/apps/website
RUN npm run build

# ────────────────────────────────────────────────────────────
# Stage 3 : RUNNER — image de production minimale
# ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Fichiers Next.js standalone
# Note: en monorepo avec outputFileTracingRoot, server.js est à apps/website/server.js
# et Next.js cherche public/ RELATIF au server.js → donc apps/website/public (pas ./public).
COPY --from=builder --chown=nextjs:nodejs /app/apps/website/public ./apps/website/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/website/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/website/.next/static ./apps/website/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/website/server.js"]
