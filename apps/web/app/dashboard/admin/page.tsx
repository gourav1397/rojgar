"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { DashboardGrid, DashboardShell } from "../../../components/dashboard-shell";
import { api } from "../../../lib/api";

type Metrics = {
  users: number;
  companies: number;
  jobs: number;
  applications: number;
  reports: number;
};

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
};

type PendingJob = {
  id: string;
  title: string;
  city: string;
  status: string;
  company: { name: string };
  createdAt: string;
};

type PendingCompany = {
  id: string;
  name: string;
  city: string | null;
  industry: string | null;
  status: string;
};

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
};

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompany[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [message, setMessage] = useState("");

  async function loadAdminData() {
    setMessage("");
    try {
      const [dashboardData, usersData, jobsData, companiesData, logsData] = await Promise.all([
        api<{ metrics: Metrics }>("/api/v1/admin/dashboard"),
        api<{ users: User[] }>("/api/v1/admin/users"),
        api<{ jobs: PendingJob[] }>("/api/v1/admin/jobs/pending"),
        api<{ companies: PendingCompany[] }>("/api/v1/admin/companies/pending"),
        api<{ logs: AuditLog[] }>("/api/v1/admin/audit-logs"),
      ]);
      setMetrics(dashboardData.metrics);
      setUsers(usersData.users);
      setPendingJobs(jobsData.jobs);
      setPendingCompanies(companiesData.companies);
      setLogs(logsData.logs);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unable to load admin panel";
      setMessage(
        detail === "Invalid or expired token" || detail === "Authentication required" || detail === "Insufficient permissions"
          ? "Please log in with an admin account to use the admin panel."
          : detail
      );
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function updateJobApproval(jobId: string, approved: boolean) {
    try {
      await api(`/api/v1/admin/jobs/${jobId}/approval`, {
        method: "PATCH",
        body: JSON.stringify({ approved }),
      });
      setMessage(approved ? "Job approved and published." : "Job rejected.");
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update job");
    }
  }

  async function updateCompanyVerification(companyId: string, status: "VERIFIED" | "REJECTED") {
    try {
      await api(`/api/v1/admin/companies/${companyId}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes: status === "VERIFIED" ? "Verified by admin" : "Rejected by admin" }),
      });
      setMessage(status === "VERIFIED" ? "Company verified." : "Company rejected.");
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update company");
    }
  }

  async function submitCms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await api("/api/v1/admin/cms", {
        method: "POST",
        body: JSON.stringify({
          slug: formData.get("slug")?.toString().trim(),
          title: formData.get("title")?.toString().trim(),
          body: formData.get("body")?.toString().trim(),
          metaTitle: formData.get("metaTitle")?.toString().trim() || undefined,
          metaDescription: formData.get("metaDescription")?.toString().trim() || undefined,
          publishedAt: formData.get("published") === "on" ? new Date().toISOString() : undefined,
        }),
      });
      form.reset();
      setMessage("CMS page saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save CMS page");
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await api("/api/v1/admin/reports", {
        method: "POST",
        body: JSON.stringify({
          type: formData.get("type")?.toString().trim(),
          entityId: formData.get("entityId")?.toString().trim() || undefined,
          reason: formData.get("reason")?.toString().trim(),
        }),
      });
      form.reset();
      setMessage("Report created.");
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create report");
    }
  }

  return (
    <DashboardShell title="Admin Dashboard" subtitle="Moderate users, companies, jobs, fraud reports, CMS, and platform analytics.">
      {message && <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</p>}
      <DashboardGrid
        items={[
          { label: "Users", value: String(metrics?.users ?? "-"), text: "Manage candidates, employers, admins, suspensions, and permissions." },
          { label: "Companies", value: String(metrics?.companies ?? "-"), text: "Review company verification and employer ownership." },
          { label: "Open reports", value: String(metrics?.reports ?? "-"), text: "Review flagged companies, jobs, and suspicious applications." },
        ]}
      />
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold">Job approval system</h2>
          <div className="mt-4 grid gap-3">
            {pendingJobs.length === 0 && <p className="text-sm text-slate-600">No jobs are waiting for approval.</p>}
            {pendingJobs.map(job => (
              <article className="rounded-md border border-slate-200 p-4" key={job.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{job.title}</h3>
                    <p className="text-sm text-slate-600">{job.company.name} - {job.city}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary" type="button" onClick={() => updateJobApproval(job.id, true)}>Approve</button>
                    <button className="btn-secondary" type="button" onClick={() => updateJobApproval(job.id, false)}>Reject</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Recent users</h2>
          <div className="mt-4 grid gap-3">
            {users.slice(0, 8).map(user => (
              <article className="rounded-md border border-slate-200 p-3" key={user.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{user.name || user.email}</p>
                    <p className="truncate text-sm text-slate-600">{user.email}</p>
                  </div>
                  <span className="text-xs font-extrabold uppercase text-brand">{user.role}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Company verification</h2>
          <div className="mt-4 grid gap-3">
            {pendingCompanies.length === 0 && <p className="text-sm text-slate-600">No companies are waiting for verification.</p>}
            {pendingCompanies.map(company => (
              <article className="rounded-md border border-slate-200 p-4" key={company.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{company.name}</h3>
                    <p className="text-sm text-slate-600">{company.industry || "Industry not set"} - {company.city || "City not set"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary" type="button" onClick={() => updateCompanyVerification(company.id, "VERIFIED")}>Verify</button>
                    <button className="btn-secondary" type="button" onClick={() => updateCompanyVerification(company.id, "REJECTED")}>Reject</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <form onSubmit={submitCms} className="card grid gap-3 p-5">
          <h2 className="font-bold">CMS management</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="input" name="slug" placeholder="Page slug" required />
            <input className="input" name="title" placeholder="Page title" required />
            <input className="input" name="metaTitle" placeholder="Meta title" />
            <input className="input" name="metaDescription" placeholder="Meta description" />
          </div>
          <textarea className="input min-h-28 py-3" name="body" placeholder="Page body" required />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input name="published" type="checkbox" /> Publish now
          </label>
          <button className="btn-primary" type="submit">Save CMS Page</button>
        </form>
        <form onSubmit={submitReport} className="card grid gap-3 p-5">
          <h2 className="font-bold">Fraud detection report</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="input" name="type" placeholder="Type: job, company, user" required />
            <input className="input" name="entityId" placeholder="Entity ID optional" />
          </div>
          <textarea className="input min-h-24 py-3" name="reason" placeholder="Reason" required />
          <button className="btn-primary" type="submit">Create Report</button>
        </form>
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-bold">Audit logs</h2>
          <div className="mt-4 grid gap-2">
            {logs.slice(0, 8).map(log => (
              <div className="flex flex-wrap justify-between gap-2 rounded-md border border-slate-200 p-3 text-sm" key={log.id}>
                <span className="font-semibold">{log.action}</span>
                <span className="text-slate-600">{log.entity}</span>
                <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
