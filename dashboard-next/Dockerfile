FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --no-fund --no-audit

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN apk add --no-cache curl
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
HEALTHCHECK --interval=60s --timeout=20s --start-period=30s --retries=3 \
    CMD curl -fsS http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", "server.js"]
