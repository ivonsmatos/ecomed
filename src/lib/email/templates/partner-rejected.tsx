export function EmailTemplate({ partnerName, pointName, motivo }: Record<string, string>) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <span style={{ fontSize: 32 }}>🌿</span>
        <h1 style={{ color: "#15803d", margin: "8px 0 0" }}>EcoMed</h1>
      </div>

      <h2 style={{ color: "#1a1a1a" }}>Atualização sobre seu cadastro</h2>

      <p style={{ color: "#555", lineHeight: 1.6 }}>
        Olá, <strong>{partnerName}</strong>. Infelizmente o ponto{" "}
        <strong>{pointName}</strong> não pôde ser aprovado neste momento.
      </p>

      {motivo && (
        <div
          style={{
            backgroundColor: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: 8,
            padding: 16,
            margin: "24px 0",
          }}
        >
          <p style={{ color: "#c2410c", margin: 0, fontSize: 14, fontWeight: "bold" }}>
            Motivo informado pela equipe:
          </p>
          <p style={{ color: "#555", margin: "8px 0 0", fontSize: 14 }}>{motivo}</p>
        </div>
      )}

      <p style={{ color: "#555", lineHeight: 1.6 }}>
        Você pode corrigir as informações e reenviar a solicitação pelo painel de parceiro.
        Nossa equipe analisará novamente em até 48 horas úteis.
      </p>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <a
          href="https://ecomed.eco.br/parceiro/dashboard"
          style={{
            backgroundColor: "#15803d",
            color: "white",
            padding: "12px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Editar cadastro
        </a>
      </div>

      <p style={{ color: "#999", fontSize: 12, textAlign: "center" }}>
        EcoMed — Descarte correto de medicamentos · ecomed.eco.br
      </p>
    </div>
  );
}
