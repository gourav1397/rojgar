const API_BASE_URL = typeof window === "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:4000" : "";

let csrfToken: string | null = null;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/v1/csrf-token`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await response.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() || "GET";
  const needsCsrf = !["GET", "HEAD", "OPTIONS"].includes(method);
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  if (needsCsrf) {
    const token = await getCsrfToken();
    if (token) headers.set("x-csrf-token", token);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    const fieldErrors = data.issues?.fieldErrors as Record<string, string[] | undefined> | undefined;
    const firstFieldError = fieldErrors
      ? Object.entries(fieldErrors).find((entry): entry is [string, string[]] => Boolean(entry[1]?.length))
      : undefined;
    const detail = firstFieldError ? `${firstFieldError[0]}: ${firstFieldError[1][0]}` : undefined;
    throw new Error(detail || data.error || "Request failed");
  }
  return data as T;
}
