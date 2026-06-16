"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { DashboardShell } from "../../../../components/dashboard-shell";
import { api } from "../../../../lib/api";

type Candidate = {
  id: string;
  headline: string | null;
  currentCity: string | null;
  totalExperience: number;
  profileScore: number;
  user: { name: string | null; email: string };
  skills: Array<{ skill: { name: string } }>;
  resumes: Array<{ title: string; fileUrl: string | null }>;
};

export default function EmployerCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [message, setMessage] = useState("");

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["q", "city"]) {
      const value = formData.get(key)?.toString().trim();
      if (value) params.set(key, value);
    }
    try {
      const data = await api<{ candidates: Candidate[] }>(`/api/v1/employer/candidate-search?${params}`);
      setCandidates(data.candidates);
      setMessage(data.candidates.length ? "" : "No matching candidates found.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unable to search candidates";
      setMessage(
        detail === "Invalid or expired token" || detail === "Authentication required" || detail === "Insufficient permissions"
          ? "Please log in with an employer account to search candidates."
          : detail
      );
    }
  }

  return (
    <DashboardShell title="Candidate Search" subtitle="Search candidates by skills, city, experience, salary, and profile strength.">
      <section className="card p-5">
        <form onSubmit={search} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <input className="input" name="q" placeholder="Skill, title, or candidate name" />
          <input className="input" name="city" placeholder="City" />
          <button className="btn-primary" type="submit">Search Candidates</button>
        </form>
        {message && <p className="mt-4 text-sm font-semibold text-amber-700">{message}</p>}
        <div className="mt-6 grid gap-3">
          {candidates.map(candidate => (
            <article className="rounded-md border border-slate-200 p-4" key={candidate.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{candidate.user.name || candidate.user.email}</h2>
                  <p className="mt-1 text-sm text-slate-600">{candidate.headline || "Candidate profile"} - {candidate.currentCity || "Any city"}</p>
                  <p className="mt-1 text-sm text-slate-600">{candidate.totalExperience} yrs experience - {candidate.profileScore}% profile</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.slice(0, 5).map(item => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold" key={item.skill.name}>{item.skill.name}</span>)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
