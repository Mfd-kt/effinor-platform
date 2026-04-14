FROM node:20-alpine

WORKDIR /app

# Next.js : NEXT_PUBLIC_* et clé Server Actions doivent exister au build (bundle + actions).
# Dokploy : les passer en build args / env de build.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

COPY . .

RUN npm install

# Monorepo : ne build que l’ERP (pas website / landings).
RUN npm run build -w @effinor/erp

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "run", "start", "-w", "@effinor/erp"]
