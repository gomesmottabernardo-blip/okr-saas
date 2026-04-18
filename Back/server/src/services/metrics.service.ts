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