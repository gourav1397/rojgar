import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AdminDashboardPage from "./dashboard/admin/page";
import CandidateDashboardPage from "./dashboard/candidate/page";
import EmployerDashboardPage from "./dashboard/employer/page";
import EmployerCandidatesPage from "./dashboard/employer/candidates/page";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

vi.mock("../lib/api", () => ({
  api: vi.fn(() => Promise.reject(new Error("Authentication required"))),
}));

describe("dashboard pages", () => {
  it("renders functional candidate dashboard sections", () => {
    const html = renderToStaticMarkup(<CandidateDashboardPage />);

    expect(html).toContain("Profile management");
    expect(html).toContain("Skills management");
    expect(html).toContain("Education management");
    expect(html).toContain("Experience management");
    expect(html).toContain("AI job recommendations");
  });

  it("renders functional employer dashboard sections", () => {
    const html = renderToStaticMarkup(<EmployerDashboardPage />);

    expect(html).toContain("Company profile");
    expect(html).toContain("Employer analytics");
    expect(html).toContain("Manage applicants");
    expect(html).toContain("Candidate Search");
  });

  it("renders employer candidate search form", () => {
    const html = renderToStaticMarkup(<EmployerCandidatesPage />);

    expect(html).toContain("Search Candidates");
    expect(html).toContain("Skill, title, or candidate name");
    expect(html).toContain("City");
  });

  it("renders functional admin dashboard controls", () => {
    const html = renderToStaticMarkup(<AdminDashboardPage />);

    expect(html).toContain("Job approval system");
    expect(html).toContain("Company verification");
    expect(html).toContain("CMS management");
    expect(html).toContain("Fraud detection report");
    expect(html).toContain("Audit logs");
  });
});
