---
name: ecomed-security
description: >
  Skill de segurança para o projeto EcoMed. Use sempre que implementar novos endpoints,
  autenticação, upload de arquivos, validação de dados, ou quando revisar código existente
  para vulnerabilidades. Também use ao configurar headers HTTP, CORS, rate limiting, LGPD,
  ou quando suspeitar de uma falha de segurança. Cobre OWASP Top 10, práticas específicas
  do Next.js 16, Prisma, Supabase RLS e Cloudflare WAF.
---

# EcoMed — Segurança

## Modelo de Ameaças — O que proteger

| Ativo | Ameaça | Controle |
|---|---|---|
| Dados de usuários (email, senha) | Vazamento de banco | bcrypt 12 rounds + RLS Supabase |
| Sessões JWT | Roubo de token | httpOnly cookie + 15min expiry |
| API de pontos | Abuso / scraping | Rate limiting Upstash |
| Upload de imagens | Malware / path traversal | Validação MIME + Sharp (transforma arquivo) |
| CNPJ / dados de parceiros | IDOR (acesso cruzado) | Verificar ownership em toda query |
| Chat com IA | Prompt injection | Guardrails no FastAPI + escopo restrito |
| Formulários públicos | XSS / SQL injection | Zod + Prisma prepared statements |

---

## Checklist por Endpoint

Todo endpoint novo deve passar por estes controles **nesta ordem**:

```typescript
// 1. Rate limiting PRIMEIRO (antes de qualquer processamento)
const ip = c.req.header("CF-Connecting-IP") ?? "anon"
const { success } = await checkRateLimit("map", ip)
if (!success) return c.json({ error: "Rate limit excedido." }, 429)

// 2. Autenticação (se rota protegida)
const session = await auth()
if (!session) return c.json({ error: "Não autenticado." }, 401)

// 3. Autorização (RBAC)
if (session.user.role !== "ADMIN") return c.json({ error: "Sem permissão." }, 403)

// 4. Validação do input com Zod
const parsed = schema.safeParse(await c.req.json())
if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

// 5. Verificar ownership (parceiro só acessa seu ponto)
const point = await prisma.point.findUnique({ where: { id: parsed.data.pointId } })
if (point?.partnerId !== session.user.partnerId) return c.json({ error: "Sem permissão." }, 403)

// 6. Lógica de negócio — só chega aqui se passou em tudo acima
```

---

## Autenticação — Padrões Seguros

### JWT — curta duração obrigatória

```typescript
// auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias (refresh token)
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.exp = Math.floor(Date.now() / 1000) + 15 * 60  // 15 min access token
      }
      return token
    },
  },
})
```

### Senhas — bcrypt com custo 12

```typescript
import bcrypt from "bcryptjs"

// Criar usuário
const hashed = await bcrypt.hash(password, 12)

// Verificar senha
const valid = await bcrypt.compare(inputPassword, storedHash)

// NUNCA comparar strings diretamente:
// ❌ user.password === inputPassword
// ✅ await bcrypt.compare(inputPassword, user.password)
```

---

## Validação de Input — Zod obrigatório

```typescript
// src/lib/schemas/point.ts
import { z } from "zod"

export const createPointSchema = z.object({
  cnpj: z.string()
    .length(14, "CNPJ deve ter 14 dígitos")
    .regex(/^\d+$/, "CNPJ deve conter apenas números"),
  name: z.string().min(3).max(100).trim(),
  address: z.string().min(5).max(200).trim(),
  zipCode: z.string().length(8).regex(/^\d+$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  residueTypes: z.array(z.string()).min(1).max(10),
  phone: z.string().regex(/^\d{10,11}$/).optional(),
})

// Upload de imagem — validação no servidor
export const imageUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(f => f.size <= 5 * 1024 * 1024, "Máximo 5 MB")
    .refine(
      f => ["image/jpeg", "image/png", "image/webp"].includes(f.type),
      "Apenas JPEG, PNG ou WebP"
    ),
})

// ⚠️ Sharp transforma o arquivo no servidor — mesmo que o MIME seja falso,
// a transformação falhará de forma segura sem executar código malicioso
```

---

## Headers HTTP — Configuração Next.js

```typescript
// next.config.ts
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // unsafe-eval necessário para Next.js
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.r2.dev https://api.mapbox.com",
      "connect-src 'self' https://*.supabase.co https://*.upstash.io wss://*.supabase.co",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
]

const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
}
```

---

## IDOR — Prevenção de Acesso Cruzado

IDOR (Insecure Direct Object Reference) é quando usuário A acessa dados do usuário B
trocando um ID na URL/body. **Toda query deve verificar ownership.**

```typescript
// ❌ VULNERÁVEL — busca pelo ID sem verificar quem é o dono
const point = await prisma.point.findUnique({ where: { id: pointId } })

// ✅ SEGURO — inclui partnerId na query
const point = await prisma.point.findUnique({
  where: {
    id: pointId,
    partnerId: session.user.partnerId,  // falha silenciosamente se não for do parceiro
  },
})
if (!point) return c.json({ error: "Não encontrado." }, 404)

// ✅ SEGURO — favorito sempre vinculado ao usuário da sessão
const favorite = await prisma.favorite.delete({
  where: {
    userId_pointId: {
      userId: session.user.id,  // nunca aceitar userId do body
      pointId: parsed.data.pointId,
    },
  },
})
```

---

## LGPD — Implementação Técnica

```typescript
// Coleta mínima de dados — não armazenar localização permanente
// Localização do usuário é usada APENAS em tempo real, nunca salva no banco

// Exclusão de conta — cascata completa
// DELETE /api/usuario via src/app/api/routes/usuario.ts
app.delete("/usuario", async (c) => {
  const session = await auth()
  if (!session) return c.json({ error: "Não autenticado." }, 401)

  // Prisma cascata já configurada no schema com onDelete: Cascade
  // Deleta: User → Account, Session, Favorite, Report, PushSubscription,
  //          Notification, Wallet → CoinTransaction, UserBadge, UserMission
  await prisma.user.delete({ where: { id: session.user.id } })

  // Invalidar sessão
  return c.json({ ok: true })
})

// Consentimento — salvar decisão do cookie consent
// Usar cookie httpOnly com duração de 1 ano
// Não usar localStorage (acessível por JS)
```

### Dados que NÃO armazenar

```
❌ Coordenadas GPS históricas do usuário
❌ Endereço IP (além do rate limiting — Upstash não persiste)
❌ Histórico de busca no mapa
❌ Sessões de chat após encerradas (apenas durante a sessão ativa)
✅ Email, nome (consentimento explícito no cadastro)
✅ Favoritos (funcional, declarado na política)
✅ Reportes enviados (sem localização pessoal)
✅ Wallet/transações EcoCoin (funcional, declarado)
```

---

## Cloudflare WAF — Regras Recomendadas

Configurar no painel Cloudflare → Security → WAF:

```
Regra 1 — Bloquear bots maliciosos
  If: Bot Score < 10 AND NOT (Verified Bot)
  Then: Block

Regra 2 — Rate limit por IP em /api/*
  If: URI Path starts with /api/ AND Rate > 200/min por IP
  Then: Block por 1 hora

Regra 3 — Proteger /admin/*
  If: URI Path starts with /admin/
  AND NOT CF-Connecting-Country in [BR]
  Then: Block

Regra 4 — Bloquear métodos desnecessários
  If: HTTP Method in [DELETE, PATCH] AND URI Path NOT starts with /api/
  Then: Block
```

---

## Supabase RLS — Row Level Security

```sql
-- Executar no Supabase SQL Editor
-- Garantir que usuários só acessem seus próprios dados

ALTER TABLE "Favorite" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorite_owner" ON "Favorite"
  USING (auth.uid()::text = "userId");

ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_owner" ON "PushSubscription"
  USING (auth.uid()::text = "userId");

ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_owner" ON "Wallet"
  USING (auth.uid()::text = "userId");

ALTER TABLE "CoinTransaction" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transaction_owner" ON "CoinTransaction"
  USING (
    EXISTS (
      SELECT 1 FROM "Wallet" w
      WHERE w.id = "walletId" AND w."userId" = auth.uid()::text
    )
  );
```

---

## Referências

- **`references/owasp-checklist.md`** — OWASP Top 10 aplicado ao EcoMed
