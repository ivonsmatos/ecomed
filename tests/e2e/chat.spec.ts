import { expect, test } from "@playwright/test"

// Fluxo crítico 3: EcoBot (chat IA)
// Valida contrato HTTP do endpoint /api/chat sem depender da IA real.
test.describe("EcoBot /api/chat", () => {
  test("rejeita pergunta vazia/curta com 400", async ({ request }) => {
    const res = await request.post("/api/chat", { data: { pergunta: "" } })
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })

  test("aceita pergunta válida e retorna 200/502/503/504", async ({ request }) => {
    const res = await request.post("/api/chat", {
      data: { pergunta: "Como descartar antibióticos vencidos?" },
    })
    // 200 quando IA está saudável; 502/503/504 quando IA está fora — todos são contratos
    // esperados (e devem ser logados no AiPromptLog). 401/403 não devem ocorrer.
    expect([200, 502, 503, 504, 429]).toContain(res.status())

    if (res.status() === 200) {
      const body = (await res.json()) as { resposta?: string; messageId?: string }
      expect(body.resposta).toBeTruthy()
      expect(body.messageId).toMatch(/^[0-9a-f-]{36}$/i)
    }
  })

  test("página /app/chat existe ou redireciona para login", async ({ page }) => {
    const res = await page.goto("/app/chat")
    expect((res?.status() ?? 200) < 500).toBeTruthy()
  })
})
