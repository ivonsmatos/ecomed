export function EmailTemplate({ name, resetUrl }: Record<string, string>) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <span style={{ fontSize: 32 }}>🌿</span>
        <h1 style={{ color: "#15803d", margin: "8px 0 0" }}>EcoMed</h1>
      </div>

      <h2 style={{ color: "#1a1a1a" }}>Redefinir sua senha</h2>

      <p style={{ color: "#555", lineHeight: 1.6 }}>
        Olá, <strong>{name}</strong>. Recebemos uma solicitação para redefinir a senha da
        sua conta EcoMed.
      </p>

      <p style={{ color: "#555", lineHeight: 1.6 }}>
        Clique no botão abaixo para criar uma nova senha. Este link expira em{" "}
        <strong>1 hora</strong>.
      </p>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <a
          href={resetUrl}
          style={{
            backgroundColor: "#15803d",
            color: "white",
            padding: "12px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Redefinir senha
        </a>
      </div>

      <div
        style={{
          backgroundColor: "#f5f5f5",
          borderRadius: 8,
          padding: 16,
          margin: "24px 0",
        }}
      >
        <p style={{ color: "#555", margin: 0, fontSize: 13 }}>
          Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
        </p>
        <p style={{ color: "#15803d", margin: "8px 0 0", fontSize: 12, wordBreak: "break-all" }}>
          {resetUrl}
        </p>
      </div>

      <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6 }}>
        Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece
        a mesma.
      </p>

      <p style={{ color: "#999", fontSize: 12, textAlign: "center" }}>
        EcoMed — Descarte correto de medicamentos · ecomed.eco.br
      </p>
    </div>
  );
}
