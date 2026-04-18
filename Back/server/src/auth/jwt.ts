import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Crash at startup if running in production without a real secret
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("[FATAL] JWT_SECRET env var is not set. Refusing to start in production.");
  }
  console.warn("[WARNING] JWT_SECRET not set — using insecure default. Set it before deploying.");
}

const SECRET = JWT_SECRET || "supersecret-local-dev-only";

// Minimum length guard (prevent trivially weak secrets)
if (SECRET.length < 32 && SECRET !== "supersecret-local-dev-only") {
  throw new Error("[FATAL] JWT_SECRET must be at least 32 characters.");
}

export function signToken(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET);
}
