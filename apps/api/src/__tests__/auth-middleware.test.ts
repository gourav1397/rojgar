import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticate, authorize } from "../middleware/auth";

vi.mock("../utils/tokens", () => ({
  verifyAccessToken: vi.fn((token: string) => {
    if (token === "valid-token") return { userId: "user_1", role: "EMPLOYER", email: "employer@rogjar.in" };
    throw new Error("invalid");
  }),
}));

function responseMock() {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return response;
}

describe("auth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authenticates bearer tokens", () => {
    const request = { headers: { authorization: "Bearer valid-token" }, cookies: {} } as Request;
    const response = responseMock();
    const next: NextFunction = vi.fn();

    authenticate(request, response, next);

    expect(request.auth).toEqual({ userId: "user_1", role: "EMPLOYER", email: "employer@rogjar.in" });
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects missing tokens", () => {
    const request = { headers: {}, cookies: {} } as Request;
    const response = responseMock();

    authenticate(request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Authentication required" });
  });

  it("enforces role authorization", () => {
    const request = { auth: { userId: "user_1", role: "EMPLOYER", email: "employer@rogjar.in" } } as Request;
    const response = responseMock();

    authorize("ADMIN")(request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ error: "Insufficient permissions" });
  });
});
