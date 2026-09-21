FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci
COPY index.html vite.config.mjs LICENSE THIRD_PARTY_NOTICES.md ./
COPY scripts/build-notices.mjs ./scripts/build-notices.mjs
COPY src ./src
COPY assets/icon.png ./assets/icon.png
RUN npm run build:web
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build --chown=node:node /app/dist-web ./dist-web
COPY --chown=node:node web/server.mjs ./web/server.mjs
USER node
EXPOSE 8080
CMD ["node","web/server.mjs"]
