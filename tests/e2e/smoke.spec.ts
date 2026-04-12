import { expect, test } from "@playwright/test"

test("home carrega sem erro", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/EcoMed/i)
})

test("health endpoint responde status ok", async ({ request }) => {
  const response = await request.get("/api/health")
  expect(response.ok()).toBeTruthy()

  const payload = (await response.json()) as { status?: string }
  expect(payload.status).toBe("ok")
})
