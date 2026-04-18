import { z } from 'zod'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { router, adminProcedure, superAdminProcedure } from '../trpc/trpc'
import { prisma } from '../lib/prisma'
import { TRPCError } from '@trpc/server'

const INVITE_TTL_HOURS = 48

export const settingsRouter = router({

  // ── Listar usuários da empresa ─────────────────────────────────────────────
  listUsers: adminProcedure.query(async ({ ctx }) => {
    return prisma.user.findMany({
      where: { companyId: ctx.user.companyId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    })
  }),

  // ── Criar usuário (sem senha — gera invite token) ─────────────────────────
  createUser: adminProcedure
    .input(z.object({
      name:  z.string().min(2).max(100),
      email: z.string().email().max(255).toLowerCase().trim(),
      role:  z.enum(['ADMIN', 'MEMBER']),
    }))
    .mutation(async ({ ctx, input }) => {
      const company = await prisma.company.findUniqueOrThrow({
        where: { id: ctx.user.companyId },
        select: { maxUsers: true },
      })

      if (ctx.user.role !== 'SUPER_ADMIN') {
        const count = await prisma.user.count({ where: { companyId: ctx.user.companyId } })
        if (count >= company.maxUsers) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Limite de ${company.maxUsers} usuários atingido. Contate o administrador da plataforma.`,
          })
        }
      }

      const existing = await prisma.user.findFirst({
        where: { email: input.email, companyId: ctx.user.companyId },
      })
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'E-mail já cadastrado nesta empresa.' })
      }

      // Senha aleatória — o usuário NUNCA consegue logar com ela
      // O acesso real é feito via InviteToken (primeiro acesso)
      const tempPassword = await bcrypt.hash(crypto.randomUUID(), 12)

      const user = await prisma.user.create({
        data: {
          name:      input.name,
          email:     input.email,
          password:  tempPassword,
          role:      input.role,
          companyId: ctx.user.companyId,
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      })

      // Gera token de primeiro acesso (48h)
      await prisma.inviteToken.deleteMany({
        where: { email: input.email, companyId: ctx.user.companyId, usedAt: null },
      })
      const token = crypto.randomUUID()
      await prisma.inviteToken.create({
        data: {
          token,
          email:     input.email,
          role:      input.role,
          companyId: ctx.user.companyId,
          createdBy: ctx.user.userId,
          expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000),
        },
      })

      return { ...user, setupToken: token }
    }),

  // ── Reenviar / regenerar token de acesso inicial ─────────────────────────
  regenerateInvite: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const target = await prisma.user.findUniqueOrThrow({
        where: { id: input.userId },
        select: { id: true, email: true, companyId: true, role: true },
      })
      if (target.companyId !== ctx.user.companyId && ctx.user.role !== 'SUPER_ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      await prisma.inviteToken.deleteMany({
        where: { email: target.email, companyId: target.companyId, usedAt: null },
      })
      const token = crypto.randomUUID()
      await prisma.inviteToken.create({
        data: {
          token,
          email:     target.email,
          role:      target.role,
          companyId: target.companyId,
          createdBy: ctx.user.userId,
          expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000),
        },
      })
      return { setupToken: token }
    }),

  // ── Atualizar usuário ──────────────────────────────────────────────────────
  updateUser: adminProcedure
    .input(z.object({
      id:   z.string().uuid(),
      name: z.string().min(2).max(100).optional(),
      role: z.enum(['ADMIN', 'MEMBER']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const target = await prisma.user.findUniqueOrThrow({ where: { id: input.id } })
      if (target.companyId !== ctx.user.companyId && ctx.user.role !== 'SUPER_ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      if (target.role === 'SUPER_ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Não é possível editar o Super Admin.' })
      }
      return prisma.user.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.role !== undefined && { role: input.role }),
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      })
    }),

  // ── Remover usuário ────────────────────────────────────────────────────────
  removeUser: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não pode remover sua própria conta.' })
      }
      const target = await prisma.user.findUniqueOrThrow({ where: { id: input.id } })
      if (target.companyId !== ctx.user.companyId && ctx.user.role !== 'SUPER_ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      if (target.role === 'SUPER_ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Não é possível remover o Super Admin.' })
      }
      await prisma.user.delete({ where: { id: input.id } })
      return { success: true }
    }),

  // ── Atualizar links / redes sociais ───────────────────────────────────────
  updateLinks: adminProcedure
    .input(z.object({
      site:       z.string().url().optional().or(z.literal('')),
      instagram:  z.string().max(100).optional(),
      linkedin:   z.string().max(255).optional(),
      otherLinks: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.company.update({
        where: { id: ctx.user.companyId },
        data: {
          ...(input.site       !== undefined && { site:       input.site       || null }),
          ...(input.instagram  !== undefined && { instagram:  input.instagram  || null }),
          ...(input.linkedin   !== undefined && { linkedin:   input.linkedin   || null }),
          ...(input.otherLinks !== undefined && { otherLinks: input.otherLinks || null }),
        },
        select: { id: true, site: true, instagram: true, linkedin: true, otherLinks: true },
      })
    }),

  // ── [SUPER ADMIN] Listar todas as empresas ────────────────────────────────
  listAllCompanies: superAdminProcedure.query(async () => {
    const companies = await prisma.company.findMany({
      select: {
        id: true, name: true, slug: true, maxUsers: true, createdAt: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    })
    return companies.map(c => ({
      id:           c.id,
      name:         c.name,
      slug:         c.slug,
      maxUsers:     c.maxUsers,
      currentUsers: c._count.users,
      createdAt:    c.createdAt,
    }))
  }),

  // ── [SUPER ADMIN] Definir limite de usuários por empresa ──────────────────
  setCompanyMaxUsers: superAdminProcedure
    .input(z.object({
      companyId: z.string().uuid(),
      maxUsers:  z.number().int().min(1).max(9999),
    }))
    .mutation(async ({ input }) => {
      return prisma.company.update({
        where: { id: input.companyId },
        data:  { maxUsers: input.maxUsers },
        select: { id: true, name: true, maxUsers: true },
      })
    }),
})
