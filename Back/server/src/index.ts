import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/context";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/**
 * Health check (Railway usa para verificar se o servidor está vivo)
 */
app.get("/health", (req, res) => {
  res.json({
    status: "OK 🚀",
  });
});

/**
 * tRPC endpoint
 */
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

/**
 * Railway exige porta dinâmica
 */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});