import { router, publicProcedure } from "../trpc/trpc"
import { prisma } from "../lib/prisma"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { z } from "zod"

export const authRouter = router({

  login: publicProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
        companySlug: z.string()
      })
    )
    .mutation(async ({ input }) => {

      const company = await prisma.company.findUnique({
        where: {
          slug: input.companySlug
        }
      })

      if (!company) {
        throw new Error("Company not found")
      }

      const user = await prisma.user.findFirst({
        where: {
          email: input.email,
          companyId: company.id
        }
      })

      if (!user) {
        throw new Error("User not found")
      }

      const validPassword = await bcrypt.compare(
        input.password,
        user.password
      )

      if (!validPassword) {
        throw new Error("Invalid password")
      }

      const token = jwt.sign(
        {
          userId: user.id,
          companyId: company.id
        },
        process.env.JWT_SECRET!,
        {
          expiresIn: "7d"
        }
      )

      return {
        token
      }

    })

})