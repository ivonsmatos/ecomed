import { IMPACT_ASSUMPTIONS } from "./constants"

export function calcularImpacto(checkins: number) {
  const safeCheckins = Number.isFinite(checkins) ? Math.max(0, Math.trunc(checkins)) : 0
  return {
    checkins: safeCheckins,
    litrosAguaProtegidos: safeCheckins * IMPACT_ASSUMPTIONS.litersWaterPotentialPerCheckin,
    kgResiduoDescartado: IMPACT_ASSUMPTIONS.wasteKgPerCheckin,
    co2EvitadoKg: IMPACT_ASSUMPTIONS.co2KgPerCheckin,
    methodologyVersion: IMPACT_ASSUMPTIONS.version,
    estimated: true,
  }
}
