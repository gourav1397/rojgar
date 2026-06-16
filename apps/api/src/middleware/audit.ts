import type { NextFunction, Request, Response } from "express";
import { prisma } from "@rogjar/database";
import { getOptionalParam } from "../utils/params";

export function audit(action: string, entity: string) {
  return (request: Request, response: Response, next: NextFunction) => {
    response.on("finish", () => {
      if (response.statusCode >= 500) return;
      void prisma.auditLog.create({
        data: {
          actorId: request.auth?.userId,
          action,
          entity,
          entityId: getOptionalParam(request, "id"),
          metadata: {
            method: request.method,
            path: request.originalUrl,
            statusCode: response.statusCode,
          },
          ipAddress: request.ip,
          userAgent: Array.isArray(request.headers["user-agent"])
            ? request.headers["user-agent"].join(", ")
            : request.headers["user-agent"],
        },
      });
    });
    next();
  };
}
