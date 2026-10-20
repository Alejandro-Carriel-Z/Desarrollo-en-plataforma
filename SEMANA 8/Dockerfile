# Imagen de producción de SecureGuard (Unidad 8)
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production HTTPS_ENABLED=false TRUST_PROXY=true
COPY package*.json prisma7.config.ts ./
COPY prisma ./prisma
RUN npm ci --omit=dev
COPY . .
USER node
EXPOSE 3000
# Aplica migraciones pendientes y arranca. El hosting inyecta PORT, DATABASE_URL y JWT_SECRET.
CMD ["npm", "run", "start:prod"]
