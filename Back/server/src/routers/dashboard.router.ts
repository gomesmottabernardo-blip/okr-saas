import { router, publicProcedure } from "../trpc/trpc";
import { prisma } from "../lib/prisma";
import { getDashboard } from "../services/dashboard.service";

export const dashboardRouter = router({

  summary: publicProcedure.query(async () => {

    const company = await prisma.company.findFirst();

    if (!company) {
      throw new Error("No company found in database");
    }

    const data = await getDashboard(company.id);

    return data;

  }),

});