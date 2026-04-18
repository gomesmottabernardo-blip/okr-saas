import { useEffect, useState } from "react"
import { fetchCycleInsights, fetchCycles, sendAlerts } from "../services/api"

export default function Insights() {
  const [data, setData] = useState<any>(null)
  const [cycles, setCycles] = useState<any[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [alertResult, setAlertResult] = useState<any>(null)

  useEffect(() => { loadCycles() }, [])
  useEffect(() => { load() }, [selectedCycle])

  async function loadCycles() {
    try {
      const c = await fetchCycles()
      setCycles(c || [])
      const active = c?.find((x: any) => x.status === "ACTIVE")
      if (active) setSelectedCycle(active.id)
    } catch (err) { console.error(err) }
  }

  async function load() {
    setLoading(true)
    try {
      const d = await fetchCycleInsights(selectedCycle || undefined)
      setData(d)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  async function handleSendAlerts() {
    setSending(true)
    setAlertResult(null)
    try {
      const result = await sendAlerts(selectedCycle || undefined)
      setAlertResult(result)
    } catch (err: any) {
      setAlertResult({ error: err.message || "Erro ao enviar alertas" })
    }
    setSending(false)
  }

  if (loading) return <div style={{ padding: 40, color: "#888" }}>Analisando ciclo...</div>

  if (!data) {
    return (
      <div style={{ background: "white", borderRadius: 12, padding: 40, textAlign: "center", border: "1px solid #f0f0f0" }}>
        <p style={{ color: "#888", fontSize: 15, margin: 0 }}>
          Nenhum ciclo ativo. Crie um ciclo e objetivos na aba OKRs.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Seletor */}
      {cycles.length > 0 && (
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>Ciclo:</span>
          <select
            value={selectedCycle}
            onChange={e => setSelectedCycle(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 14, background: "white", cursor: "pointer", outline: "none" }}
          >
            {cycles.map((c: any) => (
              <option key={c.id} value={c.id}>{c.label}{c.status === "ACTIVE" ? " (ativo)" : ""}</option>
            ))}
          </select>
        </div>
      )}

      {/* Resumo do ciclo */}
      <h2 style={sectionTitle}>Análise do Ciclo — {data.cycleName}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 36 }}>
        <StatCard label="Progresso geral" value={`${Math.round(data.cycleProgress * 100)}%`} accent={progressColor(data.cycleProgress)} />
        <StatCard label="Ações concluídas" value={`${data.completedActions}/${data.totalActions}`} accent="#16a34a" />
        <StatCard label="Em progresso" value={String(data.inProgressActions)} accent="#3b82f6" />
        <StatCard label="Não iniciadas" value={String(data.notStartedActions)} accent="#9ca3af" />
        <StatCard label="Em risco" value={String(data.atRiskActions)} accent="#ef4444" />
        <StatCard label="Sem responsável" value={String(data.actionsWithoutOwner)} accent="#f59e0b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 36 }}>
        {/* Objetivos em risco */}
        <Section title="Objetivos em Risco" icon="⚠️">
          {data.atRiskObjectives.length === 0 ? (
            <p style={emptyMsg}>Nenhum objetivo crítico. Bom trabalho!</p>
          ) : (
            data.atRiskObjectives.map((obj: any) => (
              <div key={obj.id} style={riskItem}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#222", flex: 1, marginRight: 8 }}>{obj.title}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#ef4444" }}>{Math.round(obj.progress * 100)}%</span>
                </div>
                <ProgressBar value={obj.progress} />
                <div style={{ fontSize: 11, color: "#888", marginTop: 5 }}>
                  {obj.completedKRs}/{obj.totalKRs} KRs concluídos
                </div>
              </div>
            ))
          )}
        </Section>

        {/* Destaques positivos */}
        <Section title="Destaques Positivos" icon="✅">
          {data.topObjectives.length === 0 ? (
            <p style={emptyMsg}>Acelere as entregas para aparecer aqui.</p>
          ) : (
            data.topObjectives.map((obj: any) => (
              <div key={obj.id} style={riskItem}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#222", flex: 1, marginRight: 8 }}>{obj.title}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>{Math.round(obj.progress * 100)}%</span>
                </div>
                <ProgressBar value={obj.progress} />
              </div>
            ))
          )}
        </Section>
      </div>

      {/* Botão de Alertas por Email */}
      <div style={{
        background: "white",
        borderRadius: 14,
        padding: "20px 24px",
        marginBottom: 32,
        border: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#222", marginBottom: 4 }}>
            Notificar responsáveis por email
          </div>
          <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>
            Envia email automático para cada owner com suas tarefas atrasadas ou em risco.
            O email inclui o contexto do OKR e a data de vencimento.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <button
            onClick={handleSendAlerts}
            disabled={sending}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              border: "none",
              background: sending ? "#e5e7eb" : "#dc2626",
              color: sending ? "#9ca3af" : "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: sending ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {sending ? "Enviando..." : "⚠️ Enviar alertas por email"}
          </button>
          {alertResult && (
            <div style={{ fontSize: 12, textAlign: "right", maxWidth: 280 }}>
              {alertResult.error ? (
                <span style={{ color: "#dc2626" }}>
                  {alertResult.noApiKey
                    ? "Configure RESEND_API_KEY no Render para ativar emails."
                    : alertResult.error}
                </span>
              ) : alertResult.sent === 0 ? (
                <span style={{ color: "#6b7280" }}>
                  Nenhuma tarefa em atraso com responsável encontrada.
                </span>
              ) : (
                <span style={{ color: "#16a34a" }}>
                  ✓ {alertResult.sent} email{alertResult.sent > 1 ? "s" : ""} enviado{alertResult.sent > 1 ? "s" : ""}
                  {alertResult.recipients?.length > 0 && (
                    <span style={{ display: "block", color: "#888", marginTop: 2 }}>
                      Para: {alertResult.recipients.join(", ")}
                    </span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sugestões para o próximo trimestre */}
      <h2 style={sectionTitle}>Sugestões para o Próximo Trimestre</h2>
      <div style={{ background: "white", borderRadius: 14, padding: 24, marginBottom: 28, border: "1px solid #f0f0f0" }}>
        {data.suggestions.map((s: string, i: number) => (
          <div key={i} style={suggestionItem}>
            <div style={suggestionDot} />
            <span style={{ fontSize: 14, color: "#333", lineHeight: 1.5 }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Melhorias contínuas */}
      <h2 style={sectionTitle}>Ações de Melhoria Contínua</h2>
      <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid #f0f0f0" }}>
        {data.improvements.map((s: string, i: number) => (
          <div key={i} style={{ ...suggestionItem, borderLeftColor: "#f59e0b" }}>
            <div style={{ ...suggestionDot, background: "#f59e0b" }} />
            <span style={{ fontSize: 14, color: "#333", lineHeight: 1.5 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Components ──────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", borderRadius: 14, padding: 22, border: "1px solid #f0f0f0" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#222", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span>
        {title}
      </div>
      {children}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: "16px 18px", border: "1px solid #f0f0f0", borderLeft: `4px solid ${accent}` }}>
      <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>{value}</div>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div style={{ background: "#f3f4f6", borderRadius: 4, height: 6, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: progressColor(value), borderRadius: 4, transition: "width 0.4s" }} />
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function progressColor(v: number): string {
  const p = v * 100
  if (p >= 80) return "#16a34a"
  if (p >= 40) return "#3b82f6"
  if (p > 0) return "#f59e0b"
  return "#ef4444"
}

const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 16px 0" }
const emptyMsg: React.CSSProperties = { fontSize: 13, color: "#aaa", margin: 0, fontStyle: "italic" }
const riskItem: React.CSSProperties = { padding: "10px 0", borderBottom: "1px solid #f5f5f5" }
const suggestionItem: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 0",
  borderBottom: "1px solid #f5f5f5",
}
const suggestionDot: React.CSSProperties = {
  width: 8, height: 8, borderRadius: "50%", background: "#6366f1",
  marginTop: 5, flexShrink: 0,
}
