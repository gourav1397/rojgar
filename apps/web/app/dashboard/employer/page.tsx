"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardGrid, DashboardShell } from "../../../components/dashboard-shell";
import { api } from "../../../lib/api";

type EmployerDashboard = {
  employer: {
    title: string | null;
    company: { name: string; status: string; city: string | null; industry: string | null };
  } | null;
  analytics: { jobs: number; applicants: number; interviews: number };
};

type Applicant = {
  id: string;
  status: string;
  candidate: { headline: string | null; user: { name: string | null; email: string } };
  job: { title: string };
  interviews: Array<{ id: string; scheduledAt: string; mode: string }>;
};

export default function EmployerDashboardPage() {
  const [dashboard, setDashboard] = useState<EmployerDashboard | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [message, setMessage] = useState("");

  async function loadEmployerData() {
    try {
      const [dashboardData, applicantsData] = await Promise.all([
        api<EmployerDashboard>("/api/v1/employer/dashboard"),
        api<{ applicants: Applicant[] }>("/api/v1/employer/applicants"),
      ]);
      setDashboard(dashboardData);
      setApplicants(applicantsData.applicants);
      setMessage("");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unable to load employer dashboard";
      setMessage(
        detail === "Invalid or expired token" || detail === "Authentication required" || detail === "Insufficient permissions"
          ? "Please log in with an employer account to use the employer dashboard."
          : detail
      );
    }
  }

  useEffect(() => {
    void loadEmployerData();
  }, []);

  async function updateStatus(applicationId: string, status: string) {
    try {
      await api(`/api/v1/applications/${applicationId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setMessage("Application status updated.");
      await loadEmployerData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update application");
    }
  }

  return (
    <DashboardShell title="Employer Dashboard" subtitle="Post jobs, manage applicants, search candidates, and view analytics.">
      {message && <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</p>}
      <DashboardGrid
        items={[
          { label: "Open jobs", value: String(dashboard?.analytics.jobs ?? "-"), text: "Create, edit, pause, delete, and promote job listings." },
          { label: "Applicants", value: String(dashboard?.analytics.applicants ?? "-"), text: "Move candidates through screening, interviews, offers, and hires." },
          { label: "Interviews", value: String(dashboard?.analytics.interviews ?? "-"), text: "Schedule and track upcoming interview sessions." },
        ]}
      />
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold">Company profile</h2>
          <p className="mt-2 text-sm text-slate-600">{dashboard?.employer?.company.name || "No linked company"}</p>
          <p className="mt-1 text-sm font-semibold text-brand">{dashboard?.employer?.company.status || "Unknown"}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/dashboard/employer/jobs/new">Create Job</Link>
            <Link className="btn-secondary" href="/dashboard/employer/candidates">Candidate Search</Link>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Employer analytics</h2>
          <p className="mt-2 text-sm text-slate-600">Jobs, applicants, and interviews update from live database counts.</p>
          <p className="mt-3 text-sm text-slate-600">Industry: {dashboard?.employer?.company.industry || "Not set"}</p>
          <p className="text-sm text-slate-600">City: {dashboard?.employer?.company.city || "Not set"}</p>
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-bold">Manage applicants</h2>
          <div className="mt-4 grid gap-3">
            {applicants.length === 0 && <p className="text-sm text-slate-600">No applications yet.</p>}
            {applicants.map(applicant => (
              <article className="rounded-md border border-slate-200 p-4" key={applicant.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{applicant.candidate.user.name || applicant.candidate.user.email}</h3>
                    <p className="text-sm text-slate-600">{applicant.job.title} - {applicant.status}</p>
                    <p className="text-sm text-slate-600">{applicant.candidate.headline || "Candidate profile"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-secondary" type="button" onClick={() => updateStatus(applicant.id, "SHORTLISTED")}>Shortlist</button>
                    <button className="btn-secondary" type="button" onClick={() => updateStatus(applicant.id, "REJECTED")}>Reject</button>
                    <button className="btn-primary" type="button" onClick={() => updateStatus(applicant.id, "OFFERED")}>Offer</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
