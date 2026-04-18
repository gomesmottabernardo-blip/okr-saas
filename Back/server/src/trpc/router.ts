import { router } from "./trpc"
import { authRouter } from "../routers/auth.router"
import { okrRouter } from "../routers/okr.router"
import { dashboardRouter } from "../routers/dashboard.router"
import { clientRouter } from "../routers/client.router"
import { financialRouter } from "../routers/financial.router"
import { companyRouter } from "../routers/company.router"
import { insightsRouter } from "../routers/insights.router"

export const appRouter = router({
  auth: authRouter,
  okr: okrRouter,
  dashboard: dashboardRouter,
  client: clientRouter,
  financial: financialRouter,
  company: companyRouter,
  insights: insightsRouter,
})

export type AppRouter = typeof appRouter
