import { router, protectedProcedure } from "../trpc/trpc";
import { prisma } from "../lib/prisma";

export const financialRouter = router({

  list: protectedProcedure.query(async ({ ctx }) => {

    const companyId = ctx.user.companyId;

    return prisma.financialTransaction.findMany({
      where: {
        companyId
      },
      orderBy: {
        date: "desc"
      }
    });

  }),

  summary: protectedProcedure.query(async ({ ctx }) => {

    const companyId = ctx.user.companyId;

    const transactions = await prisma.financialTransaction.findMany({
      where: {
        companyId
      }
    });

    const revenue = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const costs = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const profit = revenue + costs;

    return {
      revenue,
      costs,
      profit
    };

  })

});