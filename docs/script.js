
const STORAGE_KEY = "jobtrack_applications";

const form = document.getElementById("applicationForm");
const applicationsList = document.getElementById("applicationsList");
const message = document.getElementById("message");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const sortDate = document.getElementById("sortDate");
const applicationDateInput = document.getElementById("applicationDate");

let applications = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let editingId = null;

function saveApplications() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

function setMaximumApplicationDate() {
  const today = new Date();
  applicationDateInput.max =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#dc2626" : "#15803d";
}

function updateDashboard() {
  const count = (status) =>
    applications.filter(app => app.status === status).length;

  const cards = document.querySelectorAll(".dashboard-card h2, .stat-card h2, .dashboard-card .count, .stat-card .count");
  const values = [
    applications.length,
    count("Interview"),
    count("Selected"),
    count("Rejected")
  ];

  cards.forEach((card, index) => {
    if (index < values.length) card.textContent = values[index];
  });
}

function renderApplications() {
  const search = (searchInput?.value || "").toLowerCase().trim();
  const status = filterStatus?.value || "";

  let filtered = applications.filter(app =>
    (app.companyName || "").toLowerCase().includes(search) ||
    (app.jobRole || "").toLowerCase().includes(search)
  );

  if (status) {
    filtered = filtered.filter(app => app.status === status);
  }

  if (sortDate?.value === "oldest") {
    filtered.sort((a, b) => (a.applicationDate || "").localeCompare(b.applicationDate || ""));
  } else {
    filtered.sort((a, b) => (b.applicationDate || "").localeCompare(a.applicationDate || ""));
  }

  applicationsList.innerHTML = "";

  if (filtered.length === 0) {
    applicationsList.textContent = "No applications found.";
    updateDashboard();
    return;
  }

  filtered.forEach(app => {
    const card = document.createElement("div");
    card.className = "application-card";

    const details = document.createElement("div");
    const company = document.createElement("h3");
    company.textContent = app.companyName;
    const role = document.createElement("p");
    role.textContent = `Role: ${app.jobRole}`;
    const date = document.createElement("p");
    date.textContent = `Application Date: ${app.applicationDate || "Not set"}`;
    const statusText = document.createElement("p");
    statusText.textContent = `Status: ${app.status}`;
    statusText.className = "status-badge " + (app.status || "").toLowerCase();

    details.append(company, role, date, statusText);

    const actions = document.createElement("div");
    actions.className = "application-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      document.getElementById("companyName").value = app.companyName;
      document.getElementById("jobRole").value = app.jobRole;
      applicationDateInput.value = app.applicationDate || "";
      document.getElementById("status").value = app.status;
      editingId = app.id;
      showMessage("Editing application.");
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      if (!confirm(`Delete application at ${app.companyName}?`)) return;
      applications = applications.filter(item => item.id !== app.id);
      saveApplications();
      renderApplications();
      showMessage("Application deleted.");
    });

    actions.append(editButton, deleteButton);
    card.append(details, actions);
    applicationsList.appendChild(card);
  });

  updateDashboard();
}

form.addEventListener("submit", event => {
  event.preventDefault();
  setMaximumApplicationDate();

  const companyName = document.getElementById("companyName").value.trim();
  const jobRole = document.getElementById("jobRole").value.trim();
  const applicationDate = applicationDateInput.value;
  const status = document.getElementById("status").value;

  if (!companyName || !jobRole || !applicationDate) {
    showMessage("Please complete all required fields.", true);
    return;
  }

  if (applicationDate > applicationDateInput.max) {
    showMessage("Application date cannot be in the future.", true);
    return;
  }

  if (editingId !== null) {
    applications = applications.map(app =>
      app.id === editingId
        ? { ...app, companyName, jobRole, applicationDate, status }
        : app
    );
    editingId = null;
    showMessage("Application updated successfully.");
  } else {
    applications.push({
      id: Date.now(),
      companyName,
      jobRole,
      applicationDate,
      status
    });
    showMessage("Application added successfully.");
  }

  saveApplications();
  form.reset();
  renderApplications();
});

searchInput?.addEventListener("input", renderApplications);
filterStatus?.addEventListener("change", renderApplications);
sortDate?.addEventListener("change", renderApplications);

setMaximumApplicationDate();
renderApplications();
