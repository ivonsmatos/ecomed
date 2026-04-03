export function EmailTemplate({
  partnerName,
  pointName,
  tipo,
  descricao,
}: Record<string, string>) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <span style={{ fontSize: 32 }}>🌿</span>
        <h1 style={{ color: "#15803d", margin: "8px 0 0" }}>EcoMed</h1>
      </div>

      <h2 style={{ color: "#1a1a1a" }}>Novo problema reportado no seu ponto</h2>

      <p style={{ color: "#555", lineHeight: 1.6 }}>
        Olá, <strong>{partnerName}</strong>. Um usuário reportou um problema no ponto{" "}
        <strong>{pointName}</strong>.
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
        <p style={{ color: "#166534", margin: 0, fontSize: 14, fontWeight: "bold" }}>
          Tipo de problema: {tipo}
        </p>
        {descricao && (
          <p style={{ color: "#555", margin: "8px 0 0", fontSize: 14 }}>{descricao}</p>
        )}
      </div>

      <p style={{ color: "#555", lineHeight: 1.6 }}>
        Verifique as informações do seu ponto e, se necessário, atualize os dados ou entre em
        contato com nossa equipe.
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
          Ver painel do parceiro
        </a>
      </div>

      <p style={{ color: "#999", fontSize: 12, textAlign: "center" }}>
        EcoMed — Descarte correto de medicamentos · ecomed.eco.br
      </p>
    </div>
  );
}
