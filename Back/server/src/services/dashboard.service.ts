import { prisma } from "../lib/prisma"
import { getCompanyMetrics } from "./metrics.service"
import { getMonthlyMetrics } from "./metrics-history.service"

export async function getDashboard(companyId: string) {

  const metrics = await getCompanyMetrics(companyId)

  const monthlyMetrics = await getMonthlyMetrics(companyId)

  const okrs = await prisma.oKR.findMany({
    where: {
      companyId
    },
    include: {
      keyResults: true
    }
  })

  return {
    ...metrics,
    monthlyMetrics,
    okrs
  }

}