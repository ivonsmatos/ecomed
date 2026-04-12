import { useState } from "react";

const c = {
  teal: "#3E8C8C", tealDark: "#1A736A", green: "#24A645",
  lime: "#C7D93D", cream: "#D9D6D0", g9: "#1A1A1A",
  g6: "#4A4A4A", g4: "#9CA3AF", g2: "#E5E7EB",
  g50: "#F9FAFB", white: "#FFFFFF", bg: "#FAFAF8",
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
function HoverCard({ children, style = {} }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: c.white, borderRadius: 14, padding: 24, border: `1px solid ${h ? c.teal : c.g2}`,
        boxShadow: h ? "0 12px 32px rgba(26,115,106,0.10)" : "0 1px 3px rgba(0,0,0,0.04)",
        transform: h ? "translateY(-2px)" : "none", transition: "all 0.3s ease", ...style }}>
      {children}
    </div>
  );
}
function TimelineItem({ year, title, desc, color, isLast }) {
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: color, border: `3px solid ${c.white}`, boxShadow: `0 0 0 2px ${color}`, zIndex: 1 }} />
        {!isLast && <div style={{ width: 2, flex: 1, background: c.g2, marginTop: 4 }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 32 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color }}>{year}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: c.g9, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 14, color: c.g6, lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
}

export default function SobrePage() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: c.bg }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* HERO */}
      <section style={{ background: c.tealDark, padding: "80px 24px 64px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: c.teal, opacity: 0.15 }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: c.green, opacity: 0.1 }} />
        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <Label color={c.lime}>Sobre o EcoMed</Label>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: c.white, lineHeight: 1.15, marginBottom: 20, maxWidth: 700, letterSpacing: "-0.02em" }}>
            Transformando o descarte de medicamentos no Brasil
          </h1>
          <p style={{ fontSize: 18, color: c.cream, lineHeight: 1.6, maxWidth: 600 }}>
            Plataforma educativa que combina mapa inteligente, inteligência artificial e gamificação para resolver um problema que afeta 91% dos brasileiros.
          </p>
        </div>
      </section>

      {/* PROBLEMA */}
      <Section id="problema">
        <Label>O Problema</Label>
        <Title>Por que o EcoMed existe</Title>
        <p style={{ fontSize: 16, color: c.g6, lineHeight: 1.7, marginBottom: 32, maxWidth: 700 }}>
          Mais de 30 mil toneladas de medicamentos são descartadas incorretamente no Brasil todos os anos — no lixo comum, na pia, no vaso sanitário. Essa contaminação chega aos rios, ao solo e à água que bebemos. Existem mais de 7.500 pontos de coleta em farmácias, mas quase ninguém sabe que eles existem.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
          {[{i:"💊",v:"30 mil ton",l:"descartadas errado/ano"},{i:"💧",v:"450 mil L",l:"contaminados por 1 comprimido"},{i:"🏥",v:"7.500+",l:"pontos de coleta LogMed"},{i:"😟",v:"91%",l:"descartam incorretamente"}].map((s,i)=>(
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{s.i}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: c.tealDark, letterSpacing: "-0.02em" }}>{s.v}</div>
              <div style={{ fontSize: 13, color: c.g6, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: c.g4, marginTop: 16, textAlign: "center" }}>Fontes: ANVISA, LogMed/Sindusfarma, OMS, The Lancet</p>
      </Section>

      {/* SOLUÇÃO */}
      <Section bg={c.g50} id="solucao">
        <Label>Nossa Solução</Label>
        <Title>Três funcionalidades, um propósito</Title>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginTop: 24 }}>
          {[
            {i:"🗺️",t:"Mapa Inteligente",d:"Encontre a farmácia mais próxima que aceita medicamentos. Filtre por tipo, veja horário e abra a rota.",cl:c.green},
            {i:"🤖",t:"EcoBot (Chat com IA)",d:"Tire dúvidas sobre descarte 24h. IA educativa em linguagem simples, com fontes confiáveis.",cl:c.teal},
            {i:"🪙",t:"EcoCoins (Gamificação)",d:"Ganhe EcoCoins por cada ação: descarte, quiz, leitura, indicação. Suba de nível e troque por recompensas.",cl:c.tealDark},
          ].map((item,i)=>(
            <HoverCard key={i}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${item.cl}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>{item.i}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: c.g9, marginBottom: 8 }}>{item.t}</h3>
              <p style={{ fontSize: 14, color: c.g6, lineHeight: 1.6 }}>{item.d}</p>
            </HoverCard>
          ))}
        </div>
      </Section>

      {/* MISSÃO / VISÃO / VALORES */}
      <Section id="missao">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
          <div>
            <Label>Missão</Label>
            <p style={{ fontSize: 18, fontWeight: 600, color: c.g9, lineHeight: 1.5, marginBottom: 24 }}>
              Promover a conscientização e facilitar o descarte correto de medicamentos no Brasil por meio de tecnologia acessível, educação de qualidade e incentivos gamificados.
            </p>
            <Label>Visão</Label>
            <p style={{ fontSize: 18, fontWeight: 600, color: c.g9, lineHeight: 1.5 }}>
              Ser a principal referência digital brasileira em descarte consciente de medicamentos, contribuindo para a redução da contaminação ambiental.
            </p>
          </div>
          <div>
            <Label>Nossos Valores</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                {i:"🌍",n:"Impacto Real",d:"Cada ação no EcoMed tem resultado mensurável no meio ambiente"},
                {i:"🔓",n:"Transparência",d:"Código aberto, dados com fonte, IA que admite quando não sabe"},
                {i:"🤝",n:"Acessibilidade",d:"Gratuito, sem download, linguagem simples, fontes grandes"},
                {i:"🎓",n:"Educação Primeiro",d:"Informamos antes de gamificar. Conhecimento é a base da mudança"},
                {i:"🛡️",n:"Privacidade",d:"IA local (Ollama), LGPD compliant, dados protegidos"},
                {i:"🌱",n:"Melhoria Contínua",d:"Feedback dos usuários melhora o sistema constantemente"},
              ].map((v,i)=>(
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{v.i}</span>
                  <div><span style={{ fontSize: 14, fontWeight: 700, color: c.g9 }}>{v.n}: </span><span style={{ fontSize: 14, color: c.g6 }}>{v.d}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* TECNOLOGIA */}
      <Section bg={c.tealDark} id="tecnologia">
        <Label color={c.lime}>Tecnologia</Label>
        <Title color={c.white}>Stack 100% open source, custo quase zero</Title>
        <p style={{ fontSize: 16, color: c.cream, lineHeight: 1.7, marginBottom: 32, maxWidth: 600 }}>
          O EcoMed roda com menos de R$ 5/mês usando plataformas gratuitas. A inteligência artificial funciona localmente, protegendo seus dados.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            {n:"Next.js 15",r:"Frontend PWA",d:"App Router, SSR, offline"},
            {n:"Ollama + Llama 3",r:"IA Local",d:"Sem custo de API, privacidade"},
            {n:"Supabase",r:"Banco + Auth",d:"PostgreSQL + Realtime + pgvector"},
            {n:"Cloudflare",r:"CDN + Segurança",d:"DNS, SSL, cache, WAF"},
            {n:"OpenStreetMap",r:"Mapa",d:"Gratuito, open source"},
            {n:"Tailwind + shadcn",r:"Design System",d:"Componentes acessíveis"},
          ].map((t,i)=>(
            <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: c.lime, marginBottom: 2 }}>{t.n}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.white, marginBottom: 4 }}>{t.r}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{t.d}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* IMPACTO + ODS */}
      <Section bg={c.g50} id="impacto">
        <Label>Impacto</Label>
        <Title>Alinhado com os ODS da ONU</Title>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          {[{n:"3",l:"Saúde",cl:"#4C9F38"},{n:"4",l:"Educação",cl:"#C5192D"},{n:"6",l:"Água",cl:"#26BDE2"},{n:"9",l:"Inovação",cl:"#FD6925"},{n:"12",l:"Consumo",cl:"#BF8B2E"},{n:"17",l:"Parcerias",cl:"#19486A"}].map((o,i)=>(
            <div key={i} style={{ background: o.cl, borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.white }}>ODS {o.n}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{o.l}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* EQUIPE */}
      <Section id="equipe">
        <Label>Equipe</Label>
        <Title>70 alunos, 3 turmas, 1 missão</Title>
        <p style={{ fontSize: 16, color: c.g6, lineHeight: 1.7, marginBottom: 32, maxWidth: 600 }}>
          Projeto interdisciplinar coordenado pelo Prof. Ivon Matos, desenvolvido por alunos de Escola Técnica Estadual.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {[
            {t:"3TA — Farmácia e Negócios",g:"Pesquisa, Conteúdo, Negócio, Marketing",f:"Concepção, validação, conteúdo e estratégia",cl:c.green},
            {t:"3TB — IA e Ética",g:"Ollama, RAG, Guardrails, Prompts",f:"Motor de inteligência artificial e governança ética",cl:c.teal},
            {t:"3TC — Frontend",g:"Setup, Chat, Mapa, Telas",f:"Interface, experiência do usuário e infraestrutura",cl:c.tealDark},
          ].map((t,i)=>(
            <HoverCard key={i}>
              <div style={{ height: 4, background: t.cl, borderRadius: 2, marginBottom: 16 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: c.g9, marginBottom: 6 }}>{t.t}</h3>
              <p style={{ fontSize: 13, color: c.g6, marginBottom: 8 }}>{t.f}</p>
              <div style={{ fontSize: 12, color: c.g4 }}>4 grupos: {t.g}</div>
            </HoverCard>
          ))}
        </div>
        <div style={{ marginTop: 32, background: c.tealDark, borderRadius: 14, padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.white }}>Coordenação: Prof. Ivon Matos</div>
            <div style={{ fontSize: 13, color: c.cream }}>Escola Técnica Estadual | Projeto Interdisciplinar 2026</div>
          </div>
          <div style={{ fontSize: 13, color: c.lime, textAlign: "right" }}>12 grupos | 196+ tarefas | OpenProject</div>
        </div>
      </Section>

      {/* ROADMAP */}
      <Section bg={c.g50} id="roadmap">
        <Label>Roadmap</Label>
        <Title>Do MVP ao impacto nacional</Title>
        <div style={{ maxWidth: 500, marginTop: 24 }}>
          <TimelineItem year="2026 Q2" title="MVP" desc="Auth, Mapa, Chat IA, EcoCoins, PWA, Documentação. Meta: 100 usuários." color={c.green} />
          <TimelineItem year="2026 Q3" title="V1.0" desc="Missões semanais, Eventos, Parcerias B2B, Badges. Meta: 1.000 usuários." color={c.teal} />
          <TimelineItem year="2026 Q4" title="V1.1" desc="PIX cashback, Cupons, Nível Lenda, Feed social. Meta: 5.000 usuários." color={c.tealDark} />
          <TimelineItem year="2027" title="V2.0" desc="Marketplace, QR Code check-in, Desafios comunitários. Meta: 20.000 usuários." color="#D4A017" isLast />
        </div>
      </Section>

      {/* OPEN SOURCE */}
      <Section id="opensource">
        <div style={{ textAlign: "center" }}>
          <Label>Open Source</Label>
          <Title align="center">Código aberto, impacto coletivo</Title>
          <p style={{ fontSize: 16, color: c.g6, lineHeight: 1.7, maxWidth: 600, margin: "0 auto 32px" }}>
            O EcoMed é 100% open source. Código no GitHub, aberto para auditoria, contribuições e replicação.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ background: c.g9, color: c.white, padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>github.com/ivonsmatos/ecomed</div>
            <div style={{ background: c.green, color: c.white, padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>Licença MIT</div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section style={{ background: c.tealDark, padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌿</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: c.white, marginBottom: 12 }}>Junte-se ao EcoMed</h2>
          <p style={{ fontSize: 16, color: c.cream, marginBottom: 24, lineHeight: 1.6 }}>Descarte medicamentos corretamente, ganhe EcoCoins e proteja o meio ambiente.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{ background: c.green, color: c.white, border: "none", borderRadius: 8, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Começar Agora</button>
            <button style={{ background: "transparent", color: c.white, border: `2px solid ${c.white}`, borderRadius: 8, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Seja Parceiro</button>
          </div>
          <div style={{ marginTop: 24, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>contato@ecomed.eco.br | parcerias@ecomed.eco.br</div>
        </div>
      </section>
    </div>
  );
}
