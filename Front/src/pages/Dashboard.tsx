import { useEffect, useState } from "react"
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import {
  fetchDashboardSummary,
  fetchCycles,
  fetchMonthlyBreakdown,
  fetchFinancialProjections,
} from "../services/api"

type ChartType = "bar" | "line" | "area"

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [monthly, setMonthly] = useState<any[]>([])
  const [cycles, setCycles] = useState<any[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<ChartType>("bar")
  const [showProjections, setShowProjections] = useState(false)
  const [projections, setProjections] = useState<any>(null)
  const [loadingProjections, setLoadingProjections] = useState(false)

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

  async function handleOpenProjections() {
    setShowProjections(true)
    if (projections) return
    setLoadingProjections(true)
    try {
      const p = await fetchFinancialProjections()
      setProjections(p)
    } catch (err) { console.error(err) }
    setLoadingProjections(false)
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
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 14, background: "white", cursor: "pointer", outline: "none" }}
          >
            <option value="">Todos</option>
            {cycles.map((c: any) => (
              <option key={c.id} value={c.id}>{c.label}{c.status === "ACTIVE" ? " (ativo)" : ""}</option>
            ))}
          </select>
        </div>
      )}

      {/* KPI Cards — título clicável abre modal de projeções */}
      {fin && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <h2 style={{ ...sectionTitle, margin: 0 }}>Métricas Financeiras</h2>
            <button
              onClick={handleOpenProjections}
              title="Ver projeções de cenários"
              style={{
                background: "none", border: "1px solid #e0e0e0", borderRadius: 6,
                padding: "3px 10px", fontSize: 12, color: "#6366f1", cursor: "pointer",
                fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
              }}
            >
              📈 Ver projeções
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 40 }}>
            <KpiCard label="MRR" value={fmt(fin.mrr)} accent="#6366f1" />
            <KpiCard label="Clientes ativos" value={String(fin.activeClients)} accent="#3b82f6" />
            <KpiCard label="Ticket médio" value={fmt(fin.avgTicket)} accent="#8b5cf6" />
            <KpiCard label="LTV médio" value={fmt(fin.avgLTV)} accent="#06b6d4" />
            <KpiCard label="Lucro acumulado" value={fmt(fin.profit)} accent={fin.profit >= 0 ? "#16a34a" : "#dc2626"} valueColor={fin.profit >= 0 ? "#16a34a" : "#dc2626"} />
            <KpiCard label="Margem" value={`${(fin.margin || 0).toFixed(1)}%`} accent={fin.margin >= 20 ? "#16a34a" : "#f59e0b"} valueColor={fin.margin >= 20 ? "#16a34a" : "#f59e0b"} />
          </div>
        </>
      )}

      {/* Gráfico de Evolução Mensal */}
      {monthly.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ ...sectionTitle, margin: 0 }}>Evolução Mensal</h2>
            <ChartTypeSwitcher value={chartType} onChange={setChartType} />
          </div>
          <div style={{ background: "white", borderRadius: 14, padding: "24px 20px", marginBottom: 40, border: "1px solid #f0f0f0" }}>
            <MonthlyChart data={monthly} type={chartType} />
          </div>
        </>
      )}

      {/* OKR Progress */}
      {okr ? (
        <>
          <h2 style={sectionTitle}>Progresso de OKRs</h2>

          <div style={{ background: "white", borderRadius: 14, padding: 24, marginBottom: 20, border: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>Progresso geral do ciclo</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: progressColor(okr.cycle.progress) }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                {okr.byOwner.map((owner: any, i: number) => (
                  <OwnerCard key={i} owner={owner} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div style={{ background: "white", borderRadius: 12, padding: 40, textAlign: "center", border: "1px solid #f0f0f0" }}>
          <p style={{ fontSize: 15, color: "#888", margin: 0 }}>
            Nenhum ciclo ativo. Crie um ciclo e objetivos na aba "OKRs".
          </p>
        </div>
      )}

      {/* Modal de Projeções */}
      {showProjections && (
        <ProjectionsModal
          projections={projections}
          loading={loadingProjections}
          onClose={() => setShowProjections(false)}
        />
      )}
    </div>
  )
}

// ─── Chart Type Switcher ──────────────────────────────────────────────────────

function ChartTypeSwitcher({ value, onChange }: { value: ChartType; onChange: (t: ChartType) => void }) {
  const types: { key: ChartType; label: string }[] = [
    { key: "bar", label: "Barras" },
    { key: "line", label: "Linhas" },
    { key: "area", label: "Área" },
  ]
  return (
    <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 8, padding: 3 }}>
      {types.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: "5px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600,
            cursor: "pointer",
            background: value === t.key ? "white" : "transparent",
            color: value === t.key ? "#333" : "#888",
            boxShadow: value === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Monthly Chart ────────────────────────────────────────────────────────────

function MonthlyChart({ data, type }: { data: any[]; type: ChartType }) {
  const commonProps = {
    data,
    margin: { top: 4, right: 8, left: 0, bottom: 0 },
  }
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
      <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
      <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} width={52} />
      <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ borderRadius: 8, border: "1px solid #f0f0f0", fontSize: 13 }} />
      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
    </>
  )

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart {...commonProps}>
          {axes}
          <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="custo" name="Custo" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart {...commonProps}>
          {axes}
          <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} />
          <Area type="monotone" dataKey="custo" name="Custo" stroke="#f87171" fill="#fef2f2" strokeWidth={2} />
          <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#34d399" fill="#f0fdf4" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart {...commonProps}>
        {axes}
        <Bar dataKey="faturamento" name="Faturamento" fill="#6366f1" radius={[4, 4, 0, 0]} />
        <Bar dataKey="custo" name="Custo" fill="#f87171" radius={[4, 4, 0, 0]} />
        <Bar dataKey="lucro" name="Lucro" fill="#34d399" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Owner Card with Top Focus ────────────────────────────────────────────────

function OwnerCard({ owner }: { owner: any }) {
  const focusTypeIcon: Record<string, string> = {
    objective: "🎯",
    kr: "📊",
    action: "✅",
  }
  const focusTypeLabel: Record<string, string> = {
    objective: "Objetivo",
    kr: "Key Result",
    action: "Ação",
  }
  const statusColor: Record<string, string> = {
    AT_RISK: "#ef4444",
    NOT_STARTED: "#9ca3af",
    IN_PROGRESS: "#3b82f6",
    DONE: "#16a34a",
  }

  return (
    <div style={{ background: "white", borderRadius: 12, padding: 18, border: "1px solid #f0f0f0" }}>
      {/* Header */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#222", marginBottom: 10 }}>
        {owner.ownerName || "Sem responsável"}
      </div>
      <ProgressBar value={owner.progress} height={6} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: "#888" }}>{owner.completedActions}/{owner.totalActions} ações</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: progressColor(owner.progress) }}>
          {Math.round(owner.progress * 100)}%
        </span>
      </div>

      {/* Top Focos */}
      {owner.topFocus && owner.topFocus.length > 0 && (
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Top Focos
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {owner.topFocus.map((item: any, idx: number) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 13 }}>{focusTypeIcon[item.type] || "•"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#333", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: "#aaa" }}>{focusTypeLabel[item.type]}</span>
                    {item.status && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: statusColor[item.status] || "#888" }}>
                        · {item.status === "AT_RISK" ? "Em risco" : item.status === "NOT_STARTED" ? "Não iniciado" : item.status === "IN_PROGRESS" ? "Em progresso" : item.status}
                      </span>
                    )}
                    {item.progress !== undefined && item.progress !== null && (
                      <span style={{ fontSize: 10, color: progressColor(item.progress), fontWeight: 600, marginLeft: "auto" }}>
                        {Math.round(item.progress * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Projections Modal ────────────────────────────────────────────────────────

function ProjectionsModal({ projections, loading, onClose }: {
  projections: any; loading: boolean; onClose: () => void
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white", borderRadius: 16, padding: 32, maxWidth: 860, width: "100%",
          maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111" }}>Projeções de Cenários</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
              Baseado nos últimos 90 dias · projeção para os próximos 3 meses
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888", padding: "4px 8px" }}>✕</button>
        </div>

        {loading && <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Calculando projeções...</div>}

        {!loading && !projections && (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
            Não há dados históricos suficientes para calcular projeções.
          </div>
        )}

        {!loading && projections && (
          <>
            {/* Historical baseline */}
            <div style={{ background: "#f8f9fb", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", gap: 32, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Meses analisados</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#333" }}>{projections.monthsAnalyzed}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Receita média/mês</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#6366f1" }}>{fmt(projections.historical?.avgRevenue)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Custo médio/mês</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#f87171" }}>{fmt(projections.historical?.avgCosts)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Margem média</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a" }}>{(projections.historical?.avgMargin || 0).toFixed(1)}%</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Crescimento mensal</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#333" }}>
                  {projections.historical?.monthlyGrowthRate > 0 ? "+" : ""}
                  {((projections.historical?.monthlyGrowthRate || 0) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 3 scenario columns */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {["pessimist", "base", "optimist"].map(key => {
                const sc = projections.scenarios?.[key]
                if (!sc) return null
                return (
                  <div key={key} style={{ border: `2px solid ${sc.color}20`, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ background: sc.color, padding: "10px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{sc.label}</div>
                    </div>
                    <div style={{ padding: 12 }}>
                      {sc.months?.map((m: any, i: number) => (
                        <div key={i} style={{
                          padding: "10px 0",
                          borderBottom: i < sc.months.length - 1 ? "1px solid #f3f4f6" : "none",
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6 }}>{m.label}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <ProjectionRow label="Receita" value={fmt(m.revenue)} color="#6366f1" />
                            <ProjectionRow label="Custo" value={fmt(m.costs)} color="#f87171" />
                            <ProjectionRow label="Lucro" value={fmt(m.profit)} color={m.profit >= 0 ? "#16a34a" : "#dc2626"} />
                            <ProjectionRow label="Margem" value={`${(m.margin || 0).toFixed(1)}%`} color="#888" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ProjectionRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 11, color: "#aaa" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, accent, valueColor }: {
  label: string; value: string; accent: string; valueColor?: string
}) {
  return (
    <div style={{ background: "white", borderRadius: 12, border: "1px solid #f0f0f0", borderLeft: `4px solid ${accent}`, padding: "18px 20px" }}>
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
      <div style={{ width: `${pct}%`, height: "100%", background: progressColor(value), borderRadius: 6, transition: "width 0.5s ease" }} />
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
    <div style={{ background: "white", borderRadius: 12, marginBottom: 10, border: "1px solid #f0f0f0", overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 11, color: "#bbb", minWidth: 18 }}>{open ? "▼" : "▶"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#222", marginBottom: 6 }}>
            {objective.title}
            {objective.ownerName && (
              <span style={{ fontSize: 11, color: "#888", fontWeight: 400, marginLeft: 8 }}>
                · {objective.ownerName}
              </span>
            )}
          </div>
          <ProgressBar value={objective.progress.progress} height={7} />
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, color: progressColor(objective.progress.progress), minWidth: 52, textAlign: "right" }}>
          {pct}%
        </span>
      </div>

      {open && objective.keyResults?.length > 0 && (
        <div style={{ padding: "0 20px 16px 52px" }}>
          {objective.keyResults.map((kr: any) => {
            const krPct = Math.round(kr.progress.progress * 100)
            return (
              <div key={kr.id} style={{ padding: "10px 0", borderTop: "1px solid #f5f5f5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                  <div style={{ flex: 1, marginRight: 8 }}>
                    <span style={{ fontSize: 13, color: "#555" }}>{kr.title}</span>
                    {kr.ownerName && (
                      <span style={{ fontSize: 11, color: "#aaa", marginLeft: 6 }}>· {kr.ownerName}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: progressColor(kr.progress.progress), flexShrink: 0 }}>
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

const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 16px 0" }
