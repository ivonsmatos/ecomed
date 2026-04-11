import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════
const tokens = {
  colors: {
    teal: "#3E8C8C",
    tealDark: "#1A736A",
    green: "#24A645",
    lime: "#C7D93D",
    cream: "#D9D6D0",
    red: "#EF4444",
    amber: "#D97706",
    blue: "#2563EB",
    gray900: "#1A1A1A",
    gray600: "#4A4A4A",
    gray400: "#9CA3AF",
    gray200: "#E5E7EB",
    gray100: "#F3F4F6",
    gray50: "#F9FAFB",
    white: "#FFFFFF",
    bg: "#FAFAF8",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48, "3xl": 64 },
  radius: { sm: 6, md: 8, lg: 12, xl: 16, full: 9999 },
  fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 32, "4xl": 40 },
  fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
    lg: "0 4px 12px rgba(0,0,0,0.08)",
    xl: "0 12px 32px rgba(26,115,106,0.10)",
  },
  transition: { fast: "150ms ease", normal: "200ms ease", slow: "300ms ease" },
};

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
function Section({ id, title, icon, children }) {
  return (
    <section id={id} style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${tokens.colors.gray200}` }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: tokens.colors.tealDark, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SubSection({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: tokens.colors.gray900, marginBottom: 12 }}>{title}</h3>
      {children}
    </div>
  );
}

function TokenRow({ label, value, preview }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${tokens.colors.gray100}` }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.gray900, width: 120, flexShrink: 0 }}>{label}</span>
      <code style={{ fontSize: 12, color: tokens.colors.teal, background: tokens.colors.gray50, padding: "2px 8px", borderRadius: 4, fontFamily: "Consolas, monospace" }}>{value}</code>
      {preview && <div style={{ marginLeft: "auto" }}>{preview}</div>}
    </div>
  );
}

function ComponentDemo({ label, description, children, code }) {
  const [showCode, setShowCode] = useState(false);
  return (
    <div style={{ border: `1px solid ${tokens.colors.gray200}`, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "16px 20px", background: tokens.colors.white }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.gray900, marginBottom: 4 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: tokens.colors.gray400, marginBottom: 12 }}>{description}</div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>{children}</div>
      </div>
      {code && (
        <>
          <div style={{ borderTop: `1px solid ${tokens.colors.gray200}`, padding: "6px 20px", background: tokens.colors.gray50, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }} onClick={() => setShowCode(!showCode)}>
            <span style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.gray400, textTransform: "uppercase", letterSpacing: "0.06em" }}>Código</span>
            <span style={{ fontSize: 11, color: tokens.colors.gray400 }}>{showCode ? "▲" : "▼"}</span>
          </div>
          {showCode && (
            <div style={{ padding: "12px 20px", background: "#1E293B", fontFamily: "Consolas, monospace", fontSize: 12, color: "#E2E8F0", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {code}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// DESIGN SYSTEM COMPONENTS (live)
// ═══════════════════════════════════════

function DSButton({ variant = "primary", size = "md", disabled = false, loading = false, children }) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const styles = {
    primary: { bg: tokens.colors.green, color: "#fff", hoverBg: "#1E8E3A", activeBg: "#1A7A33" },
    secondary: { bg: tokens.colors.teal, color: "#fff", hoverBg: "#357A7A", activeBg: "#2D6B6B" },
    outline: { bg: "transparent", color: tokens.colors.teal, hoverBg: "rgba(62,140,140,0.08)", activeBg: "rgba(62,140,140,0.15)", border: `1.5px solid ${tokens.colors.teal}` },
    destructive: { bg: tokens.colors.red, color: "#fff", hoverBg: "#DC2626", activeBg: "#B91C1C" },
    ghost: { bg: "transparent", color: tokens.colors.gray600, hoverBg: tokens.colors.gray100, activeBg: tokens.colors.gray200 },
  };
  const sizes = {
    sm: { padding: "6px 14px", fontSize: 12, minHeight: 32 },
    md: { padding: "10px 20px", fontSize: 14, minHeight: 44 },
    lg: { padding: "14px 28px", fontSize: 16, minHeight: 52 },
  };
  const s = styles[variant];
  const sz = sizes[size];

  return (
    <button
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)} onMouseUp={() => setActive(false)}
      style={{
        background: disabled ? tokens.colors.gray200 : active ? s.activeBg : hover ? s.hoverBg : s.bg,
        color: disabled ? tokens.colors.gray400 : s.color,
        border: s.border || "none",
        borderRadius: tokens.radius.md,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: `all ${tokens.transition.fast}`,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        opacity: disabled ? 0.6 : 1,
        ...sz,
      }}
    >
      {loading && <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />}
      {children}
    </button>
  );
}

function DSBadge({ variant = "default", children }) {
  const styles = {
    default: { bg: tokens.colors.gray100, color: tokens.colors.gray600 },
    teal: { bg: "rgba(62,140,140,0.1)", color: tokens.colors.teal },
    green: { bg: "rgba(36,166,69,0.1)", color: tokens.colors.green },
    lime: { bg: "rgba(199,217,61,0.15)", color: "#6B7A00" },
    red: { bg: "rgba(239,68,68,0.1)", color: tokens.colors.red },
    amber: { bg: "rgba(217,119,6,0.1)", color: tokens.colors.amber },
  };
  const s = styles[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px",
      borderRadius: tokens.radius.full, fontSize: 12, fontWeight: 600,
      background: s.bg, color: s.color, fontFamily: "'Inter', sans-serif",
    }}>{children}</span>
  );
}

function DSInput({ placeholder, label, error, disabled, icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: tokens.colors.gray900 }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: tokens.colors.gray400 }}>{icon}</span>}
        <input
          placeholder={placeholder} disabled={disabled}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: `10px ${icon ? "12px 12px 36px" : "12px"}`,
            border: `1.5px solid ${error ? tokens.colors.red : focused ? tokens.colors.teal : tokens.colors.gray200}`,
            borderRadius: tokens.radius.md, fontSize: 14, fontFamily: "'Inter', sans-serif",
            outline: "none", color: tokens.colors.gray900,
            background: disabled ? tokens.colors.gray50 : tokens.colors.white,
            transition: `border-color ${tokens.transition.fast}`,
            boxShadow: focused ? `0 0 0 3px rgba(62,140,140,0.12)` : "none",
            cursor: disabled ? "not-allowed" : "text",
            boxSizing: "border-box",
          }}
        />
      </div>
      {error && <span style={{ fontSize: 12, color: tokens.colors.red }}>{error}</span>}
    </div>
  );
}

function DSCard({ children, hover = true }) {
  const [h, setH] = useState(false);
  return (
    <div
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: tokens.colors.white, borderRadius: tokens.radius.lg,
        border: `1px solid ${h && hover ? tokens.colors.teal : tokens.colors.gray200}`,
        padding: 20, transition: `all ${tokens.transition.slow}`,
        boxShadow: h && hover ? tokens.shadow.xl : tokens.shadow.md,
        transform: h && hover ? "translateY(-2px)" : "translateY(0)",
      }}
    >{children}</div>
  );
}

function DSToast({ variant = "success", children }) {
  const colors = { success: tokens.colors.green, error: tokens.colors.red, warning: tokens.colors.amber, info: tokens.colors.teal };
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px",
      borderRadius: tokens.radius.md, background: tokens.colors.white,
      border: `1px solid ${tokens.colors.gray200}`, boxShadow: tokens.shadow.lg,
      borderLeft: `4px solid ${colors[variant]}`,
    }}>
      <span>{icons[variant]}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: tokens.colors.gray900 }}>{children}</span>
    </div>
  );
}

function DSLevelBadge({ level }) {
  const config = {
    semente: { icon: "🌱", label: "Semente", color: "#C7D93D", bg: "rgba(199,217,61,0.12)" },
    broto: { icon: "🌿", label: "Broto", color: "#24A645", bg: "rgba(36,166,69,0.1)" },
    arvore: { icon: "🌳", label: "Árvore", color: "#3E8C8C", bg: "rgba(62,140,140,0.1)" },
    guardiao: { icon: "🌍", label: "Guardião", color: "#1A736A", bg: "rgba(26,115,106,0.1)" },
    lenda: { icon: "⭐", label: "Lenda Eco", color: "#D4A017", bg: "rgba(212,160,23,0.1)" },
  };
  const c = config[level];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px",
      borderRadius: tokens.radius.full, background: c.bg, border: `1px solid ${c.color}30`,
    }}>
      <span style={{ fontSize: 14 }}>{c.icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{c.label}</span>
    </span>
  );
}

function DSCoinToast({ amount }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px",
      borderRadius: tokens.radius.full, background: tokens.colors.tealDark,
      boxShadow: "0 4px 16px rgba(26,115,106,0.3)",
    }}>
      <span style={{ fontSize: 16 }}>🪙</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: "#C7D93D" }}>+{amount} EcoCoins</span>
    </div>
  );
}

function DSProgress({ value, max, color, label, size = "md" }) {
  const pct = Math.min(100, (value / max) * 100);
  const h = size === "sm" ? 6 : size === "md" ? 10 : 16;
  return (
    <div style={{ width: "100%" }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: tokens.colors.gray600 }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: tokens.colors.gray900 }}>{value}/{max}</span>
        </div>
      )}
      <div style={{ height: h, background: tokens.colors.gray100, borderRadius: h / 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color || tokens.colors.teal, borderRadius: h / 2, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function DSAvatar({ name, size = 36, src }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: src ? `url(${src}) center/cover` : `hsl(${hue}, 50%, 45%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: "#fff", fontFamily: "'Inter', sans-serif",
      flexShrink: 0,
    }}>
      {!src && initials}
    </div>
  );
}

function DSSkeleton({ width, height = 16, radius = 6 }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: `linear-gradient(90deg, ${tokens.colors.gray100} 25%, ${tokens.colors.gray50} 50%, ${tokens.colors.gray100} 75%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }} />
  );
}

// ═══════════════════════════════════════
// MAIN DESIGN SYSTEM PAGE
// ═══════════════════════════════════════
const NAV = [
  { id: "colors", label: "Cores", icon: "🎨" },
  { id: "typography", label: "Tipografia", icon: "🔤" },
  { id: "spacing", label: "Espaçamento", icon: "📐" },
  { id: "buttons", label: "Botões", icon: "🔘" },
  { id: "inputs", label: "Inputs", icon: "📝" },
  { id: "cards", label: "Cards", icon: "🃏" },
  { id: "badges", label: "Badges", icon: "🏷️" },
  { id: "feedback", label: "Feedback", icon: "💬" },
  { id: "gamification", label: "Gamificação", icon: "🪙" },
  { id: "patterns", label: "Padrões", icon: "🧩" },
];

export default function DesignSystem() {
  const [active, setActive] = useState("colors");

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: tokens.colors.bg, minHeight: "100vh" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ background: tokens.colors.tealDark, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontSize: 20 }}>🌿</span>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>EcoMed</span>
        <span style={{ fontSize: 13, color: tokens.colors.lime, fontWeight: 500 }}>Design System v1.0</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Referência para 3TC-G1 e 3TA-G4</span>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 50px)" }}>
        {/* Sidebar */}
        <nav style={{ width: 180, background: "#fff", borderRight: `1px solid ${tokens.colors.gray200}`, padding: "12px 0", flexShrink: 0, position: "sticky", top: 50, height: "calc(100vh - 50px)", overflowY: "auto" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setActive(n.id)} style={{
              width: "100%", padding: "8px 16px", border: "none", background: active === n.id ? "rgba(62,140,140,0.08)" : "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13,
              fontWeight: active === n.id ? 600 : 400, color: active === n.id ? tokens.colors.tealDark : tokens.colors.gray600,
              borderRight: active === n.id ? `2px solid ${tokens.colors.tealDark}` : "2px solid transparent",
              transition: `all ${tokens.transition.fast}`, textAlign: "left", fontFamily: "'Inter', sans-serif",
            }}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main style={{ flex: 1, padding: "24px 32px", maxWidth: 800 }}>
          {active === "colors" && (
            <Section id="colors" title="Paleta de Cores" icon="🎨">
              <SubSection title="Cores Principais">
                {[
                  { name: "Teal (Principal)", token: "--eco-teal", hex: tokens.colors.teal, use: "Botões secundários, links, ícones, destaques" },
                  { name: "Teal Dark", token: "--eco-teal-dark", hex: tokens.colors.tealDark, use: "Headers, fundos escuros, texto de ênfase" },
                  { name: "Green (CTA)", token: "--eco-green", hex: tokens.colors.green, use: "CTAs, confirmações, sucesso" },
                  { name: "Lime", token: "--eco-lime", hex: tokens.colors.lime, use: "Badges, gamificação, EcoCoins, destaques" },
                  { name: "Cream", token: "--eco-cream", hex: tokens.colors.cream, use: "Fundos de cards, áreas neutras" },
                  { name: "Red", token: "--eco-red", hex: tokens.colors.red, use: "Erros, avisos críticos, destructive" },
                ].map((c, i) => (
                  <TokenRow key={i} label={c.name} value={`${c.token}: ${c.hex}`}
                    preview={<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 40, height: 24, borderRadius: 4, background: c.hex, border: `1px solid ${tokens.colors.gray200}` }} />
                      <span style={{ fontSize: 11, color: tokens.colors.gray400 }}>{c.use}</span>
                    </div>} />
                ))}
              </SubSection>
              <SubSection title="Neutros">
                {[
                  { name: "Gray 900", hex: tokens.colors.gray900, use: "Texto principal" },
                  { name: "Gray 600", hex: tokens.colors.gray600, use: "Texto secundário" },
                  { name: "Gray 400", hex: tokens.colors.gray400, use: "Placeholders" },
                  { name: "Gray 200", hex: tokens.colors.gray200, use: "Bordas, divisores" },
                  { name: "Gray 100", hex: tokens.colors.gray100, use: "Backgrounds hover" },
                  { name: "White", hex: tokens.colors.white, use: "Fundo principal" },
                ].map((c, i) => (
                  <TokenRow key={i} label={c.name} value={c.hex}
                    preview={<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 40, height: 24, borderRadius: 4, background: c.hex, border: `1px solid ${tokens.colors.gray200}` }} />
                      <span style={{ fontSize: 11, color: tokens.colors.gray400 }}>{c.use}</span>
                    </div>} />
                ))}
              </SubSection>
              <div style={{ padding: 12, background: "rgba(239,68,68,0.06)", borderRadius: 8, border: `1px solid rgba(239,68,68,0.15)`, marginTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.red }}>⚠️ Regra: NÃO usar gradientes. Todas as cores são sólidas.</span>
              </div>
            </Section>
          )}

          {active === "typography" && (
            <Section id="typography" title="Tipografia" icon="🔤">
              <SubSection title="Família: Inter">
                <p style={{ fontSize: 13, color: tokens.colors.gray600, marginBottom: 16 }}>
                  Fonte: <code style={{ background: tokens.colors.gray50, padding: "2px 6px", borderRadius: 3, fontSize: 12 }}>
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif</code>
                </p>
              </SubSection>
              <SubSection title="Hierarquia">
                {[
                  { tag: "H1", size: "40px (2.5rem)", weight: 700, sample: "Descarte certo, planeta saudável" },
                  { tag: "H2", size: "32px (2rem)", weight: 600, sample: "Como funciona o EcoMed" },
                  { tag: "H3", size: "24px (1.5rem)", weight: 600, sample: "Mapa de pontos de coleta" },
                  { tag: "H4", size: "20px (1.25rem)", weight: 500, sample: "Seus EcoCoins esta semana" },
                  { tag: "Body", size: "16px (1rem)", weight: 400, sample: "O descarte correto de medicamentos protege rios, solo e a sua saúde." },
                  { tag: "Small", size: "14px (0.875rem)", weight: 400, sample: "Última atualização: há 2 horas" },
                  { tag: "Caption", size: "12px (0.75rem)", weight: 400, sample: "Fonte: ANVISA, 2024" },
                ].map((t, i) => (
                  <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${tokens.colors.gray100}` }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: tokens.colors.teal, width: 50 }}>{t.tag}</span>
                      <code style={{ fontSize: 11, color: tokens.colors.gray400 }}>{t.size} / fw:{t.weight}</code>
                    </div>
                    <p style={{ fontSize: parseInt(t.size), fontWeight: t.weight, color: tokens.colors.gray900, margin: 0, lineHeight: 1.3 }}>{t.sample}</p>
                  </div>
                ))}
              </SubSection>
            </Section>
          )}

          {active === "spacing" && (
            <Section id="spacing" title="Espaçamento e Radius" icon="📐">
              <SubSection title="Escala de Espaçamento">
                {Object.entries(tokens.spacing).map(([k, v]) => (
                  <TokenRow key={k} label={k} value={`${v}px`}
                    preview={<div style={{ width: v, height: 16, background: tokens.colors.teal, borderRadius: 2, opacity: 0.4 }} />} />
                ))}
              </SubSection>
              <SubSection title="Border Radius">
                {Object.entries(tokens.radius).map(([k, v]) => (
                  <TokenRow key={k} label={k} value={`${v}px`}
                    preview={<div style={{ width: 40, height: 40, background: tokens.colors.gray100, border: `2px solid ${tokens.colors.teal}`, borderRadius: v }} />} />
                ))}
              </SubSection>
              <SubSection title="Sombras">
                {Object.entries(tokens.shadow).map(([k, v]) => (
                  <TokenRow key={k} label={k} value={v.slice(0, 30) + "..."}
                    preview={<div style={{ width: 60, height: 30, background: "#fff", borderRadius: 6, boxShadow: v }} />} />
                ))}
              </SubSection>
            </Section>
          )}

          {active === "buttons" && (
            <Section id="buttons" title="Botões" icon="🔘">
              <ComponentDemo label="Variantes" description="5 variantes para diferentes contextos" code={`<DSButton variant="primary">Começar Agora</DSButton>\n<DSButton variant="secondary">Saiba Mais</DSButton>\n<DSButton variant="outline">Cancelar</DSButton>\n<DSButton variant="destructive">Excluir</DSButton>\n<DSButton variant="ghost">Pular</DSButton>`}>
                <DSButton variant="primary">Começar Agora</DSButton>
                <DSButton variant="secondary">Saiba Mais</DSButton>
                <DSButton variant="outline">Cancelar</DSButton>
                <DSButton variant="destructive">Excluir</DSButton>
                <DSButton variant="ghost">Pular</DSButton>
              </ComponentDemo>
              <ComponentDemo label="Tamanhos" description="sm (32px), md (44px), lg (52px) — mínimo 44px para acessibilidade">
                <DSButton size="sm">Small</DSButton>
                <DSButton size="md">Medium</DSButton>
                <DSButton size="lg">Large</DSButton>
              </ComponentDemo>
              <ComponentDemo label="Estados" description="Hover (interaja), disabled, loading">
                <DSButton>Normal (hover me)</DSButton>
                <DSButton disabled>Disabled</DSButton>
                <DSButton loading>Enviando...</DSButton>
              </ComponentDemo>
            </Section>
          )}

          {active === "inputs" && (
            <Section id="inputs" title="Inputs" icon="📝">
              <ComponentDemo label="Estados do Input" description="Normal, focused (clique), error, disabled" code={`<DSInput label="E-mail" placeholder="seu@email.com" />\n<DSInput label="Nome" error="Campo obrigatório" />\n<DSInput label="Bloqueado" disabled />`}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
                  <DSInput label="E-mail" placeholder="seu@email.com" />
                  <DSInput label="Buscar ponto de coleta" placeholder="CEP ou endereço" icon="📍" />
                  <DSInput label="Nome" placeholder="Seu nome" error="Campo obrigatório" />
                  <DSInput label="Bloqueado" placeholder="Não editável" disabled />
                </div>
              </ComponentDemo>
            </Section>
          )}

          {active === "cards" && (
            <Section id="cards" title="Cards" icon="🃏">
              <ComponentDemo label="Card Padrão" description="Hover para ver elevação + borda teal">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: "100%" }}>
                  <DSCard>
                    <div style={{ fontSize: 14, fontWeight: 700, color: tokens.colors.gray900, marginBottom: 6 }}>📖 Como descartar insulina</div>
                    <div style={{ fontSize: 12, color: tokens.colors.gray600 }}>Guia completo para descarte seguro de perfurocortantes</div>
                    <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                      <DSBadge variant="teal">5 min</DSBadge>
                      <DSBadge variant="lime">+2 🪙</DSBadge>
                    </div>
                  </DSCard>
                  <DSCard>
                    <div style={{ fontSize: 14, fontWeight: 700, color: tokens.colors.gray900, marginBottom: 6 }}>🧠 Quiz: Mitos do Descarte</div>
                    <div style={{ fontSize: 12, color: tokens.colors.gray600 }}>Teste seus conhecimentos sobre descarte correto</div>
                    <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                      <DSBadge variant="green">Fácil</DSBadge>
                      <DSBadge variant="lime">+5-10 🪙</DSBadge>
                    </div>
                  </DSCard>
                </div>
              </ComponentDemo>
            </Section>
          )}

          {active === "badges" && (
            <Section id="badges" title="Badges" icon="🏷️">
              <ComponentDemo label="Variantes de Badge" description="6 variantes para diferentes contextos">
                <DSBadge>Default</DSBadge>
                <DSBadge variant="teal">Teal</DSBadge>
                <DSBadge variant="green">Sucesso</DSBadge>
                <DSBadge variant="lime">EcoCoin</DSBadge>
                <DSBadge variant="red">Erro</DSBadge>
                <DSBadge variant="amber">Alerta</DSBadge>
              </ComponentDemo>
              <ComponentDemo label="Níveis EcoMed" description="Badges de nível do sistema de gamificação">
                <DSLevelBadge level="semente" />
                <DSLevelBadge level="broto" />
                <DSLevelBadge level="arvore" />
                <DSLevelBadge level="guardiao" />
                <DSLevelBadge level="lenda" />
              </ComponentDemo>
              <ComponentDemo label="Avatares" description="Gerados por iniciais com cores únicas por nome">
                <DSAvatar name="Maria Silva" />
                <DSAvatar name="João Carlos" />
                <DSAvatar name="Ana Beatriz" />
                <DSAvatar name="Carlos Eduardo" size={44} />
              </ComponentDemo>
            </Section>
          )}

          {active === "feedback" && (
            <Section id="feedback" title="Feedback" icon="💬">
              <ComponentDemo label="Toasts" description="4 variantes: success, error, warning, info">
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                  <DSToast variant="success">Descarte registrado com sucesso!</DSToast>
                  <DSToast variant="error">Erro ao salvar. Tente novamente.</DSToast>
                  <DSToast variant="warning">Você atingiu o limite diário de 120 EcoCoins.</DSToast>
                  <DSToast variant="info">Nova missão disponível: Quiz relâmpago.</DSToast>
                </div>
              </ComponentDemo>
              <ComponentDemo label="Progress Bars" description="3 tamanhos: sm, md, lg">
                <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
                  <DSProgress value={320} max={500} label="Progresso para Árvore 🌳" color={tokens.colors.teal} />
                  <DSProgress value={42} max={100} label="Missões da semana" color={tokens.colors.green} size="sm" />
                  <DSProgress value={87} max={100} label="Leitura do artigo" color={tokens.colors.lime} size="lg" />
                </div>
              </ComponentDemo>
              <ComponentDemo label="Skeletons (Loading)" description="Placeholder animado enquanto dados carregam">
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                  <DSSkeleton width="60%" height={20} />
                  <DSSkeleton width="100%" height={14} />
                  <DSSkeleton width="80%" height={14} />
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <DSSkeleton width={60} height={24} radius={12} />
                    <DSSkeleton width={80} height={24} radius={12} />
                  </div>
                </div>
              </ComponentDemo>
            </Section>
          )}

          {active === "gamification" && (
            <Section id="gamification" title="Gamificação (EcoCoin)" icon="🪙">
              <ComponentDemo label="EcoCoin Toast" description="Animação de ganho de EcoCoins (aparece e desaparece)">
                <DSCoinToast amount={10} />
                <DSCoinToast amount={20} />
                <DSCoinToast amount={5} />
              </ComponentDemo>
              <ComponentDemo label="Card de Missão" description="Missão diária com progresso">
                <div style={{ width: "100%" }}>
                  <DSCard>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>📖</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.gray900 }}>Leitor do dia</div>
                          <div style={{ fontSize: 11, color: tokens.colors.gray400 }}>Ler 1 artigo completo</div>
                        </div>
                      </div>
                      <DSBadge variant="lime">+3 🪙</DSBadge>
                    </div>
                    <DSProgress value={0} max={1} color={tokens.colors.teal} size="sm" />
                  </DSCard>
                </div>
              </ComponentDemo>
              <ComponentDemo label="Widget de Coins (Header)" description="Componente compacto para navbar">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(62,140,140,0.08)", borderRadius: tokens.radius.full, border: `1px solid rgba(62,140,140,0.15)` }}>
                  <span style={{ fontSize: 14 }}>🪙</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: tokens.colors.tealDark }}>320</span>
                </div>
              </ComponentDemo>
              <ComponentDemo label="Card de Impacto" description="Dashboard pessoal do usuário">
                <DSCard hover={false}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, textAlign: "center" }}>
                    {[
                      { icon: "💊", value: "12", label: "descartes" },
                      { icon: "💧", value: "5.4M", label: "litros protegidos" },
                      { icon: "🪙", value: "320", label: "EcoCoins" },
                    ].map((s, i) => (
                      <div key={i}>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: tokens.colors.tealDark }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: tokens.colors.gray400 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </DSCard>
              </ComponentDemo>
            </Section>
          )}

          {active === "patterns" && (
            <Section id="patterns" title="Padrões de Uso" icon="🧩">
              <SubSection title="Regras Gerais">
                {[
                  "Mobile-first: sempre estilizar para 320px primeiro, depois media queries",
                  "Min-height 44px em todos os elementos interativos (WCAG acessibilidade)",
                  "Máximo 75 caracteres por linha de texto para legibilidade",
                  "Sem gradientes — todas as cores são sólidas",
                  "Emojis permitidos em gamificação e missões; evitar em artigos longos",
                  "Animações: max 300ms, ease timing, respeitar prefers-reduced-motion",
                  "Focus visible: ring de 3px rgba(62,140,140,0.3) em todos os interativos",
                  "Textos sobre fundo escuro: sempre branco (#FFFFFF), nunca cinza claro",
                  "Textos sobre fundo claro: sempre gray-900 (#1A1A1A) para títulos, gray-600 para body",
                  "EcoCoin (não EcoMed Coin): sempre uma palavra, E e C maiúsculos",
                ].map((r, i) => (
                  <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${tokens.colors.gray100}`, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 11, color: tokens.colors.teal, fontWeight: 700, flexShrink: 0 }}>#{i + 1}</span>
                    <span style={{ fontSize: 13, color: tokens.colors.gray600 }}>{r}</span>
                  </div>
                ))}
              </SubSection>

              <SubSection title="Breakpoints">
                {[
                  { bp: "Mobile", range: "320px – 767px", cols: "1 coluna", nav: "Bottom nav" },
                  { bp: "Tablet", range: "768px – 1023px", cols: "2 colunas", nav: "Sidebar opcional" },
                  { bp: "Desktop", range: "1024px+", cols: "Multi-coluna, max-w 1280px", nav: "Nav horizontal" },
                ].map((b, i) => (
                  <TokenRow key={i} label={b.bp} value={b.range}
                    preview={<span style={{ fontSize: 11, color: tokens.colors.gray400 }}>{b.cols} | {b.nav}</span>} />
                ))}
              </SubSection>

              <SubSection title="Micro-interações">
                {[
                  { trigger: "Hover em card", anim: "translateY(-2px) + shadow xl + border teal", duration: "300ms ease" },
                  { trigger: "Hover em botão", anim: "background darken 10%", duration: "150ms ease" },
                  { trigger: "Focus em input", anim: "border teal + ring 3px rgba(teal, 0.12)", duration: "150ms ease" },
                  { trigger: "Ganhar EcoCoins", anim: "Toast sobe + fade in → 3s visível → fade out", duration: "400ms ease-out" },
                  { trigger: "Level up", anim: "Modal com confetti + badge animado + shake", duration: "600ms spring" },
                  { trigger: "Completar missão", anim: "Checkmark draw animation + badge pulse", duration: "500ms ease" },
                  { trigger: "Streak fire icon", anim: "Pulse scale 1.0 → 1.15 → 1.0", duration: "800ms ease, loop" },
                  { trigger: "Skeleton loading", anim: "Shimmer gradient slide left→right", duration: "1.5s linear, loop" },
                  { trigger: "Page transition", anim: "Fade up: opacity 0→1 + translateY 12→0", duration: "300ms ease" },
                ].map((m, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${tokens.colors.gray100}`, display: "grid", gridTemplateColumns: "140px 1fr 100px", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.gray900 }}>{m.trigger}</span>
                    <span style={{ fontSize: 12, color: tokens.colors.gray600 }}>{m.anim}</span>
                    <code style={{ fontSize: 10, color: tokens.colors.teal, background: tokens.colors.gray50, padding: "2px 6px", borderRadius: 3 }}>{m.duration}</code>
                  </div>
                ))}
              </SubSection>
            </Section>
          )}
        </main>
      </div>
    </div>
  );
}
