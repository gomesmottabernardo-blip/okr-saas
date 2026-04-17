// ============================================================================
// OKR Router — routers/okr.router.ts (Evoluído)
// ============================================================================
//
// ANTES: 2 endpoints (list, create), input sem validação, sem service layer
// AGORA: CRUD completo para Objectives, KeyResults, Actions + Cycles
//        Toda lógica no okr.service.ts
//        Input validado com Zod
//        Tudo protegido (protectedProcedure)
//
// ============================================================================

import { z } from "zod"
import { router, protectedProcedure } from "../trpc/trpc"
import * as okrService from "../services/okr.service"

// ----------------------------------------------------------------------------
// Input Schemas
// ----------------------------------------------------------------------------

const createObjectiveSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  cycleId: z.string().uuid().optional(),
})

const updateObjectiveSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "AT_RISK", "COMPLETED", "CANCELLED"]).optional(),
  ownerId: z.string().uuid().nullable().optional(),
  cycleId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().optional(),
})

const createKeyResultSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  objectiveId: z.string().uuid(),
  progressMode: z.enum(["ACTION_BASED", "METRIC_BASED"]).optional(),
  targetValue: z.number().optional(),
  startValue: z.number().optional(),
  unit: z.string().max(50).optional(),
  ownerId: z.string().uuid().optional(),
})

const updateKeyResultSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "AT_RISK", "COMPLETED", "CANCELLED"]).optional(),
  currentValue: z.number().optional(),
  targetValue: z.number().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().optional(),
})

const createActionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  keyResultId: z.string().uuid(),
  ownerId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
})

const updateActionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "AT_RISK", "COMPLETED"]).optional(),
  ownerId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional().transform(v => v ? new Date(v) : undefined),
  sortOrder: z.number().int().optional(),
})

const createCycleSchema = z.object({
  label: z.string().min(1).max(100),
  startDate: z.string().datetime().transform(v => new Date(v)),
  endDate: z.string().datetime().transform(v => new Date(v)),
})

// ----------------------------------------------------------------------------
// Router
// ----------------------------------------------------------------------------

export const okrRouter = router({

  // ── Cycles ──────────────────────────────────────────────────────────────

  listCycles: protectedProcedure.query(async ({ ctx }) => {
    return okrService.listCycles(ctx.user.companyId)
  }),

  getActiveCycle: protectedProcedure.query(async ({ ctx }) => {
    return okrService.getActiveCycle(ctx.user.companyId)
  }),

  createCycle: protectedProcedure
    .input(createCycleSchema)
    .mutation(async ({ ctx, input }) => {
      return okrService.createCycle(ctx.user.companyId, input)
    }),

  activateCycle: protectedProcedure
    .input(z.object({ cycleId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return okrService.activateCycle(ctx.user.companyId, input.cycleId)
    }),

  // ── Objectives ──────────────────────────────────────────────────────────

  listObjectives: protectedProcedure
    .input(z.object({ cycleId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return okrService.listObjectives(ctx.user.companyId, input?.cycleId)
    }),

  getObjective: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return okrService.getObjective(ctx.user.companyId, input.id)
    }),

  createObjective: protectedProcedure
    .input(createObjectiveSchema)
    .mutation(async ({ ctx, input }) => {
      return okrService.createObjective(ctx.user.companyId, input)
    }),

  updateObjective: protectedProcedure
    .input(updateObjectiveSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return okrService.updateObjective(ctx.user.companyId, id, data)
    }),

  deleteObjective: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return okrService.deleteObjective(ctx.user.companyId, input.id)
    }),

  // ── Key Results ─────────────────────────────────────────────────────────

  createKeyResult: protectedProcedure
    .input(createKeyResultSchema)
    .mutation(async ({ ctx, input }) => {
      return okrService.createKeyResult(ctx.user.companyId, input)
    }),

  updateKeyResult: protectedProcedure
    .input(updateKeyResultSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return okrService.updateKeyResult(ctx.user.companyId, id, data)
    }),

  deleteKeyResult: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return okrService.deleteKeyResult(ctx.user.companyId, input.id)
    }),

  // ── Actions ─────────────────────────────────────────────────────────────

  createAction: protectedProcedure
    .input(createActionSchema)
    .mutation(async ({ ctx, input }) => {
      return okrService.createAction(ctx.user.companyId, input as any)
    }),

  updateAction: protectedProcedure
    .input(updateActionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return okrService.updateAction(ctx.user.companyId, id, data as any)
    }),

  deleteAction: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return okrService.deleteAction(ctx.user.companyId, input.id)
    }),

  // ── Dashboard ───────────────────────────────────────────────────────────

  dashboardMetrics: protectedProcedure
    .input(z.object({ cycleId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return okrService.getDashboardOkrMetrics(
        ctx.user.companyId,
        input?.cycleId
      )
    }),

  // Recalcula todos os progressos de um ciclo (admin only)
  recalculateCycle: protectedProcedure
    .input(z.object({ cycleId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await okrService.recalculateFullCycle(ctx.user.companyId, input.cycleId)
      return { success: true }
    }),

})
