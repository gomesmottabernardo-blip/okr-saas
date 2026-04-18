import { initTRPC, TRPCError } from '@trpc/server';
import { verifyToken } from '../auth/jwt';
import type { Context } from './context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

function extractUser(ctx: Context) {
  const authHeader = ctx.req.headers.authorization;
  if (!authHeader) throw new TRPCError({ code: 'UNAUTHORIZED' });

  const token = authHeader.split(' ')[1];
  if (!token) throw new TRPCError({ code: 'UNAUTHORIZED' });

  try {
    const decoded = verifyToken(token) as {
      userId: string;
      companyId: string;
      role?: string;
    };
    return {
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: decoded.role || 'MEMBER',
    };
  } catch (err) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
}

// 🔐 Qualquer usuário autenticado
const isAuthed = t.middleware(({ next, ctx }) => {
  const user = extractUser(ctx);
  return next({ ctx: { user } });
});

// 🔐 Admin da empresa OU Super Admin da plataforma
const isAdmin = t.middleware(({ next, ctx }) => {
  const user = extractUser(ctx);
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx: { user } });
});

// 🔐 Apenas o Super Admin da plataforma (poderes irrestritos)
const isSuperAdmin = t.middleware(({ next, ctx }) => {
  const user = extractUser(ctx);
  if (user.role !== 'SUPER_ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx: { user } });
});

export const protectedProcedure  = t.procedure.use(isAuthed);
export const adminProcedure      = t.procedure.use(isAdmin);
export const superAdminProcedure = t.procedure.use(isSuperAdmin);
