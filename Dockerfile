# Stage 1: Build dependencies
FROM node:20.10.0 AS builder

LABEL maintainer="Furqan Khurrum <furqan.khurrum99@gmail.com>"
LABEL description="Fragments node.js microservice"

WORKDIR /app

# Reduce npm spam and disable color
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Copy only dependency files and install
COPY package*.json ./
RUN npm ci --omit=dev && \
    npm install -g dotenv-cli@8.0.0

# Copy application source
COPY ./src ./src
COPY ./tests/.htpasswd ./tests/.htpasswd
COPY env.production ./env.production

# Stage 2: Runtime container
FROM node:20.10.0-slim

ENV PORT=3000
WORKDIR /app

# Install dotenv-cli in the runtime container with pinned version
RUN npm install -g dotenv-cli@8.0.0

# Copy only the built artifacts from builder
COPY --from=builder /app /app

EXPOSE 3000
CMD ["npm", "start"]
