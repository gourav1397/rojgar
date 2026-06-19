import request from "supertest";
import { describe, expect, it } from "vitest";

describe("health", () => {
  it("returns service health", async () => {
    process.env.DATABASE_URL = "postgresql://rogjar:rogjar@localhost:5432/rogjar?schema=public";
    process.env.JWT_ACCESS_SECRET = "test-access-secret-123";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-123";
    const { createApp } = await import("../app");

    const response = await request(createApp()).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  }, 15_000);
});
