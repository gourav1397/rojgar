import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const status = Number(error.statusCode || error.status || 500);
  response.status(status).json({
    error: status >= 500 ? "Internal server error" : error.message,
    detail: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
};
