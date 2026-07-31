import { describe, expect, it } from "vitest"
import { calcularImpacto, IMPACT_ASSUMPTIONS } from "@/lib/impacto"

describe("metodologia de impacto", () => {
  it("centraliza a estimativa e não inventa massa ou CO2", () => {
    expect(calcularImpacto(2)).toMatchObject({
      litrosAguaProtegidos: 2 * IMPACT_ASSUMPTIONS.litersWaterPotentialPerCheckin,
      kgResiduoDescartado: null,
      co2EvitadoKg: null,
      methodologyVersion: IMPACT_ASSUMPTIONS.version,
    })
  })

  it("normaliza entradas inválidas", () => {
    expect(calcularImpacto(-4).checkins).toBe(0)
  })
})
