const SEEKER_ID = "seek_demo";

const state = {
  search: "",
  city: "",
  experience: "",
  minSalary: 10000,
  types: new Set(),
  category: "",
  jobs: [],
  dialogMode: "candidate",
};

const jobList = document.querySelector("#jobList");
const resultCount = document.querySelector("#resultCount");
const salaryRange = document.querySelector("#salaryRange");
const salaryValue = document.querySelector("#salaryValue");
const roleInput = document.querySelector("#roleInput");
const cityInput = document.querySelector("#cityInput");
const experienceInput = document.querySelector("#experienceInput");
const jobStatus = document.querySelector("#jobStatus");
const postStatus = document.querySelector("#postStatus");
const dialog = document.querySelector("#actionDialog");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogText = document.querySelector("#dialogText");
const dialogName = document.querySelector("#dialogName");
const dialogMobile = document.querySelector("#dialogMobile");

function formatSalary(value) {
  return `Rs ${Number(value).toLocaleString("en-IN")}`;
}

function setStatus(message, type = "") {
  jobStatus.textContent = message;
  jobStatus.dataset.type = type;
}

function buildJobQuery() {
  const params = new URLSearchParams({
    seekerId: SEEKER_ID,
    minSalary: String(state.minSalary),
  });
  if (state.search) params.set("search", state.search);
  if (state.city) params.set("city", state.city);
  if (state.experience) params.set("experience", state.experience);
  if (state.category) params.set("category", state.category);
  for (const type of state.types) params.append("type", type);
  return params.toString();
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function renderJobs() {
  resultCount.textContent = `${state.jobs.length} job${state.jobs.length === 1 ? "" : "s"}`;

  if (state.jobs.length === 0) {
    jobList.innerHTML = `
      <article class="job-card">
        <div>
          <h3>No matching jobs yet</h3>
          <p>Try a different city, salary, or category to see more openings.</p>
        </div>
      </article>
    `;
    return;
  }

  jobList.innerHTML = state.jobs
    .map(
      job => `
        <article class="job-card">
          <div>
            <h3>${job.title}</h3>
            <p>${job.company} - ${job.city}</p>
            <div class="job-meta">
              <span>${formatSalary(job.salary)} / month</span>
              <span>${job.experience}</span>
              <span>${job.type}</span>
              <span>${job.verified ? "Verified provider" : "New provider"}</span>
            </div>
            <div class="job-tags">
              ${job.tags.map(tag => `<span>${tag}</span>`).join("")}
            </div>
          </div>
          <div class="job-actions">
            <button class="save-btn ${job.saved ? "saved" : ""}" data-save="${job.id}" aria-label="Save ${job.title}">
              ${job.saved ? "Saved" : "Save"}
            </button>
            <span>${job.applications} applicant${job.applications === 1 ? "" : "s"}</span>
          </div>
        </article>
      `
    )
    .join("");
}

async function loadJobs() {
  setStatus("Loading jobs from Rogjar database...");
  try {
    const data = await api(`/api/jobs?${buildJobQuery()}`);
    state.jobs = data.jobs;
    renderJobs();
    setStatus("Showing live results from indexed job data.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function loadStats() {
  try {
    const stats = await api("/api/stats");
    document.querySelector("#activeJobsMetric").textContent = stats.openJobs.toLocaleString("en-IN");
    document.querySelector("#providersMetric").textContent = stats.providers.toLocaleString("en-IN");
    document.querySelector("#appliedMetric").textContent = stats.applications.toLocaleString("en-IN");
    document.querySelector("#shortlistedMetric").textContent = stats.shortlisted.toLocaleString("en-IN");
    document.querySelector("#joinedMetric").textContent = stats.joined.toLocaleString("en-IN");
    document.querySelector("#latestActivity").textContent = stats.latest
      ? `${stats.latest.title} in ${stats.latest.city} is ${stats.latest.status}.`
      : "New activity will appear after applications are added.";
  } catch (error) {
    document.querySelector("#latestActivity").textContent = "Stats are temporarily unavailable.";
  }
}

document.querySelector("#jobSearch").addEventListener("submit", event => {
  event.preventDefault();
  state.search = roleInput.value.trim();
  state.city = cityInput.value.trim();
  state.experience = experienceInput.value;
  state.category = "";
  loadJobs();
});

document.querySelectorAll(".quick-tags button").forEach(button => {
  button.addEventListener("click", () => {
    roleInput.value = button.dataset.filter;
    state.search = button.dataset.filter;
    loadJobs();
  });
});

document.querySelectorAll(".type-filter").forEach(checkbox => {
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      state.types.add(checkbox.value);
    } else {
      state.types.delete(checkbox.value);
    }
    loadJobs();
  });
});

document.querySelectorAll(".category-chip").forEach(button => {
  button.addEventListener("click", () => {
    state.category = state.category === button.dataset.category ? "" : button.dataset.category;
    loadJobs();
  });
});

salaryRange.addEventListener("input", () => {
  state.minSalary = Number(salaryRange.value);
  salaryValue.textContent = formatSalary(state.minSalary);
  loadJobs();
});

document.querySelector("#clearFilters").addEventListener("click", () => {
  state.search = "";
  state.city = "";
  state.experience = "";
  state.minSalary = 10000;
  state.types.clear();
  state.category = "";
  roleInput.value = "";
  cityInput.value = "";
  experienceInput.value = "";
  salaryRange.value = "10000";
  salaryValue.textContent = formatSalary(10000);
  document.querySelectorAll(".type-filter").forEach(checkbox => {
    checkbox.checked = false;
  });
  loadJobs();
});

jobList.addEventListener("click", async event => {
  const button = event.target.closest("[data-save]");
  if (!button) return;
  button.disabled = true;
  try {
    const data = await api("/api/saved-jobs", {
      method: "POST",
      body: JSON.stringify({ seekerId: SEEKER_ID, jobId: button.dataset.save }),
    });
    const job = state.jobs.find(item => item.id === button.dataset.save);
    if (job) job.saved = data.saved;
    renderJobs();
  } catch (error) {
    setStatus(error.message, "error");
  }
});

document.querySelectorAll(".tab-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn, .tab-panel").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.tab}`).classList.add("active");
  });
});

document.querySelectorAll("[data-open-panel]").forEach(button => {
  button.addEventListener("click", () => {
    state.dialogMode = button.dataset.openPanel;
    dialogTitle.textContent = state.dialogMode === "employer" ? "Start hiring on Rogjar" : "Create your candidate profile";
    dialogText.textContent =
      state.dialogMode === "employer"
        ? "Share your company details and publish your first role for verified job seekers."
        : "Add your profile details to apply faster and receive direct HR callbacks.";
    dialogName.value = "";
    dialogMobile.value = "";
    dialog.showModal();
  });
});

dialog.querySelector("form").addEventListener("submit", async event => {
  const submitter = event.submitter;
  if (submitter?.value === "close") return;
  event.preventDefault();
  try {
    await api("/api/profiles", {
      method: "POST",
      body: JSON.stringify({
        mode: state.dialogMode,
        name: dialogName.value.trim(),
        mobile: dialogMobile.value.trim(),
      }),
    });
    dialog.close();
    await loadStats();
  } catch (error) {
    dialogText.textContent = error.message;
  }
});

document.querySelector("#postJobForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  postStatus.textContent = "Saving job to database...";
  postStatus.dataset.type = "";
  try {
    await api("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        title: document.querySelector("#postTitle").value.trim(),
        company: document.querySelector("#postCompany").value.trim(),
        city: document.querySelector("#postCity").value.trim(),
        salary: Number(document.querySelector("#postSalary").value),
        experience: document.querySelector("#postExperience").value,
        type: document.querySelector("#postType").value,
        category: document.querySelector("#postCategory").value,
      }),
    });
    form.reset();
    postStatus.textContent = "Job saved. It is now visible in live search results.";
    postStatus.dataset.type = "ok";
    state.search = "";
    state.city = "";
    state.experience = "";
    roleInput.value = "";
    cityInput.value = "";
    experienceInput.value = "";
    await loadJobs();
    await loadStats();
    document.querySelector("#jobs").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    postStatus.textContent = error.message;
    postStatus.dataset.type = "error";
  }
});

loadJobs();
loadStats();
