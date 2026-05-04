import { z } from "zod"
import { router, adminProcedure } from "../trpc/trpc"
import { syncNotionTasks } from "../integrations/notion/notion.adapter"
import { prisma } from "../lib/prisma"

export const syncRouter = router({
  triggerNotion: adminProcedure.mutation(async ({ ctx }) => {
    return syncNotionTasks(ctx.user.companyId, ctx.user.userId)
  }),

  logs: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
    .query(async ({ ctx, input }) => {
      return prisma.syncLog.findMany({
        where: { companyId: ctx.user.companyId, source: "NOTION" },
        orderBy: { startedAt: "desc" },
        take: input?.limit ?? 20,
      })
    }),
})
