import { router, publicProcedure, protectedProcedure } from "./trpc";
import { z } from "zod";
import bcrypt from "bcrypt";

import { prisma } from "../lib/prisma";
import { signToken } from "../auth/jwt";

import { dashboardRouter } from "../routers/dashboard.router";
import { clientRouter } from "../routers/client.router";
import { okrRouter } from "../routers/okr.router";
import { financialRouter } from "../routers/financial.router";
import { authRouter } from "../routers/auth.router";

export const appRouter = router({

  health: publicProcedure.query(() => {
    return { status: "OK 🚀" };
  }),

  login: publicProcedure
    .input(
      z.object({
        companySlug: z.string(),
        email: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {

      const company = await prisma.company.findUnique({
        where: { slug: input.companySlug },
      });

      if (!company) {
        throw new Error("Company not found");
      }

      const user = await prisma.user.findFirst({
        where: {
          email: input.email,
          companyId: company.id,
        },
      });

      if (!user) {
        throw new Error("Invalid credentials");
      }

      const passwordMatch = await bcrypt.compare(
        input.password,
        user.password
      );

      if (!passwordMatch) {
        throw new Error("Invalid credentials");
      }

      const token = signToken({
        userId: user.id,
        companyId: company.id,
      });

      return { token };

    }),

  auth: authRouter,

  dashboard: dashboardRouter,

  clients: clientRouter,

  okrs: okrRouter,

  financial: financialRouter

});

export type AppRouter = typeof appRouter;