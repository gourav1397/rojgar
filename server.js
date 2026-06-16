import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const PORT = Number(globalThis.process?.env?.PORT || 4173);
const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(ROOT_DIR, "data", "rogjar-db.json");
const PUBLIC_FILES = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/styles.css", "styles.css"],
  ["/script.js", "script.js"],
]);

let db;
let indexes;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function slug(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

function createId(prefix, label) {
  const hash = crypto.randomBytes(4).toString("hex");
  return `${prefix}_${slug(label) || "record"}_${hash}`;
}

function indexById(rows) {
  return new Map(rows.map(row => [row.id, row]));
}

function addToIndex(target, key, jobId) {
  const cleanKey = normalize(key);
  if (!cleanKey) return;
  if (!target.has(cleanKey)) target.set(cleanKey, new Set());
  target.get(cleanKey).add(jobId);
}

function buildIndexes() {
  const byCompany = indexById(db.companies);
  const jobsById = indexById(db.jobs);
  const byCity = new Map();
  const byType = new Map();
  const byCategory = new Map();
  const byExperience = new Map();
  const searchText = new Map();

  for (const job of db.jobs) {
    const company = byCompany.get(job.companyId);
    addToIndex(byCity, job.city, job.id);
    addToIndex(byType, job.type, job.id);
    addToIndex(byCategory, job.category, job.id);
    addToIndex(byExperience, job.experience, job.id);
    searchText.set(
      job.id,
      normalize([job.title, job.city, job.category, job.type, job.experience, company?.name, ...(job.tags || [])].join(" "))
    );
  }

  indexes = {
    byCompany,
    jobsById,
    byCity,
    byType,
    byCategory,
    byExperience,
    searchText,
    savedBySeeker: new Map(),
    applicationsByJob: new Map(),
  };

  for (const saved of db.savedJobs) {
    if (!indexes.savedBySeeker.has(saved.seekerId)) indexes.savedBySeeker.set(saved.seekerId, new Set());
    indexes.savedBySeeker.get(saved.seekerId).add(saved.jobId);
  }

  for (const application of db.applications) {
    if (!indexes.applicationsByJob.has(application.jobId)) indexes.applicationsByJob.set(application.jobId, []);
    indexes.applicationsByJob.get(application.jobId).push(application);
  }
}

async function loadDb() {
  const raw = await fs.readFile(DB_PATH, "utf8");
  db = JSON.parse(raw);
  buildIndexes();
}

async function persistDb() {
  const tempPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, DB_PATH);
  buildIndexes();
}

function intersectSets(baseIds, nextSet) {
  if (!nextSet) return new Set();
  if (!baseIds) return new Set(nextSet);
  return new Set([...baseIds].filter(id => nextSet.has(id)));
}

function getJobs(query) {
  let candidateIds;
  const city = normalize(query.get("city"));
  const category = normalize(query.get("category"));
  const experience = normalize(query.get("experience"));
  const types = query.getAll("type").flatMap(type => type.split(",")).map(normalize).filter(Boolean);
  const minSalary = Number(query.get("minSalary") || 0);
  const search = normalize(query.get("search"));
  const seekerId = query.get("seekerId") || "seek_demo";

  if (city) candidateIds = intersectSets(candidateIds, indexes.byCity.get(city));
  if (category) candidateIds = intersectSets(candidateIds, indexes.byCategory.get(category));
  if (experience) candidateIds = intersectSets(candidateIds, indexes.byExperience.get(experience));
  if (types.length > 0) {
    const typeIds = new Set();
    for (const type of types) {
      for (const id of indexes.byType.get(type) || []) typeIds.add(id);
    }
    candidateIds = intersectSets(candidateIds, typeIds);
  }

  const sourceJobs = candidateIds ? [...candidateIds].map(id => indexes.jobsById.get(id)) : db.jobs;
  const saved = indexes.savedBySeeker.get(seekerId) || new Set();
  const jobs = sourceJobs
    .filter(job => job && job.status === "open")
    .filter(job => job.salary >= minSalary)
    .filter(job => !search || indexes.searchText.get(job.id).includes(search))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(job => {
      const company = indexes.byCompany.get(job.companyId);
      return {
        ...job,
        company: company?.name || "Unknown company",
        verified: Boolean(company?.verified),
        responseTimeHours: company?.responseTimeHours || null,
        applications: indexes.applicationsByJob.get(job.id)?.length || 0,
        saved: saved.has(job.id),
      };
    });

  return {
    jobs,
    count: jobs.length,
    indexes: {
      cities: [...indexes.byCity.keys()].sort(),
      categories: [...indexes.byCategory.keys()].sort(),
      types: [...indexes.byType.keys()].sort(),
      experiences: [...indexes.byExperience.keys()].sort(),
    },
  };
}

function getStats() {
  const openJobs = db.jobs.filter(job => job.status === "open").length;
  const providers = db.companies.length;
  const applications = db.applications.length;
  const shortlisted = db.applications.filter(app => app.status === "shortlisted").length;
  const joined = db.applications.filter(app => app.status === "joined").length;
  const latestApplication = db.applications
    .map(app => ({ ...app, job: indexes.jobsById.get(app.jobId) }))
    .filter(app => app.job)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  return {
    openJobs,
    providers,
    applications,
    shortlisted,
    joined,
    latest: latestApplication
      ? {
          status: latestApplication.status,
          title: latestApplication.job.title,
          city: latestApplication.job.city,
        }
      : null,
  };
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error("Request body too large");
  }
  return body ? JSON.parse(body) : {};
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function sendStatic(response, urlPath) {
  const fileName = PUBLIC_FILES.get(urlPath);
  if (!fileName) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const filePath = path.join(ROOT_DIR, fileName);
  const extension = path.extname(filePath);
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
  };
  const data = await fs.readFile(filePath);
  response.writeHead(200, {
    "content-type": contentTypes[extension] || "application/octet-stream",
    "cache-control": "no-cache",
  });
  response.end(data);
}

async function handleCreateJob(request, response) {
  const payload = await readJsonBody(request);
  const required = ["title", "company", "city", "salary", "type"];
  for (const field of required) {
    if (!String(payload[field] || "").trim()) {
      sendJson(response, 400, { error: `${field} is required` });
      return;
    }
  }

  const companyName = String(payload.company).trim();
  let company = db.companies.find(item => normalize(item.name) === normalize(companyName));
  if (!company) {
    company = {
      id: createId("cmp", companyName),
      name: companyName,
      city: String(payload.city).trim(),
      verified: false,
      responseTimeHours: 12,
    };
    db.companies.push(company);
  }

  const job = {
    id: createId("job", payload.title),
    companyId: company.id,
    title: String(payload.title).trim(),
    city: String(payload.city).trim(),
    salary: Number(payload.salary),
    experience: String(payload.experience || "Fresher").trim(),
    type: String(payload.type).trim(),
    category: String(payload.category || "Sales").trim(),
    tags: Array.isArray(payload.tags) && payload.tags.length ? payload.tags.slice(0, 5) : ["New post", "Provider added", "Direct HR"],
    status: "open",
    createdAt: new Date().toISOString(),
  };

  db.jobs.push(job);
  await persistDb();
  sendJson(response, 201, { job: getJobs(new URLSearchParams()).jobs.find(item => item.id === job.id) });
}

async function handleSaveJob(request, response) {
  const payload = await readJsonBody(request);
  const seekerId = payload.seekerId || "seek_demo";
  const jobId = payload.jobId;
  if (!indexes.jobsById.has(jobId)) {
    sendJson(response, 404, { error: "Job not found" });
    return;
  }

  const existingIndex = db.savedJobs.findIndex(saved => saved.seekerId === seekerId && saved.jobId === jobId);
  let saved;
  if (existingIndex >= 0) {
    db.savedJobs.splice(existingIndex, 1);
    saved = false;
  } else {
    db.savedJobs.push({ seekerId, jobId, savedAt: new Date().toISOString() });
    saved = true;
  }
  await persistDb();
  sendJson(response, 200, { saved });
}

async function handleCreateProfile(request, response) {
  const payload = await readJsonBody(request);
  const name = String(payload.name || "").trim();
  const mobile = String(payload.mobile || "").trim();
  const mode = payload.mode === "employer" ? "employer" : "candidate";
  if (!name || !mobile) {
    sendJson(response, 400, { error: "Name and mobile number are required" });
    return;
  }

  if (mode === "employer") {
    const company = {
      id: createId("cmp", name),
      name,
      city: String(payload.city || "India").trim(),
      verified: false,
      responseTimeHours: 12,
    };
    db.companies.push(company);
    await persistDb();
    sendJson(response, 201, { profile: company, mode });
    return;
  }

  const seeker = {
    id: createId("seek", name),
    name,
    mobile,
    city: String(payload.city || "India").trim(),
    skills: [],
    experience: "Fresher",
    profileStrength: 40,
  };
  db.seekers.push(seeker);
  await persistDb();
  sendJson(response, 201, { profile: seeker, mode });
}

async function route(request, response) {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/jobs") {
      sendJson(response, 200, getJobs(url.searchParams));
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/stats") {
      sendJson(response, 200, getStats());
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/jobs") {
      await handleCreateJob(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/saved-jobs") {
      await handleSaveJob(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/profiles") {
      await handleCreateProfile(request, response);
      return;
    }
    if (request.method === "GET") {
      await sendStatic(response, url.pathname);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
  }
}

loadDb()
  .then(() => {
    http.createServer(route).listen(PORT, "127.0.0.1", () => {
      console.log(`Rogjar running at http://127.0.0.1:${PORT}`);
    });
  })
  .catch(error => {
    console.error(error);
    if (globalThis.process) globalThis.process.exitCode = 1;
  });
