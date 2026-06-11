FROM node:20-alpine AS base
RUN npm install -g pnpm

# ─── Dependências ────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Build ────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis públicas — NEXT_PUBLIC_* são embutidas no bundle do cliente,
# AUTH_URL e GOOGLE_CLIENT_ID aparecem em URLs públicas de OAuth.
# Segredos (DATABASE_URL, AUTH_SECRET, GOOGLE_CLIENT_SECRET) NÃO entram aqui:
# são montados via BuildKit secrets apenas durante o RUN de build, sem ficar
# gravados nas camadas da imagem (docker history não os expõe).
ARG AUTH_URL
ARG GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_SANITY_PROJECT_ID
ARG NEXT_PUBLIC_SANITY_DATASET=production

ENV AUTH_URL=${AUTH_URL}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=${NEXT_PUBLIC_VAPID_PUBLIC_KEY}
ENV NEXT_PUBLIC_SANITY_PROJECT_ID=${NEXT_PUBLIC_SANITY_PROJECT_ID}
ENV NEXT_PUBLIC_SANITY_DATASET=${NEXT_PUBLIC_SANITY_DATASET}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Gerar Prisma client e fazer build com segredos efêmeros (/run/secrets)
RUN --mount=type=secret,id=DATABASE_URL \
    --mount=type=secret,id=AUTH_SECRET \
    --mount=type=secret,id=GOOGLE_CLIENT_SECRET \
    export DATABASE_URL="$(cat /run/secrets/DATABASE_URL)" && \
    export AUTH_SECRET="$(cat /run/secrets/AUTH_SECRET)" && \
    export GOOGLE_CLIENT_SECRET="$(cat /run/secrets/GOOGLE_CLIENT_SECRET)" && \
    pnpm prisma generate && \
    pnpm exec next build --webpack

# ─── Runner ───────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3010
ENV PORT=3010
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3010/api/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
