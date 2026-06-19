import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./login/page";
import RegisterPage from "./register/page";
import VerifyEmailPage from "./verify-email/page";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("error=google-config"),
}));

describe("auth pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders google login support and missing-config feedback", () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain("Continue with Google");
    expect(html).toContain("Google login needs GOOGLE_CLIENT_ID");
    expect(html).toContain("/api/v1/auth/google");
  });

  it("renders google account creation support and candidate/employer roles", () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    expect(html).toContain("Create Rogjar account");
    expect(html).toContain("Continue with Google");
    expect(html).toContain("/api/v1/auth/google?mode=register");
    expect(html).toContain("Candidate");
    expect(html).toContain("Employer");
    expect(html).toContain("Google account creation needs GOOGLE_CLIENT_ID");
  });

  it("renders email verification and resend controls", () => {
    const html = renderToStaticMarkup(<VerifyEmailPage />);

    expect(html).toContain("Verify your email");
    expect(html).toContain("Verification code");
    expect(html).toContain("Resend code");
    expect(html).toContain("Back to login");
  });
});
