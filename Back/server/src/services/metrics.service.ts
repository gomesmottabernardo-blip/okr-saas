import { prisma } from "../lib/prisma"
import { calculateMRR, calculateAverageTicket } from "../lib/calculations/metrics"

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