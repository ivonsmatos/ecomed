// Coeficientes de impacto baseados em estudos ANVISA / PNRS
export const COEFICIENTES = {
  LITROS_AGUA_POR_CHECKIN: 450,
  KG_RESIDUO_POR_CHECKIN: 0.15,
  CO2_EVITADO_KG: 0.05, // emissões evitadas por descarte correto
}

export function calcularImpacto(checkins: number) {
  return {
    litrosAguaProtegidos: Math.round(checkins * COEFICIENTES.LITROS_AGUA_POR_CHECKIN),
    kgResiduoDescartado: +(checkins * COEFICIENTES.KG_RESIDUO_POR_CHECKIN).toFixed(1),
    co2EvitadoKg: +(checkins * COEFICIENTES.CO2_EVITADO_KG).toFixed(2),
  }
}
