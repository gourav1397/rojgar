"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { api } from "../../lib/api";
import { buildRegisterPayload } from "../../lib/form-payloads";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const oauthMessage =
    oauthError === "google-config"
      ? "Google account creation needs GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in .env."
      : oauthError === "google"
        ? "Google account creation failed. Please try again."
        : "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsSubmitting(true);
    setMessage("");
    try {
      await api("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(buildRegisterPayload(formData)),
      });
      setMessage("Account created. Check email for verification code.");
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <main className="page-shell grid min-h-screen place-items-center py-10">
      <form onSubmit={submit} className="card grid w-full max-w-md gap-4 p-6">
        <h1 className="text-2xl font-extrabold">Create Rogjar account</h1>
        <input className="input" name="name" placeholder="Full name" required />
        <input className="input" name="email" type="email" placeholder="Email" required />
        <input className="input" name="phone" placeholder="Mobile number" />
        <input className="input" name="password" type="password" placeholder="Password" required />
        <select className="input" name="role" defaultValue="CANDIDATE">
          <option value="CANDIDATE">Candidate</option>
          <option value="EMPLOYER">Employer</option>
        </select>
        <button className="btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Register"}
        </button>
        <a className="btn-secondary" href="/api/v1/auth/google?mode=register">Continue with Google</a>
        {oauthMessage && <p className="text-sm text-red-600">{oauthMessage}</p>}
        <div className="text-sm">
          <Link href="/login">Already have an account?</Link>
        </div>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>
    </main>
  );
}
