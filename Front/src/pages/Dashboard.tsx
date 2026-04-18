import { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { fetchDashboardSummary, fetchCycles, fetchMonthlyBreakdown } from "../services/api"

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [monthly, setMonthly] = useState<any[]>([])
  const [cycles, setCycles] = useState<any[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadCycles() }, [])
  useEffect(() => { loadDashboard() }, [selectedCycle])

  async function loadCycles() {
    try {
      const c = await fetchCycles()
      setCycles(c || [])
      const active = c?.find((x: any) => x.status === "ACTIVE")
      if (active) setSelectedCycle(active.id)
    } catch (err) { console.error(err) }
  }

  async function loadDashboard() {
    setLoading(true)
    try {
      const [summary, mon] = await Promise.all([
        fetchDashboardSummary(selectedCycle || undefined),
        fetchMonthlyBreakdown(),
      ])
      setData(summary)
      setMonthly(mon || [])
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  if (loading && !data) {
    return <div style={{ padding: 40, color: "#888" }}>Carregando dashboard...</div>
  }

  const fin = data?.financial
  const okr = data?.okr

  return (
    <div>
      {/* Seletor de Ciclo */}
      {cycles.length > 0 && (
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>Ciclo:</span>
          <select
            value={selectedCycle}
            onChange={e => setSelectedCycle(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #e0e0e0",
              fontSize: 14,
              background: "white",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">Todos</option>
            {cycles.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.label}{c.status === "ACTIVE" ? " (ativo)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* KPI Cards */}
      {fin && (
        <>
          <h2 style={sectionTitle}>Métricas Financeiras</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}>
            <KpiCard label="MRR" value={fmt(fin.mrr)} accent="#6366f1" />
            <KpiCard label="Clientes ativos" value={String(fin.activeClients)} accent="#3b82f6" />
            <KpiCard label="Ticket médio" value={fmt(fin.avgTicket)} accent="#8b5cf6" />
            <KpiCard label="LTV médio" value={fmt(fin.avgLTV)} accent="#06b6d4" />
            <KpiCard
              label="Lucro acumulado"
              value={fmt(fin.profit)}
              accent={fin.profit >= 0 ? "#16a34a" : "#dc2626"}
              valueColor={fin.profit >= 0 ? "#16a34a" : "#dc2626"}
            />
            <KpiCard
              label="Margem"
              value={`${(fin.margin || 0).toFixed(1)}%`}
              accent={fin.margin >= 20 ? "#16a34a" : "#f59e0b"}
              valueColor={fin.margin >= 20 ? "#16a34a" : "#f59e0b"}
            />
          </div>
        </>
      )}

      {/* Gráfico de Evolução Mensal */}
      {monthly.length > 0 && (
        <>
          <h2 style={sectionTitle}>Evolução Mensal</h2>
          <div style={{
            background: "white",
            borderRadius: 14,
            padding: "24px 20px",
            marginBottom: 40,
            border: "1px solid #f0f0f0",
          }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ borderRadius: 8, border: "1px solid #f0f0f0", fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="faturamento" name="Faturamento" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="custo" name="Custo" fill="#f87171" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucro" name="Lucro" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* OKR Progress */}
      {okr ? (
        <>
          <h2 style={sectionTitle}>Progresso de OKRs</h2>

          <div style={{
            background: "white",
            borderRadius: 14,
            padding: 24,
            marginBottom: 20,
            border: "1px solid #f0f0f0",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>Progresso geral do ciclo</span>
              <span style={{
                fontSize: 24,
                fontWeight: 800,
                color: progressColor(okr.cycle.progress),
              }}>
                {Math.round(okr.cycle.progress * 100)}%
              </span>
            </div>
            <ProgressBar value={okr.cycle.progress} height={10} />
            <div style={{ display: "flex", gap: 28, marginTop: 14 }}>
              <MiniStat label="Objetivos" value={okr.cycle.total} />
              <MiniStat label="Concluídos" value={okr.cycle.completed} color="#16a34a" />
              <MiniStat label="Em progresso" value={okr.cycle.inProgress} color="#3b82f6" />
            </div>
          </div>

          {okr.objectives?.map((obj: any) => (
            <ObjectiveCard key={obj.id} objective={obj} />
          ))}

          {okr.byOwner && okr.byOwner.length > 0 && (
            <>
              <h2 style={{ ...sectionTitle, marginTop: 36 }}>Progresso por responsável</h2>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}>
                {okr.byOwner.map((owner: any, i: number) => (
                  <div key={i} style={{
                    background: "white",
                    borderRadius: 12,
                    padding: 18,
                    border: "1px solid #f0f0f0",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 10 }}>
                      {owner.ownerName || "Sem responsável"}
                    </div>
                    <ProgressBar value={owner.progress} height={6} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: "#888" }}>
                        {owner.completedActions}/{owner.totalActions} ações
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: progressColor(owner.progress) }}>
                        {Math.round(owner.progress * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div style={{
          background: "white",
          borderRadius: 12,
          padding: 40,
          textAlign: "center",
          border: "1px solid #f0f0f0",
        }}>
          <p style={{ fontSize: 15, color: "#888", margin: 0 }}>
            Nenhum ciclo ativo. Crie um ciclo e objetivos na aba "OKRs".
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, accent, valueColor }: {
  label: string; value: string; accent: string; valueColor?: string
}) {
  return (
    <div style={{
      background: "white",
      borderRadius: 12,
      border: "1px solid #f0f0f0",
      borderLeft: `4px solid ${accent}`,
      padding: "18px 20px",
    }}>
      <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: valueColor || "#111" }}>{value}</div>
    </div>
  )
}

function ProgressBar({ value, height = 8 }: { value: number; height?: number }) {
  const pct = Math.round(value * 100)
  return (
    <div style={{ background: "#f3f4f6", borderRadius: 6, height, overflow: "hidden" }}>
      <div style={{
        width: `${pct}%`,
        height: "100%",
        background: progressColor(value),
        borderRadius: 6,
        transition: "width 0.5s ease",
      }} />
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || "#111" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#888" }}>{label}</div>
    </div>
  )
}

function ObjectiveCard({ objective }: { objective: any }) {
  const [open, setOpen] = useState(false)
  const pct = Math.round(objective.progress.progress * 100)

  return (
    <div style={{
      background: "white",
      borderRadius: 12,
      marginBottom: 10,
      border: "1px solid #f0f0f0",
      overflow: "hidden",
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
      >
        <span style={{ fontSize: 11, color: "#bbb", minWidth: 18 }}>{open ? "▼" : "▶"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#222", marginBottom: 6 }}>{objective.title}</div>
          <ProgressBar value={objective.progress.progress} height={7} />
        </div>
        <span style={{
          fontSize: 18,
          fontWeight: 800,
          color: progressColor(objective.progress.progress),
          minWidth: 52,
          textAlign: "right",
        }}>
          {pct}%
        </span>
      </div>

      {open && objective.keyResults?.length > 0 && (
        <div style={{ padding: "0 20px 16px 52px" }}>
          {objective.keyResults.map((kr: any) => {
            const krPct = Math.round(kr.progress.progress * 100)
            return (
              <div key={kr.id} style={{ padding: "10px 0", borderTop: "1px solid #f5f5f5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: "#555" }}>{kr.title}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: progressColor(kr.progress.progress) }}>
                    {krPct}%
                  </span>
                </div>
                <ProgressBar value={kr.progress.progress} height={5} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function progressColor(v: number): string {
  const pct = v * 100
  if (pct >= 80) return "#16a34a"
  if (pct >= 40) return "#3b82f6"
  if (pct > 0) return "#f59e0b"
  return "#d1d5db"
}

function fmt(value: number): string {
  if (value === undefined || value === null) return "R$ 0"
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtK(value: number): string {
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`
  return `R$${value}`
}

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "#333",
  margin: "0 0 16px 0",
}
