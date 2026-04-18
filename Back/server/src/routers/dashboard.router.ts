// ============================================================================
// Dashboard Router — routers/dashboard.router.ts (Corrigido)
// ============================================================================
//
// ANTES: publicProcedure + findFirst() → qualquer pessoa vê qualquer dado
// AGORA: protectedProcedure + ctx.user.companyId → isolamento correto
//
// ============================================================================

import { z } from "zod"
import { router, protectedProcedure, adminProcedure } from "../trpc/trpc"
import { getCompanyMetrics, getMonthlyBreakdown, getFinancialProjections } from "../services/metrics.service"
import { getDashboardOkrMetrics } from "../services/okr.service"

export const dashboardRouter = router({

  // Métricas financeiras (MRR, ticket, margem, LTV) — apenas admins
  financial: adminProcedure.query(async ({ ctx }) => {
    return getCompanyMetrics(ctx.user.companyId)
  }),

  // Métricas de OKR (progresso por ciclo, objetivo, KR, owner) — todos os usuários
  okr: protectedProcedure
    .input(z.object({ cycleId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return getDashboardOkrMetrics(ctx.user.companyId, input?.cycleId)
    }),

  // Consolidado (financeiro + OKR juntos) — financeiro só para admins
  summary: protectedProcedure
    .input(z.object({ cycleId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === 'ADMIN'

      const [financial, okr] = await Promise.all([
        isAdmin ? getCompanyMetrics(ctx.user.companyId) : Promise.resolve(null),
        getDashboardOkrMetrics(ctx.user.companyId, input?.cycleId),
      ])

      return { financial, okr }
    }),

  // Evolução mensal (faturamento, custo, lucro por mês) — apenas admins
  monthly: adminProcedure.query(async ({ ctx }) => {
    return getMonthlyBreakdown(ctx.user.companyId)
  }),

  // Projeção de cenários financeiros (90 dias histórico → 3 meses futuros) — apenas admins
  projections: adminProcedure.query(async ({ ctx }) => {
    return getFinancialProjections(ctx.user.companyId)
  }),

})
