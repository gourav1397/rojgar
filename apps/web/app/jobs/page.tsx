import { SiteHeader } from "../../components/site-header";

async function getJobs(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  try {
    const response = await fetch(`${base}/api/v1/jobs?${params}`, { cache: "no-store" });
    return response.json();
  } catch {
    return { items: [], total: 0 };
  }
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolved = await searchParams;
  const data = await getJobs(resolved);
  return (
    <>
      <SiteHeader />
      <main className="page-shell grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="card h-fit p-5">
          <h2 className="font-bold">Advanced filters</h2>
          <form className="mt-4 grid gap-3">
            <input className="input" name="q" placeholder="Skills, title, company" defaultValue={String(resolved.q || "")} />
            <input className="input" name="city" placeholder="Location" defaultValue={String(resolved.city || "")} />
            <input className="input" name="skills" placeholder="Skills comma separated" />
            <input className="input" name="minSalary" placeholder="Minimum salary" />
            <input className="input" name="minExperience" placeholder="Experience years" />
            <button className="btn-primary" type="submit">Apply Filters</button>
          </form>
        </aside>
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-extrabold">Jobs</h1>
            <span className="text-sm font-semibold text-slate-500">{data.total || 0} results</span>
          </div>
          <div className="grid gap-4">
            {(data.items || []).map((job: any) => (
              <article className="card p-5" key={job.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{job.title}</h2>
                    <p className="text-sm text-slate-600">{job.company?.name} - {job.city}</p>
                  </div>
                  <a className="btn-primary" href={`/jobs/${job.slug}`}>Apply Now</a>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{job.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
