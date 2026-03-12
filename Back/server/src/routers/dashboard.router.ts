import { router, publicProcedure } from "../trpc/trpc";
import { getCompanyMetrics } from "../services/metrics.service";

export const dashboardRouter = router({
  summary: publicProcedure.query(async ({ ctx }) => {

    const companyId = ctx.user.companyId;

    const metrics = await getCompanyMetrics(companyId);

    return metrics;

  }),
});