import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { verifyAccessToken } from "../utils/tokens";

export function authenticate(request: Request, response: Response, next: NextFunction) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : request.cookies?.accessToken;
  if (!token) {
    response.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    request.auth = {
      userId: payload.userId,
      role: payload.role as UserRole,
      email: payload.email,
    };
    next();
  } catch {
    response.status(401).json({ error: "Invalid or expired token" });
  }
}

export function authorize(...roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.auth) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(request.auth.role)) {
      response.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
