import { prisma } from "../lib/prisma";

export async function getDashboard(companyId: string) {

  const clients = await prisma.client.findMany({
    where: { companyId }
  });

  const transactions = await prisma.financialTransaction.findMany({
    where: { companyId }
  });

  const okrs = await prisma.oKR.findMany({
    where: { companyId },
    include: {
      keyResults: true
    }
  });

  const activeClients = clients.filter(c => c.active).length;

  const mrr = clients
    .filter(c => c.active)
    .reduce((sum, c) => sum + c.monthlyValue, 0);

  const avgTicket =
    activeClients === 0 ? 0 : mrr / activeClients;

  const revenue = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const costs = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const profit = revenue + costs;

  return {
    clients: activeClients,
    mrr,
    avgTicket,
    revenue,
    costs,
    profit,
    okrs
  };

}