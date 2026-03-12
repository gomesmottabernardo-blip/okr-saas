import { prisma } from "../lib/prisma"

export async function getMonthlyMetrics(companyId: string) {

  const transactions = await prisma.financialTransaction.findMany({
    where: {
      companyId
    },
    orderBy: {
      date: "asc"
    }
  })

  const monthlyMap: Record<string, {
    revenue: number
    costs: number
  }> = {}

  transactions.forEach((transaction) => {

    const date = new Date(transaction.date)

    const key = `${date.getFullYear()}-${date.getMonth() + 1}`

    if (!monthlyMap[key]) {
      monthlyMap[key] = {
        revenue: 0,
        costs: 0
      }
    }

    if (transaction.amount > 0) {
      monthlyMap[key].revenue += transaction.amount
    } else {
      monthlyMap[key].costs += transaction.amount
    }

  })

  const result = Object.entries(monthlyMap).map(([month, values]) => {

    const profit = values.revenue + values.costs

    return {
      month,
      revenue: values.revenue,
      costs: Math.abs(values.costs),
      profit
    }

  })

  return result

}