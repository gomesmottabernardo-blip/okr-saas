import { router, publicProcedure } from "../trpc/trpc";
import { prisma } from "../lib/prisma";

export const okrRouter = router({

  list: publicProcedure.query(async ({ ctx }) => {

    return prisma.oKR.findMany({
      where: {
        companyId: ctx.user.companyId
      },
      include: {
        keyResults: true
      }
    });

  }),

  create: publicProcedure
    .input((data: any) => data)
    .mutation(async ({ ctx, input }) => {

      return prisma.oKR.create({
        data: {
          title: input.title,
          description: input.description,
          companyId: ctx.user.companyId
        }
      });

    }),

});