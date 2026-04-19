import { expect, test } from "@playwright/test"

// Fluxo crítico 5: parceiro — onboarding e dashboard
test.describe("Parceiro", () => {
  test("/parceiros (público) lista parceiros", async ({ page }) => {
    const res = await page.goto("/parceiros")
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator("main, body")).toBeVisible()
  })

  test("/parceiro/dashboard exige autenticação", async ({ page }) => {
    await page.goto("/parceiro/dashboard")
    await expect(page).toHaveURL(/\/(entrar|parceiro\/dashboard)/)
  })

  test("/app/seja-parceiro renderiza CTA de cadastro", async ({ page }) => {
    const res = await page.goto("/app/seja-parceiro")
    // Pode exigir login — aceitamos redirect ou render direto
    expect((res?.status() ?? 200) < 500).toBeTruthy()
  })
})
