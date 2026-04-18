import { z } from "zod"
import { router, protectedProcedure } from "../trpc/trpc"
import { getCycleInsights } from "../services/insights.service"

export const insightsRouter = router({
  getCycleInsights: protectedProcedure
    .input(z.object({ cycleId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return getCycleInsights(ctx.user.companyId, input?.cycleId)
    }),
})
