import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("health", () => {
  it("returns service health", async () => {
    const response = await request(createApp()).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });
});
