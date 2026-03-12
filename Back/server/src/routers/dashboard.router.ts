import { router, protectedProcedure } from "../trpc/trpc";
import { getDashboard } from "../services/dashboard.service";

export const dashboardRouter = router({

  summary: protectedProcedure.query(async ({ ctx }) => {

    const companyId = ctx.user.companyId;

    const data = await getDashboard(companyId);

    return data;

  })

});