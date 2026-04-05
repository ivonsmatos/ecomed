# OWASP Top 10 — Aplicado ao EcoMed

## A01 — Broken Access Control

**Risco no EcoMed:** Parceiro A acessar dados do parceiro B. Admin sem proteção de rota.

```
☐ Middleware RBAC em /parceiro/* e /admin/*
☐ Toda query de parceiro inclui partnerId da sessão (não do body)
☐ Toda query de usuário inclui userId da sessão (não do body)
☐ Endpoints de admin verificam role === "ADMIN"
☐ Supabase RLS ativo nas tabelas sensíveis
☐ Soft delete preserva dados (active=false, não DELETE)
```

## A02 — Cryptographic Failures

**Risco no EcoMed:** Senhas em texto claro. Tokens expostos em URL.

```
☐ Senhas hash com bcrypt (custo 12)
☐ JWT em httpOnly cookie (não em localStorage)
☐ NEXTAUTH_SECRET >= 32 chars aleatórios
☐ VAPID keys não expostas no client (private key server-only)
☐ IA_SERVICE_TOKEN não exposto no client (IA_SERVICE_TOKEN sem NEXT_PUBLIC_)
☐ URLs de reset de senha com token de uso único expirável (1h)
☐ R2 bucket privado (URLs assinadas ou via proxy)
```

## A03 — Injection

**Risco no EcoMed:** SQL injection em buscas. XSS em artigos do blog.

```
☐ Prisma usa prepared statements automaticamente
☐ Queries raw ($queryRaw) usam template literals (nunca concatenação)
☐ Input validado com Zod antes de qualquer uso
☐ React escapa HTML por padrão (não usar dangerouslySetInnerHTML com input de usuário)
☐ Artigos do blog sanitizados antes de renderizar (usar DOMPurify se necessário)
☐ Sanitizar parâmetros de URL antes de usar em queries
```

## A04 — Insecure Design

**Risco no EcoMed:** Sistema de EcoCoin sem limites → farming de coins.

```
☐ Limite diário por evento (ARTICLE_READ max 5/dia, REPORT_SUBMITTED max 3/dia)
☐ REFERRAL só concedido após email verificado do indicado
☐ SIGNUP só concedido uma vez (verificar via existingTransactions)
☐ Transações idempotentes (não duplicar coin por retry)
☐ Admin pode cancelar transações suspeitas
☐ Log de todas as transações com timestamp e IP
```

## A05 — Security Misconfiguration

**Risco no EcoMed:** Variáveis de ambiente vazadas. Headers inseguros.

```
☐ .env.local no .gitignore
☐ Nenhuma secret com prefixo NEXT_PUBLIC_ (expõe ao browser)
☐ Headers de segurança configurados no next.config.ts
☐ CORS restrito a origens conhecidas
☐ NODE_ENV=production no Cloudflare Pages
☐ Prisma Studio não exposto em produção
☐ /studio (Sanity) protegido por autenticação
```

## A06 — Vulnerable Components

**Risco no EcoMed:** Dependências com CVEs conhecidas.

```
☐ pnpm audit rodando no CI (sem vulnerabilidades críticas)
☐ Dependências atualizadas mensalmente
☐ Dependências de dev não chegam ao bundle de produção
☐ Next.js e Prisma nas versões mais recentes estáveis
```

## A07 — Identification and Authentication Failures

**Risco no EcoMed:** Brute force em login. Sessões não invalidadas.

```
☐ Rate limit em /api/auth/* (10 tentativas por minuto por IP)
☐ Mensagem de erro genérica no login ("Email ou senha incorretos" — nunca "email não existe")
☐ Logout invalida sessão no servidor (não só no client)
☐ Email verificado obrigatório para receber EcoCoins
☐ Reset de senha invalida token após uso
☐ Google OAuth configurado com redirect URI correto (não aceita wildcards)
```

## A08 — Software and Data Integrity Failures

**Risco no EcoMed:** Manipulação de dados de EcoCoin no client.

```
☐ Lógica de crédito de coins SEMPRE no servidor (nunca no client)
☐ Amount de coins nunca vem do body da request (calculado no servidor)
☐ Webhook de eventos externos verificado com assinatura
☐ Dependências verificadas com lockfile (pnpm-lock.yaml commitado)
☐ GitHub Actions com actions pinadas por hash
```

## A09 — Security Logging and Monitoring Failures

**Risco no EcoMed:** Ataque não detectado. Sem rastreabilidade.

```
☐ Sentry configurado e capturando erros 4xx e 5xx
☐ Log de login failures (para detectar brute force)
☐ Log de transações de EcoCoin (auditoria)
☐ Alertas no Sentry para spikes de erros 500
☐ Cloudflare Analytics monitorando tráfego anômalo
☐ Upstash rate limit logging (quantas requests bloqueadas)
```

## A10 — Server-Side Request Forgery (SSRF)

**Risco no EcoMed:** Endpoint que faz fetch de URL externa (ViaCEP, ReceitaWS, IA service).

```
☐ ViaCEP: validar CEP (8 dígitos) antes de fazer fetch
☐ ReceitaWS: validar CNPJ (algoritmo) antes de fazer fetch
☐ IA_SERVICE_URL: variável de ambiente, não aceita input do usuário
☐ Nunca fazer fetch de URL arbitrária fornecida pelo usuário
☐ Lista de domínios externos permitidos hardcoded:
     viacep.com.br, receitaws.com.br, nominatim.openstreetmap.org
```
