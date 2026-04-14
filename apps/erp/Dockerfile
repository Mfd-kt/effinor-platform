# Debian bookworm-slim (glibc) : Playwright/Chromium pour les PDF (présentation + accord).
# Éviter Alpine ici : binaire Chromium / libs système souvent incompatibles ou absents.
FROM node:20-bookworm-slim

WORKDIR /app

# Next.js : variables requises au build (client Supabase + Server Actions).
# Dokploy : build args / env de build.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

ENV DEBIAN_FRONTEND=noninteractive

COPY package.json package-lock.json ./
RUN npm ci

# Même binaire que la dépendance `playwright` du projet + paquets OS (apt).
RUN npx playwright install --with-deps chromium

COPY . .

RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "run", "start"]
