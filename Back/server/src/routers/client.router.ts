import { router, protectedProcedure } from "../trpc/trpc";
import { prisma } from "../lib/prisma";

export const clientRouter = router({

  list: protectedProcedure.query(async ({ ctx }) => {

    const companyId = ctx.user.companyId;

    return prisma.client.findMany({
      where: {
        companyId
      }
    });

  }),

  create: protectedProcedure
    .input((data: any) => data)
    .mutation(async ({ ctx, input }) => {

      const companyId = ctx.user.companyId;

      return prisma.client.create({
        data: {
          name: input.name,
          service: input.service,
          monthlyValue: input.monthlyValue,
          startDate: new Date(input.startDate),
          companyId
        }
      });

    }),

});