import { useEffect, useState } from "react"
import {
  fetchCycles,
  fetchObjectives,
  createCycle,
  activateCycle,
  createObjective,
  deleteObjective,
  createKeyResult,
  deleteKeyResult,
  createAction,
  updateAction,
  deleteAction,
} from "../services/api"

// ============================================================================
// Página principal de gestão de OKRs
// ============================================================================

export default function OkrManager() {
  const [cycles, setCycles] = useState<any[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [objectives, setObjectives] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCycle, setShowNewCycle] = useState(false)
  const [showNewObj, setShowNewObj] = useState(false)

  useEffect(() => { loadCycles() }, [])
  useEffect(() => { if (selectedCycle) loadObjectives() }, [selectedCycle])

  async function loadCycles() {
    try {
      const c = await fetchCycles()
      setCycles(c || [])
      const active = c?.find((x: any) => x.status === "ACTIVE")
      if (active) setSelectedCycle(active.id)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  async function loadObjectives() {
    try {
      const o = await fetchObjectives(selectedCycle)
      setObjectives(o || [])
    } catch (err) { console.error(err) }
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
  }

  if (loading) return <div style={{ padding: 40, color: "#888" }}>Carregando...</div>

  return (
    <div>
      {/* ── Ciclos ─────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <h2 style={sectionTitle}>Ciclos</h2>
          <button onClick={() => setShowNewCycle(!showNewCycle)} style={btnSmall}>
            + Novo ciclo
          </button>
        </div>

        {showNewCycle && <NewCycleForm onSubmit={handleCreateCycle} onCancel={() => setShowNewCycle(false)} />}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cycles.map((c: any) => (
            <div
              key={c.id}
              onClick={() => setSelectedCycle(c.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: c.id === selectedCycle ? "2px solid #111" : "1px solid #e0e0e0",
                background: c.id === selectedCycle ? "#f8f9fb" : "white",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: c.id === selectedCycle ? 600 : 400,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {c.label}
              {c.status === "ACTIVE" && <span style={{ fontSize: 10, background: "#dcfce7", color: "#16a34a", padding: "2px 6px", borderRadius: 4 }}>ativo</span>}
              {c.status !== "ACTIVE" && c.id === selectedCycle && (
                <button onClick={(e) => { e.stopPropagation(); handleActivateCycle(c.id) }} style={{ fontSize: 10, background: "#eef2ff", color: "#4f46e5", border: "none", padding: "2px 6px", borderRadius: 4, cursor: "pointer" }}>
                  ativar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Objetivos ──────────────────────────────────── */}
      {selectedCycle ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <h2 style={sectionTitle}>Objetivos</h2>
            <button onClick={() => setShowNewObj(!showNewObj)} style={btnSmall}>
              + Novo objetivo
            </button>
          </div>

          {showNewObj && <QuickAddForm placeholder="Título do objetivo..." onSubmit={handleCreateObjective} onCancel={() => setShowNewObj(false)} />}

          {objectives.length === 0 ? (
            <EmptyState message="Nenhum objetivo neste ciclo. Clique em '+ Novo objetivo' para começar." />
          ) : (
            objectives.map((obj: any) => (
              <ObjectiveBlock
                key={obj.id}
                objective={obj}
                onDelete={() => handleDeleteObjective(obj.id)}
                onRefresh={refresh}
              />
            ))
          )}
        </>
      ) : (
        <EmptyState message="Selecione ou crie um ciclo para gerenciar OKRs." />
      )}
    </div>
  )
}

// ============================================================================
// Blocos
// ============================================================================

function ObjectiveBlock({ objective, onDelete, onRefresh }: { objective: any; onDelete: () => void; onRefresh: () => void }) {
  const [open, setOpen] = useState(true)
  const [showNewKR, setShowNewKR] = useState(false)
  const pct = Math.round((objective.progress || 0) * 100)

  async function handleAddKR(title: string) {
    await createKeyResult({ title, objectiveId: objective.id, progressMode: "ACTION_BASED" })
    setShowNewKR(false)
    await onRefresh()
  }

  return (
    <div style={{ background: "white", borderRadius: 12, marginBottom: 16, border: "1px solid #f0f0f0", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <span onClick={() => setOpen(!open)} style={{ cursor: "pointer", fontSize: 12, color: "#888", minWidth: 16 }}>
          {open ? "▼" : "▶"}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#222" }}>{objective.title}</div>
          <ProgressBar value={objective.progress || 0} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#333", minWidth: 40, textAlign: "right" }}>{pct}%</span>
        <button onClick={onDelete} style={btnDanger} title="Deletar objetivo">✕</button>
      </div>

      {/* Key Results */}
      {open && (
        <div style={{ padding: "0 20px 16px", marginLeft: 28 }}>
          {objective.keyResults?.map((kr: any) => (
            <KeyResultBlock key={kr.id} kr={kr} onRefresh={onRefresh} />
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

function KeyResultBlock({ kr, onRefresh }: { kr: any; onRefresh: () => void }) {
  const [open, setOpen] = useState(false)
  const [showNewAction, setShowNewAction] = useState(false)
  const pct = Math.round((kr.progress || 0) * 100)

  async function handleAddAction(title: string) {
    await createAction({ title, keyResultId: kr.id })
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
        <span onClick={() => setOpen(!open)} style={{ cursor: "pointer", fontSize: 10, color: "#aaa", minWidth: 14 }}>
          {open ? "▼" : "▶"}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "#444", fontWeight: 500 }}>{kr.title}</div>
          <ProgressBar value={kr.progress || 0} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{pct}%</span>
        <button onClick={handleDeleteKR} style={btnDangerSmall}>✕</button>
      </div>

      {open && (
        <div style={{ marginLeft: 24, marginTop: 8 }}>
          {kr.actions?.map((action: any) => (
            <ActionRow key={action.id} action={action} onRefresh={onRefresh} />
          ))}

          {showNewAction ? (
            <QuickAddForm placeholder="Título da ação..." onSubmit={handleAddAction} onCancel={() => setShowNewAction(false)} />
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

function ActionRow({ action, onRefresh }: { action: any; onRefresh: () => void }) {
  async function toggleStatus() {
    const next: Record<string, string> = {
      NOT_STARTED: "IN_PROGRESS",
      IN_PROGRESS: "COMPLETED",
      COMPLETED: "NOT_STARTED",
      AT_RISK: "IN_PROGRESS",
    }
    await updateAction(action.id, { status: next[action.status] || "IN_PROGRESS" })
    await onRefresh()
  }

  async function handleDelete() {
    await deleteAction(action.id)
    await onRefresh()
  }

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    NOT_STARTED: { label: "A fazer", bg: "#f3f4f6", color: "#6b7280" },
    IN_PROGRESS: { label: "Fazendo", bg: "#dbeafe", color: "#2563eb" },
    AT_RISK: { label: "Risco", bg: "#fef3c7", color: "#d97706" },
    COMPLETED: { label: "Feito", bg: "#dcfce7", color: "#16a34a" },
  }

  const st = statusConfig[action.status] || statusConfig.NOT_STARTED

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "6px 0",
      borderBottom: "1px solid #fafafa",
    }}>
      <button
        onClick={toggleStatus}
        style={{
          padding: "3px 10px",
          borderRadius: 6,
          border: "none",
          background: st.bg,
          color: st.color,
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          minWidth: 60,
        }}
      >
        {st.label}
      </button>
      <span style={{
        flex: 1,
        fontSize: 13,
        color: action.status === "COMPLETED" ? "#9ca3af" : "#333",
        textDecoration: action.status === "COMPLETED" ? "line-through" : "none",
      }}>
        {action.title}
      </span>
      <button onClick={handleDelete} style={btnDangerSmall}>✕</button>
    </div>
  )
}

// ============================================================================
// Componentes auxiliares
// ============================================================================

function ProgressBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? "#16a34a" : pct >= 40 ? "#3b82f6" : pct > 0 ? "#f59e0b" : "#e5e7eb"
  return (
    <div style={{ background: "#f3f4f6", borderRadius: 4, height: 6, marginTop: 4, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s" }} />
    </div>
  )
}

function QuickAddForm({ placeholder, onSubmit, onCancel }: { placeholder: string; onSubmit: (val: string) => void; onCancel: () => void }) {
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

function NewCycleForm({ onSubmit, onCancel }: { onSubmit: (label: string, start: string, end: string) => void; onCancel: () => void }) {
  const [label, setLabel] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")

  return (
    <div style={{ background: "#f8f9fb", padding: 16, borderRadius: 10, marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
        <input placeholder="Ex: Q2 2026" value={label} onChange={e => setLabel(e.target.value)} style={formInput} />
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

// ============================================================================
// Estilos
// ============================================================================

const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "#333", margin: 0 }
const formInput: React.CSSProperties = { padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 13, outline: "none" }
const btnSmall: React.CSSProperties = { padding: "6px 14px", borderRadius: 6, border: "1px solid #e0e0e0", background: "white", fontSize: 12, cursor: "pointer", fontWeight: 500 }
const btnDanger: React.CSSProperties = { background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14, padding: "2px 6px", borderRadius: 4 }
const btnDangerSmall: React.CSSProperties = { background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: 12, padding: "0 4px" }
