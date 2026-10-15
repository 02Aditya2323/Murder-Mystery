# Multi-stage Dockerfile for Murder Mystery Platform
FROM node:22-alpine AS builder

WORKDIR /app


# better-sqlite3 / node-gyp requirements
RUN apk add --no-cache python3 make g++

# Copy root and workspace package files
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/

RUN npm ci

# Copy full source and content
COPY . .

# Generate assets, database, hashed answers, and compile projects
RUN node scripts/gen-placeholders.mjs && \
    node scripts/gen-logs.mjs && \
    node scripts/build-sql-level.mjs && \
    node scripts/hash-answers.mjs && \
    node scripts/verify-content.mjs && \
    npm run build -w apps/server && \
    npm run build -w apps/web

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000


RUN apk add --no-cache python3 make g++


COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/

RUN npm ci --omit=dev

# Copy built artifacts and content
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/data ./apps/server/data
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/content ./content
COPY --from=builder /app/MISSING_ASSETS.md ./MISSING_ASSETS.md

EXPOSE 3000

CMD ["node", "apps/server/dist/index.js"]
