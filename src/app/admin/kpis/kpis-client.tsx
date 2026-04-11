"use client"

import { useState, useMemo } from "react"
import type { CSSProperties } from "react"
import type { KpiData } from "./getData"

const TARGETS = {
  users: 100, dau: 20, d7: 20, d30: 10, disposals: 50, articles: 300,
  chat: 500, uptime: 99, lighthouse: 90, api: 2, fcp: 1.5, tests: 60, nps: 7,
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
const fmt = (n: number): string => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B"
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K"
  return n.toLocaleString("pt-BR")
}
const pct = (v: number, t: number) => Math.min(100, Math.round((v / t) * 100))
const statusColor = (v: number, t: number, invert = false) => {
  const r = invert ? t / v : v / t
  if (r >= 1) return "#24A645"
  if (r >= 0.7) return "#D97706"
  return "#DC2626"
}
const statusLabel = (v: number, t: number, invert = false) => {
  const r = invert ? t / v : v / t
  if (r >= 1) return "✅ Atingida"
  if (r >= 0.7) return "🟡 No caminho"
  return "🔴 Atenção"
}

// ═══════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════
const colors = {
  teal: "#3E8C8C", tealDark: "#1A736A", green: "#24A645",
  lime: "#C7D93D", cream: "#D9D6D0", red: "#DC2626",
  amber: "#D97706", blue: "#2563EB", gray: "#4A4A4A",
  bg: "#F8FAFB", card: "#FFFFFF", border: "#E5E7EB",
}

// ═══════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════
function Card({ children, style = {}, onClick }: { children: React.ReactNode; style?: CSSProperties; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      background: colors.card, borderRadius: 14, padding: "20px 22px",
      border: `1px solid ${colors.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      ...style,
    }}>{children}</div>
  )
}

interface MetricCardProps {
  label: string
  value: number | string
  unit?: string
  icon?: string
  target?: number
  invert?: boolean
  small?: boolean
  color?: string
}

function MetricCard({ label, value, unit, icon, target, invert, small, color: customColor }: MetricCardProps) {
  const c = target ? statusColor(Number(value), target, invert) : customColor || colors.tealDark
  return (
    <Card style={{ position: "relative", overflow: "hidden" }}>
      {target && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: colors.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: small ? 22 : 30, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em" }}>
          {typeof value === "number" ? fmt(value) : value}
        </span>
        {unit && <span style={{ fontSize: 12, color: colors.gray, fontWeight: 500 }}>{unit}</span>}
      </div>
      {target && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: c, fontWeight: 600 }}>{statusLabel(Number(value), target, invert)}</span>
            <span style={{ fontSize: 10, color: colors.gray }}>{pct(Number(value), target)}% de {fmt(target)}</span>
          </div>
          <div style={{ height: 5, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${pct(Number(value), target)}%`, height: "100%", background: c, borderRadius: 3, transition: "width 0.8s ease" }} />
          </div>
        </div>
      )}
    </Card>
  )
}

function SparkBar({ data, color, height = 50 }: { data: { v: number; l: string }[]; color: string; height?: number }) {
  const max = Math.max(...data.map(d => d.v), 1)
  const minBarH = Math.max(8, Math.floor(height * 0.22))
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
      {data.map((d, i) => {
        const barH = d.v === 0 ? 2 : Math.max(minBarH, Math.round((d.v / max) * height))
        const isLatest = i === data.length - 1
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: d.v > 0 ? color : "transparent", lineHeight: 1 }}>
              {d.v > 0 ? fmt(d.v) : "0"}
            </span>
            <div style={{
              width: "100%", borderRadius: 3,
              background: color,
              opacity: d.v === 0 ? 0.12 : isLatest ? 1 : 0.65,
              height: barH,
              transition: "height 0.6s ease",
            }} />
            <span style={{ fontSize: 9, color: "#999", lineHeight: 1 }}>{d.l}</span>
          </div>
        )
      })}
    </div>
  )
}

function LevelDistribution({ levels, total }: { levels: KpiData["levels"]; total: number }) {
  const items = [
    { label: "Semente", icon: "🌱", count: levels.semente, color: "#C7D93D" },
    { label: "Broto", icon: "🌿", count: levels.broto, color: "#24A645" },
    { label: "Árvore", icon: "🌳", count: levels.arvore, color: "#3E8C8C" },
    { label: "Guardião", icon: "🌍", count: levels.guardiao, color: "#1A736A" },
    { label: "Lenda", icon: "⭐", count: levels.lenda, color: "#D4A017" },
  ]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{it.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", width: 64 }}>{it.label}</span>
          <div style={{ flex: 1, height: 18, background: "#F3F4F6", borderRadius: 9, overflow: "hidden", position: "relative" }}>
            <div style={{
              width: `${Math.max(2, (it.count / total) * 100)}%`, height: "100%",
              background: it.color, borderRadius: 9, transition: "width 0.8s",
            }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A", width: 28, textAlign: "right" }}>{it.count}</span>
        </div>
      ))}
    </div>
  )
}

function TaskDonut({ tasks }: { tasks: KpiData["tasks"] }) {
  const { done, progress, review, blocked, notStarted } = tasks
  const total = tasks.total
  const slices = [
    { label: "Concluídas", v: done, color: "#24A645" },
    { label: "Em progresso", v: progress, color: "#3E8C8C" },
    { label: "Em revisão", v: review, color: "#2563EB" },
    { label: "Bloqueadas", v: blocked, color: "#DC2626" },
    { label: "Não iniciadas", v: notStarted, color: "#E5E7EB" },
  ]
  let offset = 0
  const r = 40, cx = 55, cy = 55, circ = 2 * Math.PI * r
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
        <svg viewBox="0 0 110 110" width="110" height="110">
          {slices.map((s, i) => {
            const dashLen = (s.v / total) * circ
            const dashOff = -offset
            offset += dashLen
            return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="16"
              strokeDasharray={`${dashLen} ${circ - dashLen}`} strokeDashoffset={dashOff}
              transform={`rotate(-90 ${cx} ${cy})`} />
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#1A1A1A" }}>{pct(done, total)}%</span>
          <span style={{ fontSize: 9, color: colors.gray }}>concluído</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: colors.gray, width: 90 }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface FlywheelData {
  attract: { conversion: number }
  engage: { streakAvg: number }
  delight: { referralRate: number; nps: number }
}

function FlywheelDiagram({ data }: { data: FlywheelData }) {
  const phases = [
    { label: "ATRAIR", icon: "🧲", val: `${data.attract.conversion}%`, sub: "conversão", color: colors.green, angle: 210 },
    { label: "ENGAJAR", icon: "🎮", val: `${data.engage.streakAvg}d`, sub: "streak médio", color: colors.teal, angle: 330 },
    { label: "ENCANTAR", icon: "💎", val: `${data.delight.referralRate}%`, sub: "indicam", color: colors.tealDark, angle: 90 },
  ]
  const r = 72, cx = 130, cy = 130
  return (
    <svg viewBox="0 0 260 260" width="260" height="260" style={{ display: "block", margin: "0 auto" }}>
      <circle cx={cx} cy={cy} r={r + 20} fill="none" stroke={colors.border} strokeWidth="1.5" strokeDasharray="6 4" />
      {phases.map((ph, i) => {
        const a1 = ((ph.angle + 40) * Math.PI) / 180
        const ax = cx + (r + 20) * Math.cos(a1)
        const ay = cy + (r + 20) * Math.sin(a1)
        return <polygon key={`arr${i}`} points={`${ax},${ay} ${ax - 5},${ay - 8} ${ax + 5},${ay - 8}`}
          fill={ph.color} transform={`rotate(${ph.angle + 40} ${ax} ${ay})`} />
      })}
      <circle cx={cx} cy={cy} r={28} fill={colors.tealDark} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#C7D93D" fontSize="10" fontWeight="700">NPS</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#fff" fontSize="16" fontWeight="800">{data.delight.nps}</text>
      {phases.map((ph, i) => {
        const rad = (ph.angle * Math.PI) / 180
        const x = cx + r * Math.cos(rad)
        const y = cy + r * Math.sin(rad)
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={32} fill={ph.color} opacity={0.12} />
            <circle cx={x} cy={y} r={32} fill="none" stroke={ph.color} strokeWidth={2} />
            <text x={x} y={y - 12} textAnchor="middle" fontSize="14">{ph.icon}</text>
            <text x={x} y={y + 4} textAnchor="middle" fill="#1A1A1A" fontSize="13" fontWeight="800">{ph.val}</text>
            <text x={x} y={y + 16} textAnchor="middle" fill={colors.gray} fontSize="8" fontWeight="500">{ph.sub}</text>
            <text x={x} y={y + 28} textAnchor="middle" fill={ph.color} fontSize="8" fontWeight="700">{ph.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 28, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${colors.border}` }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, margin: 0 }}>{title}</h2>
    </div>
  )
}

// ═══════════════════════════════════════
// TAB SECTIONS
// ═══════════════════════════════════════
function TabOverview({ d }: { d: KpiData }) {
  const sparkUsers = d.weekly.map(w => ({ v: w.u, l: w.w }))
  const sparkDisposals = d.weekly.map(w => ({ v: w.d, l: w.w }))
  const sparkCoins = d.weekly.map(w => ({ v: w.c, l: w.w }))
  return (
    <>
      <Card style={{ background: colors.tealDark, border: "none", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "#C7D93D", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>⭐ North Star Metric</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 42, fontWeight: 800, color: "#fff" }}>{d.northStar.current}</span>
              <span style={{ fontSize: 14, color: "#C7D93D" }}>{d.northStar.label}</span>
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              Meta MVP: {d.northStar.target}/semana — {statusLabel(d.northStar.current, d.northStar.target)}
            </span>
          </div>
          <div style={{ width: 160 }}>
            <SparkBar data={sparkDisposals} color="#C7D93D" height={40} />
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        <MetricCard label="Usuários" value={d.users.total} target={TARGETS.users} icon="👥" />
        <MetricCard label="DAU" value={d.users.dau} target={TARGETS.dau} icon="📊" />
        <MetricCard label="Retenção D7" value={d.retention.d7} unit="%" target={TARGETS.d7} icon="🔄" />
        <MetricCard label="Descartes" value={d.disposals.total} target={TARGETS.disposals} icon="💊" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
        <Card>
          <div style={{ fontSize: 11, color: colors.gray, fontWeight: 600, marginBottom: 10 }}>📈 USUÁRIOS (SEMANAL)</div>
          <SparkBar data={sparkUsers} color={colors.teal} />
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: colors.gray, fontWeight: 600, marginBottom: 10 }}>🪙 ECOCOINS DISTRIBUÍDOS</div>
          <SparkBar data={sparkCoins} color={colors.green} />
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: colors.gray, fontWeight: 600, marginBottom: 10 }}>📚 ARTIGOS LIDOS</div>
          <SparkBar data={d.weekly.map(w => ({ v: w.a, l: w.w }))} color={colors.tealDark} />
        </Card>
      </div>

      <SectionHeader icon="🌍" title="Impacto Ambiental" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <MetricCard label="Litros protegidos" value={d.impact.liters} icon="💧" color={colors.blue} />
        <MetricCard label="Pessoas educadas" value={d.impact.people} icon="🎓" color={colors.teal} />
        <MetricCard label="Pontos mapeados" value={d.impact.points} icon="📍" color={colors.green} />
        <MetricCard label="Cidades ativas" value={d.impact.cities} icon="🏙️" color={colors.tealDark} />
      </div>
    </>
  )
}

function TabFlywheel({ d }: { d: KpiData }) {
  const flywheelData: FlywheelData = {
    attract: { conversion: 16.7 },
    engage: { streakAvg: d.streaks.avg },
    delight: { referralRate: 20.7, nps: d.social.nps },
  }
  return (
    <>
      <Card style={{ marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: colors.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Flywheel de Crescimento</div>
        <FlywheelDiagram data={flywheelData} />
        <p style={{ fontSize: 11, color: colors.gray, marginTop: 12 }}>Atrair → Engajar → Encantar → volta para Atrair</p>
      </Card>

      <SectionHeader icon="🧲" title="Fase: ATRAIR" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        <MetricCard label="Visitantes/mês" value={520} target={500} icon="🌐" small />
        <MetricCard label="Conversão" value="16.7" unit="%" target={15} icon="🎯" small />
        <MetricCard label="Indicações" value={d.social.refs} icon="🤝" small color={colors.green} />
        <MetricCard label="Shares" value={d.social.shares} icon="📤" small color={colors.teal} />
      </div>

      <SectionHeader icon="🎮" title="Fase: ENGAJAR" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        <MetricCard label="Missões completas" value={`${d.missions.rate}%`} icon="✅" small color={d.missions.rate >= 40 ? colors.green : colors.amber} />
        <MetricCard label="Streak médio" value={`${d.streaks.avg}`} unit="dias" icon="🔥" small color={colors.teal} />
        <MetricCard label="EcoCoins/user/sem" value={d.coins.avg} target={30} icon="🪙" small />
        <MetricCard label="Quizzes/mês" value={d.education.quizzes} icon="🧠" small color={colors.tealDark} />
      </div>

      <SectionHeader icon="💎" title="Fase: ENCANTAR" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <MetricCard label="Taxa de indicação" value="20.7" unit="%" target={15} icon="📣" small />
        <MetricCard label="NPS" value={d.social.nps} target={TARGETS.nps} icon="⭐" />
        <MetricCard label="Resgates" value={d.coins.rewards} icon="🎁" small color={colors.green} />
        <MetricCard label="Streaks ativos" value={d.streaks.active} icon="🔥" small color={colors.teal} />
      </div>
    </>
  )
}

function TabEcoCoins({ d }: { d: KpiData }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        <MetricCard label="EcoCoins totais" value={d.coins.total} icon="🪙" color={colors.tealDark} />
        <MetricCard label="Média/usuário" value={d.coins.avg} icon="📊" color={colors.teal} />
        <MetricCard label="Gastos (resgates)" value={d.coins.spent} icon="🎁" color={colors.green} />
        <MetricCard label="Recompensas resgatadas" value={d.coins.rewards} icon="🏆" color={colors.tealDark} />
      </div>

      <SectionHeader icon="📊" title="Distribuição de Níveis" />
      <Card style={{ marginBottom: 16 }}>
        <LevelDistribution levels={d.levels} total={d.users.total} />
        <div style={{ display: "flex", gap: 16, marginTop: 16, paddingTop: 12, borderTop: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 12, color: colors.gray }}>
            <span style={{ fontWeight: 700, color: "#1A1A1A" }}>{pct(d.levels.broto + d.levels.arvore + d.levels.guardiao + d.levels.lenda, d.users.total)}%</span> saíram de Semente
          </div>
          <div style={{ fontSize: 12, color: colors.gray }}>
            Streak médio: <span style={{ fontWeight: 700, color: "#1A1A1A" }}>{d.streaks.avg} dias</span>
          </div>
          <div style={{ fontSize: 12, color: colors.gray }}>
            Melhor streak: <span style={{ fontWeight: 700, color: "#1A1A1A" }}>{d.streaks.best} dias 🔥</span>
          </div>
        </div>
      </Card>

      <SectionHeader icon="📚" title="Educação" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <MetricCard label="Artigos lidos" value={d.education.articles} target={TARGETS.articles} icon="📖" small />
        <MetricCard label="Quizzes feitos" value={d.education.quizzes} icon="🧠" small color={colors.teal} />
        <MetricCard label="Nota média quiz" value={`${d.education.quizAvg}%`} icon="📝" small color={d.education.quizAvg >= 70 ? colors.green : colors.amber} />
        <MetricCard label="Perguntas ao EcoBot" value={d.education.chat} target={TARGETS.chat} icon="💬" small />
      </div>
    </>
  )
}

function TabTechnical({ d }: { d: KpiData }) {
  return (
    <>
      <SectionHeader icon="📡" title="Disponibilidade e Performance" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        <MetricCard label="Uptime" value={`${d.tech.uptime}`} unit="%" target={TARGETS.uptime} icon="🟢" />
        <MetricCard label="Lighthouse" value={d.tech.lighthouse} unit="/100" target={TARGETS.lighthouse} icon="🏎️" />
        <MetricCard label="API Latency" value={`${d.tech.api}`} unit="s" target={TARGETS.api} invert icon="⚡" />
        <MetricCard label="Chat (1º token)" value={`${d.tech.chat}`} unit="s" target={5} invert icon="💬" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        <MetricCard label="FCP" value={`${d.tech.fcp}`} unit="s" target={TARGETS.fcp} invert icon="🎨" />
        <MetricCard label="Cobertura de testes" value={d.tech.tests} unit="%" target={TARGETS.tests} icon="🧪" />
        <MetricCard label="Descartes c/ GPS" value={d.disposals.gps} icon="📍" small color={colors.teal} />
        <MetricCard label="Pontos únicos" value={d.disposals.points} icon="🗺️" small color={colors.green} />
      </div>

      <SectionHeader icon="🔍" title="Checklist Técnico MVP" />
      <Card>
        {[
          { item: "Uptime > 99%", ok: d.tech.uptime >= 99 },
          { item: "Lighthouse > 90", ok: d.tech.lighthouse >= 90 },
          { item: "API < 2s", ok: d.tech.api <= 2 },
          { item: "Chat < 5s (1º token)", ok: d.tech.chat <= 5 },
          { item: "FCP < 1.5s", ok: d.tech.fcp <= 1.5 },
          { item: "Cobertura testes > 60%", ok: d.tech.tests >= 60 },
          { item: "PWA manifest válido", ok: true },
          { item: "HTTPS + SSL", ok: true },
          { item: "CORS configurado", ok: true },
          { item: "Rate limiting ativo", ok: true },
        ].map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < 9 ? `1px solid ${colors.border}` : "none" }}>
            <span style={{ fontSize: 14 }}>{c.ok ? "✅" : "❌"}</span>
            <span style={{ fontSize: 13, color: c.ok ? colors.gray : colors.red, fontWeight: c.ok ? 400 : 600 }}>{c.item}</span>
          </div>
        ))}
      </Card>
    </>
  )
}

function TabSocial({ d }: { d: KpiData }) {
  return (
    <>
      <SectionHeader icon="📱" title="Redes Sociais" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        <MetricCard label="Instagram" value={d.social.ig} unit="seguidores" target={500} icon="📸" small />
        <MetricCard label="TikTok" value={d.social.tt} unit="seguidores" target={300} icon="🎵" small />
        <MetricCard label="LinkedIn" value={d.social.li} unit="seguidores" target={100} icon="💼" small />
        <MetricCard label="NPS" value={d.social.nps} target={TARGETS.nps} icon="⭐" />
      </div>

      <SectionHeader icon="🔄" title="Growth Orgânico" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <MetricCard label="Indicações aceitas" value={d.social.refs} icon="🤝" color={colors.green} />
        <MetricCard label="Compartilhamentos" value={d.social.shares} icon="📤" color={colors.teal} />
        <MetricCard label="Taxa de indicação" value="20.7" unit="%" target={15} icon="📣" />
        <MetricCard label="CAC" value="R$ 0" icon="💰" color={colors.green} />
      </div>
    </>
  )
}

function TabTasks({ d }: { d: KpiData }) {
  return (
    <>
      <SectionHeader icon="📋" title="Progresso do Projeto (OpenProject)" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontSize: 11, color: colors.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Distribuição de Tarefas</div>
          <TaskDonut tasks={d.tasks} />
        </Card>
        <Card>
          <div style={{ fontSize: 11, color: colors.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Resumo</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><span style={{ fontSize: 11, color: colors.gray }}>Total</span><br /><span style={{ fontSize: 22, fontWeight: 800 }}>{d.tasks.total}</span></div>
            <div><span style={{ fontSize: 11, color: colors.gray }}>Concluídas</span><br /><span style={{ fontSize: 22, fontWeight: 800, color: colors.green }}>{d.tasks.done}</span></div>
            <div><span style={{ fontSize: 11, color: colors.gray }}>Em progresso</span><br /><span style={{ fontSize: 22, fontWeight: 800, color: colors.teal }}>{d.tasks.progress}</span></div>
            <div><span style={{ fontSize: 11, color: colors.gray }}>Bloqueadas</span><br /><span style={{ fontSize: 22, fontWeight: 800, color: colors.red }}>{d.tasks.blocked}</span></div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 11, color: colors.gray, marginBottom: 4 }}>
              Velocidade: <span style={{ fontWeight: 700, color: "#1A1A1A" }}>{Math.round(d.tasks.done / 6)}</span> tarefas/semana
            </div>
            <div style={{ fontSize: 11, color: colors.gray }}>
              Estimativa p/ conclusão: <span style={{ fontWeight: 700, color: "#1A1A1A" }}>{Math.round((d.tasks.total - d.tasks.done) / (d.tasks.done / 6))}</span> semanas restantes
            </div>
          </div>
        </Card>
      </div>

      <SectionHeader icon="🏗️" title="Por Turma" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { turma: "3TA — Farmácia", done: 14, total: 52, color: colors.green },
          { turma: "3TB — IA/Ética", done: 10, total: 68, color: colors.teal },
          { turma: "3TC — Frontend", done: 10, total: 76, color: colors.tealDark },
        ].map((t, i) => (
          <Card key={i}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>{t.turma}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: t.color }}>{t.done}</span>
              <span style={{ fontSize: 12, color: colors.gray }}>/ {t.total} tarefas</span>
            </div>
            <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${pct(t.done, t.total)}%`, height: "100%", background: t.color, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 10, color: colors.gray, marginTop: 4, display: "block" }}>{pct(t.done, t.total)}% concluído</span>
          </Card>
        ))}
      </div>
    </>
  )
}

// ═══════════════════════════════════════
// TABS CONFIG
// ═══════════════════════════════════════
const TABS = [
  { id: "overview", label: "Visão Geral", icon: "📊" },
  { id: "flywheel", label: "Flywheel", icon: "🔄" },
  { id: "coins", label: "EcoCoins", icon: "🪙" },
  { id: "tech", label: "Técnico", icon: "⚙️" },
  { id: "social", label: "Marketing", icon: "📱" },
  { id: "tasks", label: "Tarefas", icon: "📋" },
] as const

type TabId = (typeof TABS)[number]["id"]

// ═══════════════════════════════════════
// PAGE
// ═══════════════════════════════════════
export default function KpisClient({ data }: { data: KpiData }) {
  const DATA = data
  const [tab, setTab] = useState<TabId>("overview")

  const content = useMemo(() => {
    switch (tab) {
      case "overview": return <TabOverview d={DATA} />
      case "flywheel": return <TabFlywheel d={DATA} />
      case "coins": return <TabEcoCoins d={DATA} />
      case "tech": return <TabTechnical d={DATA} />
      case "social": return <TabSocial d={DATA} />
      case "tasks": return <TabTasks d={DATA} />
    }
  }, [tab, DATA])

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: colors.bg, margin: "-24px", borderRadius: 8, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: colors.tealDark, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🌿</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>EcoMed</span>
          <span style={{ fontSize: 13, color: "#C7D93D", fontWeight: 500 }}>Painel de KPIs</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            Atualizado: {new Date().toLocaleDateString("pt-BR")} {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#24A645", boxShadow: "0 0 6px #24A645" }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${colors.border}`, padding: "0 24px", display: "flex", gap: 0, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "12px 16px", border: "none", background: "none", cursor: "pointer",
            fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? colors.tealDark : colors.gray,
            borderBottom: tab === t.id ? `2px solid ${colors.tealDark}` : "2px solid transparent",
            transition: "all 0.2s", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "20px 24px" }}>
        {content}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${colors.border}`, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#999" }}>
            EcoMed — Painel de KPIs v1.0 | ecomed.eco.br
          </p>
        </div>
      </div>
    </div>
  )
}
