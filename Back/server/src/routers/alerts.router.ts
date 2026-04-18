import { z } from "zod"
import { router, adminProcedure } from "../trpc/trpc"
import { sendOverdueAlertEmails } from "../services/alerts.service"

export const alertsRouter = router({
  sendOverdueAlerts: adminProcedure
    .input(z.object({ cycleId: z.string().uuid().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      return sendOverdueAlertEmails(ctx.user.companyId, input?.cycleId)
    }),
})
