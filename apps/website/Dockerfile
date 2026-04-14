FROM node:20-alpine

WORKDIR /app

# Copie tout le monorepo
COPY . .

# Installe toutes les dépendances (workspaces inclus)
RUN npm install

# Build complet (workspaces + apps)
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview", "-w", "@effinor/website"]
