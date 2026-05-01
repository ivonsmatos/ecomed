import { expect, test } from "@playwright/test"

// ── Páginas públicas ─────────────────────────────────────────────────────────

test.describe("Páginas públicas", () => {
  test("home carrega com título correto", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/EcoMed/i)
    await expect(page.getByRole("main")).toBeVisible()
  })

  test("mapa carrega sem erros JS críticos", async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (e) => errors.push(e.message))
    await page.goto("/mapa")
    await expect(page.getByRole("main")).toBeVisible()
    expect(errors.filter((e) => !e.includes("ResizeObserver"))).toHaveLength(0)
  })

  test("blog carrega lista ou estado vazio", async ({ page }) => {
    await page.goto("/blog")
    await expect(page).toHaveTitle(/Blog/i)
    await expect(page.getByRole("main")).toBeVisible()
  })

  test("sobre carrega", async ({ page }) => {
    await page.goto("/sobre")
    await expect(page.getByRole("main")).toBeVisible()
  })
})

// ── API ───────────────────────────────────────────────────────────────────────

test.describe("API", () => {
  test("health endpoint responde status ok", async ({ request }) => {
    const response = await request.get("/api/health")
    expect(response.ok()).toBeTruthy()
    const payload = (await response.json()) as { status?: string }
    expect(payload.status).toBe("ok")
  })

  test("rota protegida retorna 401 sem autenticação", async ({ request }) => {
    const res = await request.get("/api/coins/wallet")
    expect(res.status()).toBe(401)
  })
})

// ── Autenticação ──────────────────────────────────────────────────────────────

test.describe("Autenticação", () => {
  test("página de login carrega", async ({ page }) => {
    await page.goto("/entrar")
    await expect(page.getByRole("heading", { name: /entrar/i })).toBeVisible()
  })

  test("página de cadastro tem campo de e-mail", async ({ page }) => {
    await page.goto("/cadastrar")
    await expect(page.getByLabel(/e-mail/i)).toBeVisible()
  })

  test("login com credenciais inválidas exibe mensagem de erro", async ({ page }) => {
    await page.goto("/entrar")
    await page.getByLabel(/e-mail/i).fill("invalido@teste.com")
    await page.getByLabel(/senha/i).fill("senhaerrada")
    await page.getByRole("button", { name: /entrar/i }).click()
    await expect(
      page.getByRole("alert").or(page.getByText(/credenciais|e-mail|senha/i))
    ).toBeVisible({ timeout: 5000 })
  })
})

// ── Acessibilidade básica ─────────────────────────────────────────────────────

test.describe("Acessibilidade básica", () => {
  const rotas = ["/", "/mapa", "/blog", "/sobre", "/entrar", "/cadastrar"]

  for (const rota of rotas) {
    test(`${rota} — sem imagens sem atributo alt`, async ({ page }) => {
      await page.goto(rota)
      const imagens = await page.locator("img:not([alt])").all()
      expect(imagens).toHaveLength(0)
    })

    test(`${rota} — tem landmark main`, async ({ page }) => {
      await page.goto(rota)
      await expect(page.getByRole("main")).toBeVisible()
    })
  }
})

// ── PWA / SEO ─────────────────────────────────────────────────────────────────

test.describe("PWA e SEO", () => {
  test("robots.txt existe", async ({ request }) => {
    const res = await request.get("/robots.txt")
    expect(res.ok()).toBeTruthy()
  })

  test("sitemap.xml existe", async ({ request }) => {
    const res = await request.get("/sitemap.xml")
    expect(res.ok()).toBeTruthy()
  })

  test("manifest.webmanifest existe e tem name", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest")
    expect(res.ok()).toBeTruthy()
    const json = (await res.json()) as { name?: string }
    expect(json.name).toBeTruthy()
  })

  test("llms.txt existe", async ({ request }) => {
    const res = await request.get("/llms.txt")
    expect(res.ok()).toBeTruthy()
  })
})
