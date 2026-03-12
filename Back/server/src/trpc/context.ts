import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export type UserPayload = {
  userId: string;
  companyId: string;
};

export type Context = {
  req: Request;
  res: Response;
  user?: UserPayload;
};

export function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Context {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return { req, res };
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as UserPayload;

    return {
      req,
      res,
      user: decoded,
    };

  } catch (error) {

    return { req, res };

  }

}