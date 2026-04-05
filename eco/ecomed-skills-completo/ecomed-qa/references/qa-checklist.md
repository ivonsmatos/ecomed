# EcoMed — Checklist de QA

## Antes de abrir Pull Request

```
CÓDIGO
☐ pnpm lint:fix rodou sem erros
☐ pnpm tsc --noEmit sem erros de tipo
☐ pnpm test passou (cobertura ≥ 60%)
☐ Nenhum console.log esquecido no código
☐ .env.local não foi commitado

FUNCIONAL
☐ Testou no Chrome desktop
☐ Testou no Chrome mobile (DevTools, 375px)
☐ Testou no Safari (se possível)
☐ Fluxo principal funciona do início ao fim
☐ Casos de erro mostram mensagem ao usuário (não erro 500 em branco)

SEGURANÇA
☐ Endpoint novo tem rate limiting
☐ Endpoint autenticado valida sessão
☐ Input validado com Zod antes de usar
☐ Upload (se houver) valida MIME type e tamanho

ACESSIBILIDADE
☐ Componente novo tem label/aria correto
☐ Imagens novas têm atributo alt
☐ Botões novos têm texto descritivo (não só ícone)
```

## Antes de fazer merge na staging

```
TESTES E2E
☐ pnpm test:e2e passou nos cenários principais
☐ Nenhuma violação axe-playwright nova

BANCO
☐ Se mudou schema, migration foi criada e testada
☐ Seed ainda funciona após migration
☐ Nenhum campo obrigatório adicionado sem default (quebra dados existentes)
```

## Antes de deploy em produção

```
DEPLOY
☐ Build de produção gerou sem erros
☐ Variáveis de ambiente conferidas no Cloudflare
☐ Lighthouse score ≥ 90 em staging
☐ Sentry configurado e capturando erros

ROLLBACK
☐ Sabe como reverter o deploy se algo quebrar
☐ Migration é reversível (ou tem plano de hotfix)
```

## Bugs mais comuns no EcoMed

| Bug | Causa | Solução |
|---|---|---|
| Prisma error em produção | `DATABASE_URL` sem `?pgbouncer=true` | Adicionar parâmetro na URL do pooler |
| Auth redirect loop | `NEXTAUTH_URL` errada | Conferir variável de ambiente no Cloudflare |
| Mapa não carrega | CORS bloqueando OSM tiles | Configurar CSP para permitir `tile.openstreetmap.org` |
| Push notification não chega iOS | PWA não instalada | Mostrar instrução de instalação antes de pedir permissão |
| Prisma Client não encontrado | Output path customizado | Checar se `generated/prisma/` está no `.gitignore` correto |
| Build falha no Cloudflare | Env var faltando | Comparar `.env.example` com variáveis no painel |
| Coins não creditados | Rate limit ou duplicidade | Verificar `@@unique` nas transações e limite diário |
