import { prisma } from "../lib/prisma"
import { calculateMRR, calculateAverageTicket } from "../lib/calculations/metrics"

export async function getMonthlyBreakdown(companyId: string) {
  const transactions = await prisma.financialTransaction.findMany({
    where: { companyId },
    select: { amount: true, date: true },
    orderBy: { date: "asc" },
  })

  const PT_MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
  const monthMap = new Map<string, { label: string; revenue: number; costs: number }>()

  for (const t of transactions) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (!monthMap.has(key)) {
      monthMap.set(key, { label: `${PT_MONTHS[d.getMonth()]} ${d.getFullYear()}`, revenue: 0, costs: 0 })
    }
    const m = monthMap.get(key)!
    if (t.amount > 0) m.revenue += t.amount
    else m.costs += Math.abs(t.amount)
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, d]) => ({
      mes: d.label,
      faturamento: Math.round(d.revenue),
      custo: Math.round(d.costs),
      lucro: Math.round(d.revenue - d.costs),
    }))
}

export async function getCompanyMetrics(companyId: string) {

  const clients = await prisma.client.findMany({
    where: {
      companyId
    }
  })

  const transactions = await prisma.financialTransaction.findMany({
    where: {
      companyId
    }
  })

  const mrr = calculateMRR(clients)

  const activeClients = clients.filter(client => client.active).length

  const avgTicket = calculateAverageTicket(mrr, activeClients)

  const revenue = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const costs = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const profit = revenue + costs

  const margin = revenue === 0 ? 0 : (profit / revenue) * 100

  // LTV estimado baseado em ticket médio * 12 meses
  const avgLTV = avgTicket * 12

  const marginPerClient = activeClients === 0 ? 0 : profit / activeClients

  return {
    mrr,
    activeClients,
    avgTicket,
    revenue,
    costs,
    profit,
    margin,
    avgLTV,
    marginPerClient
  }

}

export async function getFinancialProjections(companyId: string) {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const transactions = await prisma.financialTransaction.findMany({
    where: { companyId, date: { gte: ninetyDaysAgo } },
    select: { amount: true, date: true },
    orderBy: { date: "asc" },
  })

  if (transactions.length === 0) return null

  const PT_MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
  const monthMap = new Map<string, { revenue: number; costs: number }>()

  for (const t of transactions) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (!monthMap.has(key)) monthMap.set(key, { revenue: 0, costs: 0 })
    const m = monthMap.get(key)!
    if (t.amount > 0) m.revenue += t.amount
    else m.costs += Math.abs(t.amount)
  }

  const months = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, d]) => ({ revenue: d.revenue, costs: d.costs, profit: d.revenue - d.costs }))

  const avgRevenue = months.reduce((s, m) => s + m.revenue, 0) / months.length
  const avgCosts = months.reduce((s, m) => s + m.costs, 0) / months.length
  const avgProfit = avgRevenue - avgCosts
  const avgMargin = avgRevenue > 0 ? (avgProfit / avgRevenue) * 100 : 0

  let monthlyGrowthRate = 0
  if (months.length > 1) {
    const first = months[0].revenue
    const last = months[months.length - 1].revenue
    if (first > 0) monthlyGrowthRate = (last - first) / first / (months.length - 1)
  }

  const now = new Date()
  const nextLabels = [1, 2, 3].map(i => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    return `${PT_MONTHS[d.getMonth()]} ${d.getFullYear()}`
  })

  const buildScenario = (revAdj: number, costAdj: number) =>
    nextLabels.map((label, i) => {
      const revenue = Math.round(avgRevenue * Math.pow(1 + monthlyGrowthRate + revAdj, i + 1))
      const costs   = Math.round(avgCosts   * Math.pow(1 + costAdj, i + 1))
      const profit  = revenue - costs
      return { label, revenue, costs, profit, margin: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0 }
    })

  return {
    monthsAnalyzed: months.length,
    historical: {
      avgRevenue: Math.round(avgRevenue),
      avgCosts:   Math.round(avgCosts),
      avgProfit:  Math.round(avgProfit),
      avgMargin:  Math.round(avgMargin * 10) / 10,
      monthlyGrowthRate: Math.round(monthlyGrowthRate * 1000) / 10,
    },
    scenarios: {
      pessimist: {
        label: "Pessimista", description: "Queda de 15% no faturamento, custos estáveis",
        color: "#ef4444", months: buildScenario(-0.15, 0),
      },
      base: {
        label: "Base", description: "Tendência atual dos últimos 90 dias se mantém",
        color: "#6366f1", months: buildScenario(0, 0),
      },
      optimist: {
        label: "Otimista", description: "Crescimento de 20% no faturamento, custos +5%",
        color: "#16a34a", months: buildScenario(0.20, 0.05),
      },
    },
  }
}