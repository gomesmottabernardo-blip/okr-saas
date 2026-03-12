import { router, protectedProcedure } from "../trpc/trpc";
import { prisma } from "../lib/prisma";

export const okrRouter = router({

  list: protectedProcedure.query(async ({ ctx }) => {

    const companyId = ctx.user.companyId;

    return prisma.oKR.findMany({
      where: {
        companyId
      },
      include: {
        keyResults: true
      }
    });

  }),

  create: protectedProcedure
    .input((data: any) => data)
    .mutation(async ({ ctx, input }) => {

      const companyId = ctx.user.companyId;

      return prisma.oKR.create({
        data: {
          title: input.title,
          description: input.description,
          companyId
        }
      });

    }),

});