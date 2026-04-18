import { useEffect, useRef, useState, useMemo } from "react"
import {
  fetchCycles, fetchObjectives, fetchUsers, fetchOverdueAlerts,
  createCycle, activateCycle,
  createObjective, deleteObjective,
  createKeyResult, deleteKeyResult,
  createAction, deleteAction,
} from "../services/api"

type ViewMode = "tree" | "filter"

interface AnalysisItem {
  type: "objective" | "kr" | "action"
  id: string
  title: string
  ownerName: string | null
  priority: "critical" | "watch" | "ok"
  score: number
  reasons: string[]
  progress?: number
  status?: string
  objectiveTitle?: string
  krTitle?: string
}

interface Props { primaryColor?: string }

export default function OkrManager({ primaryColor = "#6366f1" }: Props) {
  const [cycles, setCycles] = useState<any[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [objectives, setObjectives] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCycle, setShowNewCycle] = useState(false)
  const [showNewObj, setShowNewObj] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("tree")
  const [filterOwners, setFilterOwners] = useState<string[]>([])
  const [filterObjectives, setFilterObjectives] = useState<string[]>([])
  const [filterKRs, setFilterKRs] = useState<string[]>([])
  const [showAnalysis, setShowAnalysis] = useState(false)

  useEffect(() => { loadCycles(); loadUsers() }, [])
  useEffect(() => { if (selectedCycle) { loadObjectives(); loadAlerts() } }, [selectedCycle])

  // Clean up KR filter when objective filter changes
  useEffect(() => {
    if (filterObjectives.length > 0 && filterKRs.length > 0) {
      const validKRIds = new Set(
        objectives
          .filter(obj => filterObjectives.includes(obj.id))
          .flatMap(obj => (obj.keyResults || []).map((kr: any) => kr.id))
      )
      setFilterKRs(prev => prev.filter(id => validKRIds.has(id)))
    }
  }, [filterObjectives])

  async function loadCycles() {
    try {
      const c = await fetchCycles()
      setCycles(c || [])
      const active = c?.find((x: any) => x.status === "ACTIVE")
      if (active) setSelectedCycle(active.id)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  async function loadUsers() {
    try { setUsers((await fetchUsers()) || []) } catch (_) {}
  }

  async function loadObjectives() {
    try { setObjectives((await fetchObjectives(selectedCycle)) || []) } catch (err) { console.error(err) }
  }

  async function loadAlerts() {
    try { setAlerts((await fetchOverdueAlerts(selectedCycle)) || []) } catch (_) {}
  }

  async function handleCreateCycle(label: string, start: string, end: string) {
    await createCycle(label, start, end)
    setShowNewCycle(false)
    await loadCycles()
  }

  async function handleActivateCycle(id: string) {
    await activateCycle(id)
    await loadCycles()
    setSelectedCycle(id)
  }

  async function handleCreateObjective(title: string) {
    await createObjective({ title, cycleId: selectedCycle })
    setShowNewObj(false)
    await loadObjectives()
  }

  async function handleDeleteObjective(id: string) {
    if (!confirm("Deletar objetivo e todos seus KRs e ações?")) return
    await deleteObjective(id)
    await loadObjectives()
  }

  async function refresh() {
    await loadObjectives()
    await loadAlerts()
  }

  const allKROptions = useMemo(() => {
    const src = filterObjectives.length > 0
      ? objectives.filter(obj => filterObjectives.includes(obj.id))
      : objectives
    return src.flatMap(obj =>
      (obj.keyResults || []).map((kr: any) => ({ value: kr.id, label: kr.title, objectiveId: obj.id }))
    )
  }, [objectives, filterObjectives])

  const visibleObjectives = useMemo(() =>
    viewMode === "tree"
      ? objectives
      : applyFilters(objectives, filterOwners, filterObjectives, filterKRs),
    [objectives, viewMode, filterOwners, filterObjectives, filterKRs]
  )

  const analysisItems = useMemo(() =>
    showAnalysis ? analyzeByImportance(visibleObjectives) : [],
    [showAnalysis, visibleObjectives]
  )

  const hasFilters = filterOwners.length > 0 || filterObjectives.length > 0 || filterKRs.length > 0

  if (loading) return <div style={{ padding: 40, color: "#888" }}>Carregando...</div>

  return (
    <div>
      {/* Alertas */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <h2 style={{ ...sectionTitle, margin: 0, color: "#dc2626" }}>
              Alertas — {alerts.length} tarefa{alerts.length !== 1 ? "s" : ""} em risco ou atrasada{alerts.length !== 1 ? "s" : ""}
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alerts.map((a: any) => <AlertCard key={a.id} alert={a} />)}
          </div>
        </div>
      )}

      {/* Ciclos */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <h2 style={sectionTitle}>Ciclos</h2>
          <button onClick={() => setShowNewCycle(!showNewCycle)} style={btnSmall}>+ Novo ciclo</button>
        </div>
        {showNewCycle && <NewCycleForm onSubmit={handleCreateCycle} onCancel={() => setShowNewCycle(false)} />}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cycles.map((c: any) => (
            <div
              key={c.id}
              onClick={() => setSelectedCycle(c.id)}
              style={{
                padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                border: c.id === selectedCycle ? `2px solid ${primaryColor}` : "1px solid #e0e0e0",
                background: c.id === selectedCycle ? `${primaryColor}08` : "white",
                fontWeight: c.id === selectedCycle ? 600 : 400,
                color: c.id === selectedCycle ? primaryColor : "#333",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {c.label}
              {c.status === "ACTIVE" && (
                <span style={{ fontSize: 10, background: "#dcfce7", color: "#16a34a", padding: "2px 6px", borderRadius: 4 }}>ativo</span>
              )}
              {c.status !== "ACTIVE" && c.id === selectedCycle && (
                <button
                  onClick={e => { e.stopPropagation(); handleActivateCycle(c.id) }}
                  style={{ fontSize: 10, background: "#eef2ff", color: primaryColor, border: "none", padding: "2px 6px", borderRadius: 4, cursor: "pointer" }}
                >ativar</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Objetivos */}
      {selectedCycle ? (
        <>
          {/* Header com modos e botão de análise */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <h2 style={sectionTitle}>Objetivos</h2>

            {/* Toggle de modo */}
            <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 3 }}>
              <ModeBtn active={viewMode === "tree"} onClick={() => setViewMode("tree")} label="🌳 Árvore" />
              <ModeBtn active={viewMode === "filter"} onClick={() => setViewMode("filter")} label="🔍 Filtros" />
            </div>

            {/* Botão de análise inteligente */}
            {objectives.length > 0 && (
              <button
                onClick={() => setShowAnalysis(true)}
                style={{
                  padding: "6px 14px", borderRadius: 7, border: "none",
                  background: "#111", color: "white", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                }}
              >
                🧠 Analisar prioridades
              </button>
            )}

            <button onClick={() => setShowNewObj(!showNewObj)} style={{ ...btnSmall, marginLeft: "auto" }}>
              + Novo objetivo
            </button>
          </div>

          {/* Painel de filtros */}
          {viewMode === "filter" && (
            <FilterPanel
              users={users}
              objectives={objectives}
              krOptions={allKROptions}
              filterOwners={filterOwners}
              filterObjectives={filterObjectives}
              filterKRs={filterKRs}
              onChangeOwners={setFilterOwners}
              onChangeObjectives={setFilterObjectives}
              onChangeKRs={ids => {
                const valid = new Set(allKROptions.map(k => k.value))
                setFilterKRs(ids.filter(id => valid.has(id)))
              }}
              resultCount={visibleObjectives.length}
              primaryColor={primaryColor}
            />
          )}

          {showNewObj && (
            <QuickAddForm
              placeholder="Título do objetivo..."
              onSubmit={handleCreateObjective}
              onCancel={() => setShowNewObj(false)}
            />
          )}

          {visibleObjectives.length === 0 ? (
            <EmptyState message={
              hasFilters && viewMode === "filter"
                ? "Nenhum resultado para os filtros selecionados. Tente ampliar a seleção."
                : "Nenhum objetivo neste ciclo. Clique em '+ Novo objetivo' para começar."
            } />
          ) : (
            visibleObjectives.map((obj: any) => (
              <ObjectiveBlock
                key={obj.id}
                objective={obj}
                users={users}
                primaryColor={primaryColor}
                onDelete={() => handleDeleteObjective(obj.id)}
                onRefresh={refresh}
              />
            ))
          )}
        </>
      ) : (
        <EmptyState message="Selecione ou crie um ciclo para gerenciar OKRs." />
      )}

      {/* Modal de análise */}
      {showAnalysis && (
        <AnalysisModal
          items={analysisItems}
          scope={hasFilters && viewMode === "filter" ? "filtros aplicados" : "ciclo completo"}
          totalObjectives={visibleObjectives.length}
          onClose={() => setShowAnalysis(false)}
          primaryColor={primaryColor}
        />
      )}
    </div>
  )
}

// ─── Mode Button ──────────────────────────────────────────────────────────────

function ModeBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600,
        cursor: "pointer",
        background: active ? "white" : "transparent",
        color: active ? "#333" : "#888",
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
      }}
    >{label}</button>
  )
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({
  users, objectives, krOptions,
  filterOwners, filterObjectives, filterKRs,
  onChangeOwners, onChangeObjectives, onChangeKRs,
  resultCount, primaryColor,
}: {
  users: any[]; objectives: any[]; krOptions: { value: string; label: string }[]
  filterOwners: string[]; filterObjectives: string[]; filterKRs: string[]
  onChangeOwners: (v: string[]) => void; onChangeObjectives: (v: string[]) => void; onChangeKRs: (v: string[]) => void
  resultCount: number; primaryColor: string
}) {
  const hasFilters = filterOwners.length > 0 || filterObjectives.length > 0 || filterKRs.length > 0

  return (
    <div style={{ background: "#f8f9fb", borderRadius: 12, padding: "14px 18px", marginBottom: 20, border: "1px solid #e8eaed" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Filtrar:
        </span>

        <MultiSelect
          label="Colaboradores"
          options={users.map(u => ({ value: u.id, label: u.name || u.email }))}
          selected={filterOwners}
          onChange={onChangeOwners}
          primaryColor={primaryColor}
        />

        <MultiSelect
          label="Objetivos"
          options={objectives.map(obj => ({ value: obj.id, label: obj.title }))}
          selected={filterObjectives}
          onChange={onChangeObjectives}
          primaryColor={primaryColor}
        />

        <MultiSelect
          label="Key Results"
          options={krOptions}
          selected={filterKRs}
          onChange={onChangeKRs}
          disabled={krOptions.length === 0}
          primaryColor={primaryColor}
        />

        {hasFilters && (
          <>
            <button
              onClick={() => { onChangeOwners([]); onChangeObjectives([]); onChangeKRs([]) }}
              style={{ fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer" }}
            >
              × Limpar filtros
            </button>
            <span style={{ marginLeft: "auto", fontSize: 12, color: primaryColor, fontWeight: 700 }}>
              {resultCount} objetivo{resultCount !== 1 ? "s" : ""} visível{resultCount !== 1 ? "is" : ""}
            </span>
          </>
        )}

        {!hasFilters && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#ccc" }}>
            Selecione um ou mais filtros para refinar a visualização
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Multi-Select ─────────────────────────────────────────────────────────────

function MultiSelect({
  label, options, selected, onChange, disabled = false, primaryColor = "#6366f1",
}: {
  label: string; options: { value: string; label: string }[]
  selected: string[]; onChange: (v: string[]) => void
  disabled?: boolean; primaryColor?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open])

  function toggle(value: string) {
    if (selected.includes(value)) onChange(selected.filter(v => v !== value))
    else onChange([...selected, value])
  }

  const active = selected.length > 0

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        style={{
          padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: active ? 600 : 400,
          cursor: disabled ? "not-allowed" : "pointer",
          border: active ? `1.5px solid ${primaryColor}` : "1px solid #e0e0e0",
          background: active ? `${primaryColor}0e` : "white",
          color: active ? primaryColor : disabled ? "#ccc" : "#555",
          display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
        }}
      >
        {active ? `${label} (${selected.length})` : label}
        <span style={{ fontSize: 9, opacity: 0.5 }}>▾</span>
      </button>

      {open && !disabled && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 300,
          background: "white", border: "1px solid #e8e8e8", borderRadius: 10, padding: 6,
          minWidth: 230, maxHeight: 260, overflowY: "auto",
          boxShadow: "0 8px 28px rgba(0,0,0,0.10)",
        }}>
          {options.length === 0 ? (
            <div style={{ padding: "10px 14px", color: "#bbb", fontSize: 13 }}>Nenhuma opção disponível</div>
          ) : (
            <>
              {selected.length > 0 && (
                <div style={{ padding: "4px 8px 6px" }}>
                  <button
                    onClick={() => { onChange([]); setOpen(false) }}
                    style={{ fontSize: 11, color: primaryColor, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >Limpar seleção</button>
                </div>
              )}
              {options.map(opt => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                    cursor: "pointer", borderRadius: 6,
                    background: selected.includes(opt.value) ? `${primaryColor}0e` : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                    style={{ accentColor: primaryColor, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, color: "#333", lineHeight: 1.4 }}>{opt.label}</span>
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Analysis Modal ───────────────────────────────────────────────────────────

function AnalysisModal({ items, scope, totalObjectives, onClose, primaryColor }: {
  items: AnalysisItem[]; scope: string; totalObjectives: number; onClose: () => void; primaryColor: string
}) {
  const critical = items.filter(i => i.priority === "critical")
  const watch = items.filter(i => i.priority === "watch")
  const ok = items.filter(i => i.priority === "ok")

  const typeIcon: Record<string, string> = { objective: "🎯", kr: "📊", action: "✅" }
  const typeLabel: Record<string, string> = { objective: "Objetivo", kr: "Key Result", action: "Ação" }
  const statusLabel: Record<string, { label: string; color: string }> = {
    NOT_STARTED: { label: "A fazer", color: "#6b7280" },
    IN_PROGRESS: { label: "Em progresso", color: "#2563eb" },
    AT_RISK:     { label: "Em risco", color: "#d97706" },
    COMPLETED:   { label: "Feito", color: "#16a34a" },
  }
  const priorityCfg: Record<string, { border: string; leftBorder: string; bg: string }> = {
    critical: { border: "#fca5a5", leftBorder: "#ef4444", bg: "#fff8f8" },
    watch:    { border: "#fcd34d", leftBorder: "#f59e0b", bg: "#fffdf0" },
    ok:       { border: "#bbf7d0", leftBorder: "#22c55e", bg: "#f8fff8" },
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", borderRadius: 16, padding: 32, maxWidth: 740, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.16)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111" }}>🧠 Análise de Prioridades</h2>
            <p style={{ margin: "5px 0 0", fontSize: 13, color: "#888" }}>
              Escopo: {scope} · {totalObjectives} objetivo{totalObjectives !== 1 ? "s" : ""} analisado{totalObjectives !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#bbb" }}>✕</button>
        </div>

        {/* Summary chips */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
          {[
            { count: critical.length, label: "Atenção imediata", color: "#dc2626", bg: "#fef2f2" },
            { count: watch.length,    label: "Monitorar",        color: "#d97706", bg: "#fffbeb" },
            { count: ok.length,       label: "No caminho",       color: "#16a34a", bg: "#f0fdf4" },
          ].map(s => (
            <div key={s.label} style={{ padding: "8px 16px", borderRadius: 8, background: s.bg, border: `1px solid ${s.color}25` }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 500, marginLeft: 7 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#16a34a", marginBottom: 6 }}>Tudo no caminho certo!</div>
            <div style={{ fontSize: 14, color: "#888" }}>Nenhum item crítico identificado. Continue assim.</div>
          </div>
        )}

        {/* Sections */}
        {[
          { title: "🔴 Atenção Imediata", sub: "Itens que exigem ação urgente agora", list: critical },
          { title: "🟡 Monitorar de Perto", sub: "Itens em risco se não houver intervenção", list: watch },
          { title: "🟢 No Caminho", sub: "Itens progredindo adequadamente", list: ok },
        ].map(sec => sec.list.length === 0 ? null : (
          <div key={sec.title} style={{ marginBottom: 28 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>{sec.title}</div>
              <div style={{ fontSize: 12, color: "#aaa" }}>{sec.sub}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sec.list.map((item, idx) => {
                const cfg = priorityCfg[item.priority]
                const st = item.status ? statusLabel[item.status] : null
                const progColor = item.progress !== undefined
                  ? (item.progress >= 0.8 ? "#16a34a" : item.progress >= 0.4 ? "#3b82f6" : item.progress > 0 ? "#f59e0b" : "#d1d5db")
                  : "#888"
                return (
                  <div
                    key={`${item.type}-${item.id}-${idx}`}
                    style={{
                      border: `1px solid ${cfg.border}`,
                      borderLeft: `3px solid ${cfg.leftBorder}`,
                      background: cfg.bg,
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}
                  >
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                      <span style={{ fontSize: 13 }}>{typeIcon[item.type]}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#999", background: "#f3f4f6", padding: "2px 7px", borderRadius: 4, textTransform: "uppercase" }}>
                        {typeLabel[item.type]}
                      </span>
                      {item.type !== "objective" && item.objectiveTitle && (
                        <span style={{ fontSize: 11, color: "#bbb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>
                          {item.krTitle ? `${item.objectiveTitle} › ${item.krTitle}` : item.objectiveTitle}
                        </span>
                      )}
                      <span style={{ marginLeft: "auto", fontSize: 10, color: "#ccc" }}>score {item.score}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#222", marginBottom: 7 }}>{item.title}</div>

                        {/* Chips */}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                          {item.ownerName ? (
                            <span style={{ fontSize: 11, color: "#555", background: "#f0f0f0", padding: "2px 8px", borderRadius: 12 }}>
                              👤 {item.ownerName}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "#f59e0b", background: "#fffbeb", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>
                              ⚠ Sem responsável
                            </span>
                          )}
                          {st && (
                            <span style={{ fontSize: 11, color: st.color, background: "#f8f9fb", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>
                              {st.label}
                            </span>
                          )}
                        </div>

                        {/* Reasons */}
                        {item.reasons.map((r, i) => (
                          <div key={i} style={{ fontSize: 12, color: "#555", display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 8, color: "#ccc" }}>●</span>{r}
                          </div>
                        ))}
                      </div>

                      {item.progress !== undefined && (
                        <div style={{ textAlign: "center", flexShrink: 0, minWidth: 48 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: progColor }}>
                            {Math.round(item.progress * 100)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Footer explanation */}
        <div style={{ marginTop: 8, padding: "14px 18px", background: "#f8f9fb", borderRadius: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
            Como a pontuação é calculada
          </div>
          <div style={{ fontSize: 12, color: "#999", lineHeight: 1.6 }}>
            Considera: status (em risco, atrasado), prazo, ausência de responsável, progresso atual e impacto no objetivo pai.
            Score ≥ 60 → atenção imediata · 25–59 → monitorar · abaixo de 25 → no caminho.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: any }) {
  const isOverdue = alert.isOverdue
  const bg = isOverdue ? "#fff1f0" : "#fffbeb"
  const border = isOverdue ? "#fca5a5" : "#fcd34d"
  const badge = isOverdue
    ? { label: "Atrasada", bg: "#fecaca", color: "#dc2626" }
    : { label: "Em risco",  bg: "#fef3c7", color: "#d97706" }

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: badge.bg, color: badge.color, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
          {badge.label}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#222", marginBottom: 2 }}>{alert.title}</div>
          <div style={{ fontSize: 11, color: "#888" }}>{alert.objectiveTitle} → {alert.keyResultTitle}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {alert.ownerName && <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 2 }}>{alert.ownerName}</div>}
          {alert.dueDate && (
            <div style={{ fontSize: 11, color: isOverdue ? "#dc2626" : "#888" }}>
              {isOverdue ? "Venceu em " : "Vence em "}
              {new Date(alert.dueDate).toLocaleDateString("pt-BR")}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
            Objetivo: {Math.round(alert.objectiveProgress * 100)}%
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Objective Block ──────────────────────────────────────────────────────────

function ObjectiveBlock({ objective, users, primaryColor, onDelete, onRefresh }: {
  objective: any; users: any[]; primaryColor: string; onDelete: () => void; onRefresh: () => void
}) {
  const [open, setOpen] = useState(true)
  const [showNewKR, setShowNewKR] = useState(false)
  const pct = Math.round((objective.progress || 0) * 100)
  const color = pct >= 80 ? "#16a34a" : pct >= 40 ? "#3b82f6" : pct > 0 ? "#f59e0b" : "#d1d5db"

  async function handleAddKR(title: string) {
    await createKeyResult({ title, objectiveId: objective.id, progressMode: "ACTION_BASED" })
    setShowNewKR(false)
    await onRefresh()
  }

  return (
    <div style={{ background: "white", borderRadius: 12, marginBottom: 14, border: "1px solid #f0f0f0", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <span onClick={() => setOpen(!open)} style={{ cursor: "pointer", fontSize: 11, color: "#bbb", minWidth: 14 }}>
          {open ? "▼" : "▶"}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#222", marginBottom: 4 }}>{objective.title}</div>
          {objective.owner && (
            <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>
              Responsável: <strong>{objective.owner.name}</strong>
            </div>
          )}
          <ProgressBar value={objective.progress || 0} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color, minWidth: 44, textAlign: "right" }}>{pct}%</span>
        <button onClick={onDelete} style={btnDanger}>✕</button>
      </div>

      {open && (
        <div style={{ padding: "0 20px 16px", marginLeft: 26 }}>
          {objective.keyResults?.map((kr: any) => (
            <KeyResultBlock key={kr.id} kr={kr} users={users} primaryColor={primaryColor} onRefresh={onRefresh} />
          ))}
          {showNewKR ? (
            <QuickAddForm placeholder="Título do Key Result..." onSubmit={handleAddKR} onCancel={() => setShowNewKR(false)} />
          ) : (
            <button onClick={() => setShowNewKR(true)} style={{ ...btnSmall, marginTop: 8, fontSize: 12 }}>
              + Key Result
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Key Result Block ─────────────────────────────────────────────────────────

function KeyResultBlock({ kr, users, primaryColor, onRefresh }: {
  kr: any; users: any[]; primaryColor: string; onRefresh: () => void
}) {
  const [open, setOpen] = useState(false)
  const [showNewAction, setShowNewAction] = useState(false)
  const pct = Math.round((kr.progress || 0) * 100)
  const color = pct >= 80 ? "#16a34a" : pct >= 40 ? "#3b82f6" : pct > 0 ? "#f59e0b" : "#d1d5db"

  async function handleAddAction(title: string, ownerId?: string) {
    await createAction({ title, keyResultId: kr.id, ownerId })
    setShowNewAction(false)
    await onRefresh()
  }

  async function handleDeleteKR() {
    if (!confirm("Deletar Key Result e todas suas ações?")) return
    await deleteKeyResult(kr.id)
    await onRefresh()
  }

  return (
    <div style={{ borderTop: "1px solid #f5f5f5", padding: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span onClick={() => setOpen(!open)} style={{ cursor: "pointer", fontSize: 10, color: "#bbb", minWidth: 12 }}>
          {open ? "▼" : "▶"}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "#444", fontWeight: 500, marginBottom: 4 }}>
            {kr.title}
            {kr.owner && (
              <span style={{ fontSize: 11, color: "#aaa", fontWeight: 400, marginLeft: 8 }}>({kr.owner.name})</span>
            )}
          </div>
          <ProgressBar value={kr.progress || 0} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36, textAlign: "right" }}>{pct}%</span>
        <button onClick={handleDeleteKR} style={btnDangerSmall}>✕</button>
      </div>

      {open && (
        <div style={{ marginLeft: 22, marginTop: 8 }}>
          {kr.actions?.map((action: any) => (
            <ActionRow key={action.id} action={action} onRefresh={onRefresh} />
          ))}
          {showNewAction ? (
            <ActionAddForm
              users={users}
              primaryColor={primaryColor}
              onSubmit={handleAddAction}
              onCancel={() => setShowNewAction(false)}
            />
          ) : (
            <button onClick={() => setShowNewAction(true)} style={{ ...btnSmall, fontSize: 11, marginTop: 4 }}>
              + Ação
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Action Row ───────────────────────────────────────────────────────────────

function ActionRow({ action, onRefresh }: { action: any; onRefresh: () => void }) {
  async function handleDelete() {
    await deleteAction(action.id)
    await onRefresh()
  }

  const statusConfig: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    NOT_STARTED: { label: "A fazer",   bg: "#f3f4f6", color: "#6b7280", icon: "○" },
    IN_PROGRESS: { label: "Fazendo",   bg: "#dbeafe", color: "#2563eb", icon: "◑" },
    AT_RISK:     { label: "Em risco",  bg: "#fef3c7", color: "#d97706", icon: "⚠" },
    COMPLETED:   { label: "Feito",     bg: "#dcfce7", color: "#16a34a", icon: "✓" },
  }
  const st = statusConfig[action.status] || statusConfig.NOT_STARTED
  const done = action.status === "COMPLETED"

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #fafafa" }}>
      <span
        title="Status sincronizado do sistema integrado"
        style={{
          padding: "3px 9px", borderRadius: 5,
          background: st.bg, color: st.color,
          fontSize: 11, fontWeight: 600,
          minWidth: 70, flexShrink: 0,
          display: "inline-flex", alignItems: "center", gap: 4,
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: 10 }}>{st.icon}</span>
        {st.label}
      </span>

      <span style={{ flex: 1, fontSize: 13, color: done ? "#9ca3af" : "#333", textDecoration: done ? "line-through" : "none" }}>
        {action.title}
      </span>

      {action.owner ? (
        <span style={{ fontSize: 11, color: "#555", background: "#f3f4f6", padding: "2px 8px", borderRadius: 12, whiteSpace: "nowrap", flexShrink: 0 }}>
          👤 {action.owner.name}
        </span>
      ) : (
        <span style={{ fontSize: 11, color: "#f59e0b", background: "#fffbeb", padding: "2px 8px", borderRadius: 12, whiteSpace: "nowrap", flexShrink: 0, fontWeight: 600 }}>
          sem responsável
        </span>
      )}

      {action.dueDate && (
        <span style={{ fontSize: 10, color: new Date(action.dueDate) < new Date() && !done ? "#dc2626" : "#bbb", flexShrink: 0 }}>
          {new Date(action.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        </span>
      )}

      <button onClick={handleDelete} style={btnDangerSmall}>✕</button>
    </div>
  )
}

// ─── Action Add Form ──────────────────────────────────────────────────────────

function ActionAddForm({ users, primaryColor, onSubmit, onCancel }: {
  users: any[]; primaryColor: string;
  onSubmit: (title: string, ownerId?: string) => void;
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [ownerId, setOwnerId] = useState("")

  function submit() {
    if (!title.trim()) return
    onSubmit(title.trim(), ownerId || undefined)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8, padding: "10px 12px", background: "#fafafa", borderRadius: 8, border: "1px solid #f0f0f0" }}>
      <input
        autoFocus
        placeholder="Título da ação..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit() }}
        style={{ padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: 7, fontSize: 13, outline: "none" }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <select
          value={ownerId}
          onChange={e => setOwnerId(e.target.value)}
          style={{ flex: 1, padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: 7, fontSize: 12, background: "white", outline: "none" }}
        >
          <option value="">Sem responsável</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
        </select>
        <button onClick={submit} style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: primaryColor, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Salvar
        </button>
        <button onClick={onCancel} style={btnSmall}>Cancelar</button>
      </div>
    </div>
  )
}

// ─── Aux Components ───────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? "#16a34a" : pct >= 40 ? "#3b82f6" : pct > 0 ? "#f59e0b" : "#e5e7eb"
  return (
    <div style={{ background: "#f3f4f6", borderRadius: 4, height: 5, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s" }} />
    </div>
  )
}

function QuickAddForm({ placeholder, onSubmit, onCancel }: {
  placeholder: string; onSubmit: (val: string) => void; onCancel: () => void
}) {
  const [value, setValue] = useState("")
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <input
        autoFocus
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && value.trim()) onSubmit(value.trim()) }}
        style={{ flex: 1, padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 13, outline: "none" }}
      />
      <button onClick={() => { if (value.trim()) onSubmit(value.trim()) }} style={{ ...btnSmall, background: "#111", color: "white" }}>Salvar</button>
      <button onClick={onCancel} style={btnSmall}>Cancelar</button>
    </div>
  )
}

function NewCycleForm({ onSubmit, onCancel }: { onSubmit: (l: string, s: string, e: string) => void; onCancel: () => void }) {
  const [label, setLabel] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  return (
    <div style={{ background: "#f8f9fb", padding: 16, borderRadius: 10, marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
        <input placeholder="Ex: Q3 2026" value={label} onChange={e => setLabel(e.target.value)} style={formInput} />
        <input type="date" value={start} onChange={e => setStart(e.target.value)} style={formInput} />
        <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={formInput} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { if (label && start && end) onSubmit(label, start, end) }} style={{ ...btnSmall, background: "#111", color: "white" }}>Criar ciclo</button>
        <button onClick={onCancel} style={btnSmall}>Cancelar</button>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: 40, textAlign: "center", border: "1px solid #f0f0f0" }}>
      <p style={{ fontSize: 14, color: "#888", margin: 0 }}>{message}</p>
    </div>
  )
}

// ─── Filter Engine ────────────────────────────────────────────────────────────

function applyFilters(
  objectives: any[],
  filterOwners: string[],
  filterObjectives: string[],
  filterKRs: string[]
): any[] {
  let result = objectives

  if (filterObjectives.length > 0) {
    result = result.filter(obj => filterObjectives.includes(obj.id))
  }

  if (filterKRs.length > 0) {
    result = result
      .map(obj => ({ ...obj, keyResults: (obj.keyResults || []).filter((kr: any) => filterKRs.includes(kr.id)) }))
      .filter(obj => obj.keyResults.length > 0)
  }

  if (filterOwners.length > 0) {
    result = result
      .map(obj => {
        if (obj.owner && filterOwners.includes(obj.owner.id)) return obj
        const krs = (obj.keyResults || [])
          .map((kr: any) => {
            if (kr.owner && filterOwners.includes(kr.owner.id)) return kr
            const actions = (kr.actions || []).filter((a: any) => a.owner && filterOwners.includes(a.owner.id))
            return { ...kr, actions }
          })
          .filter((kr: any) => (kr.owner && filterOwners.includes(kr.owner.id)) || kr.actions.length > 0)
        return { ...obj, keyResults: krs }
      })
      .filter(obj => (obj.owner && filterOwners.includes(obj.owner.id)) || obj.keyResults.length > 0)
  }

  return result
}

// ─── Analysis Engine ──────────────────────────────────────────────────────────

function analyzeByImportance(objectives: any[]): AnalysisItem[] {
  const now = new Date()
  const items: AnalysisItem[] = []

  for (const obj of objectives) {
    const objProgress = obj.progress || 0
    const objScore = scoreObjective(obj, now)
    if (objScore > 0 && objProgress < 1) {
      items.push({
        type: "objective", id: obj.id, title: obj.title,
        ownerName: obj.owner?.name ?? null,
        priority: scoreToPriority(objScore), score: objScore,
        reasons: reasonsObjective(obj, now), progress: objProgress,
      })
    }

    for (const kr of obj.keyResults || []) {
      const krProgress = kr.progress || 0
      const krScore = scoreKR(kr, obj, now)
      if (krScore > 0 && krProgress < 1) {
        items.push({
          type: "kr", id: kr.id, title: kr.title,
          ownerName: kr.owner?.name ?? null,
          priority: scoreToPriority(krScore), score: krScore,
          reasons: reasonsKR(kr, obj, now), progress: krProgress,
          objectiveTitle: obj.title,
        })
      }

      for (const action of kr.actions || []) {
        if (action.status === "COMPLETED") continue
        const actionScore = scoreAction(action, kr, obj, now)
        if (actionScore > 0) {
          items.push({
            type: "action", id: action.id, title: action.title,
            ownerName: action.owner?.name ?? null,
            priority: scoreToPriority(actionScore), score: actionScore,
            reasons: reasonsAction(action, kr, obj, now),
            status: action.status,
            objectiveTitle: obj.title, krTitle: kr.title,
          })
        }
      }
    }
  }

  return items.sort((a, b) => b.score - a.score)
}

function scoreAction(action: any, kr: any, obj: any, now: Date): number {
  let s = 0
  if (action.status === "AT_RISK")     s += 80
  else if (action.status === "NOT_STARTED") s += 25
  else if (action.status === "IN_PROGRESS") s += 15
  if (!action.owner) s += 25
  if (action.dueDate) {
    const days = Math.floor((new Date(action.dueDate).getTime() - now.getTime()) / 86400000)
    if (days < 0)   s += 60
    else if (days <= 3)  s += 35
    else if (days <= 7)  s += 20
    else if (days <= 14) s += 8
  }
  if ((kr.progress || 0) < 0.3)  s += 15
  if ((obj.progress || 0) < 0.3) s += 8
  return s
}

function scoreKR(kr: any, obj: any, now: Date): number {
  const p = kr.progress || 0
  let s = p === 0 ? 40 : p < 0.25 ? 30 : p < 0.5 ? 15 : 0
  if (!kr.owner) s += 10
  const actions = kr.actions || []
  s += actions.filter((a: any) => a.status === "AT_RISK").length * 12
  s += actions.filter((a: any) => a.status !== "COMPLETED" && a.dueDate && new Date(a.dueDate) < now).length * 10
  s += actions.filter((a: any) => !a.owner && a.status !== "COMPLETED").length * 6
  if ((obj.progress || 0) < 0.3) s += 8
  return s
}

function scoreObjective(obj: any, now: Date): number {
  const p = obj.progress || 0
  let s = p === 0 ? 50 : p < 0.2 ? 40 : p < 0.4 ? 22 : p < 0.6 ? 10 : 0
  if (!obj.owner) s += 10
  let atRisk = 0, overdue = 0, noOwner = 0
  for (const kr of obj.keyResults || []) {
    for (const a of kr.actions || []) {
      if (a.status === "COMPLETED") continue
      if (a.status === "AT_RISK") atRisk++
      if (a.dueDate && new Date(a.dueDate) < now) overdue++
      if (!a.owner) noOwner++
    }
  }
  s += atRisk * 6 + overdue * 5 + noOwner * 3
  return s
}

function reasonsAction(action: any, kr: any, obj: any, now: Date): string[] {
  const r: string[] = []
  if (action.status === "AT_RISK")     r.push("Status: em risco")
  if (action.status === "NOT_STARTED") r.push("Ainda não foi iniciada")
  if (!action.owner) r.push("Sem responsável — risco de abandono")
  if (action.dueDate) {
    const days = Math.floor((new Date(action.dueDate).getTime() - now.getTime()) / 86400000)
    if (days < 0)        r.push(`Atrasada há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? "s" : ""}`)
    else if (days <= 3)  r.push(`Vence em ${days} dia${days !== 1 ? "s" : ""} — urgente`)
    else if (days <= 7)  r.push(`Vence em ${days} dias`)
    else if (days <= 14) r.push(`Prazo em ${days} dias`)
  }
  if ((kr.progress || 0) < 0.3)  r.push(`KR com apenas ${Math.round((kr.progress || 0) * 100)}% de progresso`)
  if ((obj.progress || 0) < 0.3) r.push(`Objetivo em ${Math.round((obj.progress || 0) * 100)}% — impacto direto`)
  return r
}

function reasonsKR(kr: any, obj: any, now: Date): string[] {
  const r: string[] = []
  const p = kr.progress || 0
  if (p === 0) r.push("Nenhum progresso registrado")
  else if (p < 0.3) r.push(`Progresso crítico: ${Math.round(p * 100)}%`)
  if (!kr.owner) r.push("Key Result sem responsável")
  const actions = kr.actions || []
  const atRisk  = actions.filter((a: any) => a.status === "AT_RISK").length
  const overdue = actions.filter((a: any) => a.status !== "COMPLETED" && a.dueDate && new Date(a.dueDate) < now).length
  const noOwner = actions.filter((a: any) => !a.owner && a.status !== "COMPLETED").length
  if (atRisk  > 0) r.push(`${atRisk} ação${atRisk > 1 ? "ões" : ""} em risco`)
  if (overdue > 0) r.push(`${overdue} ação${overdue > 1 ? "ões" : ""} atrasada${overdue > 1 ? "s" : ""}`)
  if (noOwner > 0) r.push(`${noOwner} ação${noOwner > 1 ? "ões" : ""} sem responsável`)
  if ((obj.progress || 0) < 0.3) r.push(`Objetivo em ${Math.round((obj.progress || 0) * 100)}% — cada KR é crítico`)
  return r
}

function reasonsObjective(obj: any, now: Date): string[] {
  const r: string[] = []
  const p = obj.progress || 0
  if (p === 0) r.push("Nenhum progresso registrado no objetivo")
  else if (p < 0.3) r.push(`Progresso crítico: ${Math.round(p * 100)}%`)
  if (!obj.owner) r.push("Objetivo sem responsável definido")
  let atRisk = 0, overdue = 0, noOwner = 0
  for (const kr of obj.keyResults || []) {
    for (const a of kr.actions || []) {
      if (a.status === "COMPLETED") continue
      if (a.status === "AT_RISK") atRisk++
      if (a.dueDate && new Date(a.dueDate) < now) overdue++
      if (!a.owner) noOwner++
    }
  }
  if (atRisk  > 0) r.push(`${atRisk} ação${atRisk > 1 ? "ões" : ""} em risco`)
  if (overdue > 0) r.push(`${overdue} ação${overdue > 1 ? "ões" : ""} atrasada${overdue > 1 ? "s" : ""}`)
  if (noOwner > 0) r.push(`${noOwner} ação${noOwner > 1 ? "ões" : ""} sem responsável`)
  return r
}

function scoreToPriority(score: number): "critical" | "watch" | "ok" {
  if (score >= 60) return "critical"
  if (score >= 25) return "watch"
  return "ok"
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "#333", margin: 0 }
const formInput: React.CSSProperties = { padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 13, outline: "none" }
const btnSmall: React.CSSProperties = { padding: "6px 14px", borderRadius: 6, border: "1px solid #e0e0e0", background: "white", fontSize: 12, cursor: "pointer", fontWeight: 500 }
const btnDanger: React.CSSProperties = { background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: 14, padding: "2px 6px" }
const btnDangerSmall: React.CSSProperties = { background: "none", border: "none", color: "#e0e0e0", cursor: "pointer", fontSize: 12, padding: "0 4px" }
