import { initTRPC, TRPCError } from '@trpc/server';
import { verifyToken } from '../auth/jwt';
import type { Context } from './context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// 🔐 Middleware de autenticação
const isAuthed = t.middleware(({ next, ctx }) => {
  const authHeader = ctx.req.headers.authorization;

  if (!authHeader) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  try {
    const decoded = verifyToken(token) as {
      userId: string;
      companyId: string;
      role?: string;
    };

    return next({
      ctx: {
        user: {
          userId: decoded.userId,
          companyId: decoded.companyId,
          role: decoded.role || 'MEMBER',
        },
      },
    });
  } catch (err) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
});

// 🔐 Middleware de autorização — apenas admins
const isAdmin = t.middleware(({ next, ctx }) => {
  const authHeader = ctx.req.headers.authorization;

  if (!authHeader) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  try {
    const decoded = verifyToken(token) as {
      userId: string;
      companyId: string;
      role?: string;
    };

    if (decoded.role !== 'ADMIN') {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    return next({
      ctx: {
        user: {
          userId: decoded.userId,
          companyId: decoded.companyId,
          role: decoded.role,
        },
      },
    });
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);