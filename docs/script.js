
const STORAGE_KEY = "jobtrack_applications";

const form = document.getElementById("applicationForm");
const applicationsList = document.getElementById("applicationsList");
const message = document.getElementById("message");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const sortDate = document.getElementById("sortDate");
const applicationDateInput = document.getElementById("applicationDate");

let applications = [];
let editingId = null;

function loadApplications() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    applications = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(applications)) {
      applications = [];
    }
  } catch (error) {
    console.error("Could not load applications:", error);
    applications = [];
  }
}

function saveApplications() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(applications)
    );
    return true;
  } catch (error) {
    console.error("Could not save applications:", error);
    showMessage("Could not save data in this browser.", true);
    return false;
  }
}

function setMaximumApplicationDate() {
  if (!applicationDateInput) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  applicationDateInput.max = `${year}-${month}-${day}`;
}

function showMessage(text, isError = false) {
  if (!message) return;

  message.textContent = text;
  message.style.color = isError ? "#dc2626" : "#15803d";
}

function updateDashboard() {
  const count = status =>
    applications.filter(app => app.status === status).length;

  const values = [
    applications.length,
    count("Interview"),
    count("Selected"),
    count("Rejected")
  ];

  const selectors = [
    "#totalApplications",
    "#interviewCount",
    "#selectedCount",
    "#rejectedCount"
  ];

  selectors.forEach((selector, index) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = values[index];
  });

  // Fallback for dashboards that use card-based markup.
  if (!selectors.every(selector => document.querySelector(selector))) {
    const cards = document.querySelectorAll(
      ".dashboard-card h2, .stat-card h2, " +
      ".dashboard-card .count, .stat-card .count"
    );

    cards.forEach((card, index) => {
      if (index < values.length) {
        card.textContent = values[index];
      }
    });
  }
}

function renderApplications() {
  if (!applicationsList) {
    console.error('Missing element: id="applicationsList"');
    return;
  }

  const search = (searchInput?.value || "")
    .toLowerCase()
    .trim();

  const status = filterStatus?.value || "";

  let filtered = applications.filter(app => {
    const company = String(app.companyName || "").toLowerCase();
    const role = String(app.jobRole || "").toLowerCase();

    const matchesSearch =
      company.includes(search) || role.includes(search);

    const matchesStatus = !status || app.status === status;

    return matchesSearch && matchesStatus;
  });

  if (sortDate?.value === "oldest") {
    filtered.sort((a, b) =>
      String(a.applicationDate || "").localeCompare(
        String(b.applicationDate || "")
      )
    );
  } else {
    filtered.sort((a, b) =>
      String(b.applicationDate || "").localeCompare(
        String(a.applicationDate || "")
      )
    );
  }

  applicationsList.replaceChildren();

  if (filtered.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = applications.length === 0
      ? "No applications yet. Add your first application above."
      : "No applications match your search or filter.";

    applicationsList.appendChild(emptyMessage);
    updateDashboard();
    return;
  }

  filtered.forEach(app => {
    const card = document.createElement("div");
    card.className = "application-card";

    const details = document.createElement("div");

    const company = document.createElement("h3");
    company.textContent = app.companyName || "Unknown company";

    const role = document.createElement("p");
    role.textContent = `Role: ${app.jobRole || "Not specified"}`;

    const date = document.createElement("p");
    date.textContent =
      `Application Date: ${app.applicationDate || "Not set"}`;

    const statusText = document.createElement("p");
    statusText.textContent = `Status: ${app.status || "Applied"}`;
    statusText.className =
      "status-badge " +
      String(app.status || "Applied")
        .toLowerCase()
        .replace(/\s+/g, "-");

    details.append(company, role, date, statusText);

    const actions = document.createElement("div");
    actions.className = "application-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", () => {
      document.getElementById("companyName").value =
        app.companyName || "";

      document.getElementById("jobRole").value =
        app.jobRole || "";

      applicationDateInput.value =
        app.applicationDate || "";

      document.getElementById("status").value =
        app.status || "Applied";

      editingId = app.id;
      showMessage("Editing application.");

      form.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
      if (!confirm(`Delete application at ${app.companyName}?`)) {
        return;
      }

      applications = applications.filter(
        item => item.id !== app.id
      );

      if (saveApplications()) {
        renderApplications();
        showMessage("Application deleted successfully.");
      }
    });

    actions.append(editButton, deleteButton);
    card.append(details, actions);
    applicationsList.appendChild(card);
  });

  updateDashboard();
}

if (form) {
  form.addEventListener("submit", event => {
    event.preventDefault();
    setMaximumApplicationDate();

    const companyName =
      document.getElementById("companyName").value.trim();

    const jobRole =
      document.getElementById("jobRole").value.trim();

    const applicationDate = applicationDateInput.value;
    const status = document.getElementById("status").value;

    if (!companyName || !jobRole || !applicationDate || !status) {
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
          ? {
              ...app,
              companyName,
              jobRole,
              applicationDate,
              status
            }
          : app
      );

      editingId = null;
    } else {
      applications.push({
        id: Date.now(),
        companyName,
        jobRole,
        applicationDate,
        status
      });
    }

    if (saveApplications()) {
      form.reset();
      setMaximumApplicationDate();
      renderApplications();
      showMessage("Application saved successfully.");
    }
  });
} else {
  console.error('Missing element: id="applicationForm"');
}

searchInput?.addEventListener("input", renderApplications);
filterStatus?.addEventListener("change", renderApplications);
sortDate?.addEventListener("change", renderApplications);

window.addEventListener("storage", event => {
  if (event.key === STORAGE_KEY) {
    loadApplications();
    renderApplications();
  }
});

loadApplications();
setMaximumApplicationDate();
renderApplications();
