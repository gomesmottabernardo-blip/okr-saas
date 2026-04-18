import { z } from "zod"
import { router, protectedProcedure } from "../trpc/trpc"
import { prisma } from "../lib/prisma"

export const companyRouter = router({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    return prisma.company.findFirst({
      where: { id: ctx.user.companyId },
      select: { id: true, name: true, slug: true, domain: true, primaryColor: true, logoUrl: true },
    })
  }),

  updateSettings: protectedProcedure
    .input(z.object({
      domain: z.string().max(255).optional(),
      primaryColor: z.string().max(20).optional(),
      logoUrl: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const logoUrl = input.logoUrl !== undefined
        ? input.logoUrl
        : input.domain
          ? `https://logo.clearbit.com/${input.domain}`
          : undefined

      return prisma.company.update({
        where: { id: ctx.user.companyId },
        data: {
          ...(input.domain !== undefined && { domain: input.domain }),
          ...(input.primaryColor !== undefined && { primaryColor: input.primaryColor }),
          ...(logoUrl !== undefined && { logoUrl }),
        },
        select: { id: true, name: true, domain: true, primaryColor: true, logoUrl: true },
      })
    }),
})
