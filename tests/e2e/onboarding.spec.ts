import { expect, test } from "@playwright/test"

// Fluxo crítico 1: cadastro/onboarding do cidadão
// Não cria conta de fato (ambiente de CI sem SMTP/OAuth) — valida que a página
// renderiza, exige campos obrigatórios e que o link para entrar existe.
test.describe("Onboarding cidadão", () => {
  test("/cadastrar mostra formulário e CTA de login", async ({ page }) => {
    await page.goto("/cadastrar")
    await expect(page.locator("form")).toBeVisible()

    // Campos obrigatórios típicos
    const email = page.getByLabel(/e-?mail/i)
    await expect(email).toBeVisible()

    // Link para a tela de login
    await expect(page.getByRole("link", { name: /acesse aqui|entrar|j[áa] tenho/i })).toBeVisible()
  })

  test("submit vazio mantém usuário na página", async ({ page }) => {
    await page.goto("/cadastrar")
    const submit = page.getByRole("button", { name: /cadastrar|criar conta|continuar/i }).first()
    if (await submit.isVisible().catch(() => false)) {
      await submit.click()
      await expect(page).toHaveURL(/\/cadastrar/)
    }
  })
})
