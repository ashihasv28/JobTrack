
const API_URL = "/api/applications";

const form = document.getElementById("applicationForm");
const applicationsList = document.getElementById("applicationsList");
const message = document.getElementById("message");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const sortDate = document.getElementById("sortDate");
const applicationDateInput = document.getElementById("applicationDate");

// Set today's date as the maximum application date
function setMaximumApplicationDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    applicationDateInput.max = `${year}-${month}-${day}`;
}

setMaximumApplicationDate();

// Update dashboard and display applications
async function loadApplications() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load applications");
        }

        const applications = await response.json();

        // Dashboard counts
        document.getElementById("totalCount").textContent =
            applications.length;

        document.getElementById("interviewCount").textContent =
            applications.filter(app => app.status === "Interview").length;

        document.getElementById("selectedCount").textContent =
            applications.filter(app => app.status === "Selected").length;

        document.getElementById("rejectedCount").textContent =
            applications.filter(app => app.status === "Rejected").length;

        // Search and status filter
        const searchText = searchInput.value.toLowerCase().trim();
        const selectedStatus = filterStatus.value;

        const filteredApplications = applications.filter(application => {
            const companyName =
                (application.companyName || "").toLowerCase();

            const jobRole =
                (application.jobRole || "").toLowerCase();

            const matchesSearch =
                companyName.includes(searchText) ||
                jobRole.includes(searchText);

            const matchesStatus =
                selectedStatus === "All" ||
                application.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        // Date sorting
        filteredApplications.sort((a, b) => {
            const dateA = a.applicationDate || "";
            const dateB = b.applicationDate || "";

            if (sortDate.value === "oldest") {
                return dateA.localeCompare(dateB);
            }

            return dateB.localeCompare(dateA);
        });

        // Clear previous cards
        applicationsList.innerHTML = "";

        if (filteredApplications.length === 0) {
            applicationsList.textContent =
                applications.length === 0
                    ? "No applications yet. Add your first one!"
                    : "No matching applications found.";
            return;
        }

        // Create application cards
        filteredApplications.forEach(application => {
            const card = document.createElement("div");
            card.className = "application-card";

            const company = document.createElement("h3");
            company.textContent = application.companyName;

            const role = document.createElement("p");
            role.textContent = "Role: " + application.jobRole;

            const date = document.createElement("p");
            date.textContent =
                "Applied on: " + application.applicationDate;

            const status = document.createElement("span");
            status.className =
                "status " + application.status.toLowerCase();
            status.textContent = application.status;

            // Edit button
            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.className = "edit-button";

            editButton.addEventListener("click", () => {
                document.getElementById("companyName").value =
                    application.companyName;

                document.getElementById("jobRole").value =
                    application.jobRole;

                applicationDateInput.value =
                    application.applicationDate;

                document.getElementById("status").value =
                    application.status;

                form.dataset.editId = application.id;

                form.querySelector("button[type='submit']").textContent =
                    "Update Application";

                message.textContent = "Editing application...";
                message.style.color = "#4f46e5";

                document.getElementById("companyName").focus();
            });

            // Delete button
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-button";

            deleteButton.addEventListener("click", () => {
                deleteApplication(application.id);
            });

            card.append(
                company,
                role,
                date,
                status,
                editButton,
                deleteButton
            );

            applicationsList.appendChild(card);
        });

    } catch (error) {
        applicationsList.textContent =
            "Could not load applications. Please check the backend.";

        console.error("Loading error:", error);
    }
}

// Add or update an application
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const companyName =
        document.getElementById("companyName").value.trim();

    const jobRole =
        document.getElementById("jobRole").value.trim();

    const applicationDate = applicationDateInput.value;
    const status = document.getElementById("status").value;

    // Validate required fields
    if (!companyName || !jobRole || !applicationDate) {
        message.textContent = "Please fill in all required fields.";
        message.style.color = "red";
        return;
    }

    // Validate application date
    setMaximumApplicationDate();

    const today = applicationDateInput.max;

    if (applicationDate > today) {
        message.textContent =
            "Application date cannot be in the future.";

        message.style.color = "red";
        return;
    }

    const application = {
        companyName,
        jobRole,
        applicationDate,
        status
    };

    const editId = form.dataset.editId;

    try {
        const response = await fetch(
            editId ? `${API_URL}/${editId}` : API_URL,
            {
                method: editId ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(application)
            }
        );

        if (!response.ok) {
            throw new Error("Failed to save application");
        }

        form.reset();
        delete form.dataset.editId;

        form.querySelector("button[type='submit']").textContent =
            "Add Application";

        message.textContent = editId
            ? "Application updated successfully!"
            : "Application added successfully!";

        message.style.color = "green";

        await loadApplications();

    } catch (error) {
        message.textContent =
            "Could not save application. Please try again.";

        message.style.color = "red";
        console.error("Saving error:", error);
    }
});

// Delete an application
async function deleteApplication(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this application?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Failed to delete application");
        }

        message.textContent = "Application deleted successfully!";
        message.style.color = "green";

        await loadApplications();

    } catch (error) {
        message.textContent = "Could not delete application.";
        message.style.color = "red";
        console.error("Deletion error:", error);
    }
}

// Search, filter, and sorting listeners
searchInput.addEventListener("input", loadApplications);
filterStatus.addEventListener("change", loadApplications);
sortDate.addEventListener("change", loadApplications);

// Load applications on page startup
loadApplications();
