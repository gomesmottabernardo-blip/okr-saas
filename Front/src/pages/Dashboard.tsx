import { useEffect, useState } from "react"
import { fetchDashboardSummary, fetchCycles } from "../services/api"

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [cycles, setCycles] = useState<any[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCycles()
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [selectedCycle])

  async function loadCycles() {
    try {
      const c = await fetchCycles()
      setCycles(c || [])
      const active = c?.find((x: any) => x.status === "ACTIVE")
      if (active) setSelectedCycle(active.id)
    } catch (err) {
      console.error("Erro ao carregar ciclos:", err)
    }
  }

  async function loadDashboard() {
    setLoading(true)
    try {
      const d = await fetchDashboardSummary(selectedCycle || undefined)
      setData(d)
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err)
    } finally {
      setLoading(false)
    }
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
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>Ciclo:</span>
          <select
            value={selectedCycle}
            onChange={e => setSelectedCycle(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e0e0e0",
              fontSize: 14,
              background: "white",
              cursor: "pointer",
            }}
          >
            <option value="">Todos</option>
            {cycles.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.label} {c.status === "ACTIVE" ? " (ativo)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Métricas Financeiras */}
      {fin && (
        <>
          <h2 style={sectionTitle}>Métricas Financeiras</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}>
            <MetricCard label="MRR" value={formatCurrency(fin.mrr)} />
            <MetricCard label="Clientes ativos" value={fin.activeClients} />
            <MetricCard label="Ticket médio" value={formatCurrency(fin.avgTicket)} />
            <MetricCard label="LTV médio" value={formatCurrency(fin.avgLTV)} />
            <MetricCard label="Lucro" value={formatCurrency(fin.profit)} color={fin.profit >= 0 ? "#16a34a" : "#dc2626"} />
            <MetricCard label="Margem" value={`${(fin.margin || 0).toFixed(1)}%`} color={fin.margin >= 20 ? "#16a34a" : "#f59e0b"} />
          </div>
        </>
      )}

      {/* OKR Progress */}
      {okr ? (
        <>
          <h2 style={sectionTitle}>Progresso de OKRs</h2>

          {/* Progresso Geral do Ciclo */}
          <div style={{
            background: "white",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            border: "1px solid #f0f0f0",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>Progresso geral</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>
                {Math.round(okr.cycle.progress * 100)}%
              </span>
            </div>
            <ProgressBar value={okr.cycle.progress} />
            <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
              <MiniStat label="Objetivos" value={okr.cycle.total} />
              <MiniStat label="Concluídos" value={okr.cycle.completed} color="#16a34a" />
              <MiniStat label="Em progresso" value={okr.cycle.inProgress} color="#3b82f6" />
            </div>
          </div>

          {/* Por Objetivo */}
          {okr.objectives?.map((obj: any) => (
            <ObjectiveCard key={obj.id} objective={obj} />
          ))}

          {/* Por Owner */}
          {okr.byOwner && okr.byOwner.length > 0 && (
            <>
              <h2 style={{ ...sectionTitle, marginTop: 40 }}>Progresso por responsável</h2>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}>
                {okr.byOwner.map((owner: any, i: number) => (
                  <div key={i} style={{
                    background: "white",
                    borderRadius: 10,
                    padding: 16,
                    border: "1px solid #f0f0f0",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 8 }}>
                      {owner.ownerName || "Sem responsável"}
                    </div>
                    <ProgressBar value={owner.progress} />
                    <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                      {owner.completedActions}/{owner.totalActions} ações concluídas
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
          <p style={{ fontSize: 16, color: "#888", margin: 0 }}>
            Nenhum ciclo ativo. Crie um ciclo e objetivos na aba "OKRs".
          </p>
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function MetricCard({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div style={{
      background: "white",
      padding: 20,
      borderRadius: 12,
      border: "1px solid #f0f0f0",
    }}>
      <div style={{ fontSize: 12, color: "#888", fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || "#111" }}>{value}</div>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? "#16a34a" : pct >= 40 ? "#3b82f6" : pct > 0 ? "#f59e0b" : "#e5e7eb"

  return (
    <div style={{
      background: "#f3f4f6",
      borderRadius: 6,
      height: 8,
      overflow: "hidden",
    }}>
      <div style={{
        width: `${pct}%`,
        height: "100%",
        background: color,
        borderRadius: 6,
        transition: "width 0.5s ease",
      }} />
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || "#111" }}>{value}</div>
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
      marginBottom: 12,
      border: "1px solid #f0f0f0",
      overflow: "hidden",
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "16px 20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span style={{ fontSize: 12, color: "#888", minWidth: 20 }}>{open ? "▼" : "▶"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>{objective.title}</div>
          <div style={{ marginTop: 6 }}>
            <ProgressBar value={objective.progress.progress} />
          </div>
        </div>
        <span style={{
          fontSize: 16,
          fontWeight: 700,
          color: pct >= 80 ? "#16a34a" : pct >= 40 ? "#3b82f6" : "#f59e0b",
          minWidth: 48,
          textAlign: "right",
        }}>
          {pct}%
        </span>
      </div>

      {open && objective.keyResults?.length > 0 && (
        <div style={{ padding: "0 20px 16px", paddingLeft: 56 }}>
          {objective.keyResults.map((kr: any) => {
            const krPct = Math.round(kr.progress.progress * 100)
            return (
              <div key={kr.id} style={{
                padding: "10px 0",
                borderTop: "1px solid #f5f5f5",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#555" }}>{kr.title}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{krPct}%</span>
                </div>
                <ProgressBar value={kr.progress.progress} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function formatCurrency(value: number): string {
  if (value === undefined || value === null) return "R$ 0"
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "#333",
  margin: "0 0 16px 0",
}
