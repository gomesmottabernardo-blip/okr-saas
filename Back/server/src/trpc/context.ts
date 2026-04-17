import { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export const createContext = ({ req }: CreateExpressContextOptions) => {
  return {
    req,
  };
};

export type Context = ReturnType<typeof createContext>;