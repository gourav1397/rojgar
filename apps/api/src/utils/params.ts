import type { Request } from "express";

export function getParam(request: Request, name: string) {
  const value = request.params[name];
  const param = Array.isArray(value) ? value[0] : value;
  if (!param) throw new Error(`Missing route parameter: ${name}`);
  return param;
}

export function getOptionalParam(request: Request, name: string) {
  const value = request.params[name];
  return Array.isArray(value) ? value[0] : value;
}
