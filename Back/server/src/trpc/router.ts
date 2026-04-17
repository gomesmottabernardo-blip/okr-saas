import { router } from "./trpc"
import { authRouter } from "../routers/auth.router"
import { okrRouter } from "../routers/okr.router"
import { dashboardRouter } from "../routers/dashboard.router"
import { clientRouter } from "../routers/client.router"
import { financialRouter } from "../routers/financial.router"

export const appRouter = router({
  auth: authRouter,
  okr: okrRouter,
  dashboard: dashboardRouter,
  client: clientRouter,
  financial: financialRouter,
})

export type AppRouter = typeof appRouter
