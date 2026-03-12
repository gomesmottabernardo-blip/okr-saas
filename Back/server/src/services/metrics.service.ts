import { prisma } from "../lib/prisma"
import { calculateMRR, calculateAverageTicket } from "../lib/calculations/metrics"

export async function getCompanyMetrics(companyId: string) {

  const clients = await prisma.client.findMany({
    where: {
      companyId
    },
    include: {
      invoices: true
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

  let totalLTV = 0

  clients.forEach(client => {

    const clientRevenue = client.invoices.reduce((sum, inv) => {
      return sum + inv.amount
    }, 0)

    totalLTV += clientRevenue

  })

  const avgLTV = clients.length === 0 ? 0 : totalLTV / clients.length

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