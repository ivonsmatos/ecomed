import { getKpiData } from "./getData"
import KpisClient from "./kpis-client"

export const metadata = { title: "KPIs — EcoMed Admin" }
export const revalidate = 300 // Revalida a cada 5 minutos

export default async function KPIsPage() {
  const data = await getKpiData()
  return <KpisClient data={data} />
}
