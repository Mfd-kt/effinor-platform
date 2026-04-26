# ============================================================
# Dockerfile — apps/landing-reno-global (renovation.effinor.fr)
# Strategy : Next.js 16 standalone multi-stage
# Base : node:20-alpine
# ============================================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ────────────────────────────────────────────────────────────
# Stage 1 : DEPS
# ────────────────────────────────────────────────────────────
FROM base AS deps

COPY package.json package-lock.json ./
COPY packages/design-system/package.json ./packages/design-system/package.json
COPY packages/lib/package.json ./packages/lib/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/landing-reno-global/package.json ./apps/landing-reno-global/package.json

RUN npm ci --ignore-scripts

# ────────────────────────────────────────────────────────────
# Stage 2 : BUILDER
# ────────────────────────────────────────────────────────────
FROM base AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

COPY packages/ ./packages/
COPY apps/landing-reno-global/ ./apps/landing-reno-global/
COPY package.json package-lock.json ./

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL=https://renovation.effinor.fr

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

WORKDIR /app/apps/landing-reno-global
RUN npm run build

# ────────────────────────────────────────────────────────────
# Stage 3 : RUNNER
# ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/landing-reno-global/public ./apps/landing-reno-global/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/landing-reno-global/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/landing-reno-global/.next/static ./apps/landing-reno-global/.next/static

USER nextjs

EXPOSE 3002

CMD ["node", "apps/landing-reno-global/server.js"]
