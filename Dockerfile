# ============================
# Etapa base
# ============================
FROM node:20-alpine AS base

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Desactivar telemetría de Next
ENV NEXT_TELEMETRY_DISABLED=1

# Dependencia útil para Prisma en Alpine
RUN apk add --no-cache openssl

# Puerto en el que correrá Next.js dentro del contenedor
ENV PORT=4000

# Necesario para que Prisma pueda generar el cliente.
# En build solo valida formato, no se conecta realmente.
ENV DATABASE_URL="mysql://le_shuke_user:le_shuke_password@db:3306/le_shuke_db"

# ============================
# Etapa de dependencias
# ============================
FROM base AS deps

# Copiamos solo los archivos de dependencias primero para aprovechar caché
COPY package.json package-lock.json* ./

# Instalamos dependencias en modo limpio
RUN npm ci

# Copiamos carpeta de Prisma por si necesitas generar cliente en build
COPY prisma ./prisma

# ============================
# Etapa de build
# ============================
FROM base AS builder

# Copiamos node_modules desde la etapa de deps
COPY --from=deps /app/node_modules ./node_modules

# Copiamos TODO el código fuente
COPY . .

# Generar cliente de Prisma (usa DATABASE_URL de la etapa base)
RUN npx prisma generate

# Construir la app de Next en modo producción
RUN npm run build

# ============================
# Etapa de runtime
# ============================
FROM base AS runner

ENV NODE_ENV=production

# Crear usuario no root para ejecutar la app
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Exponer el puerto interno 4000
EXPOSE 4000

# Cambiar a usuario sin privilegios
USER nextjs

# Copiar solo lo necesario para ejecutar
COPY --from=builder /app/public ./public
Copy --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Comando por defecto: iniciar Next.js en producción
# Next usará el PORT=4000 definido arriba
CMD ["npm", "run", "start"]
