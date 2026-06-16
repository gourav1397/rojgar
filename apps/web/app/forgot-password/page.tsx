"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { api } from "../../lib/api";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setMessage("");
    try {
      await api("/api/v1/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: formData.get("email") }) });
      setMessage("If the email exists, reset instructions were sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <main className="page-shell grid min-h-screen place-items-center">
      <form onSubmit={submit} className="card grid w-full max-w-md gap-4 p-6">
        <h1 className="text-2xl font-extrabold">Forgot password</h1>
        <input className="input" name="email" type="email" placeholder="Email" required />
        <button className="btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>
    </main>
  );
}
