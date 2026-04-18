import { z } from "zod"
import { router, protectedProcedure } from "../trpc/trpc"
import { prisma } from "../lib/prisma"

// ─── Logo auto-detection ──────────────────────────────────────────────────────
// Testa múltiplas fontes de logo na ordem; usa fetch nativo (Node 18+)
// que segue redirects automaticamente.

function logoSources(domain: string): string[] {
  return [
    `https://logo.clearbit.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://${domain}/favicon.ico`,
    `https://www.${domain}/favicon.ico`,
  ]
}

async function probeImage(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await (global as any).fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    })
    clearTimeout(timeout)
    const ct = res.headers.get("content-type") ?? ""
    return res.ok && (ct.includes("image") || ct.includes("octet-stream"))
  } catch {
    return false
  }
}

export async function findBestLogoUrl(domain: string): Promise<string | null> {
  const clean = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "")
  for (const url of logoSources(clean)) {
    if (await probeImage(url)) return url
  }
  return null
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const companyRouter = router({

  getSettings: protectedProcedure.query(async ({ ctx }) => {
    return prisma.company.findFirst({
      where: { id: ctx.user.companyId },
      select: {
        id: true, name: true, slug: true, domain: true,
        primaryColor: true, logoUrl: true, maxUsers: true,
        site: true, instagram: true, linkedin: true, otherLinks: true,
      },
    })
  }),

  // Salva configurações de cor/logo manualmente
  updateSettings: protectedProcedure
    .input(z.object({
      domain:      z.string().max(255).optional(),
      primaryColor: z.string().max(20).optional(),
      logoUrl:     z.string().url().max(2048).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.company.update({
        where: { id: ctx.user.companyId },
        data: {
          ...(input.domain !== undefined && { domain: input.domain }),
          ...(input.primaryColor !== undefined && { primaryColor: input.primaryColor }),
          ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
        },
        select: { id: true, name: true, domain: true, primaryColor: true, logoUrl: true },
      })
    }),

  // Detecta logo automaticamente: Clearbit → Google → DuckDuckGo → favicon direto
  autoDetectLogo: protectedProcedure
    .input(z.object({ domain: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const domain = input.domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "")
      const logoUrl = await findBestLogoUrl(domain)

      await prisma.company.update({
        where: { id: ctx.user.companyId },
        data: {
          domain,
          ...(logoUrl && { logoUrl }),
        },
      })

      return {
        found: !!logoUrl,
        logoUrl: logoUrl ?? null,
        domain,
        sourcesTried: logoSources(domain),
      }
    }),
})
