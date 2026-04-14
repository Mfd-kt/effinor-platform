# Contexte : effinor-platform
FROM node:20-alpine AS build
WORKDIR /repo
ENV NODE_ENV=production
COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps
RUN npm install
RUN npm run build -w @effinor/landing-pac

FROM nginx:alpine
COPY --from=build /repo/apps/landing-pac/dist /usr/share/nginx/html
COPY apps/website/nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
