---
name: ecomed-qa
description: >
  Skill de QA e testes para o projeto EcoMed. Use sempre que precisar escrever, corrigir
  ou revisar testes: unitários (Vitest), E2E (Playwright), acessibilidade (axe-playwright),
  performance (Lighthouse), testes da API, ou quando encontrar bugs e regressões.
  Também use para configurar pipelines de CI, interpretar falhas de teste,
  aumentar cobertura de código, ou auditar a qualidade geral do projeto.
---

# EcoMed — QA e Testes

## Stack de testes

| Ferramenta | Versão | Papel |
|---|---|---|
| Vitest | latest | Testes unitários e de integração (app/) |
| Playwright | latest | Testes E2E — fluxos completos no browser |
| axe-playwright | latest | Auditoria de acessibilidade WCAG 2.1 AA |
| Lighthouse CI | latest | Performance, PWA, SEO automatizados |
| Sentry | latest | Monitoramento de erros em produção |

---

## Estrutura de arquivos de teste

```
app/
├── src/
│   └── lib/
│       ├── utils.test.ts        ← testes unitários ao lado do código
│       └── coins/
│           └── index.test.ts
├── tests/
│   └── e2e/
│       ├── cidadao-mapa.spec.ts
│       ├── auth-fluxo.spec.ts
│       ├── parceiro-cadastro.spec.ts
│       └── admin-aprovacao.spec.ts
├── playwright.config.ts
└── vitest.config.ts
```

---

## Vitest — padrões

### Configuração (`vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules", "src/app/api", "prisma", "tests"],
      thresholds: { lines: 60, functions: 60, branches: 50 },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
})
```

### Setup global (`src/test/setup.ts`)

```typescript
import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock do Prisma — nunca bater no banco em testes unitários
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    wallet: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    coinTransaction: { create: vi.fn(), findMany: vi.fn() },
    point: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
  },
}))

// Mock do NextAuth
vi.mock("@/auth", () => ({
  auth: vi.fn(() => null),
}))
```

### Exemplo — teste de lógica de coins

```typescript
// src/lib/coins/index.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { creditCoins, calcularNivel, verificarLimiteDiario } from "./index"
import { prisma } from "@/lib/db/prisma"

describe("calcularNivel", () => {
  it("retorna SEMENTE para 0-100 coins", () => {
    expect(calcularNivel(0)).toBe("SEMENTE")
    expect(calcularNivel(100)).toBe("SEMENTE")
  })
  it("retorna BROTO para 101-500", () => {
    expect(calcularNivel(101)).toBe("BROTO")
    expect(calcularNivel(500)).toBe("BROTO")
  })
  it("retorna ARVORE para 501-2000", () => {
    expect(calcularNivel(501)).toBe("ARVORE")
  })
  it("retorna GUARDIAO para 2001+", () => {
    expect(calcularNivel(2001)).toBe("GUARDIAO")
    expect(calcularNivel(99999)).toBe("GUARDIAO")
  })
})

describe("verificarLimiteDiario", () => {
  it("bloqueia ARTICLE_READ após 5 no dia", async () => {
    vi.mocked(prisma.coinTransaction.findMany).mockResolvedValue(
      Array(5).fill({ event: "ARTICLE_READ" })
    )
    const ok = await verificarLimiteDiario("user-1", "ARTICLE_READ")
    expect(ok).toBe(false)
  })
})
```

---

## Playwright — configuração e padrões

### `playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
})
```

### Fixture de autenticação reutilizável

```typescript
// tests/e2e/fixtures.ts
import { test as base, expect } from "@playwright/test"

type UserFixtures = {
  cidadaoPage: import("@playwright/test").Page
  parceiroPage: import("@playwright/test").Page
  adminPage: import("@playwright/test").Page
}

export const test = base.extend<UserFixtures>({
  cidadaoPage: async ({ page }, use) => {
    await page.goto("/auth/login")
    await page.fill("[data-testid='email-input']", "cidadao@teste.com")
    await page.fill("[data-testid='password-input']", "Teste@123")
    await page.click("[data-testid='login-button']")
    await page.waitForURL("/app/perfil")
    await use(page)
  },
  adminPage: async ({ page }, use) => {
    await page.goto("/auth/login")
    await page.fill("[data-testid='email-input']", "admin@ecomed.eco.br")
    await page.fill("[data-testid='password-input']", "Admin@123")
    await page.click("[data-testid='login-button']")
    await page.waitForURL("/admin/dashboard")
    await use(page)
  },
})

export { expect }
```

### Cenários E2E obrigatórios

```typescript
// tests/e2e/cidadao-mapa.spec.ts
import { test, expect } from "./fixtures"
import AxeBuilder from "@axe-core/playwright"

test.describe("Cidadão — Mapa de pontos", () => {
  test("vê pontos ao acessar /mapa sem login", async ({ page }) => {
    await page.goto("/mapa")
    await expect(page.locator("[data-testid='map-container']")).toBeVisible()
    await expect(page.locator("[data-testid='point-marker']").first()).toBeVisible({ timeout: 8000 })
  })

  test("busca por CEP e mapa atualiza", async ({ page }) => {
    await page.goto("/mapa")
    await page.fill("[data-testid='cep-input']", "01310100")
    await page.keyboard.press("Enter")
    await expect(page.locator("[data-testid='point-card']").first()).toBeVisible({ timeout: 5000 })
  })

  test("tenta favoritar sem login → redireciona para login", async ({ page }) => {
    await page.goto("/mapa")
    await page.locator("[data-testid='point-marker']").first().click()
    await page.click("[data-testid='favorite-button']")
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test("não tem violações de acessibilidade WCAG 2.1 AA", async ({ page }) => {
    await page.goto("/mapa")
    await page.waitForLoadState("networkidle")
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()
    expect(results.violations).toHaveLength(0)
  })
})

test.describe("Admin — Aprovação de parceiros", () => {
  test("aprova parceiro e ponto aparece no mapa", async ({ adminPage }) => {
    await adminPage.goto("/admin/pontos?status=PENDING")
    const primeiroItem = adminPage.locator("[data-testid='pending-point-row']").first()
    await primeiroItem.click()
    await adminPage.click("[data-testid='approve-button']")
    await expect(adminPage.locator("[data-testid='toast-success']")).toBeVisible()
  })
})
```

---

## Checklist de acessibilidade — WCAG 2.1 AA

Verificar manualmente além do axe-playwright:

```
NAVEGAÇÃO POR TECLADO
☐ Tab percorre todos os elementos interativos na ordem correta
☐ Enter/Space ativa botões e links
☐ Escape fecha modais e drawers
☐ Foco visível em todos os elementos (outline não removido)
☐ Skip to content link presente

CONTRASTE
☐ Texto normal: ratio ≥ 4.5:1
☐ Texto grande (18px+): ratio ≥ 3:1
☐ Ícones interativos: ratio ≥ 3:1
☐ Verificar com: https://webaim.org/resources/contrastchecker/

CONTEÚDO
☐ Todas as imagens têm alt descritivo (ou alt="" se decorativas)
☐ Inputs têm label associado (não só placeholder)
☐ Erros de formulário explicam o problema e como corrigir
☐ Idioma da página declarado: <html lang="pt-BR">
☐ Touch targets ≥ 44x44px (testar no mobile)

FORMULÁRIOS
☐ Campos obrigatórios marcados com aria-required="true"
☐ Mensagens de erro vinculadas via aria-describedby
☐ Autocomplete configurado onde aplicável
```

---

## Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  push:
    branches: [staging, main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm install --frozen-lockfile
        working-directory: app
      - run: pnpm build
        working-directory: app
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: https://staging.ecomed.eco.br
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            https://staging.ecomed.eco.br/
            https://staging.ecomed.eco.br/mapa
            https://staging.ecomed.eco.br/blog
          budgetPath: ./app/lighthouse-budget.json
          uploadArtifacts: true

# app/lighthouse-budget.json
# {
#   "performance": 90,
#   "accessibility": 90,
#   "best-practices": 90,
#   "seo": 90,
#   "pwa": true
# }
```

---

## Referências

- **`references/qa-checklist.md`** — checklist completo antes de cada PR e deploy
