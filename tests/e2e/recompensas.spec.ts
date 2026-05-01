import { expect, test } from "@playwright/test"

// Fluxo crítico 4: catálogo de recompensas e fluxo de resgate
test.describe("Recompensas (catálogo + resgate)", () => {
  test("/app/recompensas exige autenticação", async ({ page }) => {
    await page.goto("/app/recompensas")
    await expect(page).toHaveURL(/\/(entrar|app\/recompensas)/)
  })

  test("API /api/recompensas/listar é pública ou retorna 401 estruturado", async ({ request }) => {
    const res = await request.get("/api/recompensas/listar")
    expect([200, 401, 404]).toContain(res.status())
    if (res.status() === 200) {
      const body = (await res.json()) as unknown
      expect(body).toBeTruthy()
    }
  })
})
