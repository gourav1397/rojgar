import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateBody(schema: ZodSchema) {
  return (request: Request, response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      response.status(422).json({ error: "Validation failed", issues: result.error.flatten() });
      return;
    }
    request.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (request: Request, response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      response.status(422).json({ error: "Validation failed", issues: result.error.flatten() });
      return;
    }
    request.query = result.data as typeof request.query;
    next();
  };
}
