"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { DashboardGrid, DashboardShell } from "../../../components/dashboard-shell";
import { api } from "../../../lib/api";

type JobSummary = {
  id: string;
  title: string;
  city: string;
  company?: { name: string };
};

type CandidateProfile = {
  id: string;
  headline: string | null;
  currentCity: string | null;
  preferredCity: string | null;
  totalExperience: number;
  expectedSalary: number | null;
  profileScore: number;
  openToRemote: boolean;
  resumes: Array<{ id: string; title: string; fileUrl: string | null; isPrimary: boolean }>;
  skills: Array<{ level: number; skill: { name: string } }>;
  education: Array<{ id: string; degree: string; institute: string; startYear: number | null; endYear: number | null }>;
  experiences: Array<{ id: string; title: string; company: string; description: string | null }>;
  savedJobs: Array<{ job: JobSummary }>;
  applications: Array<{ id: string; status: string; job: JobSummary; interviews: Array<{ id: string; scheduledAt: string; mode: string }> }>;
  jobAlerts: Array<{ id: string; name: string; query: string | null; city: string | null; frequency: string; isActive: boolean }>;
};

type Recommendation = {
  score: number;
  job: JobSummary;
};

function numberOrUndefined(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text ? Number(text) : undefined;
}

function textOrUndefined(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text || undefined;
}

export default function CandidateDashboardPage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadCandidateData() {
    setIsLoading(true);
    try {
      const [dashboardData, recommendationData] = await Promise.all([
        api<{ profile: CandidateProfile }>("/api/v1/candidate/dashboard"),
        api<{ items: Recommendation[] }>("/api/v1/jobs/recommendations").catch(() => ({ items: [] })),
      ]);
      setProfile(dashboardData.profile);
      setRecommendations(recommendationData.items);
      setMessage("");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unable to load candidate dashboard";
      setMessage(
        detail === "Invalid or expired token" || detail === "Authentication required" || detail === "Insufficient permissions"
          ? "Please log in with a candidate account to use the candidate dashboard."
          : detail
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCandidateData();
  }, []);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await runAction("Profile updated.", "/api/v1/candidate/profile", {
      method: "PATCH",
      body: JSON.stringify({
        headline: textOrUndefined(formData.get("headline")),
        currentCity: textOrUndefined(formData.get("currentCity")),
        preferredCity: textOrUndefined(formData.get("preferredCity")),
        totalExperience: numberOrUndefined(formData.get("totalExperience")),
        expectedSalary: numberOrUndefined(formData.get("expectedSalary")),
        openToRemote: formData.get("openToRemote") === "on",
      }),
    });
  }

  async function submitSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    await runAction("Skill added.", "/api/v1/candidate/skills", {
      method: "POST",
      body: JSON.stringify({ name: textOrUndefined(formData.get("name")), level: numberOrUndefined(formData.get("level")) || 1 }),
    });
    form.reset();
  }

  async function submitEducation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    await runAction("Education added.", "/api/v1/candidate/education", {
      method: "POST",
      body: JSON.stringify({
        degree: textOrUndefined(formData.get("degree")),
        institute: textOrUndefined(formData.get("institute")),
        startYear: numberOrUndefined(formData.get("startYear")),
        endYear: numberOrUndefined(formData.get("endYear")),
      }),
    });
    form.reset();
  }

  async function submitExperience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    await runAction("Experience added.", "/api/v1/candidate/experience", {
      method: "POST",
      body: JSON.stringify({
        title: textOrUndefined(formData.get("title")),
        company: textOrUndefined(formData.get("company")),
        startDate: textOrUndefined(formData.get("startDate")),
        endDate: textOrUndefined(formData.get("endDate")),
        description: textOrUndefined(formData.get("description")),
      }),
    });
    form.reset();
  }

  async function submitAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    await runAction("Job alert created.", "/api/v1/candidate/alerts", {
      method: "POST",
      body: JSON.stringify({
        name: textOrUndefined(formData.get("name")),
        query: textOrUndefined(formData.get("query")),
        city: textOrUndefined(formData.get("city")),
        minSalary: numberOrUndefined(formData.get("minSalary")),
        skills: textOrUndefined(formData.get("skills"))?.split(",").map(skill => skill.trim()).filter(Boolean) || [],
        frequency: textOrUndefined(formData.get("frequency")) || "daily",
      }),
    });
    form.reset();
  }

  async function saveJob(jobId: string) {
    await runAction("Job saved.", `/api/v1/candidate/saved-jobs/${jobId}`, { method: "POST" });
  }

  async function removeSavedJob(jobId: string) {
    await runAction("Saved job removed.", `/api/v1/candidate/saved-jobs/${jobId}`, { method: "DELETE" });
  }

  async function runAction(successMessage: string, path: string, init: RequestInit) {
    try {
      await api(path, init);
      setMessage(successMessage);
      await loadCandidateData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed");
    }
  }

  return (
    <DashboardShell title="Candidate Dashboard" subtitle="Manage your profile, resumes, applications, alerts, and interviews.">
      {message && <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</p>}
      <DashboardGrid
        items={[
          { label: "Applications", value: isLoading ? "-" : String(profile?.applications.length ?? 0), text: "Track applied, shortlisted, interview, offer, and rejected stages." },
          { label: "Profile strength", value: isLoading ? "-" : `${profile?.profileScore ?? 0}%`, text: "Improve skills, education, experience, and resume data." },
          { label: "Job alerts", value: isLoading ? "-" : String(profile?.jobAlerts.length ?? 0), text: "Receive matching jobs by skills, city, salary, and experience." },
        ]}
      />

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <form onSubmit={submitProfile} className="card grid gap-4 p-5">
          <h2 className="font-bold">Profile management</h2>
          <input className="input" name="headline" placeholder="Headline" defaultValue={profile?.headline || ""} />
          <div className="grid gap-3 md:grid-cols-2">
            <input className="input" name="currentCity" placeholder="Current city" defaultValue={profile?.currentCity || ""} />
            <input className="input" name="preferredCity" placeholder="Preferred city" defaultValue={profile?.preferredCity || ""} />
            <input className="input" name="totalExperience" placeholder="Experience years" defaultValue={profile?.totalExperience ?? 0} />
            <input className="input" name="expectedSalary" placeholder="Expected salary" defaultValue={profile?.expectedSalary || ""} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input name="openToRemote" type="checkbox" defaultChecked={Boolean(profile?.openToRemote)} /> Open to remote jobs
          </label>
          <button className="btn-primary" type="submit">Save Profile</button>
        </form>

        <div className="card p-5">
          <h2 className="font-bold">Resume builder</h2>
          <p className="mt-2 text-sm text-slate-600">Resume upload uses Cloudinary credentials. Existing resumes appear here after upload.</p>
          <div className="mt-4 grid gap-2">
            {profile?.resumes.length ? profile.resumes.map(resume => (
              <div className="rounded-md border border-slate-200 p-3 text-sm" key={resume.id}>
                <span className="font-semibold">{resume.title}</span>
                {resume.isPrimary && <span className="ml-2 text-brand">Primary</span>}
              </div>
            )) : <p className="text-sm text-slate-600">No resumes added yet.</p>}
          </div>
        </div>

        <form onSubmit={submitSkill} className="card grid gap-3 p-5">
          <h2 className="font-bold">Skills management</h2>
          <div className="flex flex-wrap gap-2">
            {profile?.skills.map(item => <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold" key={item.skill.name}>{item.skill.name} - L{item.level}</span>)}
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
            <input className="input" name="name" placeholder="Skill name" required />
            <input className="input" name="level" placeholder="Level" defaultValue="1" />
            <button className="btn-primary" type="submit">Add Skill</button>
          </div>
        </form>

        <form onSubmit={submitAlert} className="card grid gap-3 p-5">
          <h2 className="font-bold">Job alerts</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="input" name="name" placeholder="Alert name" required />
            <input className="input" name="query" placeholder="Job title or skill" />
            <input className="input" name="city" placeholder="City" />
            <input className="input" name="minSalary" placeholder="Minimum salary" />
          </div>
          <input className="input" name="skills" placeholder="Skills comma separated" />
          <input className="input" name="frequency" placeholder="Frequency" defaultValue="daily" />
          <button className="btn-primary" type="submit">Create Alert</button>
          <div className="grid gap-2">
            {profile?.jobAlerts.map(alert => <p className="text-sm text-slate-600" key={alert.id}>{alert.name} - {alert.city || "Any city"} - {alert.frequency}</p>)}
          </div>
        </form>

        <form onSubmit={submitEducation} className="card grid gap-3 p-5">
          <h2 className="font-bold">Education management</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="input" name="degree" placeholder="Degree" required />
            <input className="input" name="institute" placeholder="Institute" required />
            <input className="input" name="startYear" placeholder="Start year" />
            <input className="input" name="endYear" placeholder="End year" />
          </div>
          <button className="btn-primary" type="submit">Add Education</button>
          {profile?.education.map(item => <p className="text-sm text-slate-600" key={item.id}>{item.degree}, {item.institute}</p>)}
        </form>

        <form onSubmit={submitExperience} className="card grid gap-3 p-5">
          <h2 className="font-bold">Experience management</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="input" name="title" placeholder="Job title" required />
            <input className="input" name="company" placeholder="Company" required />
            <input className="input" name="startDate" placeholder="Start date YYYY-MM-DD" />
            <input className="input" name="endDate" placeholder="End date YYYY-MM-DD" />
          </div>
          <textarea className="input min-h-24 py-3" name="description" placeholder="Description" />
          <button className="btn-primary" type="submit">Add Experience</button>
          {profile?.experiences.map(item => <p className="text-sm text-slate-600" key={item.id}>{item.title}, {item.company}</p>)}
        </form>

        <div className="card p-5">
          <h2 className="font-bold">Applied jobs and interview tracking</h2>
          <div className="mt-4 grid gap-3">
            {profile?.applications.length ? profile.applications.map(application => (
              <article className="rounded-md border border-slate-200 p-3" key={application.id}>
                <p className="font-bold">{application.job.title}</p>
                <p className="text-sm text-slate-600">{application.job.company?.name} - {application.status}</p>
                {application.interviews.map(interview => <p className="mt-1 text-sm text-brand" key={interview.id}>{interview.mode} interview on {new Date(interview.scheduledAt).toLocaleString()}</p>)}
              </article>
            )) : <p className="text-sm text-slate-600">No applications yet.</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-bold">Saved jobs</h2>
          <div className="mt-4 grid gap-3">
            {profile?.savedJobs.length ? profile.savedJobs.map(item => (
              <article className="rounded-md border border-slate-200 p-3" key={item.job.id}>
                <p className="font-bold">{item.job.title}</p>
                <p className="text-sm text-slate-600">{item.job.company?.name} - {item.job.city}</p>
                <button className="btn-secondary mt-3" type="button" onClick={() => removeSavedJob(item.job.id)}>Remove</button>
              </article>
            )) : <p className="text-sm text-slate-600">No saved jobs yet.</p>}
          </div>
        </div>

        <div className="card p-5 xl:col-span-2">
          <h2 className="font-bold">AI job recommendations</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recommendations.length ? recommendations.map(item => (
              <article className="rounded-md border border-slate-200 p-4" key={item.job.id}>
                <p className="font-bold">{item.job.title}</p>
                <p className="text-sm text-slate-600">{item.job.company?.name} - {item.job.city}</p>
                <p className="mt-1 text-sm font-semibold text-brand">Match score {Math.round(item.score)}%</p>
                <button className="btn-primary mt-3" type="button" onClick={() => saveJob(item.job.id)}>Save Job</button>
              </article>
            )) : <p className="text-sm text-slate-600">Recommendations will appear after active jobs and profile skills are available.</p>}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
