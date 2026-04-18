import { router, publicProcedure } from "../trpc/trpc"
import { prisma } from "../lib/prisma"
import bcrypt from "bcrypt"
import { z } from "zod"
import { signToken } from "../auth/jwt"
import { TRPCError } from "@trpc/server"

// Generic error to prevent user enumeration
const INVALID_CREDENTIALS = new TRPCError({
  code: "UNAUTHORIZED",
  message: "Credenciais inválidas.",
})

export const authRouter = router({

  // ── Login ────────────────────────────────────────────────────────────────
  login: publicProcedure
    .input(z.object({
      email:       z.string().email().max(255).toLowerCase().trim(),
      password:    z.string().min(1).max(128),
      companySlug: z.string().min(1).max(100).toLowerCase().trim(),
    }))
    .mutation(async ({ input }) => {
      const company = await prisma.company.findUnique({
        where: { slug: input.companySlug },
        select: { id: true },
      })
      // Same error for wrong company or wrong credentials (prevent enumeration)
      if (!company) throw INVALID_CREDENTIALS

      const user = await prisma.user.findFirst({
        where: { email: input.email, companyId: company.id },
        select: { id: true, password: true, role: true, name: true, email: true },
      })
      if (!user) throw INVALID_CREDENTIALS

      const valid = await bcrypt.compare(input.password, user.password)
      if (!valid) throw INVALID_CREDENTIALS

      const token = signToken({
        userId:    user.id,
        companyId: company.id,
        role:      user.role,
      })

      return { token, role: user.role, name: user.name }
    }),

  // ── Validate invite token ────────────────────────────────────────────────
  validateSetupToken: publicProcedure
    .input(z.object({ token: z.string().uuid() }))
    .query(async ({ input }) => {
      const invite = await prisma.inviteToken.findUnique({
        where: { token: input.token },
        select: { email: true, expiresAt: true, usedAt: true, companyId: true },
      })
      if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token inválido ou expirado.",
        })
      }
      return {
        email:       invite.email,
        companySlug: await prisma.company.findUnique({
          where: { id: invite.companyId },
          select: { slug: true },
        }).then(c => c?.slug ?? ""),
      }
    }),

  // ── First-access password setup ──────────────────────────────────────────
  setupPassword: publicProcedure
    .input(z.object({
      token:    z.string().uuid(),
      password: z.string().min(8).max(128),
    }))
    .mutation(async ({ input }) => {
      const invite = await prisma.inviteToken.findUnique({
        where: { token: input.token },
        select: { id: true, email: true, companyId: true, expiresAt: true, usedAt: true, role: true },
      })

      if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token inválido ou expirado. Solicite um novo convite.",
        })
      }

      const user = await prisma.user.findFirst({
        where: { email: invite.email!, companyId: invite.companyId },
        select: { id: true },
      })
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado." })
      }

      const hashed = await bcrypt.hash(input.password, 12)

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data:  { password: hashed },
        }),
        prisma.inviteToken.update({
          where: { id: invite.id },
          data:  { usedAt: new Date() },
        }),
      ])

      return { success: true, email: invite.email }
    }),
})
