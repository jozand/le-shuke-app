###############################################
# BASE IMAGE
###############################################
FROM node:20-alpine AS base

# Carpeta de trabajo
WORKDIR /app

# Desactivar telemetría Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Necesario para Prisma en Alpine
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Puerto interno
ENV PORT=4000

# Prisma necesita un DATABASE_URL durante el build
# No importa si no existe la BD aún, solo valida el formato.
ENV DATABASE_URL="mysql://le_shuke_user:le_shuke_password@db:3306/le_shuke_db"


###############################################
# DEPENDENCIAS (mejor cache)
###############################################
FROM base AS deps

COPY package.json package-lock.json* ./

RUN npm ci

COPY prisma ./prisma


###############################################
# BUILDER (genera prisma + build next.js)
###############################################
FROM base AS builder

# Copiar node_modules desde deps
COPY --from=deps /app/node_modules ./node_modules

# Copiar el resto del proyecto
COPY . .

# 🔥 Generar Prisma Client para Linux MUSL (Alpine)
# Esto crea los engines correctos:
# libquery_engine-linux-musl-openssl-3.0.x.so.node
RUN npx prisma generate

# 🔥 Construir Next.js en modo producción
RUN npm run build


###############################################
# RUNTIME FINAL
###############################################
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4000

# Prisma necesita openssl en runtime
RUN apk add --no-cache openssl libc6-compat

# Usuario sin privilegios
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

USER nextjs

# Copiar solo lo necesario desde el builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/app/generated/prisma ./app/generated/prisma

# Expone Next.js
EXPOSE 4000

# Iniciar Next.js
CMD ["npm", "run", "start"]
