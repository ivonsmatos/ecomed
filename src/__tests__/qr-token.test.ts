import { beforeEach, describe, expect, it, vi } from "vitest"
import { gerarTokenPonto, validarTokenPonto } from "@/lib/qr/token"

describe("token QR de ponto", () => {
  beforeEach(() => {
    process.env.QR_HMAC_SECRET = "teste-segredo-qr-com-mais-de-32-caracteres"
  })

  it("valida um token assinado", () => {
    const token = gerarTokenPonto("point-1")
    expect(validarTokenPonto(token)?.pointId).toBe("point-1")
  })

  it("rejeita token adulterado", () => {
    const token = gerarTokenPonto("point-1")
    expect(validarTokenPonto(`${token}x`)).toBeNull()
  })

  it("rejeita token expirado", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01"))
    const token = gerarTokenPonto("point-1")
    vi.setSystemTime(new Date("2026-03-01"))
    expect(validarTokenPonto(token)).toBeNull()
    vi.useRealTimers()
  })
})
