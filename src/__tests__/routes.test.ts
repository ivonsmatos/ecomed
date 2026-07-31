import { describe, expect, it } from "vitest"
import { buildLoginUrl } from "@/lib/auth/urls"
import { APP_ROUTES } from "@/lib/routes"

describe("rotas internas", () => {
  it("preserva o callback do check-in com encoding", () => {
    expect(buildLoginUrl("/checkin?p=abc&x=1")).toBe(
      "/entrar?callbackUrl=%2Fcheckin%3Fp%3Dabc%26x%3D1",
    )
  })

  it("rejeita callbacks externos", () => {
    expect(() => buildLoginUrl("//evil.example")).toThrow()
    expect(() => buildLoginUrl("https://evil.example")).toThrow()
  })

  it("usa a rota autenticada de recompensas", () => {
    expect(APP_ROUTES.rewards).toBe("/app/recompensas")
  })
})
