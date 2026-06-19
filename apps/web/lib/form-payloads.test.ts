import { describe, expect, it, vi } from "vitest";
import {
  buildCandidateProfilePayload,
  buildCandidateSearchParams,
  buildCandidateSkillPayload,
  buildCmsPayload,
  buildEducationPayload,
  buildEmployerJobPayload,
  buildExperiencePayload,
  buildForgotPasswordPayload,
  buildJobAlertPayload,
  buildLoginPayload,
  buildRegisterPayload,
  buildReportPayload,
  buildVerifyEmailPayload,
  dashboardPath,
} from "./form-payloads";

function form(values: Record<string, string | undefined>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) formData.set(key, value);
  }
  return formData;
}

describe("login and signup form payloads", () => {
  it("builds login payloads and role dashboard redirects", () => {
    expect(buildLoginPayload(form({ email: "candidate@rogjar.in", password: "Password@123" }))).toEqual({
      email: "candidate@rogjar.in",
      password: "Password@123",
    });
    expect(dashboardPath("CANDIDATE")).toBe("/dashboard/candidate");
    expect(dashboardPath("EMPLOYER")).toBe("/dashboard/employer");
    expect(dashboardPath("ADMIN")).toBe("/dashboard/admin");
  });

  it("builds candidate signup payloads without blank optional phone", () => {
    expect(
      buildRegisterPayload(
        form({ name: "  Demo Candidate  ", email: " candidate@rogjar.in ", phone: "   ", password: "Password@123", role: "CANDIDATE" })
      )
    ).toEqual({
      name: "Demo Candidate",
      email: "candidate@rogjar.in",
      password: "Password@123",
      role: "CANDIDATE",
    });
  });

  it("builds employer signup payloads with phone when present", () => {
    expect(
      buildRegisterPayload(
        form({ name: "Demo Employer", email: "employer@rogjar.in", phone: "9876543210", password: "Password@123", role: "EMPLOYER" })
      )
    ).toEqual({
      name: "Demo Employer",
      email: "employer@rogjar.in",
      phone: "9876543210",
      password: "Password@123",
      role: "EMPLOYER",
    });
  });

  it("builds forgot password payloads", () => {
    expect(buildForgotPasswordPayload(form({ email: "user@rogjar.in" }))).toEqual({ email: "user@rogjar.in" });
  });

  it("builds verify email payloads", () => {
    expect(buildVerifyEmailPayload(form({ email: " user@rogjar.in ", code: " ab12cd " }))).toEqual({
      email: "user@rogjar.in",
      code: "AB12CD",
    });
  });
});

describe("candidate dashboard form payloads", () => {
  it("builds profile management payloads", () => {
    expect(
      buildCandidateProfilePayload(
        form({
          headline: " Sales associate ",
          currentCity: " Delhi ",
          preferredCity: " Noida ",
          totalExperience: "2",
          expectedSalary: "35000",
          openToRemote: "on",
        })
      )
    ).toEqual({
      headline: "Sales associate",
      currentCity: "Delhi",
      preferredCity: "Noida",
      totalExperience: 2,
      expectedSalary: 35000,
      openToRemote: true,
    });
  });

  it("builds skills, education, experience, and alert payloads", () => {
    expect(buildCandidateSkillPayload(form({ name: " React ", level: "3" }))).toEqual({ name: "React", level: 3 });
    expect(buildEducationPayload(form({ degree: "BCA", institute: "DU", startYear: "2020", endYear: "2023" }))).toEqual({
      degree: "BCA",
      institute: "DU",
      startYear: 2020,
      endYear: 2023,
    });
    expect(buildExperiencePayload(form({ title: "Executive", company: "BrightPay", startDate: "2024-01-01", description: "Support" }))).toEqual({
      title: "Executive",
      company: "BrightPay",
      startDate: "2024-01-01",
      endDate: undefined,
      description: "Support",
    });
    expect(buildJobAlertPayload(form({ name: "Sales jobs", query: "sales", city: "Delhi", minSalary: "25000", skills: "Sales, CRM", frequency: "" }))).toEqual({
      name: "Sales jobs",
      query: "sales",
      city: "Delhi",
      minSalary: 25000,
      skills: ["Sales", "CRM"],
      frequency: "daily",
    });
  });
});

describe("employer forms", () => {
  it("builds create-job payloads and omits blank optional numbers", () => {
    expect(
      buildEmployerJobPayload(
        "company_1",
        form({
          title: " Field Sales ",
          description: "Meet merchants and onboard them.",
          city: " Delhi ",
          category: " Sales ",
          employmentType: "Full time",
          minSalary: "22000",
          maxSalary: "",
          minExperience: "0",
          maxExperience: "",
          skills: "Sales, Communication",
        })
      )
    ).toEqual({
      companyId: "company_1",
      title: "Field Sales",
      description: "Meet merchants and onboard them.",
      city: "Delhi",
      category: "Sales",
      employmentType: "Full time",
      minSalary: "22000",
      minExperience: "0",
      skills: ["Sales", "Communication"],
    });
  });

  it("builds candidate search query params", () => {
    expect(buildCandidateSearchParams(form({ q: " sales ", city: " Delhi " })).toString()).toBe("q=sales&city=Delhi");
    expect(buildCandidateSearchParams(form({ q: "", city: " " })).toString()).toBe("");
  });
});

describe("admin forms", () => {
  it("builds cms payloads", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T00:00:00.000Z"));

    expect(
      buildCmsPayload(form({ slug: " about ", title: " About ", body: " Body ", metaTitle: "", metaDescription: "SEO", published: "on" }))
    ).toEqual({
      slug: "about",
      title: "About",
      body: "Body",
      metaTitle: undefined,
      metaDescription: "SEO",
      publishedAt: "2026-06-17T00:00:00.000Z",
    });

    vi.useRealTimers();
  });

  it("builds fraud/report payloads", () => {
    expect(buildReportPayload(form({ type: " job ", entityId: " ", reason: " Suspicious posting " }))).toEqual({
      type: "job",
      entityId: undefined,
      reason: "Suspicious posting",
    });
  });
});
