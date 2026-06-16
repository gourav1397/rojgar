import Link from "next/link";
import { SiteHeader, StatCard } from "../components/site-header";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Rogjar",
  url: "https://rogjar.in",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://rogjar.in/jobs?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-[linear-gradient(120deg,rgba(9,121,105,.12),rgba(245,165,36,.12)),url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center">
          <div className="page-shell grid gap-8 py-16 lg:grid-cols-[1.2fr_.8fr]">
            <div>
              <p className="text-xs font-extrabold uppercase text-brand">Production job marketplace</p>
              <h1 className="mt-3 max-w-3xl text-5xl font-extrabold tracking-normal text-slate-950 md:text-7xl">
                Find jobs, hire talent, and manage every step.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                Rogjar now supports candidates, employers, and admins with JWT auth, dashboards,
                job search, applications, analytics, payments, notifications, and audit trails.
              </p>
              <form action="/jobs" className="mt-8 grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xl md:grid-cols-[1fr_1fr_auto]">
                <input className="input" name="q" placeholder="Job title, skill, company" />
                <input className="input" name="city" placeholder="City or location" />
                <button className="btn-primary" type="submit">Search Jobs</button>
              </form>
            </div>
            <div className="grid content-center gap-4">
              <StatCard label="Role-based users" value="Admin, Employer, Candidate" />
              <StatCard label="Hiring workflow" value="Apply to offer" />
              <StatCard label="Security" value="JWT, RBAC, audit logs" />
            </div>
          </div>
        </section>
        <section className="page-shell grid gap-4 py-10 md:grid-cols-3">
          {["Candidate dashboard", "Employer analytics", "Admin verification"].map(item => (
            <Link href="/dashboard/candidate" className="card p-6 transition hover:border-brand" key={item}>
              <h2 className="text-xl font-bold">{item}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Production-ready flows modeled after large job boards.</p>
            </Link>
          ))}
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
