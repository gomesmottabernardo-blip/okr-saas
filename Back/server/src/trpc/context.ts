import { Request, Response } from "express";
import jwt from "jsonwebtoken";

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

  if (!authHeader) {
    return { req, res };
  }

  const token = authHeader.split(" ")[1];

  try {

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string;
      companyId: string;
    };

    return {
      req,
      res,
      user: payload,
    };

  } catch {

    return { req, res };

  }

};