import { z } from "zod"
import { router, protectedProcedure, adminProcedure } from "../trpc/trpc"
import { prisma } from "../lib/prisma"

export const clientRouter = router({

  list: protectedProcedure.query(async ({ ctx }) => {
    return prisma.client.findMany({
      where: { companyId: ctx.user.companyId },
      orderBy: { name: "asc" },
    })
  }),

  create: adminProcedure
    .input(z.object({
      name:         z.string().min(1).max(200),
      service:      z.string().min(1).max(200),
      monthlyValue: z.number().min(0),
      startDate:    z.string(),
      active:       z.boolean().optional().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.client.create({
        data: {
          name:         input.name,
          service:      input.service,
          monthlyValue: input.monthlyValue,
          startDate:    new Date(input.startDate),
          active:       input.active,
          companyId:    ctx.user.companyId,
        },
      })
    }),

})
