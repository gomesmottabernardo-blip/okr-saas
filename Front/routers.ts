import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getAllActions } from "./notion";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  okr: router({
    metrics: publicProcedure.query(async () => {
      const { calculateDashboardMetrics } = await import("./okrMetrics");
      return calculateDashboardMetrics();
    }),
    actionsByKR: publicProcedure
      .input(z.object({ keyResultId: z.string() }))
      .query(async ({ input }) => {
        const allActions = await getAllActions();
        const actions = allActions.filter(action => action.keyResultId === input.keyResultId);
        
        return actions.map(action => ({
          id: action.id,
          title: action.title,
          status: action.status,
          owner: action.owner || 'Sem owner',
          date: action.date,
        }));
      }),
  }),
});

export type AppRouter = typeof appRouter;
