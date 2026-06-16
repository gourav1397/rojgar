import { SiteHeader } from "./site-header";

export function DashboardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="page-shell py-8">
        <div className="mb-6">
          <p className="text-xs font-extrabold uppercase text-brand">Rogjar workspace</p>
          <h1 className="mt-2 text-3xl font-extrabold">{title}</h1>
          <p className="mt-2 text-slate-600">{subtitle}</p>
        </div>
        {children}
      </main>
    </>
  );
}

export function DashboardGrid({ items }: { items: Array<{ label: string; value: string; text: string }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map(item => (
        <article className="card p-5" key={item.label}>
          <div className="text-sm font-semibold text-slate-500">{item.label}</div>
          <div className="mt-2 text-3xl font-extrabold">{item.value}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
        </article>
      ))}
    </div>
  );
}
