import { Request, Response } from 'express';
import { verifyToken } from '../auth/jwt';

export interface Context {
  req: Request;
  res: Response;
  user?: {
    userId: string;
    companyId: string;
  };
}

export const createContext = ({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Context => {
  const authHeader = req.headers.authorization;

  let user;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (payload) {
      user = payload;
    }
  }

  return {
    req,
    res,
    user,
  };
};