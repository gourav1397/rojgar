import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("api helper", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds csrf token and credentials for mutating requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ csrfToken: "csrf-123" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);

    const response = await api<{ ok: boolean }>("/api/v1/auth/logout", { method: "POST" });

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toMatch(/\/api\/v1\/auth\/logout$/);
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "POST", credentials: "include", cache: "no-store" });
    expect((fetchMock.mock.calls[1]?.[1]?.headers as Headers).get("x-csrf-token")).toBe("csrf-123");
  });

  it("surfaces first validation field error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "Validation failed",
          issues: { fieldErrors: { email: ["Invalid email"] } },
        }),
      })
    );

    await expect(api("/api/v1/auth/register")).rejects.toThrow("email: Invalid email");
  });
});
