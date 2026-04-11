# Relatório de Infraestrutura — EcoMed CI/CD

> Histórico completo de erros encontrados durante a implementação do pipeline CI/CD automático e como cada um foi corrigido.

---

## Sumário Executivo

| #   | Erro                                                          | Categoria      | Status       |
| --- | ------------------------------------------------------------- | -------------- | ------------ |
| 1   | `envs` no appleboy/ssh-action fecha sessão SSH em 2s          | CI/CD          | ✅ Resolvido |
| 2   | `EMAIL_FROM=EcoMed <noreply@...>` quebra `source .env`        | Configuração   | ✅ Resolvido |
| 3   | `git reset --hard` recusa remover diretório `app/` (CWD)      | Git / VPS      | ✅ Resolvido |
| 4   | `git checkout -B master -f origin/master` — mesma causa       | Git / VPS      | ✅ Resolvido |
| 5   | `git fetch` + `reset --hard` — mesma causa raiz               | Git / VPS      | ✅ Resolvido |
| 6   | Fine-grained PAT não funciona com GHCR                        | Autenticação   | ✅ Resolvido |
| 7   | `paths-ignore: [".github/**"]` bloqueava o próprio workflow   | GitHub Actions | ✅ Resolvido |
| 8   | Commit vazio `--allow-empty` não dispara Actions              | GitHub Actions | ✅ Resolvido |
| 9   | `x-pathname` no middleware não acessível em Server Components | Next.js        | ✅ Resolvido |

---

## Erro 1 — Parâmetro `envs` no appleboy/ssh-action fecha sessão em ~2s

**Data:** Abril 2026  
**Impacto:** Pipeline falha imediatamente após conexão SSH

### Diagnóstico

O workflow tentava passar variáveis de ambiente via o parâmetro `envs` da action `appleboy/ssh-action`:

```yaml
# ERRADO
- uses: appleboy/ssh-action@v1.2.0
  with:
    envs: DATABASE_URL,AUTH_SECRET,GOOGLE_CLIENT_ID,...
```

O servidor SSH do VPS (Oracle Cloud) tem a diretiva `AcceptEnv` configurada para aceitar apenas `LANG LC_*`. Qualquer outra variável é rejeitada e o servidor fecha a conexão imediatamente (~2s).

### Solução

Remover completamente o parâmetro `envs`. As variáveis necessárias para o build são lidas diretamente dos arquivos presentes no VPS:

```yaml
# CORRETO
script: |
  source /opt/ecomed/.env
  docker build --build-arg "DATABASE_URL=${DATABASE_URL}" ...
```

### Lição Aprendida

Nunca usar `envs` no appleboy/ssh-action em servidores com `AcceptEnv` restritivo. Sempre ler variáveis sensíveis de arquivos no próprio servidor.

---

## Erro 2 — `EMAIL_FROM` com `< >` quebra `source /opt/ecomed/.env`

**Data:** Abril 2026  
**Impacto:** `source .env` falha na linha 12, todo o script subsequente perde as variáveis

### Diagnóstico

O arquivo `.env` continha:

```
EMAIL_FROM=EcoMed <noreply@ecomed.eco.br>
```

No bash, `<` e `>` são operadores de redirecionamento. Sem aspas, o bash interpreta isso como:

- Redirecionar stdout para arquivo `noreply@ecomed.eco.br`
- Ler stdin do arquivo chamado `EcoMed`

Resultado: syntax error, `source` falha silenciosamente e nenhuma variável é exportada.

### Solução

```bash
# Aplicado no VPS via sed
sed -i 's|EMAIL_FROM=EcoMed <noreply@ecomed.eco.br>|EMAIL_FROM="EcoMed <noreply@ecomed.eco.br>"|' /opt/ecomed/.env
```

### Lição Aprendida

Qualquer valor de variável `.env` que contenha caracteres especiais bash (`<`, `>`, `|`, `&`, `;`, `$`) **deve estar entre aspas duplas**. Validar o `.env` com `bash -n` antes de fazer deploy.

---

## Erro 3, 4 e 5 — Git recusa remover diretório `app/` (CWD)

**Data:** Abril 2026  
**Impacto:** Todos os comandos de sync git falhavam no VPS

### Diagnóstico

Esses três comandos falhavam com a mesma mensagem:

```
fatal: Refusing to remove 'app' since it is the current working directory of a process.
```

**Causa raiz:** A estrutura do VPS estava errada. O que havia em `/opt/ecomed` era um clone do branch `main` do monorepo (que possui uma subpasta `app/` com o código Next.js). O CI/CD tentava fazer `cd /opt/ecomed/app` e em seguida sincronizar com o branch `master`, que também tem `app/` na raiz — gerando conflito.

```
# Estrutura ERRADA (branch main clonado na raiz):
/opt/ecomed/           ← clone do branch main
/opt/ecomed/app/       ← subdiretório do monorepo (app Next.js)
/opt/ecomed/ia/        ← subdiretório do monorepo (microserviço Python)

# Comandos tentados que falharam:
git reset --hard origin/master      # Erro 3
git checkout -B master -f origin/master  # Erro 4
git fetch origin master && git reset --hard  # Erro 5
```

O git não consegue substituir `/opt/ecomed/app/` porque o processo SSH está executando **dentro** desse diretório (é o CWD).

### Solução

Reestruturar o VPS: criar um clone standalone do branch `master` em `/opt/ecomed/app`:

```bash
# 1. Renomear o diretório problemático
mv /opt/ecomed/app /opt/ecomed/app_main_backup_$(date +%s)

# 2. Clonar o branch master diretamente na pasta app
git clone -b master https://github.com/ivonsmatos/ecomed.git /opt/ecomed/app

# 3. Verify
cd /opt/ecomed/app
git log --oneline -3
```

### Estrutura Final Correta

```
/opt/ecomed/
  .env                  ← variáveis de ambiente do servidor
  .github_token         ← PAT do GitHub (não mais necessário, repo público)
  deploy.sh             ← script de deploy manual (backup)
  app/                  ← clone standalone do branch master
    Dockerfile
    next.config.ts
    package.json
    ...
  app_main_backup_*/    ← backup do clone antigo do branch main
```

### Lição Aprendida

O VPS deve ter um **clone standalone de um único branch** em cada pasta de deploy, nunca um clone do monorepo com múltiplas branches. O `cd` no script CI/CD deve ser feito para um repositório git autocontido.

---

## Erro 6 — Fine-grained PAT não funciona com GitHub Container Registry

**Data:** Abril 2026  
**Impacto:** `docker login ghcr.io` falhava mesmo com PAT válido

### Diagnóstico

O workflow inicial tentava fazer push para GHCR (GitHub Container Registry) usando um fine-grained PAT com a permissão `Contents: read/write`. O GHCR rejeita fine-grained PATs — ele só aceita **classic PATs** com o scope `read:packages` / `write:packages`.

### Solução

Eliminar completamente o uso do GHCR do workflow. Em vez de fazer push da imagem para o registry e depois pull no VPS, o VPS faz **build local** da imagem:

```yaml
# ABORDAGEM FINAL — build local no VPS com cache de camadas
docker build \
--build-arg "DATABASE_URL=${DATABASE_URL}" \
...
-t ecomed-app:latest .
```

Vantagem adicional: o cache de camadas do Docker no VPS torna os builds subsequentes muito mais rápidos (apenas camadas alteradas são recompiladas, principalmente as de `node_modules`).

---

## Erro 7 — `paths-ignore: [".github/**"]` impedia o workflow de ser testado

**Data:** Abril 2026  
**Impacto:** Commits que só alteravam o workflow não disparavam o pipeline

### Diagnóstico

O workflow tinha:

```yaml
on:
  push:
    branches: [master]
    paths-ignore:
      - "*.md"
      - "docs/**"
      - ".github/**" # ← PROBLEMA
```

Quando o próprio arquivo `deploy.yml` era alterado e commitado, o GitHub Actions não disparava — pois o único arquivo alterado estava em `.github/workflows/`, que estava no `paths-ignore`.

### Solução

Remover `.github/**` do `paths-ignore` e adicionar `workflow_dispatch` para disparo manual:

```yaml
on:
  push:
    branches: [master]
    paths-ignore:
      - "*.md"
      - "docs/**"
  workflow_dispatch:
```

---

## Erro 8 — Commit vazio `--allow-empty` não dispara Actions

**Data:** Abril 2026  
**Impacto:** Tentativa de forçar disparo do pipeline falhava

### Diagnóstico

Para testar o pipeline sem alterar código real, foi usado:

```bash
git commit --allow-empty -m "chore: trigger CI"
```

O GitHub Actions não considera commits vazios para avaliação de `paths`. Como nenhum arquivo foi modificado, o `paths-ignore` não tem o que comparar e o trigger nunca é disparado.

### Solução

Sempre triggerar o pipeline com um commit que altere pelo menos um arquivo real (mesmo que seja um comentário no código ou uma linha no `README`). Alternativamente, usar `workflow_dispatch` na aba Actions no GitHub para disparo manual.

---

## Estado Final da Infraestrutura

### VPS Oracle Cloud

- **IP:** `45.151.122.234`
- **SO:** Ubuntu (root)
- **Container:** `ecomed-web` — porta `3010`
- **Monitoramento:** Portainer em `http://45.151.122.234:3000`

### Estrutura de Arquivos no VPS

```
/opt/ecomed/
  .env                  ← todas as variáveis de ambiente (nunca commitar)
  app/                  ← clone git do branch master (repositório público)
  deploy.sh             ← script manual de fallback
```

### Pipeline CI/CD Final (`.github/workflows/deploy.yml`)

```
Push para master
  → GitHub Actions (ubuntu-latest)
  → SSH (appleboy/ssh-action@v1.2.0, password auth)
  → cd /opt/ecomed/app
  → git pull origin master
  → source /opt/ecomed/.env
  → docker build --build-arg ... -t ecomed-app:latest .
  → docker stop ecomed-web && docker rm ecomed-web
  → docker run -d --name ecomed-web -p 3010:3010 --env-file /opt/ecomed/.env ecomed-app:latest
  → HTTP 200 ✅
```

### Tempo Total de Deploy

- **~9 minutos** (Next.js webpack + TypeScript check + instalação de dependências)
- Builds subsequentes são mais rápidos devido ao cache de camadas Docker

---

## Erro 9 — `x-pathname` no middleware não acessível em Server Components

**Data:** Abril 2026  
**Impacto:** Tela branca em `/app/onboarding` devido a redirect infinito

### Diagnóstico

O `middleware.ts` definia o header `x-pathname` apenas como **response header**:

```typescript
function withCsp(res: NextResponse): NextResponse {
  res.headers.set("x-pathname", pathname);
  return res;
}
return withCsp(NextResponse.next());
```

Porém, `headers()` em Server Components lê **request headers**, não response headers. O layout `/app` usava `headers().get("x-pathname")` para detectar se estava na página de onboarding e evitar redirect:

```typescript
const pathname = headersList.get("x-pathname") ?? "";
const isOnboardingPage = pathname === "/app/onboarding";
```

Como `pathname` sempre retornava `""`, nunca `"/app/onboarding"`, todo acesso a `/app/*` redirecionava para onboarding → loop infinito → tela branca.

### Solução

Criada função `nextWithCsp()` que usa `NextResponse.next({ request: { headers } })` para encaminhar `x-pathname` como request header:

```typescript
const forwardedHeaders = new Headers(req.headers);
forwardedHeaders.set("x-pathname", pathname);

function nextWithCsp(): NextResponse {
  const res = NextResponse.next({ request: { headers: forwardedHeaders } });
  res.headers.set("Content-Security-Policy", cspValue);
  return res;
}
```

### Lição Aprendida

Headers definidos com `res.headers.set()` são **response headers** — não acessíveis via `headers()` em Server Components. Para compartilhar dados do middleware com Server Components, usar `NextResponse.next({ request: { headers } })` para encaminhar como **request headers**.

---

## Próximas Melhorias Recomendadas

1. **Nginx proxy reverso** — expor porta 80/443 em vez de 3010 (Cloudflare pode então atuar como proxy)
2. **SSL/TLS** — configurar Let's Encrypt via Certbot no nginx
3. **Health check pré-swap** — aguardar HTTP 200 no novo container antes de remover o antigo
4. **Notificação de falha** — Slack/Discord webhook em caso de falha no deploy
5. **Backup do `.env`** — armazenar cópia criptografada fora do VPS
