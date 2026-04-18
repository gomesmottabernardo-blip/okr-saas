import { prisma } from "../lib/prisma"
import { getActiveCycle } from "./okr.service"

interface SuggestionItem {
  id: string
  text: string
  type: string
  triggerMetrics: { label: string; value: string }[]
}

export async function getCycleInsights(companyId: string, cycleId?: string) {
  let targetCycleId = cycleId
  if (!targetCycleId) {
    const active = await getActiveCycle(companyId)
    targetCycleId = active?.id
  }

  if (!targetCycleId) return null

  const cycle = await prisma.cycle.findFirst({
    where: { id: targetCycleId, companyId },
    include: {
      objectives: {
        include: {
          keyResults: { include: { actions: true } },
        },
      },
    },
  })

  if (!cycle) return null

  const objectives = cycle.objectives
  const allKRs = objectives.flatMap(o => o.keyResults)
  const allActions = allKRs.flatMap(kr => kr.actions)

  const totalActions = allActions.length
  const completedActions = allActions.filter(a => a.status === "COMPLETED").length
  const atRiskActions = allActions.filter(a => a.status === "AT_RISK").length
  const inProgressActions = allActions.filter(a => a.status === "IN_PROGRESS").length
  const notStartedActions = allActions.filter(a => a.status === "NOT_STARTED").length

  const cycleProgress = objectives.length > 0
    ? objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length
    : 0

  const completionRate = totalActions > 0 ? completedActions / totalActions : 0

  const atRiskObjectives = objectives
    .filter(o => o.progress < 0.4)
    .sort((a, b) => a.progress - b.progress)
    .map(o => ({
      id: o.id,
      title: o.title,
      progress: o.progress,
      totalKRs: o.keyResults.length,
      completedKRs: o.keyResults.filter(kr => kr.progress >= 0.8).length,
      atRiskKRs: o.keyResults.filter(kr => kr.progress < 0.3 && kr.actions.length > 0).length,
    }))

  const topObjectives = objectives
    .filter(o => o.progress >= 0.6)
    .sort((a, b) => b.progress - a.progress)
    .map(o => ({ id: o.id, title: o.title, progress: o.progress }))

  const actionsWithoutOwner = allActions.filter(a => !a.ownerId).length

  const suggestions = buildNextQuarterSuggestions(cycleProgress, objectives, allActions)
  const improvements = buildImprovements(objectives, allActions, actionsWithoutOwner, atRiskActions)

  return {
    cycleName: cycle.label,
    cycleProgress,
    completionRate,
    totalObjectives: objectives.length,
    totalKRs: allKRs.length,
    totalActions,
    completedActions,
    atRiskActions,
    inProgressActions,
    notStartedActions,
    actionsWithoutOwner,
    atRiskObjectives,
    topObjectives,
    suggestions,
    improvements,
  }
}

function buildNextQuarterSuggestions(
  progress: number,
  objectives: any[],
  actions: any[]
): SuggestionItem[] {
  const items: SuggestionItem[] = []
  const notStarted = objectives.filter(o => o.progress === 0)
  const completedActions = actions.filter(a => a.status === "COMPLETED").length
  const atRiskActions = actions.filter(a => a.status === "AT_RISK").length
  const inProgressActions = actions.filter(a => a.status === "IN_PROGRESS").length
  const completionRate = actions.length > 0 ? completedActions / actions.length : 0

  if (progress < 0.3) {
    items.push({
      id: "focus_reduction", type: "focus_reduction",
      text: "Reduza para 2-3 Objetivos no próximo ciclo — foco é o principal fator de execução",
      triggerMetrics: [
        { label: "Progresso do ciclo", value: `${Math.round(progress * 100)}%` },
        { label: "Total de objetivos", value: String(objectives.length) },
        { label: "Objetivos sem progresso", value: String(notStarted.length) },
      ],
    })
    items.push({
      id: "review_ambition", type: "review_ambition",
      text: "Revise a ambição dos KRs: metas muito agressivas travam a equipe. Prefira objetivos 70% atingíveis",
      triggerMetrics: [
        { label: "Progresso do ciclo", value: `${Math.round(progress * 100)}%` },
        { label: "Ações em progresso", value: String(inProgressActions) },
        { label: "Ações em risco", value: String(atRiskActions) },
      ],
    })
    items.push({
      id: "weekly_ritual", type: "weekly_ritual",
      text: "Implante um ritual semanal de 30 min para revisar o status das ações com os responsáveis",
      triggerMetrics: [
        { label: "Ações em risco", value: String(atRiskActions) },
        { label: "Taxa de conclusão", value: `${Math.round(completionRate * 100)}%` },
      ],
    })
  } else if (progress < 0.6) {
    items.push({
      id: "maintain_objectives", type: "maintain_objectives",
      text: "O progresso está no caminho — mantenha os Objetivos e foque em destravar o que está parado",
      triggerMetrics: [
        { label: "Progresso do ciclo", value: `${Math.round(progress * 100)}%` },
        { label: "Ações concluídas", value: String(completedActions) },
        { label: "Total de ações", value: String(actions.length) },
      ],
    })
    items.push({
      id: "elevate_kr", type: "elevate_kr",
      text: "Para o próximo ciclo, elevar levemente as metas dos KRs que performaram acima de 60%",
      triggerMetrics: [
        { label: "Progresso do ciclo", value: `${Math.round(progress * 100)}%` },
        { label: "Ações em progresso", value: String(inProgressActions) },
      ],
    })
    items.push({
      id: "document_blockers", type: "document_blockers",
      text: "Documente o que travou a execução este trimestre antes de definir o próximo ciclo",
      triggerMetrics: [
        { label: "Ações em risco", value: String(atRiskActions) },
        { label: "Objetivos sem progresso", value: String(notStarted.length) },
      ],
    })
  } else {
    items.push({
      id: "elevate_goals", type: "elevate_goals",
      text: "Excelente! Para o próximo ciclo, eleve 20-30% as metas dos Objetivos de alto desempenho",
      triggerMetrics: [
        { label: "Progresso do ciclo", value: `${Math.round(progress * 100)}%` },
        { label: "Objetivos acima de 60%", value: String(objectives.filter(o => o.progress >= 0.6).length) },
      ],
    })
    items.push({
      id: "replicate_success", type: "replicate_success",
      text: "Identifique os processos que funcionaram e replique-os nas áreas com menor progresso",
      triggerMetrics: [
        { label: "Taxa de conclusão", value: `${Math.round(completionRate * 100)}%` },
        { label: "Objetivos em destaque (≥80%)", value: String(objectives.filter(o => o.progress >= 0.8).length) },
      ],
    })
    items.push({
      id: "add_innovation", type: "add_innovation",
      text: "Com este momentum, é o momento ideal para adicionar um Objetivo de inovação/expansão",
      triggerMetrics: [
        { label: "Progresso do ciclo", value: `${Math.round(progress * 100)}%` },
        { label: "Ações concluídas", value: String(completedActions) },
      ],
    })
  }

  if (notStarted.length > 0) {
    items.push({
      id: "not_started_objs", type: "not_started_objs",
      text: `${notStarted.length} objetivo(s) não saíram do zero — revise se são reais prioridades ou podem ser descartados`,
      triggerMetrics: [
        { label: "Objetivos zerados", value: String(notStarted.length) },
        { label: "Total de objetivos", value: String(objectives.length) },
      ],
    })
  }

  if (completionRate > 0.7) {
    items.push({
      id: "high_completion", type: "high_completion",
      text: "Alta taxa de conclusão de ações — a execução está forte. Priorize impacto estratégico no próximo ciclo",
      triggerMetrics: [
        { label: "Taxa de conclusão", value: `${Math.round(completionRate * 100)}%` },
        { label: "Ações concluídas", value: String(completedActions) },
        { label: "Total de ações", value: String(actions.length) },
      ],
    })
  }

  return items.slice(0, 5)
}

function buildImprovements(
  objectives: any[],
  actions: any[],
  withoutOwner: number,
  atRisk: number
): SuggestionItem[] {
  const items: SuggestionItem[] = []
  const completedActions = actions.filter(a => a.status === "COMPLETED").length

  if (withoutOwner > actions.length * 0.3) {
    items.push({
      id: "missing_owners", type: "missing_owners",
      text: `${withoutOwner} ações sem responsável — atribua um owner para cada ação para garantir accountability`,
      triggerMetrics: [
        { label: "Ações sem responsável", value: String(withoutOwner) },
        { label: "Total de ações", value: String(actions.length) },
        { label: "Percentual sem dono", value: `${Math.round(withoutOwner / Math.max(actions.length, 1) * 100)}%` },
      ],
    })
  }

  if (atRisk > 0) {
    items.push({
      id: "at_risk_actions", type: "at_risk_actions",
      text: `${atRisk} ação(ões) em risco — agende uma reunião de desbloqueio urgente com os responsáveis`,
      triggerMetrics: [
        { label: "Ações em risco", value: String(atRisk) },
        { label: "Total de ações", value: String(actions.length) },
      ],
    })
  }

  for (const obj of objectives.filter(o => o.progress < 0.4).slice(0, 2)) {
    const notStartedCount = obj.keyResults
      .flatMap((kr: any) => kr.actions)
      .filter((a: any) => a.status === "NOT_STARTED").length
    if (notStartedCount > 0) {
      items.push({
        id: `not_started_${obj.id}`, type: "not_started_actions",
        text: `"${obj.title}": ${notStartedCount} ação(ões) não iniciadas — comece pela mais simples para criar momentum`,
        triggerMetrics: [
          { label: "Ações não iniciadas", value: String(notStartedCount) },
          { label: "Progresso do objetivo", value: `${Math.round(obj.progress * 100)}%` },
        ],
      })
    }
  }

  if (completedActions > 0) {
    items.push({
      id: "recognition", type: "recognition",
      text: `${completedActions} ação(ões) concluídas — reconheça publicamente a equipe pelo progresso entregue`,
      triggerMetrics: [
        { label: "Ações concluídas", value: String(completedActions) },
        { label: "Taxa de conclusão", value: `${Math.round(completedActions / Math.max(actions.length, 1) * 100)}%` },
      ],
    })
  }

  if (items.length === 0) {
    items.push({
      id: "sustained_pace", type: "sustained_pace",
      text: "Continue o ritmo atual — os indicadores mostram execução consistente",
      triggerMetrics: [
        { label: "Ações concluídas", value: String(completedActions) },
        { label: "Total de ações", value: String(actions.length) },
      ],
    })
  }

  return items.slice(0, 5)
}
