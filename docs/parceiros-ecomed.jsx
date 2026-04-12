import { useState } from "react";

const c = {
  teal: "#3E8C8C", tealDark: "#1A736A", green: "#24A645",
  lime: "#C7D93D", cream: "#D9D6D0", g9: "#1A1A1A",
  g6: "#4A4A4A", g4: "#9CA3AF", g2: "#E5E7EB",
  g50: "#F9FAFB", white: "#FFFFFF", bg: "#FAFAF8",
  red: "#EF4444",
};

function Section({ children, bg = c.white, id }) {
  return (
    <section id={id} style={{ background: bg, padding: "64px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>{children}</div>
    </section>
  );
}
function Label({ children, color }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: color || c.teal, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{children}</div>;
}
function Title({ children, align = "left", color }) {
  return <h2 style={{ fontSize: 32, fontWeight: 800, color: color || c.g9, marginBottom: 16, lineHeight: 1.2, textAlign: align, letterSpacing: "-0.02em" }}>{children}</h2>;
}
function HoverCard({ children, style = {}, accentColor }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: c.white, borderRadius: 14, padding: 24, border: `1px solid ${h ? (accentColor || c.teal) : c.g2}`,
        boxShadow: h ? "0 12px 32px rgba(26,115,106,0.10)" : "0 1px 3px rgba(0,0,0,0.04)",
        transform: h ? "translateY(-2px)" : "none", transition: "all 0.3s ease",
        borderTop: accentColor ? `4px solid ${accentColor}` : undefined, ...style }}>
      {children}
    </div>
  );
}

function StepNumber({ num, color }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: c.white, flexShrink: 0 }}>
      {num}
    </div>
  );
}

function FormField({ label, type = "text", placeholder, required, options }) {
  const [focused, setFocused] = useState(false);
  const baseStyle = {
    width: "100%", padding: "10px 14px", border: `1.5px solid ${focused ? c.teal : c.g2}`,
    borderRadius: 8, fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none",
    color: c.g9, background: c.white, transition: "border-color 0.15s ease",
    boxShadow: focused ? "0 0 0 3px rgba(62,140,140,0.12)" : "none", boxSizing: "border-box",
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: c.g9, marginBottom: 4 }}>
        {label} {required && <span style={{ color: c.red }}>*</span>}
      </label>
      {type === "textarea" ? (
        <textarea placeholder={placeholder} rows={4} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...baseStyle, resize: "vertical" }} />
      ) : type === "select" ? (
        <select onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ ...baseStyle, cursor: "pointer" }}>
          <option value="">{placeholder}</option>
          {options.map((o, i) => <option key={i} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={baseStyle} />
      )}
    </div>
  );
}

const PARTNER_TYPES = [
  {
    icon: "🏥", title: "Farmácias", color: c.green,
    offer: "Visibilidade no mapa com selo \"Farmácia Parceira EcoMed\", relatório mensal de tráfego direcionado, material educativo digital para clientes.",
    ask: "Ponto de coleta ativo, QR Code no balcão, validação de dados.",
    revenue: "Gratuito no MVP. V1.0: R$ 50–150/mês (selo + relatório).",
    cta: "Cadastre sua farmácia",
  },
  {
    icon: "🏭", title: "Indústria Farmacêutica", color: c.tealDark,
    offer: "Relatório de impacto ESG trimestral com dados reais, missões temáticas patrocinadas com branding, compliance com Decreto 10.388.",
    ask: "Financiamento (grant/patrocínio), dados agregados para compliance, divulgação interna.",
    revenue: "R$ 2–5k/trimestre (relatório ESG + missões).",
    cta: "Solicite relatório demo",
  },
  {
    icon: "🏫", title: "Escolas e Universidades", color: c.teal,
    offer: "Quizzes educativos prontos para aula, desafios entre turmas com ranking, certificados para alunos, dados para pesquisa acadêmica.",
    ask: "Alunos como usuários, validação acadêmica, contribuições open source.",
    revenue: "Gratuito (troca de valor educacional).",
    cta: "Leve o EcoMed para sua escola",
  },
  {
    icon: "🏛️", title: "Secretarias de Saúde", color: "#2563EB",
    offer: "Ferramenta gratuita de educação em descarte, dados agregados por região, material para UBS e agentes comunitários.",
    ask: "Divulgação em UBS (QR Code), dados oficiais de pontos de coleta, carta de apoio institucional.",
    revenue: "Gratuito (parceria institucional).",
    cta: "Agende uma apresentação",
  },
  {
    icon: "🌿", title: "ONGs Ambientais", color: "#059669",
    offer: "Co-branding em eventos e campanhas, missões especiais no app, dados de impacto ambiental, divulgação cruzada.",
    ask: "Alcance nas redes sociais, legitimidade ambiental, eventos conjuntos.",
    revenue: "Gratuito (troca de divulgação).",
    cta: "Proponha uma campanha",
  },
];

export default function ParceirosPage() {
  const [selectedType, setSelectedType] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: c.bg }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* HERO */}
      <section style={{ background: c.tealDark, padding: "80px 24px 64px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 350, height: 350, borderRadius: "50%", background: c.green, opacity: 0.1 }} />
        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <Label color={c.lime}>Parcerias</Label>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: c.white, lineHeight: 1.15, marginBottom: 20, maxWidth: 700, letterSpacing: "-0.02em" }}>
            Juntos pelo descarte consciente
          </h1>
          <p style={{ fontSize: 18, color: c.cream, lineHeight: 1.6, maxWidth: 600 }}>
            O EcoMed conecta farmácias, indústria, escolas, governo e ONGs em uma rede de impacto ambiental. Cada parceiro amplifica o alcance da educação sobre descarte correto.
          </p>
          <div style={{ display: "flex", gap: 24, marginTop: 32, flexWrap: "wrap" }}>
            {[{v:"7.500+",l:"pontos de coleta"},{v:"6",l:"ODS da ONU"},{v:"R$ 0",l:"custo para começar"}].map((s,i)=>(
              <div key={i}>
                <div style={{ fontSize: 28, fontWeight: 800, color: c.lime }}>{s.v}</div>
                <div style={{ fontSize: 12, color: c.cream }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POR QUE SER PARCEIRO */}
      <Section id="porque">
        <Label>Por que ser parceiro?</Label>
        <Title>O EcoMed entrega valor real</Title>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginTop: 24 }}>
          {[
            {i:"📊",t:"Relatórios de Impacto",d:"Dados mensuráveis de descarte, litros protegidos e engajamento — prontos para relatório ESG."},
            {i:"📍",t:"Visibilidade no Mapa",d:"Sua farmácia ou instituição aparece para milhares de usuários buscando onde descartar."},
            {i:"🎯",t:"Tráfego Qualificado",d:"Usuários chegam até você com intenção real de descartar — potencial de up-sell natural."},
            {i:"🏅",t:"Selo de Parceiro",d:"Badge \"Parceiro EcoMed\" visível no mapa, site e materiais — diferenciação competitiva."},
            {i:"📚",t:"Material Educativo",d:"Artigos, quizzes e infográficos prontos para compartilhar com clientes, alunos ou comunidade."},
            {i:"🌍",t:"Impacto Ambiental Real",d:"Cada parceria contribui diretamente para os ODS 3, 6 e 12. Dados públicos e verificáveis."},
          ].map((item,i)=>(
            <HoverCard key={i}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{item.i}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: c.g9, marginBottom: 6 }}>{item.t}</h3>
              <p style={{ fontSize: 14, color: c.g6, lineHeight: 1.5 }}>{item.d}</p>
            </HoverCard>
          ))}
        </div>
      </Section>

      {/* TIPOS DE PARCERIA */}
      <Section bg={c.g50} id="tipos">
        <Label>Tipos de Parceria</Label>
        <Title>Encontre o modelo certo para você</Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 24 }}>
          {PARTNER_TYPES.map((pt, i) => (
            <HoverCard key={i} accentColor={pt.color}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>{pt.icon}</span>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: c.g9 }}>{pt.title}</h3>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c.teal, marginBottom: 4 }}>O QUE OFERECEMOS</div>
                    <p style={{ fontSize: 13, color: c.g6, lineHeight: 1.5 }}>{pt.offer}</p>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c.teal, marginBottom: 4 }}>O QUE PEDIMOS</div>
                    <p style={{ fontSize: 13, color: c.g6, lineHeight: 1.5 }}>{pt.ask}</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ background: c.g50, borderRadius: 10, padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c.g4, marginBottom: 4 }}>INVESTIMENTO</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.g9 }}>{pt.revenue}</div>
                  </div>
                  <button onClick={() => { setSelectedType(pt.title); document.getElementById("formulario")?.scrollIntoView({behavior:"smooth"}); }}
                    style={{ background: pt.color, color: c.white, border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}>
                    {pt.cta} →
                  </button>
                </div>
              </div>
            </HoverCard>
          ))}
        </div>
      </Section>

      {/* COMO FUNCIONA */}
      <Section id="como-funciona">
        <Label>Como Funciona</Label>
        <Title>Da conversa ao impacto em 4 passos</Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 24, maxWidth: 600 }}>
          {[
            {n:"1",t:"Primeiro Contato",d:"Preencha o formulário abaixo ou envie e-mail para parcerias@ecomed.eco.br. Respondemos em até 48h.",cl:c.green},
            {n:"2",t:"Apresentação",d:"Agendamos uma reunião de 15 minutos (presencial ou vídeo) para mostrar o EcoMed e entender suas necessidades.",cl:c.teal},
            {n:"3",t:"Ativação",d:"Cadastramos seu ponto no mapa, geramos QR Code personalizado e entregamos material impresso com selo de parceiro.",cl:c.tealDark},
            {n:"4",t:"Acompanhamento",d:"Enviamos relatório mensal de impacto com métricas de tráfego, descartes e litros de água protegidos.",cl:"#D4A017"},
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <StepNumber num={s.n} color={s.cl} />
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: c.g9, marginBottom: 4 }}>{s.t}</h3>
                <p style={{ fontSize: 14, color: c.g6, lineHeight: 1.5 }}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* IMPACTO DOS PARCEIROS */}
      <Section bg={c.tealDark} id="impacto-parceiros">
        <Label color={c.lime}>Impacto dos Parceiros</Label>
        <Title color={c.white}>Números que importam</Title>
        <p style={{ fontSize: 16, color: c.cream, lineHeight: 1.7, marginBottom: 32, maxWidth: 600 }}>
          Cada farmácia parceira no mapa do EcoMed direciona usuários ativamente para o descarte correto. Esses são os resultados que compartilhamos no relatório mensal:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
          {[
            {i:"👥",v:"50+",l:"usuários direcionados/mês por farmácia"},
            {i:"💊",v:"10+",l:"descartes registrados/mês por ponto"},
            {i:"💧",v:"4,5M L",l:"de água protegidos por farmácia/mês"},
            {i:"📈",v:"+38,5%",l:"crescimento LogMed 2024 vs 2023"},
          ].map((s,i)=>(
            <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.i}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: c.lime }}>{s.v}</div>
              <div style={{ fontSize: 12, color: c.cream, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 16, textAlign: "center" }}>Projeções baseadas em modelagem com 1.000 usuários ativos. Dados reais disponíveis após lançamento.</p>
      </Section>

      {/* FORMULÁRIO */}
      <Section id="formulario">
        <Label>Formulário de Parceria</Label>
        <Title>Vamos conversar?</Title>
        <p style={{ fontSize: 16, color: c.g6, lineHeight: 1.7, marginBottom: 32, maxWidth: 600 }}>
          Preencha os dados abaixo e entraremos em contato em até 48 horas. Sem compromisso.
        </p>

        {submitted ? (
          <div style={{ background: "#F0FDF4", border: `2px solid ${c.green}`, borderRadius: 14, padding: 32, textAlign: "center", maxWidth: 500 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: c.g9, marginBottom: 8 }}>Formulário enviado!</h3>
            <p style={{ fontSize: 14, color: c.g6 }}>Entraremos em contato em até 48 horas pelo e-mail informado. Obrigado pelo interesse em ser parceiro do EcoMed!</p>
          </div>
        ) : (
          <div style={{ maxWidth: 500 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Nome completo" placeholder="Seu nome" required />
              <FormField label="E-mail" type="email" placeholder="seu@email.com" required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Telefone/WhatsApp" placeholder="(11) 99999-8888" required />
              <FormField label="Cargo/Função" placeholder="Farmacêutico, Professor..." />
            </div>
            <FormField label="Nome da organização" placeholder="Nome da farmácia, escola, empresa..." required />
            <FormField label="Tipo de parceria" type="select" placeholder="Selecione o tipo" required
              options={["Farmácia", "Indústria Farmacêutica", "Escola / Universidade", "Secretaria de Saúde", "ONG Ambiental", "Outro"]} />
            <FormField label="Cidade / Estado" placeholder="São Paulo, SP" required />
            <FormField label="Mensagem (opcional)" type="textarea" placeholder="Conte mais sobre como gostaria de colaborar com o EcoMed..." />

            <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center" }}>
              <button onClick={() => setSubmitted(true)}
                style={{ background: c.green, color: c.white, border: "none", borderRadius: 8, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                Enviar Formulário
              </button>
              <span style={{ fontSize: 12, color: c.g4 }}>Ou envie e-mail direto para parcerias@ecomed.eco.br</span>
            </div>
          </div>
        )}
      </Section>

      {/* FAQ PARCEIROS */}
      <Section bg={c.g50} id="faq">
        <Label>Dúvidas Frequentes</Label>
        <Title>FAQ para Parceiros</Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 700, marginTop: 16 }}>
          {[
            {q:"Preciso pagar para ser parceiro?",a:"Não no MVP. A parceria básica (aparecer no mapa + receber relatório) é gratuita. Serviços premium (selo destacado, relatório ESG expandido) terão custo a partir da V1.0."},
            {q:"Quanto tempo leva para ativar a parceria?",a:"Após o primeiro contato, a ativação leva 2-3 dias úteis. Envolve: coletar dados, inserir no mapa, gerar QR Code e entregar material."},
            {q:"Que dados aparecem no relatório mensal?",a:"Usuários direcionados à sua localização, cliques em \"Como chegar\", descartes registrados, litros de água protegidos, comparação com mês anterior e ranking entre parceiros."},
            {q:"Meus dados ficam públicos?",a:"Apenas nome, endereço, horário e tipos de medicamento aceitos (informações que já são públicas no LogMed). Dados de tráfego e métricas são exclusivos para o parceiro."},
            {q:"Posso indicar outra farmácia?",a:"Sim! Envie os dados pelo formulário ou por e-mail. Quanto mais farmácias no mapa, melhor para todos os usuários."},
            {q:"O EcoMed é confiável?",a:"Sim. Somos open source (código auditável no GitHub), LGPD compliant, com IA local (dados não saem do servidor) e orientação do Prof. Ivon Matos."},
          ].map((faq, i) => {
            const [open, setOpen] = useState(false);
            return (
              <div key={i} style={{ background: c.white, borderRadius: 10, border: `1px solid ${c.g2}`, overflow: "hidden" }}>
                <button onClick={() => setOpen(!open)} style={{
                  width: "100%", padding: "16px 20px", border: "none", background: "none", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left",
                  fontFamily: "'Inter', sans-serif",
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: c.g9 }}>{faq.q}</span>
                  <span style={{ fontSize: 18, color: c.g4, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                </button>
                {open && (
                  <div style={{ padding: "0 20px 16px", fontSize: 14, color: c.g6, lineHeight: 1.6 }}>{faq.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* CTA FINAL */}
      <section style={{ background: c.tealDark, padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: c.white, marginBottom: 12 }}>Pronto para fazer parte?</h2>
          <p style={{ fontSize: 16, color: c.cream, marginBottom: 24, lineHeight: 1.6 }}>
            Cada parceiro amplia o alcance do descarte consciente. Juntos, protegemos a água, o solo e a saúde de todos.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => document.getElementById("formulario")?.scrollIntoView({behavior:"smooth"})}
              style={{ background: c.green, color: c.white, border: "none", borderRadius: 8, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              Preencher Formulário
            </button>
            <button style={{ background: "transparent", color: c.white, border: `2px solid ${c.white}`, borderRadius: 8, padding: "14px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              parcerias@ecomed.eco.br
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
