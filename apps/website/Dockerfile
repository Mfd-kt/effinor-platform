FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build -w @effinor/lib
RUN npm run build -w @effinor/ui
RUN npm run build -w @effinor/website

EXPOSE 3000

CMD ["npm", "run", "preview", "-w", "@effinor/website"]
