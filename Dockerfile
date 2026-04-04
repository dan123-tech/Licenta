# Company Car Sharing – Next.js app
FROM node:20-alpine AS base

# Install dependencies and build
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/proxy-3001.js ./proxy-3001.js
EXPOSE 3000
# Cloud hosts (Render, Fly, etc.) set PORT; next start reads PORT when -p is omitted (see package.json start:docker).
# Local docker-compose overrides CMD to use npm run start (Next + LAN proxy on 3000/3001).
ENV HOSTNAME="0.0.0.0"
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:docker"]
