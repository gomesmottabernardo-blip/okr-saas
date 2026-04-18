// ============================================================================
// Dashboard Router — routers/dashboard.router.ts (Corrigido)
// ============================================================================
//
// ANTES: publicProcedure + findFirst() → qualquer pessoa vê qualquer dado
// AGORA: protectedProcedure + ctx.user.companyId → isolamento correto
//
// ============================================================================

import { z } from "zod"
import { router, protectedProcedure } from "../trpc/trpc"
import { getCompanyMetrics, getMonthlyBreakdown } from "../services/metrics.service"
import { getDashboardOkrMetrics } from "../services/okr.service"

export const dashboardRouter = router({

  // Métricas financeiras (MRR, ticket, margem, LTV)
  financial: protectedProcedure.query(async ({ ctx }) => {
    return getCompanyMetrics(ctx.user.companyId)
  }),

  // Métricas de OKR (progresso por ciclo, objetivo, KR, owner)
  okr: protectedProcedure
    .input(z.object({ cycleId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return getDashboardOkrMetrics(ctx.user.companyId, input?.cycleId)
    }),

  // Consolidado (financeiro + OKR juntos)
  summary: protectedProcedure
    .input(z.object({ cycleId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const [financial, okr] = await Promise.all([
        getCompanyMetrics(ctx.user.companyId),
        getDashboardOkrMetrics(ctx.user.companyId, input?.cycleId),
      ])

      return { financial, okr }
    }),

  // Evolução mensal (faturamento, custo, lucro por mês)
  monthly: protectedProcedure.query(async ({ ctx }) => {
    return getMonthlyBreakdown(ctx.user.companyId)
  }),

})
