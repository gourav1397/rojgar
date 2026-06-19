"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { api } from "../../lib/api";
import { buildForgotPasswordPayload, buildVerifyEmailPayload } from "../../lib/form-payloads";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const devCode = searchParams.get("devCode") || "";
  const [message, setMessage] = useState(devCode ? `Local development code: ${devCode}` : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    try {
      await api("/api/v1/auth/verify-email", {
        method: "POST",
        body: JSON.stringify(buildVerifyEmailPayload(new FormData(event.currentTarget))),
      });
      setMessage("Email verified. Redirecting to login...");
      router.push("/login?verified=1");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsResending(true);
    setMessage("");
    try {
      const data = await api<{ message?: string; devVerificationCode?: string }>("/api/v1/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify(buildForgotPasswordPayload(new FormData(event.currentTarget))),
      });
      setMessage(data.devVerificationCode ? `Local development code: ${data.devVerificationCode}` : data.message || "Verification code sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not resend code");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="page-shell grid min-h-screen place-items-center py-10">
      <section className="card grid w-full max-w-md gap-5 p-6">
        <div>
          <h1 className="text-2xl font-extrabold">Verify your email</h1>
          <p className="mt-1 text-sm text-slate-600">Enter the code sent to your email address.</p>
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <input className="input" name="email" type="email" placeholder="Email" defaultValue={initialEmail} required />
          <input className="input" name="code" placeholder="Verification code" defaultValue={devCode} required />
          <button className="btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify email"}
          </button>
        </form>
        <form onSubmit={resend} className="grid gap-3 border-t border-slate-200 pt-4">
          <input className="input" name="email" type="email" placeholder="Email" defaultValue={initialEmail} required />
          <button className="btn-secondary" type="submit" disabled={isResending}>
            {isResending ? "Sending..." : "Resend code"}
          </button>
        </form>
        <div className="text-sm">
          <Link href="/login">Back to login</Link>
        </div>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </section>
    </main>
  );
}
