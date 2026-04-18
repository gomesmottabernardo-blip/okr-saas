// ============================================================================
// OKR Service — services/okr.service.ts
// ============================================================================
//
// Toda lógica de negócio de OKR vive aqui. Os routers viram casca fina.
//
// Responsabilidades:
//   - CRUD de Objectives, KeyResults, Actions
//   - Recálculo de progresso em cascata
//   - Filtragem por Cycle
//   - Isolamento multi-tenant (companyId em tudo)
//
// ============================================================================

import { prisma } from "../lib/prisma"
import {
  calculateKeyResultProgress,
  calculateObjectiveProgress,
  calculateCycleProgress,
  calculateDashboardMetrics,
} from "../lib/calculations/okr-progress"
import type {
  OkrStatus,
  ActionStatus,
  ProgressMode,
  Prisma,
} from "@prisma/client"

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface CreateObjectiveInput {
  title: string
  description?: string
  ownerId?: string
  cycleId?: string
}

interface UpdateObjectiveInput {
  title?: string
  description?: string
  status?: OkrStatus
  ownerId?: string
  cycleId?: string
  sortOrder?: number
}

interface CreateKeyResultInput {
  title: string
  description?: string
  objectiveId: string
  progressMode?: ProgressMode
  targetValue?: number
  startValue?: number
  unit?: string
  ownerId?: string
}

interface UpdateKeyResultInput {
  title?: string
  description?: string
  status?: OkrStatus
  currentValue?: number
  targetValue?: number
  ownerId?: string
  sortOrder?: number
}

interface CreateActionInput {
  title: string
  description?: string
  keyResultId: string
  ownerId?: string
  dueDate?: Date
}

interface UpdateActionInput {
  title?: string
  description?: string
  status?: ActionStatus
  ownerId?: string
  dueDate?: Date
  sortOrder?: number
}

// ----------------------------------------------------------------------------
// Cycles
// ----------------------------------------------------------------------------

export async function listCycles(companyId: string) {
  return prisma.cycle.findMany({
    where: { companyId },
    orderBy: { startDate: "desc" },
  })
}

export async function getActiveCycle(companyId: string) {
  return prisma.cycle.findFirst({
    where: { companyId, status: "ACTIVE" },
  })
}

export async function createCycle(
  companyId: string,
  data: { label: string; startDate: Date; endDate: Date }
) {
  return prisma.cycle.create({
    data: {
      ...data,
      companyId,
    },
  })
}

export async function activateCycle(companyId: string, cycleId: string) {
  // Desativa qualquer ciclo ativo atual
  await prisma.cycle.updateMany({
    where: { companyId, status: "ACTIVE" },
    data: { status: "CLOSED" },
  })

  // Ativa o novo
  return prisma.cycle.update({
    where: { id: cycleId },
    data: { status: "ACTIVE" },
  })
}

// ----------------------------------------------------------------------------
// Objectives
// ----------------------------------------------------------------------------

export async function listObjectives(companyId: string, cycleId?: string) {
  const where: Prisma.ObjectiveWhereInput = { companyId }
  if (cycleId) where.cycleId = cycleId

  return prisma.objective.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      keyResults: {
        include: {
          actions: {
            include: {
              owner: { select: { id: true, name: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
          owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  })
}

export async function getObjective(companyId: string, objectiveId: string) {
  const objective = await prisma.objective.findFirst({
    where: { id: objectiveId, companyId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      cycle: true,
      keyResults: {
        include: {
          actions: {
            include: {
              owner: { select: { id: true, name: true, email: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
          owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  if (!objective) {
    throw new Error("Objective not found")
  }

  return objective
}

export async function createObjective(
  companyId: string,
  input: CreateObjectiveInput
) {
  return prisma.objective.create({
    data: {
      title: input.title,
      description: input.description,
      ownerId: input.ownerId,
      cycleId: input.cycleId,
      companyId,
    },
    include: {
      keyResults: true,
    },
  })
}

export async function updateObjective(
  companyId: string,
  objectiveId: string,
  input: UpdateObjectiveInput
) {
  // Verifica ownership (companyId)
  const existing = await prisma.objective.findFirst({
    where: { id: objectiveId, companyId },
  })

  if (!existing) {
    throw new Error("Objective not found")
  }

  return prisma.objective.update({
    where: { id: objectiveId },
    data: input,
    include: {
      keyResults: { include: { actions: true } },
    },
  })
}

export async function deleteObjective(companyId: string, objectiveId: string) {
  const existing = await prisma.objective.findFirst({
    where: { id: objectiveId, companyId },
  })

  if (!existing) {
    throw new Error("Objective not found")
  }

  // Cascade delete via Prisma (KRs e Actions deletados automaticamente)
  return prisma.objective.delete({
    where: { id: objectiveId },
  })
}

// ----------------------------------------------------------------------------
// Key Results
// ----------------------------------------------------------------------------

export async function createKeyResult(
  companyId: string,
  input: CreateKeyResultInput
) {
  // Verifica que o objective pertence à empresa
  const objective = await prisma.objective.findFirst({
    where: { id: input.objectiveId, companyId },
  })

  if (!objective) {
    throw new Error("Objective not found")
  }

  const kr = await prisma.keyResult.create({
    data: {
      title: input.title,
      description: input.description,
      objectiveId: input.objectiveId,
      progressMode: input.progressMode ?? "METRIC_BASED",
      targetValue: input.targetValue ?? 0,
      startValue: input.startValue ?? 0,
      currentValue: input.startValue ?? 0,
      unit: input.unit,
      ownerId: input.ownerId,
      companyId,
    },
  })

  // Recalcula progresso do objective pai
  await recalculateObjectiveProgress(companyId, input.objectiveId)

  return kr
}

export async function updateKeyResult(
  companyId: string,
  keyResultId: string,
  input: UpdateKeyResultInput
) {
  const existing = await prisma.keyResult.findFirst({
    where: { id: keyResultId, companyId },
  })

  if (!existing) {
    throw new Error("Key Result not found")
  }

  const updated = await prisma.keyResult.update({
    where: { id: keyResultId },
    data: input,
    include: { actions: true },
  })

  // Recalcula progresso em cascata
  await recalculateKeyResultProgress(companyId, keyResultId)
  await recalculateObjectiveProgress(companyId, existing.objectiveId)

  return updated
}

export async function deleteKeyResult(companyId: string, keyResultId: string) {
  const existing = await prisma.keyResult.findFirst({
    where: { id: keyResultId, companyId },
  })

  if (!existing) {
    throw new Error("Key Result not found")
  }

  await prisma.keyResult.delete({
    where: { id: keyResultId },
  })

  // Recalcula objective pai
  await recalculateObjectiveProgress(companyId, existing.objectiveId)
}

// ----------------------------------------------------------------------------
// Actions
// ----------------------------------------------------------------------------

export async function createAction(
  companyId: string,
  input: CreateActionInput
) {
  // Verifica que o KR pertence à empresa
  const kr = await prisma.keyResult.findFirst({
    where: { id: input.keyResultId, companyId },
  })

  if (!kr) {
    throw new Error("Key Result not found")
  }

  const action = await prisma.action.create({
    data: {
      title: input.title,
      description: input.description,
      keyResultId: input.keyResultId,
      ownerId: input.ownerId,
      dueDate: input.dueDate,
      companyId,
    },
  })

  // Recalcula em cascata
  await recalculateKeyResultProgress(companyId, input.keyResultId)
  await recalculateObjectiveProgress(companyId, kr.objectiveId)

  return action
}

export async function updateAction(
  companyId: string,
  actionId: string,
  input: UpdateActionInput
) {
  const existing = await prisma.action.findFirst({
    where: { id: actionId, companyId },
    include: { keyResult: true },
  })

  if (!existing) {
    throw new Error("Action not found")
  }

  const updated = await prisma.action.update({
    where: { id: actionId },
    data: {
      ...input,
      completedAt: input.status === "COMPLETED" ? new Date() : undefined,
    },
  })

  // Recalcula em cascata
  await recalculateKeyResultProgress(companyId, existing.keyResultId)
  await recalculateObjectiveProgress(companyId, existing.keyResult.objectiveId)

  return updated
}

export async function deleteAction(companyId: string, actionId: string) {
  const existing = await prisma.action.findFirst({
    where: { id: actionId, companyId },
    include: { keyResult: true },
  })

  if (!existing) {
    throw new Error("Action not found")
  }

  await prisma.action.delete({
    where: { id: actionId },
  })

  await recalculateKeyResultProgress(companyId, existing.keyResultId)
  await recalculateObjectiveProgress(companyId, existing.keyResult.objectiveId)
}

// ----------------------------------------------------------------------------
// Recálculo de progresso (cascata)
// ----------------------------------------------------------------------------

async function recalculateKeyResultProgress(
  companyId: string,
  keyResultId: string
) {
  const kr = await prisma.keyResult.findFirst({
    where: { id: keyResultId, companyId },
    include: { actions: true },
  })

  if (!kr) return

  const result = calculateKeyResultProgress(kr)

  await prisma.keyResult.update({
    where: { id: keyResultId },
    data: {
      progress: result.progress,
      status: result.status,
    },
  })
}

async function recalculateObjectiveProgress(
  companyId: string,
  objectiveId: string
) {
  const objective = await prisma.objective.findFirst({
    where: { id: objectiveId, companyId },
    include: {
      keyResults: {
        include: { actions: true },
      },
    },
  })

  if (!objective) return

  const result = calculateObjectiveProgress(objective)

  await prisma.objective.update({
    where: { id: objectiveId },
    data: {
      progress: result.progress,
      status: result.status,
    },
  })
}

// Recalcula TODOS os objectives de um ciclo (útil após sync)
export async function recalculateFullCycle(
  companyId: string,
  cycleId: string
) {
  const objectives = await prisma.objective.findMany({
    where: { companyId, cycleId },
    select: { id: true },
  })

  for (const obj of objectives) {
    // Recalcula cada KR do objective
    const krs = await prisma.keyResult.findMany({
      where: { objectiveId: obj.id, companyId },
      select: { id: true },
    })

    for (const kr of krs) {
      await recalculateKeyResultProgress(companyId, kr.id)
    }

    await recalculateObjectiveProgress(companyId, obj.id)
  }
}

// ----------------------------------------------------------------------------
// Users
// ----------------------------------------------------------------------------

export async function listUsers(companyId: string) {
  return prisma.user.findMany({
    where: { companyId },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })
}

// ----------------------------------------------------------------------------
// Overdue Alerts
// ----------------------------------------------------------------------------

export async function getOverdueAlerts(companyId: string, cycleId?: string) {
  const now = new Date()
  let targetCycleId = cycleId
  if (!targetCycleId) {
    const active = await getActiveCycle(companyId)
    targetCycleId = active?.id
  }

  const where: any = {
    companyId,
    status: { not: "COMPLETED" as const },
    OR: [
      { dueDate: { lt: now } },
      { status: "AT_RISK" },
    ],
  }

  if (targetCycleId) {
    where.keyResult = { objective: { cycleId: targetCycleId } }
  }

  const actions = await prisma.action.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true } },
      keyResult: {
        include: {
          objective: { select: { id: true, title: true, progress: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 20,
  })

  return actions
    .sort((a, b) => (a.keyResult.objective.progress) - (b.keyResult.objective.progress))
    .map(a => ({
      id: a.id,
      title: a.title,
      status: a.status,
      dueDate: a.dueDate,
      isOverdue: a.dueDate ? a.dueDate < now : false,
      ownerName: a.owner?.name ?? null,
      keyResultTitle: a.keyResult.title,
      objectiveTitle: a.keyResult.objective.title,
      objectiveProgress: a.keyResult.objective.progress,
    }))
}

// ----------------------------------------------------------------------------
// Dashboard (métricas consolidadas)
// ----------------------------------------------------------------------------

export async function getDashboardOkrMetrics(
  companyId: string,
  cycleId?: string
) {
  // Se não informou cycle, pega o ativo
  let targetCycleId = cycleId
  if (!targetCycleId) {
    const active = await getActiveCycle(companyId)
    targetCycleId = active?.id
  }

  if (!targetCycleId) {
    return null // Nenhum ciclo ativo
  }

  const cycle = await prisma.cycle.findFirst({
    where: { id: targetCycleId, companyId },
    include: {
      objectives: {
        include: {
          owner: { select: { id: true, name: true } },
          keyResults: {
            include: {
              owner: { select: { id: true, name: true } },
              actions: {
                include: {
                  owner: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!cycle) return null

  // Mapeia para o formato que a engine espera
  const cycleForCalc = {
    id: cycle.id,
    objectives: cycle.objectives.map(obj => ({
      id: obj.id,
      title: obj.title,
      keyResults: obj.keyResults.map(kr => ({
        id: kr.id,
        title: kr.title,
        progressMode: kr.progressMode,
        startValue: kr.startValue,
        currentValue: kr.currentValue,
        targetValue: kr.targetValue,
        actions: kr.actions.map(a => ({
          status: a.status,
          ownerId: a.ownerId,
          ownerName: a.owner?.name ?? null,
        })),
      })),
    })),
  }

  const baseMetrics = calculateDashboardMetrics(cycleForCalc as any)

  // Enriquece objectives e KRs com dados de owner
  const krOwnerMap = new Map<string, string | null>()
  const objOwnerMap = new Map<string, string | null>()
  for (const obj of cycle.objectives) {
    objOwnerMap.set(obj.id, obj.owner?.name ?? null)
    for (const kr of obj.keyResults) {
      krOwnerMap.set(kr.id, kr.owner?.name ?? null)
    }
  }

  const enrichedObjectives = baseMetrics.objectives.map(obj => ({
    ...obj,
    ownerName: objOwnerMap.get(obj.id) ?? null,
    keyResults: obj.keyResults.map(kr => ({
      ...kr,
      ownerName: krOwnerMap.get(kr.id) ?? null,
    })),
  }))

  // Constrói topFocus por owner a partir dos dados brutos do Prisma
  const topFocusMap = new Map<string, Array<any>>()

  const pushFocus = (ownerId: string, item: any) => {
    if (!topFocusMap.has(ownerId)) topFocusMap.set(ownerId, [])
    topFocusMap.get(ownerId)!.push(item)
  }

  for (const obj of cycle.objectives) {
    if (obj.ownerId) {
      pushFocus(obj.ownerId, { type: "objective", title: obj.title, progress: obj.progress })
    }
    for (const kr of obj.keyResults) {
      if (kr.ownerId) {
        pushFocus(kr.ownerId, { type: "kr", title: kr.title, progress: kr.progress, objectiveTitle: obj.title })
      }
      for (const action of kr.actions) {
        if (action.ownerId && action.status !== "COMPLETED") {
          pushFocus(action.ownerId, { type: "action", title: action.title, status: action.status, objectiveTitle: obj.title })
        }
      }
    }
  }

  for (const [id, items] of topFocusMap) {
    topFocusMap.set(id, items
      .sort((a: any, b: any) => {
        if (a.status === "AT_RISK" && b.status !== "AT_RISK") return -1
        if (b.status === "AT_RISK" && a.status !== "AT_RISK") return 1
        return (a.progress ?? 0) - (b.progress ?? 0)
      })
      .slice(0, 4)
    )
  }

  const byOwnerWithFocus = baseMetrics.byOwner.map(owner => ({
    ...owner,
    topFocus: owner.ownerId ? (topFocusMap.get(owner.ownerId) ?? []) : [],
  }))

  return {
    cycle: baseMetrics.cycle,
    objectives: enrichedObjectives,
    byOwner: byOwnerWithFocus,
  }
}
