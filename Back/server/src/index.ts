import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"

import { createExpressMiddleware } from "@trpc/server/adapters/express"
import { appRouter } from "./trpc/router"
import { createContext } from "./trpc/context"

dotenv.config()

const app = express()

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}))

// ── CORS — only allowed origins ────────────────────────────────────────────
const isProd = process.env.NODE_ENV === "production"

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()).filter(Boolean)
  : ["http://localhost:5173", "http://localhost:3000"]

if (isProd && !process.env.ALLOWED_ORIGINS) {
  console.error("[SECURITY] ALLOWED_ORIGINS not set in production! CORS will be permissive.")
}

app.use(cors({
  origin: (origin, cb) => {
    // No origin = server-to-server or health check → allow
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    // In development, allow any localhost port for convenience
    if (!isProd && /^http:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true)
    cb(new Error(`Origin '${origin}' not in ALLOWED_ORIGINS`))
  },
  credentials: true,
}))

app.use(express.json({ limit: "1mb" }))

// ── Rate limiting ──────────────────────────────────────────────────────────
// Global: 200 requests per minute per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em instantes." },
}))

// Strict limit on auth routes: 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Aguarde 15 minutos." },
  keyGenerator: (req) => {
    // Rate limit by IP + email to prevent distributed attacks
    try {
      const body = req.body
      const input = body?.["0"]?.json || body
      return `${req.ip}:${input?.email || ""}`
    } catch {
      return req.ip ?? "unknown"
    }
  },
})

// Apply strict limiter to login and setup routes
app.use("/trpc/auth.login", authLimiter)
app.use("/trpc/auth.setupPassword", authLimiter)

// ── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

// ── tRPC ────────────────────────────────────────────────────────────────────
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
)

// ── Error handler ───────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[server error]", err.message)
  res.status(500).json({ error: "Erro interno do servidor." })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
