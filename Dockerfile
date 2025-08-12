# Stage 1
FROM node:20-slim AS dependencies
WORKDIR /fragments
ENV NODE_ENV=production NPM_CONFIG_LOGLEVEL=warn NPM_CONFIG_COLOR=false SHARP_IGNORE_GLOBAL_LIBVIPS=1
COPY package*.json ./
RUN npm ci --omit=dev
COPY ./src ./src
COPY ./tests/.htpasswd ./tests/.htpasswd

# Stage 2 (setup)
FROM node:20-slim AS setup
WORKDIR /fragments
COPY --from=dependencies /fragments /fragments

# Stage 3 (run)
FROM node:20-slim AS run
WORKDIR /fragments
COPY --from=setup /fragments /fragments
ENV NODE_ENV=production PORT=3000
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["node","src/index.js"]
