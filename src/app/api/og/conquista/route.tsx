import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const nome = searchParams.get("nome") ?? "Usuário"
  const badge = searchParams.get("badge") ?? "Eco-Cidadão"
  const nivel = searchParams.get("nivel") ?? "Semente"

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#F7F9F8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          gap: 24,
        }}
      >
        <div style={{ fontSize: 72 }}>🌿</div>
        <div style={{ fontSize: 48, fontWeight: 700, color: "#2D7D46" }}>EcoMed</div>
        <div style={{ fontSize: 28, color: "#1A1A1A" }}>{nome} conquistou o badge</div>
        <div
          style={{
            background: "#2D7D46",
            color: "white",
            padding: "12px 32px",
            borderRadius: 24,
            fontSize: 32,
            fontWeight: 600,
          }}
        >
          {badge}
        </div>
        <div style={{ fontSize: 20, color: "#6B7280" }}>
          Nível {nivel} · Seu remédio tem destino certo.
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
