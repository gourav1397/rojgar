export type UserRole = "ADMIN" | "EMPLOYER" | "CANDIDATE";

export function dashboardPath(role: UserRole) {
  if (role === "ADMIN") return "/dashboard/admin";
  if (role === "EMPLOYER") return "/dashboard/employer";
  return "/dashboard/candidate";
}

export function textOrUndefined(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text || undefined;
}

export function numberOrUndefined(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text ? Number(text) : undefined;
}

export function buildLoginPayload(formData: FormData) {
  return { email: formData.get("email"), password: formData.get("password") };
}

export function buildRegisterPayload(formData: FormData) {
  const phone = formData.get("phone")?.toString().trim();
  return {
    name: formData.get("name")?.toString().trim(),
    email: formData.get("email")?.toString().trim(),
    ...(phone ? { phone } : {}),
    password: formData.get("password"),
    role: formData.get("role"),
  };
}

export function buildForgotPasswordPayload(formData: FormData) {
  return { email: formData.get("email") };
}

export function buildCandidateProfilePayload(formData: FormData) {
  return {
    headline: textOrUndefined(formData.get("headline")),
    currentCity: textOrUndefined(formData.get("currentCity")),
    preferredCity: textOrUndefined(formData.get("preferredCity")),
    totalExperience: numberOrUndefined(formData.get("totalExperience")),
    expectedSalary: numberOrUndefined(formData.get("expectedSalary")),
    openToRemote: formData.get("openToRemote") === "on",
  };
}

export function buildCandidateSkillPayload(formData: FormData) {
  return { name: textOrUndefined(formData.get("name")), level: numberOrUndefined(formData.get("level")) || 1 };
}

export function buildEducationPayload(formData: FormData) {
  return {
    degree: textOrUndefined(formData.get("degree")),
    institute: textOrUndefined(formData.get("institute")),
    startYear: numberOrUndefined(formData.get("startYear")),
    endYear: numberOrUndefined(formData.get("endYear")),
  };
}

export function buildExperiencePayload(formData: FormData) {
  return {
    title: textOrUndefined(formData.get("title")),
    company: textOrUndefined(formData.get("company")),
    startDate: textOrUndefined(formData.get("startDate")),
    endDate: textOrUndefined(formData.get("endDate")),
    description: textOrUndefined(formData.get("description")),
  };
}

export function buildJobAlertPayload(formData: FormData) {
  return {
    name: textOrUndefined(formData.get("name")),
    query: textOrUndefined(formData.get("query")),
    city: textOrUndefined(formData.get("city")),
    minSalary: numberOrUndefined(formData.get("minSalary")),
    skills: textOrUndefined(formData.get("skills"))?.split(",").map(skill => skill.trim()).filter(Boolean) || [],
    frequency: textOrUndefined(formData.get("frequency")) || "daily",
  };
}

export function buildEmployerJobPayload(companyId: string, formData: FormData) {
  const minSalary = formData.get("minSalary")?.toString().trim();
  const maxSalary = formData.get("maxSalary")?.toString().trim();
  const minExperience = formData.get("minExperience")?.toString().trim();
  const maxExperience = formData.get("maxExperience")?.toString().trim();
  const skills = formData.get("skills")?.toString().split(",").map(skill => skill.trim()).filter(Boolean);
  return {
    companyId,
    title: formData.get("title")?.toString().trim(),
    description: formData.get("description")?.toString().trim(),
    city: formData.get("city")?.toString().trim(),
    category: formData.get("category")?.toString().trim(),
    employmentType: formData.get("employmentType")?.toString().trim(),
    ...(minSalary ? { minSalary } : {}),
    ...(maxSalary ? { maxSalary } : {}),
    ...(minExperience ? { minExperience } : {}),
    ...(maxExperience ? { maxExperience } : {}),
    skills: skills || [],
  };
}

export function buildCandidateSearchParams(formData: FormData) {
  const params = new URLSearchParams();
  for (const key of ["q", "city"]) {
    const value = formData.get(key)?.toString().trim();
    if (value) params.set(key, value);
  }
  return params;
}

export function buildCmsPayload(formData: FormData) {
  return {
    slug: formData.get("slug")?.toString().trim(),
    title: formData.get("title")?.toString().trim(),
    body: formData.get("body")?.toString().trim(),
    metaTitle: formData.get("metaTitle")?.toString().trim() || undefined,
    metaDescription: formData.get("metaDescription")?.toString().trim() || undefined,
    publishedAt: formData.get("published") === "on" ? new Date().toISOString() : undefined,
  };
}

export function buildReportPayload(formData: FormData) {
  return {
    type: formData.get("type")?.toString().trim(),
    entityId: formData.get("entityId")?.toString().trim() || undefined,
    reason: formData.get("reason")?.toString().trim(),
  };
}
