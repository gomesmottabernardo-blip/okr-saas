// ============================================================================
// OKR Progress Engine — lib/calculations/okr-progress.ts
// ============================================================================
//
// Responsável por calcular progresso em todos os níveis:
//   Action → KeyResult → Objective → Cycle
//
// Regras de cálculo:
//   ACTION_BASED KR:  (concluidas + em_andamento * 0.5) / total
//   METRIC_BASED KR:  (currentValue - startValue) / (targetValue - startValue)
//   Objective:         média ponderada dos KRs (peso igual por padrão)
//   Cycle:             média dos Objectives
//
// Status é derivado do progresso:
//   0%        → NOT_STARTED
//   1-99%     → IN_PROGRESS
//   100%      → COMPLETED
//   (manual)  → AT_RISK / CANCELLED
//
// ============================================================================

import type { ActionStatus, ProgressMode } from "@prisma/client"

// ----------------------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------------------

interface ActionForCalc {
  status: ActionStatus
}

interface KeyResultForCalc {
  id: string
  title: string
  progressMode: ProgressMode
  startValue: number | null
  currentValue: number
  targetValue: number
  actions?: ActionForCalc[]
}

interface ObjectiveForCalc {
  id: string
  title: string
  keyResults: KeyResultForCalc[]
}

interface CycleForCalc {
  id: string
  objectives: ObjectiveForCalc[]
}

// Resultado de cálculo com metadata
export interface ProgressResult {
  progress: number   // 0.0 a 1.0
  status: "NOT_STARTED" | "IN_PROGRESS" | "AT_RISK" | "COMPLETED"
  total: number
  completed: number
  inProgress: number
}

// Pesos para o cálculo action-based
const ACTION_WEIGHTS: Record<ActionStatus, number> = {
  NOT_STARTED: 0,
  IN_PROGRESS: 0.5,
  AT_RISK: 0.3,       // Em risco conta menos que em andamento
  COMPLETED: 1,
}

// ----------------------------------------------------------------------------
// Cálculo: Key Result (action-based)
// ----------------------------------------------------------------------------

export function calculateActionBasedProgress(
  actions: ActionForCalc[]
): ProgressResult {
  if (actions.length === 0) {
    return {
      progress: 0,
      status: "NOT_STARTED",
      total: 0,
      completed: 0,
      inProgress: 0,
    }
  }

  const total = actions.length
  const completed = actions.filter(a => a.status === "COMPLETED").length
  const inProgress = actions.filter(a => a.status === "IN_PROGRESS").length

  const weightedSum = actions.reduce((sum, action) => {
    return sum + (ACTION_WEIGHTS[action.status] ?? 0)
  }, 0)

  const progress = Math.min(weightedSum / total, 1)

  return {
    progress: round(progress),
    status: deriveStatus(progress, completed === total),
    total,
    completed,
    inProgress,
  }
}

// ----------------------------------------------------------------------------
// Cálculo: Key Result (metric-based)
// ----------------------------------------------------------------------------

export function calculateMetricBasedProgress(
  startValue: number | null,
  currentValue: number,
  targetValue: number
): ProgressResult {
  const start = startValue ?? 0
  const range = targetValue - start

  if (range === 0) {
    // Target = start → se current >= target, 100%
    const progress = currentValue >= targetValue ? 1 : 0
    return {
      progress,
      status: progress === 1 ? "COMPLETED" : "NOT_STARTED",
      total: 1,
      completed: progress === 1 ? 1 : 0,
      inProgress: 0,
    }
  }

  const raw = (currentValue - start) / range
  const progress = Math.max(0, Math.min(raw, 1)) // Clamp 0-1

  return {
    progress: round(progress),
    status: deriveStatus(progress, progress >= 1),
    total: 1,
    completed: progress >= 1 ? 1 : 0,
    inProgress: progress > 0 && progress < 1 ? 1 : 0,
  }
}

// ----------------------------------------------------------------------------
// Cálculo: Key Result (auto-detect mode)
// ----------------------------------------------------------------------------

export function calculateKeyResultProgress(kr: KeyResultForCalc): ProgressResult {
  if (kr.progressMode === "ACTION_BASED") {
    return calculateActionBasedProgress(kr.actions ?? [])
  }

  return calculateMetricBasedProgress(
    kr.startValue,
    kr.currentValue,
    kr.targetValue
  )
}

// ----------------------------------------------------------------------------
// Cálculo: Objective (média dos KRs)
// ----------------------------------------------------------------------------

export function calculateObjectiveProgress(
  objective: ObjectiveForCalc
): ProgressResult {
  const keyResults = objective.keyResults

  if (keyResults.length === 0) {
    return {
      progress: 0,
      status: "NOT_STARTED",
      total: 0,
      completed: 0,
      inProgress: 0,
    }
  }

  const krResults = keyResults.map(kr => calculateKeyResultProgress(kr))

  const avgProgress =
    krResults.reduce((sum, r) => sum + r.progress, 0) / krResults.length

  const completed = krResults.filter(r => r.progress >= 1).length
  const inProgress = krResults.filter(r => r.progress > 0 && r.progress < 1).length

  return {
    progress: round(avgProgress),
    status: deriveStatus(avgProgress, completed === keyResults.length),
    total: keyResults.length,
    completed,
    inProgress,
  }
}

// ----------------------------------------------------------------------------
// Cálculo: Cycle (média dos Objectives)
// ----------------------------------------------------------------------------

export function calculateCycleProgress(cycle: CycleForCalc): ProgressResult {
  const objectives = cycle.objectives

  if (objectives.length === 0) {
    return {
      progress: 0,
      status: "NOT_STARTED",
      total: 0,
      completed: 0,
      inProgress: 0,
    }
  }

  const objResults = objectives.map(obj => calculateObjectiveProgress(obj))

  const avgProgress =
    objResults.reduce((sum, r) => sum + r.progress, 0) / objResults.length

  const completed = objResults.filter(r => r.progress >= 1).length
  const inProgress = objResults.filter(r => r.progress > 0 && r.progress < 1).length

  return {
    progress: round(avgProgress),
    status: deriveStatus(avgProgress, completed === objectives.length),
    total: objectives.length,
    completed,
    inProgress,
  }
}

// ----------------------------------------------------------------------------
// Métricas agregadas (para dashboard)
// ----------------------------------------------------------------------------

export interface DashboardOkrMetrics {
  cycle: ProgressResult
  objectives: Array<{
    id: string
    title: string
    progress: ProgressResult
    keyResults: Array<{
      id: string
      title: string
      progress: ProgressResult
    }>
  }>
  byOwner: Array<{
    ownerId: string | null
    ownerName: string | null
    totalActions: number
    completedActions: number
    progress: number
  }>
}

export function calculateDashboardMetrics(
  cycle: CycleForCalc & {
    objectives: Array<
      ObjectiveForCalc & {
        title: string
        keyResults: Array<
          KeyResultForCalc & {
            title: string
            actions?: Array<ActionForCalc & { ownerId?: string | null; ownerName?: string | null }>
          }
        >
      }
    >
  }
): DashboardOkrMetrics {
  // Progresso do ciclo
  const cycleProgress = calculateCycleProgress(cycle)

  // Progresso por objetivo + KR
  const objectives = cycle.objectives.map(obj => ({
    id: obj.id,
    title: obj.title,
    progress: calculateObjectiveProgress(obj),
    keyResults: obj.keyResults.map(kr => ({
      id: kr.id,
      title: kr.title,
      progress: calculateKeyResultProgress(kr),
    })),
  }))

  // Progresso por owner (agrega todas as actions)
  const ownerMap = new Map<
    string,
    { ownerName: string | null; totalActions: number; completedActions: number }
  >()

  for (const obj of cycle.objectives) {
    for (const kr of obj.keyResults) {
      for (const action of kr.actions ?? []) {
        const act = action as ActionForCalc & { ownerId?: string | null; ownerName?: string | null }
        const key = act.ownerId ?? "__unassigned__"

        if (!ownerMap.has(key)) {
          ownerMap.set(key, {
            ownerName: act.ownerName ?? null,
            totalActions: 0,
            completedActions: 0,
          })
        }

        const entry = ownerMap.get(key)!
        entry.totalActions++
        if ((action as ActionForCalc).status === "COMPLETED") {
          entry.completedActions++
        }
      }
    }
  }

  const byOwner = Array.from(ownerMap.entries()).map(([ownerId, data]) => ({
    ownerId: ownerId === "__unassigned__" ? null : ownerId,
    ownerName: data.ownerName,
    totalActions: data.totalActions,
    completedActions: data.completedActions,
    progress: data.totalActions === 0
      ? 0
      : round(data.completedActions / data.totalActions),
  }))

  return {
    cycle: cycleProgress,
    objectives,
    byOwner,
  }
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function deriveStatus(
  progress: number,
  allComplete: boolean
): "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" {
  if (allComplete || progress >= 1) return "COMPLETED"
  if (progress === 0) return "NOT_STARTED"
  return "IN_PROGRESS"
}

function round(value: number, decimals = 4): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}
