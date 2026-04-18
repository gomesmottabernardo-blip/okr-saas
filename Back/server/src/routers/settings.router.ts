import { z } from 'zod';
import bcrypt from 'bcrypt';
import { router, adminProcedure, superAdminProcedure } from '../trpc/trpc';
import { prisma } from '../lib/prisma';
import { TRPCError } from '@trpc/server';

export const settingsRouter = router({

  // ── Listar usuários da empresa ─────────────────────────────────────────────
  listUsers: adminProcedure.query(async ({ ctx }) => {
    return prisma.user.findMany({
      where: { companyId: ctx.user.companyId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
  }),

  // ── Criar usuário (admin respeita maxUsers; super admin ignora) ────────────
  createUser: adminProcedure
    .input(z.object({
      name:     z.string().min(2).max(100),
      email:    z.string().email(),
      password: z.string().min(6),
      role:     z.enum(['ADMIN', 'MEMBER']),
    }))
    .mutation(async ({ ctx, input }) => {
      const company = await prisma.company.findUniqueOrThrow({
        where: { id: ctx.user.companyId },
        select: { maxUsers: true },
      });

      if (ctx.user.role !== 'SUPER_ADMIN') {
        const count = await prisma.user.count({ where: { companyId: ctx.user.companyId } });
        if (count >= company.maxUsers) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Limite de ${company.maxUsers} usuários atingido. Contate o administrador da plataforma.`,
          });
        }
      }

      const existing = await prisma.user.findFirst({
        where: { email: input.email, companyId: ctx.user.companyId },
      });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'E-mail já cadastrado nesta empresa.' });
      }

      const hashed = await bcrypt.hash(input.password, 10);
      return prisma.user.create({
        data: {
          name:      input.name,
          email:     input.email,
          password:  hashed,
          role:      input.role,
          companyId: ctx.user.companyId,
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
    }),

  // ── Atualizar usuário ──────────────────────────────────────────────────────
  updateUser: adminProcedure
    .input(z.object({
      id:   z.string().uuid(),
      name: z.string().min(2).max(100).optional(),
      role: z.enum(['ADMIN', 'MEMBER']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const target = await prisma.user.findUniqueOrThrow({ where: { id: input.id } });

      if (target.companyId !== ctx.user.companyId && ctx.user.role !== 'SUPER_ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      if (target.role === 'SUPER_ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Não é possível editar o Super Admin.' });
      }

      return prisma.user.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.role !== undefined && { role: input.role }),
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
    }),

  // ── Remover usuário ────────────────────────────────────────────────────────
  removeUser: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não pode remover sua própria conta.' });
      }

      const target = await prisma.user.findUniqueOrThrow({ where: { id: input.id } });

      if (target.companyId !== ctx.user.companyId && ctx.user.role !== 'SUPER_ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      if (target.role === 'SUPER_ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Não é possível remover o Super Admin.' });
      }

      await prisma.user.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // ── Atualizar links / redes sociais ───────────────────────────────────────
  updateLinks: adminProcedure
    .input(z.object({
      site:       z.string().url().optional().or(z.literal('')),
      instagram:  z.string().optional(),
      linkedin:   z.string().optional(),
      otherLinks: z.string().optional(),
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
      });
    }),

  // ── [SUPER ADMIN] Listar todas as empresas com contagem de usuários ────────
  listAllCompanies: superAdminProcedure.query(async () => {
    const companies = await prisma.company.findMany({
      select: {
        id: true, name: true, slug: true, maxUsers: true, createdAt: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
    return companies.map(c => ({
      id:           c.id,
      name:         c.name,
      slug:         c.slug,
      maxUsers:     c.maxUsers,
      currentUsers: c._count.users,
      createdAt:    c.createdAt,
    }));
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
      });
    }),
});
