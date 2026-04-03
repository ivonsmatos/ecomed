export function EmailTemplate({ name }: Record<string, string>) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <span style={{ fontSize: 32 }}>🌿</span>
        <h1 style={{ color: "#15803d", margin: "8px 0 0" }}>EcoMed</h1>
      </div>

      <h2 style={{ color: "#1a1a1a" }}>Bem-vindo(a), {name || "usuário"}!</h2>
      <p style={{ color: "#555", lineHeight: 1.6 }}>
        Obrigado por se cadastrar no EcoMed. Agora você pode:
      </p>
      <ul style={{ color: "#555", lineHeight: 2 }}>
        <li>Encontrar pontos de coleta de medicamentos perto de você</li>
        <li>Salvar pontos favoritos para acesso offline</li>
        <li>Reportar problemas em pontos de coleta</li>
        <li>Conversar com nosso assistente de IA sobre descarte correto</li>
      </ul>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <a
          href="https://ecomed.eco.br/mapa"
          style={{
            backgroundColor: "#15803d",
            color: "white",
            padding: "12px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Explorar o mapa
        </a>
      </div>

      <p style={{ color: "#999", fontSize: 12, textAlign: "center" }}>
        EcoMed — Descarte correto de medicamentos · ecomed.eco.br
      </p>
    </div>
  );
}
