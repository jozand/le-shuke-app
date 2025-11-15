###############################################
# BASE IMAGE
###############################################
FROM node:20-alpine AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Alpine dependencies required for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

ENV PORT=4000

# Prisma requires DATABASE_URL at build time
ENV DATABASE_URL="mysql://le_shuke_user:le_shuke_password@db:3306/le_shuke_db"


###############################################
# DEPENDENCIAS (cache más eficiente)
###############################################
FROM base AS deps

COPY package.json package-lock.json* ./
RUN npm ci

# 👇 MUY IMPORTANTE: copiar prisma para generar cliente y mantener migraciones
COPY prisma ./prisma


###############################################
# BUILDER (genera prisma + build next.js)
###############################################
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 👇 Generar Prisma Client MUSL
RUN npx prisma generate

# 👇 Construir Next.js
RUN npm run build


###############################################
# RUNTIME FINAL (producción)
###############################################
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4000

RUN apk add --no-cache openssl libc6-compat

# Crear usuario no root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# 👇 Copiar prisma y artefactos necesarios desde el builder
COPY --from=builder /app/prisma ./prisma
# COPY --from=builder /app/prisma.config.ts ./prisma.config.ts  # si lo usas

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/app/generated/prisma ./app/generated/prisma
COPY --from=builder /app/package.json ./package.json

# 👇 DAR PERMISOS a nextjs sobre /app (incluyendo .next/cache/images)
RUN mkdir -p .next/cache/images && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 4000

# 👇 Comando de inicio
CMD ["npm", "run", "start"]
