import { prisma } from "../db/prisma"
import { calculateMRR, calculateAverageTicket } from "../lib/calculations/metrics"

export async function getCompanyMetrics(companyId: string) {

  const clients = await prisma.client.findMany({
    where: {
      companyId
    }
  })

  const mrr = calculateMRR(clients)

  const activeClients = clients.filter(client => client.active).length

  const avgTicket = calculateAverageTicket(mrr, activeClients)

  return {
    mrr,
    activeClients,
    avgTicket
  }

}