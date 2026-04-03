export function EmailTemplate({
  partnerName,
  pointName,
}: Record<string, string>) {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        maxWidth: 600,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <span style={{ fontSize: 32 }}>🌿</span>
        <h1 style={{ color: "#15803d", margin: "8px 0 0" }}>EcoMed</h1>
      </div>

      <h2 style={{ color: "#1a1a1a" }}>Solicitação recebida!</h2>
      <p style={{ color: "#555", lineHeight: 1.6 }}>
        Olá, <strong>{partnerName}</strong>! Recebemos a solicitação de cadastro
        do ponto <strong>{pointName}</strong> e estamos analisando as
        informações.
      </p>
      <p style={{ color: "#555", lineHeight: 1.6 }}>
        Nossa equipe irá revisar os dados em até <strong>48 horas úteis</strong>
        . Você receberá um e-mail assim que a análise for concluída.
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
          💡 Enquanto isso, você pode acessar seu painel de parceiro e
          complementar as informações do ponto de coleta.
        </p>
      </div>

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
          Acessar painel
        </a>
      </div>

      <p style={{ color: "#999", fontSize: 12, textAlign: "center" }}>
        EcoMed — Descarte correto de medicamentos · ecomed.eco.br
      </p>
    </div>
  );
}
