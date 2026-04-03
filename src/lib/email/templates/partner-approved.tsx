export function EmailTemplate({ partnerName, pointName, dashboardUrl }: Record<string, string>) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <span style={{ fontSize: 32 }}>🌿</span>
        <h1 style={{ color: "#15803d", margin: "8px 0 0" }}>EcoMed</h1>
      </div>

      <div style={{ textAlign: "center", fontSize: 48, marginBottom: 8 }}>✅</div>
      <h2 style={{ color: "#15803d", textAlign: "center" }}>Ponto aprovado!</h2>

      <p style={{ color: "#555", lineHeight: 1.6 }}>
        Olá, <strong>{partnerName}</strong>! Ótimas notícias: o ponto{" "}
        <strong>{pointName}</strong> foi aprovado e já está visível no mapa do EcoMed para
        todos os usuários.
      </p>

      <div
        style={{
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 8,
          padding: 16,
          margin: "24px 0",
        }}
      >
        <p style={{ color: "#15803d", margin: 0, fontSize: 14 }}>
          🗺️ Os usuários próximos já podem encontrar seu ponto de coleta no mapa interativo.
          Obrigado por contribuir com o descarte correto de medicamentos no Brasil!
        </p>
      </div>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <a
          href={dashboardUrl || "https://ecomed.eco.br/parceiro/dashboard"}
          style={{
            backgroundColor: "#15803d",
            color: "white",
            padding: "12px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Ver meu painel
        </a>
      </div>

      <p style={{ color: "#999", fontSize: 12, textAlign: "center" }}>
        EcoMed — Descarte correto de medicamentos · ecomed.eco.br
      </p>
    </div>
  );
}
