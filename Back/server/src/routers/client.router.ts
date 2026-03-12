import { router, publicProcedure } from "../trpc/trpc";
import { prisma } from "../lib/prisma";

export const clientRouter = router({

  list: publicProcedure.query(async ({ ctx }) => {

    return prisma.client.findMany({
      where: {
        companyId: ctx.user.companyId
      }
    });

  }),

  create: publicProcedure
    .input((data: any) => data)
    .mutation(async ({ ctx, input }) => {

      return prisma.client.create({
        data: {
          name: input.name,
          service: input.service,
          monthlyValue: input.monthlyValue,
          startDate: new Date(input.startDate),
          companyId: ctx.user.companyId
        }
      });

    }),

});