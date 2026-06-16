"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { DashboardShell } from "../../../../../components/dashboard-shell";
import { api } from "../../../../../lib/api";
import { buildEmployerJobPayload } from "../../../../../lib/form-payloads";

type EmployerDashboard = {
  employer: {
    companyId: string;
    company: {
      id: string;
      name: string;
      status: string;
    };
  } | null;
};

export default function NewJobPage() {
  const [message, setMessage] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api<EmployerDashboard>("/api/v1/employer/dashboard")
      .then(data => {
        if (data.employer) {
          setCompanyId(data.employer.companyId);
          setCompanyName(data.employer.company.name);
        } else {
          setMessage("No company profile is linked to this employer account.");
        }
      })
      .catch(error => {
        const detail = error instanceof Error ? error.message : "Unable to load employer company";
        setMessage(
          detail === "Invalid or expired token" || detail === "Authentication required" || detail === "Insufficient permissions"
            ? "Please log in with an employer account before creating a job."
            : detail
        );
      });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsSubmitting(true);
    setMessage("");
    try {
      await api("/api/v1/jobs", {
        method: "POST",
        body: JSON.stringify(buildEmployerJobPayload(companyId, formData)),
      });
      setMessage("Job sent for approval.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create job");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <DashboardShell title="Create Job" subtitle="Publish a new opening and send it through approval.">
      <form onSubmit={submit} className="card grid max-w-3xl gap-4 p-5">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="font-bold text-slate-900">{companyName || "Loading company..."}</p>
          <p className="mt-1 text-slate-600">Jobs will be posted under your linked company profile.</p>
        </div>
        <input className="input" name="title" placeholder="Job title" required />
        <textarea className="input min-h-32 py-3" name="description" placeholder="Job description" required />
        <div className="grid gap-4 md:grid-cols-2">
          <input className="input" name="city" placeholder="City" required />
          <input className="input" name="category" placeholder="Category" required />
          <input className="input" name="employmentType" placeholder="Employment type" required />
          <input className="input" name="minSalary" placeholder="Min salary" />
          <input className="input" name="maxSalary" placeholder="Max salary" />
          <input className="input" name="minExperience" placeholder="Min experience" defaultValue="0" />
          <input className="input" name="maxExperience" placeholder="Max experience" />
        </div>
        <input className="input" name="skills" placeholder="Skills comma separated" />
        <button className="btn-primary" type="submit" disabled={!companyId || isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Job"}
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>
    </DashboardShell>
  );
}
