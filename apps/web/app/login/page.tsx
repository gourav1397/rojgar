"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { api } from "../../lib/api";
import { buildLoginPayload, dashboardPath } from "../../lib/form-payloads";

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const oauthMessage =
    oauthError === "google-config"
      ? "Google login needs GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in .env."
      : oauthError === "google"
        ? "Google login failed. Please try again."
        : "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setMessage("");
    try {
      const data = await api<{ user: { role: "ADMIN" | "EMPLOYER" | "CANDIDATE" } }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(buildLoginPayload(formData)),
      });
      window.location.href = dashboardPath(data.user.role);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <main className="page-shell grid min-h-screen place-items-center py-10">
      <form onSubmit={submit} className="card grid w-full max-w-md gap-4 p-6">
        <h1 className="text-2xl font-extrabold">Login to Rogjar</h1>
        <input className="input" name="email" type="email" placeholder="Email" required />
        <input className="input" name="password" type="password" placeholder="Password" required />
        <button className="btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
        <a className="btn-secondary" href="/api/v1/auth/google">Continue with Google</a>
        {oauthMessage && <p className="text-sm text-red-600">{oauthMessage}</p>}
        <div className="flex justify-between text-sm">
          <Link href="/register">Create account</Link>
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
        {message && <p className="text-sm text-red-600">{message}</p>}
      </form>
    </main>
  );
}
