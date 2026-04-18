import { useEffect, useState } from "react"
import {
  fetchCycles, fetchObjectives, fetchUsers, fetchOverdueAlerts,
  createCycle, activateCycle,
  createObjective, deleteObjective,
  createKeyResult, deleteKeyResult,
  createAction, updateAction, deleteAction,
} from "../services/api"

interface Props {
  primaryColor?: string
}

export default function OkrManager({ primaryColor = "#6366f1" }: Props) {
  const [cycles, setCycles] = useState<any[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [objectives, setObjectives] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCycle, setShowNewCycle] = useState(false)
  const [showNewObj, setShowNewObj] = useState(false)

  useEffect(() => { loadCycles(); loadUsers() }, [])
  useEffect(() => { if (selectedCycle) { loadObjectives(); loadAlerts() } }, [selectedCycle])

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
    try {
      const u = await fetchUsers()
      setUsers(u || [])
    } catch (_) {}
  }

  async function loadObjectives() {
    try {
      const o = await fetchObjectives(selectedCycle)
      setObjectives(o || [])
    } catch (err) { console.error(err) }
  }

  async function loadAlerts() {
    try {
      const a = await fetchOverdueAlerts(selectedCycle)
      setAlerts(a || [])
    } catch (_) {}
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

  if (loading) return <div style={{ padding: 40, color: "#888" }}>Carregando...</div>

  return (
    <div>
      {/* ── Alertas ─────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <h2 style={{ ...sectionTitle, margin: 0, color: "#dc2626" }}>
              Alertas — {alerts.length} tarefa{alerts.length !== 1 ? "s" : ""} em risco ou atrasada{alerts.length !== 1 ? "s" : ""}
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alerts.map((a: any) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </div>
        </div>
      )}

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
                border: c.id === selectedCycle ? `2px solid ${primaryColor}` : "1px solid #e0e0e0",
                background: c.id === selectedCycle ? `${primaryColor}08` : "white",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: c.id === selectedCycle ? 600 : 400,
                color: c.id === selectedCycle ? primaryColor : "#333",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {c.label}
              {c.status === "ACTIVE" && <span style={{ fontSize: 10, background: "#dcfce7", color: "#16a34a", padding: "2px 6px", borderRadius: 4 }}>ativo</span>}
              {c.status !== "ACTIVE" && c.id === selectedCycle && (
                <button
                  onClick={e => { e.stopPropagation(); handleActivateCycle(c.id) }}
                  style={{ fontSize: 10, background: "#eef2ff", color: primaryColor, border: "none", padding: "2px 6px", borderRadius: 4, cursor: "pointer" }}
                >
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
    </div>
  )
}

// ============================================================================
// Alert Card
// ============================================================================

function AlertCard({ alert }: { alert: any }) {
  const isOverdue = alert.isOverdue
  const isAtRisk = alert.status === "AT_RISK"

  const bg = isOverdue ? "#fff1f0" : "#fffbeb"
  const border = isOverdue ? "#fca5a5" : "#fcd34d"
  const badge = isOverdue
    ? { label: "Atrasada", bg: "#fecaca", color: "#dc2626" }
    : { label: "Em risco", bg: "#fef3c7", color: "#d97706" }

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 14, padding: "2px 8px", borderRadius: 4, background: badge.bg, color: badge.color, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
          {badge.label}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#222", marginBottom: 2 }}>{alert.title}</div>
          <div style={{ fontSize: 11, color: "#888" }}>
            {alert.objectiveTitle} → {alert.keyResultTitle}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {alert.ownerName && (
            <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 2 }}>{alert.ownerName}</div>
          )}
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

// ============================================================================
// Objective Block
// ============================================================================

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
          <div style={{ fontSize: 15, fontWeight: 600, color: "#222", marginBottom: 6 }}>{objective.title}</div>
          {objective.owner && (
            <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>Responsável: {objective.owner.name}</div>
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

// ============================================================================
// Key Result Block
// ============================================================================

function KeyResultBlock({ kr, users, primaryColor, onRefresh }: { kr: any; users: any[]; primaryColor: string; onRefresh: () => void }) {
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
            {kr.owner && <span style={{ fontSize: 11, color: "#aaa", fontWeight: 400, marginLeft: 8 }}>({kr.owner.name})</span>}
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
            <ActionAddForm users={users} primaryColor={primaryColor} onSubmit={handleAddAction} onCancel={() => setShowNewAction(false)} />
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

// ============================================================================
// Action Row — com owner
// ============================================================================

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
    AT_RISK: { label: "Em risco", bg: "#fef3c7", color: "#d97706" },
    COMPLETED: { label: "Feito", bg: "#dcfce7", color: "#16a34a" },
  }

  const st = statusConfig[action.status] || statusConfig.NOT_STARTED
  const done = action.status === "COMPLETED"

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #fafafa" }}>
      <button
        onClick={toggleStatus}
        style={{ padding: "3px 9px", borderRadius: 5, border: "none", background: st.bg, color: st.color, fontSize: 11, fontWeight: 600, cursor: "pointer", minWidth: 60, flexShrink: 0 }}
      >
        {st.label}
      </button>
      <span style={{ flex: 1, fontSize: 13, color: done ? "#9ca3af" : "#333", textDecoration: done ? "line-through" : "none" }}>
        {action.title}
      </span>
      {action.owner ? (
        <span style={{ fontSize: 11, color: "#888", background: "#f3f4f6", padding: "2px 8px", borderRadius: 12, whiteSpace: "nowrap", flexShrink: 0 }}>
          {action.owner.name}
        </span>
      ) : (
        <span style={{ fontSize: 11, color: "#ddd", flexShrink: 0 }}>sem responsável</span>
      )}
      <button onClick={handleDelete} style={btnDangerSmall}>✕</button>
    </div>
  )
}

// ============================================================================
// Action Add Form — com seletor de owner
// ============================================================================

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
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name || u.email}</option>
          ))}
        </select>
        <button onClick={submit} style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: primaryColor, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Salvar
        </button>
        <button onClick={onCancel} style={btnSmall}>Cancelar</button>
      </div>
    </div>
  )
}

// ============================================================================
// Aux components
// ============================================================================

function ProgressBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? "#16a34a" : pct >= 40 ? "#3b82f6" : pct > 0 ? "#f59e0b" : "#e5e7eb"
  return (
    <div style={{ background: "#f3f4f6", borderRadius: 4, height: 5, overflow: "hidden" }}>
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

// ============================================================================
// Estilos
// ============================================================================

const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "#333", margin: 0 }
const formInput: React.CSSProperties = { padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 13, outline: "none" }
const btnSmall: React.CSSProperties = { padding: "6px 14px", borderRadius: 6, border: "1px solid #e0e0e0", background: "white", fontSize: 12, cursor: "pointer", fontWeight: 500 }
const btnDanger: React.CSSProperties = { background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: 14, padding: "2px 6px" }
const btnDangerSmall: React.CSSProperties = { background: "none", border: "none", color: "#e0e0e0", cursor: "pointer", fontSize: 12, padding: "0 4px" }
