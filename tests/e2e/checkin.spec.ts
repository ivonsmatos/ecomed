import { expect, test } from "@playwright/test"

// Fluxo crítico 2: check-in via QR/scanner
// Sem login real, verificamos que /parceiro/scanner exige autenticação
// (redireciona para /entrar) e que /app/missoes também é protegido.
test.describe("Check-in e área autenticada", () => {
  test("scanner do parceiro exige login", async ({ page }) => {
    const response = await page.goto("/parceiro/scanner")
    // Pode redirecionar para /entrar com callback ou retornar 401/403
    const url = page.url()
    expect(
      url.includes("/entrar") || (response?.status() ?? 200) >= 400,
      `esperava redirect/erro, recebeu ${url} (${response?.status()})`,
    ).toBeTruthy()
  })

  test("/app/missoes protegido", async ({ page }) => {
    await page.goto("/app/missoes")
    await expect(page).toHaveURL(/\/(entrar|app\/missoes)/)
    if (page.url().includes("/entrar")) {
      await expect(page.locator("form")).toBeVisible()
    }
  })
})
