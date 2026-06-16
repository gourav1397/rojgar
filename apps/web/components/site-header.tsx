"use client";

import Link from "next/link";
import { BriefcaseBusiness, LayoutDashboard, LogIn, LogOut, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "EMPLOYER" | "CANDIDATE";
  status: string;
};

function dashboardPath(role: SessionUser["role"]) {
  if (role === "ADMIN") return "/dashboard/admin";
  if (role === "EMPLOYER") return "/dashboard/employer";
  return "/dashboard/candidate";
}

export function SiteHeader() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dashboardHref = useMemo(() => (user ? dashboardPath(user.role) : "/dashboard/candidate"), [user]);

  useEffect(() => {
    let isMounted = true;
    api<{ user: SessionUser }>("/api/v1/auth/me")
      .then(data => {
        if (isMounted) setUser(data.user);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  async function logout() {
    await api("/api/v1/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="page-shell flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid size-9 place-items-center rounded-lg bg-brand text-white">R</span>
          Rogjar
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/jobs">Jobs</Link>
          <Link href="/dashboard/candidate">Candidate</Link>
          <Link href="/dashboard/employer">Employer</Link>
          <Link href="/dashboard/admin">Admin</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden min-w-0 text-right text-xs sm:block">
                <p className="truncate font-bold text-slate-900">{user.name || user.email}</p>
                <p className="font-semibold uppercase text-brand">{user.role.toLowerCase()}</p>
              </div>
              <Link className="btn-secondary gap-2" href={dashboardHref}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <button className="btn-primary gap-2" type="button" onClick={logout}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn-secondary gap-2" href="/login" aria-disabled={isLoading}>
                <LogIn size={16} /> Login
              </Link>
              <Link className="btn-primary gap-2" href="/dashboard/employer/jobs/new">
                <Plus size={16} /> Post Job
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <BriefcaseBusiness size={16} />
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
    </div>
  );
}
