import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifyToken } from '../auth/verifyToken';

export type JwtUser = {
  userId: string;
  companyId: string;
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  jwtUser: JwtUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  const authHeader = opts.req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  const jwtUser = verifyToken(token);

  return {
    req: opts.req,
    res: opts.res,
    user,
    jwtUser,
  };
}
