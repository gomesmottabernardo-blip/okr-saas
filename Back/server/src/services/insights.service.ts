import { prisma } from "../lib/prisma"
import { getActiveCycle } from "./okr.service"

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

function buildNextQuarterSuggestions(progress: number, objectives: any[], actions: any[]): string[] {
  const s: string[] = []

  if (progress < 0.3) {
    s.push("Reduza para 2-3 Objetivos no próximo ciclo — foco é o principal fator de execução")
    s.push("Revise a ambição dos KRs: metas muito agressivas travam a equipe. Prefira objetivos 70% atingíveis")
    s.push("Implante um ritual semanal de 30 min para revisar o status das ações com os responsáveis")
  } else if (progress < 0.6) {
    s.push("O progresso está no caminho — mantenha os Objetivos e foque em destravar o que está parado")
    s.push("Para o próximo ciclo, elevar levemente as metas dos KRs que performaram acima de 60%")
    s.push("Documente o que travou a execução este trimestre antes de definir o próximo ciclo")
  } else {
    s.push("Excelente! Para o próximo ciclo, eleve 20-30% as metas dos Objetivos de alto desempenho")
    s.push("Identifique os processos que funcionaram e replique-os nas áreas com menor progresso")
    s.push("Com este momentum, é o momento ideal para adicionar um Objetivo de inovação/expansão")
  }

  const notStarted = objectives.filter(o => o.progress === 0)
  if (notStarted.length > 0) {
    s.push(`${notStarted.length} objetivo(s) não saíram do zero — revise se são reais prioridades ou podem ser descartados`)
  }

  if (actions.filter(a => a.status === "COMPLETED").length / Math.max(actions.length, 1) > 0.7) {
    s.push("Alta taxa de conclusão de ações — a execução está forte. Priorize impacto estratégico no próximo ciclo")
  }

  return s.slice(0, 5)
}

function buildImprovements(objectives: any[], actions: any[], withoutOwner: number, atRisk: number): string[] {
  const s: string[] = []

  if (withoutOwner > actions.length * 0.3) {
    s.push(`${withoutOwner} ações sem responsável — atribua um owner para cada ação para garantir accountability`)
  }

  if (atRisk > 0) {
    s.push(`${atRisk} ação(ões) em risco — agende uma reunião de desbloqueio urgente com os responsáveis`)
  }

  for (const obj of objectives.filter(o => o.progress < 0.4).slice(0, 2)) {
    const notStarted = obj.keyResults
      .flatMap((kr: any) => kr.actions)
      .filter((a: any) => a.status === "NOT_STARTED").length
    if (notStarted > 0) {
      s.push(`"${obj.title}": ${notStarted} ação(ões) não iniciadas — comece pela mais simples para criar momentum`)
    }
  }

  const done = actions.filter(a => a.status === "COMPLETED").length
  if (done > 0) {
    s.push(`${done} ação(ões) concluídas — reconheça publicamente a equipe pelo progresso entregue`)
  }

  if (s.length === 0) {
    s.push("Continue o ritmo atual — os indicadores mostram execução consistente")
  }

  return s.slice(0, 5)
}
