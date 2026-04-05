const API_BASE = "https://raw-agentofgod.pythonanywhere.com";
const AUTH_STORAGE_KEY = "rawWebAuthToken";
const ROUTE_STORAGE_KEY = "rawWebCurrentRoute";
const PROJECT_STORAGE_KEY = "rawWebSelectedProjectId";
const DELIVERABLE_STORAGE_KEY = "rawWebSelectedDeliverableId";
const FORM_DRAFT_PREFIX = "rawWebDraft:";

const app = document.querySelector("#app");

const ROUTES = [
  { key: "Homepage", label: "Home", summary: "Welcome back and jump into the project space." },
  { key: "ProjectHomepage", label: "Project Hub", summary: "Project tools arranged the way the app groups them." },
  { key: "ManageProjects", label: "Manage Projects", summary: "Create projects and manage deliverables." },
  { key: "Projects", label: "Our Projects", summary: "Browse the current project list." },
  { key: "ProjectDetails", label: "Project Details", summary: "Open one project and see its full picture." },
  { key: "ProjectDeliverables", label: "Project Deliverables", summary: "See the work connected to a project." },
  { key: "ProjectTeam", label: "Project Team", summary: "See who is involved and what they are carrying." },
  { key: "MyDeliverables", label: "My Assignments", summary: "Review the deliverables connected to your account." },
  { key: "ProjectMessages", label: "Project Messages", summary: "Read and add conversation around project work." },
  { key: "Settings", label: "Settings", summary: "Keep this web companion in step with your account." },
];

const PROJECT_HUB_CARDS = [
  { route: "Projects", title: "RAW Projects", detail: "Browse projects and open one to see details.", roles: ["Public Community"] },
  { route: "ProjectTeam", title: "Participation Hub", detail: "See who is involved and what is moving.", roles: ["Partners"] },
  { route: "MyDeliverables", title: "My Deliverables", detail: "Review your assignments and stay on track.", roles: ["Project Team"] },
  { route: "ProjectMessages", title: "Project Messages", detail: "Keep up with notes and conversation.", roles: ["Project Team", "Project Team Admin"] },
  { route: "ProjectDetails", title: "Project Details", detail: "Choose one project and view its full breakdown.", roles: ["Public Community"] },
  { route: "ProjectDeliverables", title: "Deliverables", detail: "Open the project work list for a chosen project.", roles: ["Public Community"] },
  { route: "ManageProjects", title: "Manage Projects", detail: "Create projects, add deliverables, update deliverables, and remove projects.", roles: ["Project Team Admin", "Tech and Faith Admin"] },
];

const PROJECT_TYPE_OPTIONS = ["Relationship", "Evangelism", "Discipleship"];
const COLOR_OPTIONS = ["#00FF00", "#0000FF", "#FFFF00", "#FFA500", "#800080", "#FFC0CB", "#A52A2A", "#FFFFFF", "#808080", "#00FFFF", "#800000", "#008000", "#000080"];
const COLOR_LABELS = {
  "#00FF00": "Green",
  "#0000FF": "Blue",
  "#FFFF00": "Yellow",
  "#FFA500": "Orange",
  "#800080": "Purple",
  "#FFC0CB": "Pink",
  "#A52A2A": "Brown",
  "#FFFFFF": "White",
  "#808080": "Grey",
  "#00FFFF": "Cyan",
  "#800000": "Maroon",
  "#008000": "Dark Green",
  "#000080": "Navy",
};

const state = {
  route: localStorage.getItem(ROUTE_STORAGE_KEY) || "Homepage",
  auth: loadAuth(),
  profile: loadAuth(),
  message: null,
  projects: [],
  projectsLoaded: false,
  selectedProjectId: localStorage.getItem(PROJECT_STORAGE_KEY) || "",
  selectedDeliverableId: localStorage.getItem(DELIVERABLE_STORAGE_KEY) || "",
  projectDeliverables: {},
  projectStakeholders: {},
  stakeholderWork: {},
  myDeliverables: [],
  commentsByDeliverable: {},
  sendingComment: false,
  people: [],
  managerProjectDraft: {
    projectName: "",
    projectType: "Relationship",
    projectColor: "#00FF00",
    startDate: "",
    dueDate: "",
    shortDescription: "",
    longDescription: "",
    image: "",
  },
  managerCreateDeliverable: {
    name: "",
    details: "",
    startDate: "",
    endDate: "",
    owner: "",
    secondaryOwner: "",
    color: "#00FF00",
  },
  managerSelectedDeliverableId: "",
  managerEditDeliverable: {
    name: "",
    detail: "",
    startDate: "",
    endDate: "",
    owner: "",
    secondaryOwner: "",
    color: "#00FF00",
  },
};

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && currentUsername()) {
    verifyStoredSession(false);
  }
});

window.addEventListener("focus", () => {
  if (currentUsername()) {
    verifyStoredSession(false);
  }
});

render();
verifyStoredSession(false);

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveAuth(payload) {
  if (!payload) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    state.auth = null;
    state.profile = null;
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  state.auth = payload;
  state.profile = payload;
}

function currentUsername() {
  return String(state.profile?.username || state.auth?.username || "").trim();
}

function currentRoles() {
  return Array.isArray(state.profile?.profile_access) ? state.profile.profile_access : [];
}

function hasRole(expected) {
  return currentRoles().some((role) => String(role || "").toLowerCase() === String(expected || "").toLowerCase());
}

function hasAnyRole(list = []) {
  if (!list.length) return true;
  return list.some((role) => hasRole(role));
}

function isProfileSetupComplete(payload) {
  if (!payload) return false;
  if (payload.profile_setup_complete !== undefined) {
    return payload.profile_setup_complete === true || payload.profile_setup_complete === "true";
  }
  return Boolean(
    String(payload.first_name || "").trim() &&
    String(payload.last_name || "").trim() &&
    String(payload.email || "").trim()
  );
}

async function apiRequest(method, path, { body, params } = {}) {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), options);
  const text = await response.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const error = new Error("Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function verifyStoredSession(showSuccess = false) {
  const auth = loadAuth();
  if (!auth?.username) {
    saveAuth(null);
    render();
    return;
  }

  if (auth.active === false || auth.active === "false") {
    logout("This account is not available right now, so you've been signed out here.");
    return;
  }

  try {
    const response = await apiRequest("POST", "/user_profile", { body: { username: auth.username } });
    const profile = Array.isArray(response) ? response[0] : response;

    if (!profile || profile.active === false || profile.active === "false") {
      logout("This account is not available right now, so you've been signed out here.");
      return;
    }

    const merged = {
      ...auth,
      ...profile,
      profile_access: Array.isArray(profile.profile_access)
        ? profile.profile_access.map((item) => typeof item === "string" ? item : item?.name).filter(Boolean)
        : Array.isArray(auth.profile_access)
          ? auth.profile_access
          : [],
    };
    saveAuth(merged);
    await ensureBaseData();
    if (showSuccess) {
      flash("You're up to date and ready to continue.", "success");
    }
  } catch (error) {
    if (error.status >= 400 && error.status < 500) {
      logout("We couldn't confirm this saved sign-in, so you were signed out here.");
      return;
    }
  }

  render();
}

async function ensureBaseData() {
  await Promise.all([
    loadProjects(),
    loadMyDeliverables().catch(() => {}),
    loadPeople().catch(() => {}),
  ]);
}

async function loadProjects() {
  const data = await apiRequest("POST", "/project_info", { body: { infoType: "project" } });
  state.projects = Array.isArray(data) ? data : [];
  state.projectsLoaded = true;

  if (!state.selectedProjectId && state.projects.length) {
    state.selectedProjectId = String(state.projects[0].id);
    localStorage.setItem(PROJECT_STORAGE_KEY, state.selectedProjectId);
  }
}

async function loadProjectDeliverables(projectId) {
  if (!projectId) return [];
  if (state.projectDeliverables[projectId]) return state.projectDeliverables[projectId];
  const data = await apiRequest("POST", "/project_info", {
    body: { projectId: Number(projectId), infoType: "deliverables" },
  });
  state.projectDeliverables[projectId] = Array.isArray(data) ? data : [];
  return state.projectDeliverables[projectId];
}

async function loadProjectStakeholders(projectId) {
  if (!projectId) return [];
  if (state.projectStakeholders[projectId]) return state.projectStakeholders[projectId];
  const data = await apiRequest("POST", "/project_info", {
    body: { projectId: Number(projectId), infoType: "stakeholders" },
  });
  state.projectStakeholders[projectId] = Array.isArray(data) ? data : [];
  return state.projectStakeholders[projectId];
}

async function loadStakeholderWork(projectId, stakeholder) {
  const key = stakeholderCacheKey(projectId, stakeholder);
  if (state.stakeholderWork[key]) return state.stakeholderWork[key];
  const apiPostData = {
    stakeholderFirstName: stakeholder.projectStakeholders__first_name,
    stakeholderLastName: stakeholder.projectStakeholders__last_name,
    project_id: Number(projectId),
    setView: "stakeholder",
  };
  const response = await apiRequest("POST", "/project_details", { body: { apiPostData } });
  state.stakeholderWork[key] = Array.isArray(response) ? response : [];
  return state.stakeholderWork[key];
}

async function loadMyDeliverables() {
  if (!currentUsername()) {
    state.myDeliverables = [];
    return [];
  }
  const data = await apiRequest("POST", "/my_deliverables", {
    body: { username: currentUsername(), infoType: "delvierables" },
  });
  state.myDeliverables = Array.isArray(data) ? data : [];
  return state.myDeliverables;
}

async function loadPeople() {
  const data = await apiRequest("POST", "/propose_project", {
    body: { setView: "getUserProfile" },
  });
  state.people = Array.isArray(data) ? data : [];
  if (!state.managerCreateDeliverable.owner && currentUsername()) {
    state.managerCreateDeliverable.owner = currentUsername();
  }
  return state.people;
}

async function loadComments(deliverableId) {
  if (!deliverableId) return [];
  const response = await apiRequest("POST", "/deliverable_comments", {
    body: { deliverableId: Number(deliverableId) },
  });
  const comments = response === "noComment" ? [] : Array.isArray(response?.comments) ? response.comments : [];
  state.commentsByDeliverable[deliverableId] = comments;
  return comments;
}

async function postComment(deliverable, commentText) {
  const timestamp = new Date().toLocaleString();
  await apiRequest("POST", "/new_note", {
    body: {
      deliverableId: deliverable.id,
      notes: commentText,
      timestamp,
      username: currentUsername(),
    },
  });
  await loadComments(deliverable.id);
}

function stakeholderCacheKey(projectId, stakeholder) {
  return `${projectId}:${stakeholder.projectStakeholders__first_name}:${stakeholder.projectStakeholders__last_name}`;
}

function flash(text, tone = "info") {
  state.message = { text, tone };
}

function clearFlash() {
  state.message = null;
}

function logout(message = "Signed out.") {
  saveAuth(null);
  state.route = "Homepage";
  state.selectedProjectId = "";
  state.selectedDeliverableId = "";
  state.projects = [];
  state.projectDeliverables = {};
  state.projectStakeholders = {};
  state.stakeholderWork = {};
  state.myDeliverables = [];
  state.commentsByDeliverable = {};
  localStorage.removeItem(PROJECT_STORAGE_KEY);
  localStorage.removeItem(DELIVERABLE_STORAGE_KEY);
  flash(message, "info");
  render();
}

function setRoute(route) {
  state.route = route;
  localStorage.setItem(ROUTE_STORAGE_KEY, route);
  render();
}

function setSelectedProject(projectId) {
  state.selectedProjectId = String(projectId || "");
  localStorage.setItem(PROJECT_STORAGE_KEY, state.selectedProjectId);
  state.selectedDeliverableId = "";
  localStorage.removeItem(DELIVERABLE_STORAGE_KEY);
  render();
}

function setSelectedDeliverable(deliverableId) {
  state.selectedDeliverableId = String(deliverableId || "");
  localStorage.setItem(DELIVERABLE_STORAGE_KEY, state.selectedDeliverableId);
  render();
}

function setManagerSelectedDeliverable(deliverableId) {
  state.managerSelectedDeliverableId = String(deliverableId || "");
  const deliverable = (state.projectDeliverables[state.selectedProjectId] || []).find((item) => String(item.id) === String(deliverableId));
  if (deliverable) {
    state.managerEditDeliverable = {
      name: deliverable.deliverableName || "",
      detail: deliverable.deliverableDetails || "",
      startDate: deliverable.deliverableStartDate || "",
      endDate: deliverable.deliverableEndDate || "",
      owner: String(deliverable.deliverableOwnerUsername || deliverable.deliverableOwner || ""),
      secondaryOwner: String(deliverable.deliverableSecondaryOwnerUsername || deliverable.deliverableSecondaryOwner || ""),
      color: deliverable.deliverableColor || "#00FF00",
    };
  }
  render();
}

function getSelectedProject() {
  return state.projects.find((item) => String(item.id) === String(state.selectedProjectId)) || null;
}

function getSelectedDeliverable() {
  const projectDeliverables = state.projectDeliverables[state.selectedProjectId] || [];
  const ownDeliverables = state.myDeliverables || [];
  return (
    projectDeliverables.find((item) => String(item.id) === String(state.selectedDeliverableId)) ||
    ownDeliverables.find((item) => String(item.id) === String(state.selectedDeliverableId)) ||
    null
  );
}

function render() {
  ensureValidRoute();
  app.innerHTML = state.auth ? renderApp() : renderAuth();
  attachEvents();
}

function ensureValidRoute() {
  const allowed = new Set(ROUTES.map((item) => item.key));
  if (!allowed.has(state.route)) {
    state.route = "Homepage";
    localStorage.setItem(ROUTE_STORAGE_KEY, "Homepage");
  }
}

function renderAuth() {
  const needsProfileSetup = state.auth && !isProfileSetupComplete(state.auth);
  return `
    <div class="auth-shell">
      <section class="auth-showcase">
        <div>
          <div class="hero-badge">RAW App Companion</div>
          <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: clamp(2.5rem, 4vw, 4.2rem); margin: 20px 0 12px;">A welcoming wide-screen version of the RAW app.</h2>
          <p style="max-width: 620px; color: #d5deea; line-height: 1.8;">
            This project workspace is built to feel familiar to app users while giving everything more room on the web.
            For account creation or password help, please use the app.
          </p>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:center;align-items:center;min-height:320px;">
            <img src="./assets/rawlogoblack-square-1024.png" alt="RAW logo" style="width:min(340px,82%);height:auto;border-radius:34px;background:#fff;padding:20px;box-shadow:0 22px 45px rgba(0,0,0,.28);">
          </div>
        </div>
      </section>
      <section class="auth-panel">
        <div class="auth-card">
          <img src="./assets/rawlogoblack-square-1024.png" alt="RAW logo" style="width:72px;height:72px;border-radius:18px;background:#fff;display:block;margin-bottom:18px;">
          <h2 style="margin:0 0 10px;font-family:'Space Grotesk',sans-serif;">RAW Web</h2>
          <p class="micro">Sign in with your existing RAW account to continue into the project workspace.</p>
          ${renderMessage()}
          ${needsProfileSetup ? renderProfileSetupForm() : renderLoginForm()}
          <div class="message info" style="margin-top:18px;">Need to create an account or reset your password? Please open the RAW app for that part.</div>
        </div>
      </section>
    </div>
  `;
}

function renderLoginForm() {
  return `
    <form id="login-form" data-draft-key="login-form">
      <div class="field-group">
        <label for="login-username">Username or email</label>
        <input id="login-username" name="username" autocomplete="username">
      </div>
      <div class="field-group">
        <label for="login-password">Password</label>
        <input id="login-password" name="password" type="password" autocomplete="current-password">
      </div>
      <button class="button" type="submit">Sign In</button>
    </form>
  `;
}

function renderProfileSetupForm() {
  return `
    <div class="message warn">Your account is almost ready. Please fill in these last details before continuing.</div>
    <form id="profile-setup-form" data-draft-key="profile-setup-form">
      <div class="form-grid">
        <div class="field-group">
          <label for="profile-first-name">First name</label>
          <input id="profile-first-name" name="first_name" value="${escapeHtml(state.auth?.first_name || "")}">
        </div>
        <div class="field-group">
          <label for="profile-last-name">Last name</label>
          <input id="profile-last-name" name="last_name" value="${escapeHtml(state.auth?.last_name || "")}">
        </div>
      </div>
      <div class="form-grid">
        <div class="field-group">
          <label for="profile-email">Email</label>
          <input id="profile-email" name="email" type="email" value="${escapeHtml(state.auth?.email || "")}">
        </div>
        <div class="field-group">
          <label for="profile-phone">Phone</label>
          <input id="profile-phone" name="phone_number" value="${escapeHtml(state.auth?.phone_number || "")}">
        </div>
      </div>
      <button class="button" type="submit">Save & Continue</button>
      <button class="ghost-button" type="button" data-action="clear-draft" data-draft-key="profile-setup-form" style="margin-left:10px;">Clear Saved Draft</button>
      <button class="ghost-button" type="button" data-action="cancel-profile-setup" style="margin-left:10px;">Back to Sign In</button>
    </form>
  `;
}

function renderApp() {
  return `
    <div class="banner">
      <div class="wrap">
        <div class="banner-top">
          <div class="brand">
            <img src="./assets/rawlogoblack-square-1024.png" alt="RAW logo">
            <div>
              <span class="badge-brand">RAW • Project Workspace</span>
              <h1>RAW Web</h1>
              <p>${escapeHtml(currentUsername() || "Welcome back")}</p>
            </div>
          </div>
          <div class="header-controls">
            <button class="ghost-button" data-action="verify-session">Refresh My Access</button>
            <button class="danger-button" data-action="logout">Logout</button>
          </div>
        </div>
        <div class="banner-copy">
          <h2>${currentRouteMeta().label}</h2>
          <p>${currentRouteDescription()}</p>
        </div>
        <div class="top-nav">
          ${ROUTES.map((item) => `
            <button class="top-nav-button ${state.route === item.key ? "active" : ""}" data-route="${item.key}">
              ${item.label}
            </button>
          `).join("")}
        </div>
      </div>
    </div>
    <main class="main">
      <div class="wrap">
        ${renderMessage()}
        ${renderCurrentPage()}
      </div>
    </main>
  `;
}

function currentRouteMeta() {
  return ROUTES.find((item) => item.key === state.route) || ROUTES[0];
}

function currentRouteDescription() {
  const descriptions = {
    Homepage: "A calm place to jump back into the project work you already know from the app.",
    ProjectHomepage: "The project hub from the app, arranged for a wider screen.",
    ManageProjects: "Create projects and manage deliverables from one place.",
    Projects: "Browse the current project list and open any project for more detail.",
    ProjectDetails: "Choose one project and see its dates, description, deliverables, and people.",
    ProjectDeliverables: "Choose a project to see all of the work connected to it.",
    ProjectTeam: "Choose a project and see the people connected to the work.",
    MyDeliverables: "Review the deliverables attached to your account.",
    ProjectMessages: "Stay close to the conversation around project work.",
    Settings: "Keep this web workspace connected to the right account details.",
  };
  return descriptions[state.route] || "";
}

function renderCurrentPage() {
  switch (state.route) {
    case "Homepage":
      return renderHomepage();
    case "ProjectHomepage":
      return renderProjectHomepage();
    case "ManageProjects":
      return renderManageProjectsPage();
    case "Projects":
      return renderProjectsPage();
    case "ProjectDetails":
      return renderProjectDetailsPage();
    case "ProjectDeliverables":
      return renderProjectDeliverablesPage();
    case "ProjectTeam":
      return renderProjectTeamPage();
    case "MyDeliverables":
      return renderMyDeliverablesPage();
    case "ProjectMessages":
      return renderProjectMessagesPage();
    case "Settings":
      return renderSettingsPage();
    default:
      return renderHomepage();
  }
}

function renderHomepage() {
  const projects = state.projects.slice(0, 6);
  return `
    <section class="page-grid">
      <div class="card span-7">
        <h3>Welcome Back</h3>
        <p>This project-focused web companion gives you a wider view of the same project space you use in the app.</p>
        <div class="inline-meta">
          <span class="pill">Signed in as ${escapeHtml(currentUsername())}</span>
          <span class="pill">${state.projects.length} project${state.projects.length === 1 ? "" : "s"} available</span>
        </div>
      </div>
      <div class="card span-5">
        <h3>Quick Launch</h3>
        <div class="feature-grid">
          ${["ProjectHomepage", "ManageProjects", "Projects", "ProjectDetails", "ProjectDeliverables", "ProjectTeam", "MyDeliverables", "ProjectMessages"].map((route) => `
            <button class="nav-button" data-route="${route}">
              <strong>${routeLabel(route)}</strong>
              <span>Open this part of the workspace</span>
            </button>
          `).join("")}
        </div>
      </div>
      <div class="card span-12">
        <h3>Projects In View</h3>
        ${projects.length ? `
          <div class="project-grid">
            ${projects.map(renderProjectCard).join("")}
          </div>
        ` : `<div class="empty">Loading the project list now.</div>`}
      </div>
    </section>
  `;
}

function renderProjectHomepage() {
  const cards = PROJECT_HUB_CARDS.filter((item) => hasAnyRole(item.roles));
  return `
    <section class="page-grid">
      <div class="card span-12">
        <h3>Project Workspace</h3>
        <p>Build, assign, and move through project work in a layout that feels close to the app, just with more room.</p>
      </div>
      <div class="card span-12">
        <div class="hub-grid">
          ${cards.map((item) => `
            <button class="hub-card" data-route="${item.route}">
              <strong>${item.title}</strong>
              <span>${item.detail}</span>
            </button>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderManageProjectsPage() {
  const canManage = hasAnyRole(["Project Team Admin", "Tech and Faith Admin"]);
  const deliverables = state.projectDeliverables[state.selectedProjectId] || [];

  if (!canManage) {
    return `
      <section class="page-grid">
        <div class="card span-12">
          <h3>Manage Projects</h3>
          <div class="empty">This area is available to project admins in the app.</div>
        </div>
      </section>
    `;
  }

  return `
    <section class="page-grid">
      <div class="card span-6">
        <h3>Create A Project</h3>
        <p>Start a new project and add its first deliverable.</p>
        <form id="create-project-form" data-draft-key="create-project-form">
          <div class="field-group">
            <label for="mgr-project-name">Project name</label>
            <input id="mgr-project-name" name="projectName" value="${escapeHtml(state.managerProjectDraft.projectName)}">
          </div>
          <div class="form-grid">
            <div class="field-group">
              <label for="mgr-project-type">Project type</label>
              <select id="mgr-project-type" name="projectType">
                ${PROJECT_TYPE_OPTIONS.map((item) => `<option value="${item}" ${state.managerProjectDraft.projectType === item ? "selected" : ""}>${item}</option>`).join("")}
              </select>
            </div>
            <div class="field-group">
              <label for="mgr-project-color">Project color</label>
              <select id="mgr-project-color" name="projectColor">
                ${COLOR_OPTIONS.map((item) => `<option value="${item}" ${state.managerProjectDraft.projectColor === item ? "selected" : ""}>${escapeHtml(colorLabel(item))}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-grid">
            <div class="field-group">
              <label for="mgr-start-date">Start date</label>
              <input id="mgr-start-date" name="startDate" type="date" value="${escapeHtml(toDateInputValue(state.managerProjectDraft.startDate))}">
            </div>
            <div class="field-group">
              <label for="mgr-due-date">Due date</label>
              <input id="mgr-due-date" name="dueDate" type="date" value="${escapeHtml(toDateInputValue(state.managerProjectDraft.dueDate))}">
            </div>
          </div>
          <div class="field-group">
            <label for="mgr-short-description">Short description</label>
            <textarea id="mgr-short-description" name="shortDescription" rows="3">${escapeHtml(state.managerProjectDraft.shortDescription)}</textarea>
          </div>
          <div class="field-group">
            <label for="mgr-long-description">Long description</label>
            <textarea id="mgr-long-description" name="longDescription" rows="5">${escapeHtml(state.managerProjectDraft.longDescription)}</textarea>
          </div>
          <div class="field-group">
            <label for="mgr-image">Image URL</label>
            <input id="mgr-image" name="image" value="${escapeHtml(state.managerProjectDraft.image)}">
          </div>
          <h4 style="margin-top:18px;">First Deliverable</h4>
          <div class="field-group">
            <label for="mgr-deliverable-name">Deliverable name</label>
            <input id="mgr-deliverable-name" name="deliverableName" value="${escapeHtml(state.managerCreateDeliverable.name)}">
          </div>
          <div class="field-group">
            <label for="mgr-deliverable-details">Deliverable details</label>
            <textarea id="mgr-deliverable-details" name="deliverableDetails" rows="4">${escapeHtml(state.managerCreateDeliverable.details)}</textarea>
          </div>
          <div class="form-grid">
            <div class="field-group">
              <label for="mgr-deliverable-start">Start date</label>
              <input id="mgr-deliverable-start" name="deliverableStartDate" type="date" value="${escapeHtml(toDateInputValue(state.managerCreateDeliverable.startDate))}">
            </div>
            <div class="field-group">
              <label for="mgr-deliverable-end">End date</label>
              <input id="mgr-deliverable-end" name="deliverableEndDate" type="date" value="${escapeHtml(toDateInputValue(state.managerCreateDeliverable.endDate))}">
            </div>
          </div>
          <div class="form-grid">
            <div class="field-group">
              <label for="mgr-deliverable-owner">Primary support</label>
              <select id="mgr-deliverable-owner" name="deliverableOwner">
                <option value="">Select primary support</option>
                ${state.people.map((person) => `<option value="${escapeHtml(person.username)}" ${state.managerCreateDeliverable.owner === person.username ? "selected" : ""}>${escapeHtml(`${person.first_name || ""} ${person.last_name || ""}`.trim() || person.username)}</option>`).join("")}
              </select>
            </div>
            <div class="field-group">
              <label for="mgr-deliverable-secondary-owner">Secondary support (optional)</label>
              <select id="mgr-deliverable-secondary-owner" name="deliverableSecondaryOwner">
                <option value="">Select secondary support</option>
                ${state.people.map((person) => `<option value="${escapeHtml(person.username)}" ${state.managerCreateDeliverable.secondaryOwner === person.username ? "selected" : ""}>${escapeHtml(`${person.first_name || ""} ${person.last_name || ""}`.trim() || person.username)}</option>`).join("")}
              </select>
            </div>
            <div class="field-group">
              <label for="mgr-deliverable-color">Deliverable color</label>
              <select id="mgr-deliverable-color" name="deliverableColor">
                ${COLOR_OPTIONS.map((item) => `<option value="${item}" ${state.managerCreateDeliverable.color === item ? "selected" : ""}>${escapeHtml(colorLabel(item))}</option>`).join("")}
              </select>
            </div>
          </div>
          <button class="button" type="submit">Create Project</button>
          <button class="ghost-button" type="button" data-action="clear-draft" data-draft-key="create-project-form" style="margin-left:10px;">Clear Saved Draft</button>
        </form>
      </div>

      <div class="card span-6">
        <h3>Manage Deliverables</h3>
        <p>Select a project, add a new deliverable, or update an existing one.</p>
        ${renderProjectPicker()}
        <form id="add-deliverable-form" data-draft-key="add-deliverable-form" style="margin-top:16px;">
          <h4>Add Deliverable</h4>
          <div class="field-group">
            <label for="add-deliverable-name">Deliverable name</label>
            <input id="add-deliverable-name" name="name" value="${escapeHtml(state.managerCreateDeliverable.name)}">
          </div>
          <div class="field-group">
            <label for="add-deliverable-details">Details</label>
            <textarea id="add-deliverable-details" name="details" rows="4">${escapeHtml(state.managerCreateDeliverable.details)}</textarea>
          </div>
          <div class="form-grid">
            <div class="field-group">
              <label for="add-deliverable-start">Start date</label>
              <input id="add-deliverable-start" name="startDate" type="date" value="${escapeHtml(toDateInputValue(state.managerCreateDeliverable.startDate))}">
            </div>
            <div class="field-group">
              <label for="add-deliverable-end">End date</label>
              <input id="add-deliverable-end" name="endDate" type="date" value="${escapeHtml(toDateInputValue(state.managerCreateDeliverable.endDate))}">
            </div>
          </div>
          <div class="form-grid">
            <div class="field-group">
              <label for="add-deliverable-owner">Primary support</label>
              <select id="add-deliverable-owner" name="owner">
                <option value="">Select primary support</option>
                ${state.people.map((person) => `<option value="${escapeHtml(person.username)}" ${state.managerCreateDeliverable.owner === person.username ? "selected" : ""}>${escapeHtml(`${person.first_name || ""} ${person.last_name || ""}`.trim() || person.username)}</option>`).join("")}
              </select>
            </div>
            <div class="field-group">
              <label for="add-deliverable-secondary-owner">Secondary support (optional)</label>
              <select id="add-deliverable-secondary-owner" name="secondaryOwner">
                <option value="">Select secondary support</option>
                ${state.people.map((person) => `<option value="${escapeHtml(person.username)}" ${state.managerCreateDeliverable.secondaryOwner === person.username ? "selected" : ""}>${escapeHtml(`${person.first_name || ""} ${person.last_name || ""}`.trim() || person.username)}</option>`).join("")}
              </select>
            </div>
            <div class="field-group">
              <label for="add-deliverable-color-2">Color</label>
              <select id="add-deliverable-color-2" name="color">
                ${COLOR_OPTIONS.map((item) => `<option value="${item}" ${state.managerCreateDeliverable.color === item ? "selected" : ""}>${escapeHtml(colorLabel(item))}</option>`).join("")}
              </select>
            </div>
          </div>
          <button class="button" type="submit">Add Deliverable</button>
          <button class="ghost-button" type="button" data-action="clear-draft" data-draft-key="add-deliverable-form" style="margin-left:10px;">Clear Saved Draft</button>
        </form>

        <div style="margin-top:20px;">
          <div class="field-group">
            <label for="manage-deliverable-select">Choose a deliverable</label>
            <select id="manage-deliverable-select">
              <option value="">Select a deliverable</option>
              ${deliverables.map((item) => `<option value="${escapeHtml(String(item.id))}" ${String(item.id) === String(state.managerSelectedDeliverableId) ? "selected" : ""}>${escapeHtml(item.deliverableName)}</option>`).join("")}
            </select>
          </div>
          <form id="edit-deliverable-form" data-draft-key="edit-deliverable-form:${escapeHtml(String(state.managerSelectedDeliverableId || "default"))}">
            <div class="field-group">
              <label for="edit-deliverable-name">Deliverable name</label>
              <input id="edit-deliverable-name" name="name" value="${escapeHtml(state.managerEditDeliverable.name)}">
            </div>
            <div class="field-group">
              <label for="edit-deliverable-detail">Details</label>
              <textarea id="edit-deliverable-detail" name="detail" rows="4">${escapeHtml(state.managerEditDeliverable.detail)}</textarea>
            </div>
            <div class="form-grid">
              <div class="field-group">
                <label for="edit-deliverable-start">Start date</label>
                <input id="edit-deliverable-start" name="startDate" type="date" value="${escapeHtml(toDateInputValue(state.managerEditDeliverable.startDate))}">
              </div>
              <div class="field-group">
                <label for="edit-deliverable-end">End date</label>
                <input id="edit-deliverable-end" name="endDate" type="date" value="${escapeHtml(toDateInputValue(state.managerEditDeliverable.endDate))}">
              </div>
            </div>
            <div class="form-grid">
              <div class="field-group">
                <label for="edit-deliverable-owner">Primary support</label>
                <select id="edit-deliverable-owner" name="owner">
                  <option value="">Select primary support</option>
                  ${state.people.map((person) => `<option value="${escapeHtml(person.username)}" ${state.managerEditDeliverable.owner === person.username ? "selected" : ""}>${escapeHtml(`${person.first_name || ""} ${person.last_name || ""}`.trim() || person.username)}</option>`).join("")}
                </select>
              </div>
              <div class="field-group">
                <label for="edit-deliverable-secondary-owner">Secondary support (optional)</label>
                <select id="edit-deliverable-secondary-owner" name="secondaryOwner">
                  <option value="">Select secondary support</option>
                  ${state.people.map((person) => `<option value="${escapeHtml(person.username)}" ${state.managerEditDeliverable.secondaryOwner === person.username ? "selected" : ""}>${escapeHtml(`${person.first_name || ""} ${person.last_name || ""}`.trim() || person.username)}</option>`).join("")}
                </select>
              </div>
            </div>
            <button class="button" type="submit" ${state.managerSelectedDeliverableId ? "" : "disabled"}>Save Deliverable Changes</button>
            <button class="ghost-button" type="button" data-action="clear-draft" data-draft-key="edit-deliverable-form:${escapeHtml(String(state.managerSelectedDeliverableId || "default"))}" style="margin-left:10px;">Clear Saved Draft</button>
          </form>
        </div>
      </div>

      <div class="card span-12">
        <h3>Remove A Project</h3>
        <p>Choose a project and remove it from the workspace.</p>
        <form id="delete-project-form" class="form-grid">
          <div class="field-group col-12 md-6">
            <label for="delete-project-select">Project</label>
            <select id="delete-project-select" name="projectId">
              <option value="">Select a project</option>
              ${state.projects.map((project) => `<option value="${escapeHtml(String(project.id))}" ${String(project.id) === String(state.selectedProjectId) ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("")}
            </select>
          </div>
          <div class="field-group col-12 md-6" style="align-self:end;">
            <button class="danger-button" type="submit">Delete Project</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function renderProjectsPage() {
  return `
    <section class="page-grid">
      <div class="card span-12">
        <h3>Our Projects</h3>
        <p>Tap a project to open its details and deliverables.</p>
      </div>
      <div class="card span-12">
        ${state.projects.length ? `<div class="project-grid">${state.projects.map(renderProjectCard).join("")}</div>` : `<div class="empty">Loading projects...</div>`}
      </div>
    </section>
  `;
}

function renderProjectDetailsPage() {
  const project = getSelectedProject();
  const deliverables = state.projectDeliverables[state.selectedProjectId] || [];
  const stakeholders = state.projectStakeholders[state.selectedProjectId] || [];

  return `
    <section class="page-grid">
      <div class="card span-12">
        <h3>Project Details</h3>
        <p>Choose a project to see the same key sections the app shows.</p>
        ${renderProjectPicker()}
      </div>
      ${project ? `
        <div class="card span-6">
          <div class="project-hero">
            <span class="project-kicker">Project Details</span>
            <h3>${escapeHtml(project.name || "Project")}</h3>
            <p>${escapeHtml(project.longDescription || project.shortDescription || "No description available yet.")}</p>
            <div class="inline-meta">
              <span class="pill">Start: ${escapeHtml(project.startDate || "TBD")}</span>
              <span class="pill">Due: ${escapeHtml(project.dueDate || "TBD")}</span>
              <span class="pill">${friendlyPhase(project.phase)}</span>
            </div>
          </div>
        </div>
        <div class="card span-6">
          <h3>Overview</h3>
          <div class="feature-grid">
            <div class="metric"><span>Project Type</span><strong>${escapeHtml(project.projectType__name || "General")}</strong></div>
            <div class="metric"><span>Health</span><strong>${friendlyHealth(project.flag)}</strong></div>
            <div class="metric"><span>Deliverables</span><strong>${deliverables.length}</strong></div>
            <div class="metric"><span>Stakeholders</span><strong>${stakeholders.length}</strong></div>
          </div>
        </div>
        <div class="card span-6">
          <div class="section-head">
            <h3>Deliverables</h3>
            <button class="ghost-button" data-route="ProjectDeliverables">Open Deliverables</button>
          </div>
          ${deliverables.length ? `<div class="stack-list">${deliverables.slice(0, 6).map(renderDeliverableListItem).join("")}</div>` : `<div class="empty">No deliverables have been added for this project yet.</div>`}
        </div>
        <div class="card span-6">
          <div class="section-head">
            <h3>Project Team</h3>
            <button class="ghost-button" data-route="ProjectTeam">Open Team</button>
          </div>
          ${stakeholders.length ? `<div class="stack-list">${stakeholders.map(renderStakeholderItem).join("")}</div>` : `<div class="empty">No stakeholders are listed for this project yet.</div>`}
        </div>
      ` : `<div class="card span-12"><div class="empty">Choose a project to continue.</div></div>`}
    </section>
  `;
}

function renderProjectDeliverablesPage() {
  const project = getSelectedProject();
  const deliverables = state.projectDeliverables[state.selectedProjectId] || [];
  const selectedDeliverable = getSelectedDeliverable();

  return `
    <section class="page-grid">
      <div class="card span-12">
        <h3>Project Deliverables</h3>
        <p>Choose a project to see the work connected to it.</p>
        ${renderProjectPicker()}
      </div>
      <div class="card span-6">
        <h3>${project ? escapeHtml(project.name) : "Deliverables"}</h3>
        ${deliverables.length ? `<div class="stack-list">${deliverables.map(renderDeliverableListItem).join("")}</div>` : `<div class="empty">Choose a project to load its deliverables.</div>`}
      </div>
      <div class="card span-6">
        <h3>Deliverable Details</h3>
        ${selectedDeliverable ? renderDeliverableDetail(selectedDeliverable) : `<div class="empty">Choose a deliverable to see more here.</div>`}
      </div>
    </section>
  `;
}

function renderProjectTeamPage() {
  const project = getSelectedProject();
  const stakeholders = state.projectStakeholders[state.selectedProjectId] || [];
  const selectedStakeholder = stakeholders.find((item) => stakeholderCacheKey(state.selectedProjectId, item) === state.selectedDeliverableId);
  const stakeholderItems = selectedStakeholder ? state.stakeholderWork[stakeholderCacheKey(state.selectedProjectId, selectedStakeholder)] || [] : [];

  return `
    <section class="page-grid">
      <div class="card span-12">
        <h3>Project Team</h3>
        <p>Choose a project to see the people connected to the work.</p>
        ${renderProjectPicker()}
      </div>
      <div class="card span-5">
        <h3>${project ? escapeHtml(project.name) : "Team"}</h3>
        ${stakeholders.length ? `<div class="stack-list">${stakeholders.map(renderStakeholderItem).join("")}</div>` : `<div class="empty">Choose a project to load the team list.</div>`}
      </div>
      <div class="card span-7">
        <h3>Stakeholder View</h3>
        ${selectedStakeholder ? `
          <div class="feature-grid">
            <div class="metric">
              <span>Name</span>
              <strong>${escapeHtml(`${selectedStakeholder.projectStakeholders__first_name || ""} ${selectedStakeholder.projectStakeholders__last_name || ""}`.trim())}</strong>
            </div>
            <div class="metric">
              <span>Assigned Work</span>
              <strong>${stakeholderItems.length}</strong>
            </div>
            <div class="metric">
              <span>Progress</span>
              <strong>${stakeholderProgress(stakeholderItems)}%</strong>
            </div>
          </div>
          ${stakeholderItems.length ? `<div class="stack-list" style="margin-top:16px;">${stakeholderItems.map(renderStakeholderWorkItem).join("")}</div>` : `<div class="empty">No deliverables are assigned to this person yet.</div>`}
        ` : `<div class="empty">Choose someone from the project team to see their assignments.</div>`}
      </div>
    </section>
  `;
}

function renderMyDeliverablesPage() {
  return `
    <section class="page-grid">
      <div class="card span-12">
        <h3>My Deliverables</h3>
        <p>Your current assignments are listed here.</p>
      </div>
      <div class="card span-12">
        ${state.myDeliverables.length ? `<div class="project-grid">${state.myDeliverables.map(renderMyDeliverableCard).join("")}</div>` : `<div class="empty">There are no current deliverables assigned to you right now.</div>`}
      </div>
    </section>
  `;
}

function renderProjectMessagesPage() {
  const deliverable = getSelectedDeliverable() || state.myDeliverables[0] || null;
  const comments = deliverable ? state.commentsByDeliverable[deliverable.id] || [] : [];

  return `
    <section class="page-grid">
      <div class="card span-12">
        <h3>Project Messages</h3>
        <p>Choose a deliverable to read or add conversation around the work.</p>
        ${renderDeliverablePicker(deliverable)}
      </div>
      <div class="card span-5">
        <h3>Deliverable</h3>
        ${deliverable ? renderDeliverableDetail(deliverable) : `<div class="empty">Choose a deliverable to continue.</div>`}
      </div>
      <div class="card span-7">
        <h3>Conversation</h3>
        ${deliverable ? `
          <form id="comment-form" data-deliverable-id="${deliverable.id}" data-draft-key="comment-form:${deliverable.id}">
            <div class="field-group">
              <label for="comment-text">Add a message</label>
              <textarea id="comment-text" name="commentText" rows="4" placeholder="Share an update or add a note for the team."></textarea>
            </div>
            <button class="button" type="submit">${state.sendingComment ? "Posting..." : "Post Message"}</button>
            <button class="ghost-button" type="button" data-action="clear-draft" data-draft-key="comment-form:${deliverable.id}" style="margin-left:10px;">Clear Saved Draft</button>
          </form>
          <div class="stack-list" style="margin-top:16px;">
            ${comments.length ? comments.map(renderCommentItem).join("") : `<div class="empty">No messages have been added yet.</div>`}
          </div>
        ` : `<div class="empty">Choose a deliverable first.</div>`}
      </div>
    </section>
  `;
}

function renderSettingsPage() {
  return `
    <section class="page-grid">
      <div class="card span-6">
        <h3>Account</h3>
        <p>Keep your details current and refresh this workspace when needed.</p>
        <div class="inline-meta">
          <span class="pill">Username: ${escapeHtml(currentUsername())}</span>
          <span class="pill">Email: ${escapeHtml(state.profile?.email || "Not available yet")}</span>
        </div>
        <div class="hero-actions">
          <button class="ghost-button" data-action="verify-session">Refresh My Access</button>
          <button class="danger-button" data-action="logout">Logout</button>
        </div>
      </div>
      <div class="card span-6">
        <h3>Profile Details</h3>
        <form id="settings-profile-form" data-draft-key="settings-profile-form">
          <div class="form-grid">
            <div class="field-group">
              <label for="settings-first-name">First name</label>
              <input id="settings-first-name" name="first_name" value="${escapeHtml(state.profile?.first_name || "")}">
            </div>
            <div class="field-group">
              <label for="settings-last-name">Last name</label>
              <input id="settings-last-name" name="last_name" value="${escapeHtml(state.profile?.last_name || "")}">
            </div>
          </div>
          <div class="field-group">
            <label for="settings-phone">Phone number</label>
            <input id="settings-phone" name="phone_number" value="${escapeHtml(state.profile?.phone_number || "")}">
          </div>
          <button class="button" type="submit">Save Changes</button>
          <button class="ghost-button" type="button" data-action="clear-draft" data-draft-key="settings-profile-form" style="margin-left:10px;">Clear Saved Draft</button>
        </form>
      </div>
    </section>
  `;
}

function renderProjectPicker() {
  return `
    <div class="field-group" style="margin-top:16px;">
      <label for="project-select">Choose a project</label>
      <select id="project-select">
        <option value="">Select a project</option>
        ${state.projects.map((project) => `
          <option value="${escapeHtml(String(project.id))}" ${String(project.id) === String(state.selectedProjectId) ? "selected" : ""}>
            ${escapeHtml(project.name)}
          </option>
        `).join("")}
      </select>
    </div>
  `;
}

function renderDeliverablePicker(activeDeliverable) {
  const options = [
    ...(state.projectDeliverables[state.selectedProjectId] || []),
    ...state.myDeliverables.filter((item) => !(state.projectDeliverables[state.selectedProjectId] || []).some((existing) => existing.id === item.id)),
  ];
  return `
    <div class="field-group" style="margin-top:16px;">
      <label for="deliverable-select">Choose a deliverable</label>
      <select id="deliverable-select">
        <option value="">Select a deliverable</option>
        ${options.map((item) => `
          <option value="${escapeHtml(String(item.id))}" ${String(item.id) === String(activeDeliverable?.id || state.selectedDeliverableId) ? "selected" : ""}>
            ${escapeHtml(item.deliverableName || "Deliverable")}
          </option>
        `).join("")}
      </select>
    </div>
  `;
}

function renderProjectCard(project) {
  return `
    <button class="project-card" data-project-open="${project.id}">
      <div class="project-card-top">
        <div>
          <span class="project-kicker">Project Workspace</span>
          <h4>${escapeHtml(project.name || "Project")}</h4>
        </div>
        <span class="flag-pill">${friendlyHealth(project.flag)}</span>
      </div>
      <p>${escapeHtml(project.shortDescription || "Open this project to see more.")}</p>
      <div class="inline-meta">
        <span class="pill">${friendlyPhase(project.phase)}</span>
        <span class="pill">Start: ${escapeHtml(project.startDate || "TBD")}</span>
        <span class="pill">Due: ${escapeHtml(project.dueDate || "TBD")}</span>
      </div>
    </button>
  `;
}

function renderDeliverableListItem(item) {
  return `
    <button class="list-row" data-deliverable-open="${item.id}">
      <div>
        <strong>${escapeHtml(item.deliverableName || "Deliverable")}</strong>
        <span>${escapeHtml(item.deliverableDetails || item.deliverableStatus || "Open this deliverable for more detail.")}</span>
      </div>
      <span class="list-chip">${escapeHtml(String(item.deliverableStatus || item.deliverableCompleted || "In progress"))}</span>
    </button>
  `;
}

function renderStakeholderItem(item) {
  return `
    <button class="list-row" data-stakeholder-open="${escapeHtml(stakeholderCacheKey(state.selectedProjectId, item))}">
      <div>
        <strong>${escapeHtml(`${item.projectStakeholders__first_name || ""} ${item.projectStakeholders__last_name || ""}`.trim() || "Team Member")}</strong>
        <span>Open to see this person's project assignments.</span>
      </div>
      <span class="list-chip">Open</span>
    </button>
  `;
}

function renderStakeholderWorkItem(item) {
  return `
    <div class="detail-line">
      <strong>${escapeHtml(item.deliverableName || "Deliverable")}</strong>
      <span>${escapeHtml(item.deliverableStatus || "In progress")}</span>
    </div>
  `;
}

function renderMyDeliverableCard(item) {
  return `
    <button class="project-card" data-deliverable-open="${item.id}" data-route-open="ProjectMessages">
      <div class="project-card-top">
        <div>
          <span class="project-kicker">My Deliverables</span>
          <h4>${escapeHtml(item.deliverableName || "Deliverable")}</h4>
        </div>
        <span class="flag-pill">${escapeHtml(String(item.deliverableCompleted))}</span>
      </div>
      <p>${escapeHtml(item.deliverableDetails || "Open this deliverable to read more.")}</p>
      <div class="inline-meta">
        <span class="pill">${escapeHtml(item.projectName__name || "Project")}</span>
        <span class="pill">End: ${escapeHtml(item.deliverableEndDate || "TBD")}</span>
      </div>
    </button>
  `;
}

function renderDeliverableDetail(item) {
  const ownerName = deliverableSupportName(item, "primary");
  const secondaryOwnerName = deliverableSupportName(item, "secondary");
  return `
    <div class="detail-stack">
      <div class="detail-line"><strong>Name</strong><span>${escapeHtml(item.deliverableName || "Deliverable")}</span></div>
      <div class="detail-line"><strong>Primary Support</strong><span>${escapeHtml(ownerName || "Not listed")}</span></div>
      <div class="detail-line"><strong>Secondary Support</strong><span>${escapeHtml(secondaryOwnerName || "Not listed")}</span></div>
      <div class="detail-line"><strong>Status</strong><span>${escapeHtml(String(item.deliverableStatus || item.deliverableCompleted || "In progress"))}</span></div>
      <div class="detail-line"><strong>Start</strong><span>${escapeHtml(item.deliverableStartDate || "TBD")}</span></div>
      <div class="detail-line"><strong>End</strong><span>${escapeHtml(item.deliverableEndDate || "TBD")}</span></div>
      <div class="detail-block"><strong>Details</strong><p>${escapeHtml(item.deliverableDetails || "No additional details have been added yet.")}</p></div>
    </div>
  `;
}

function deliverableSupportName(item, type = "primary") {
  if (type === "secondary") {
    return (
      item.deliverableSecondaryOwnerName ||
      item.deliverableSecondaryOwnerUsername ||
      item.deliverableSecondaryOwner ||
      ""
    );
  }
  return (
    item.deliverableOwnerName ||
    `${item.deliverableOwner__first_name || ""} ${item.deliverableOwner__last_name || ""}`.trim() ||
    item.deliverableOwnerUsername ||
    item.deliverableOwner ||
    ""
  );
}

function renderCommentItem(comment) {
  return `
    <div class="comment-card">
      <div class="comment-head">
        <strong>${escapeHtml(comment.username || "Team Member")}</strong>
        <span>${escapeHtml(formatTimestamp(comment.timestamp))}</span>
      </div>
      <p>${escapeHtml(comment.commentText || "")}</p>
      ${(comment.subcomments || []).length ? `
        <div class="reply-list">
          ${comment.subcomments.map((reply) => `
            <div class="reply-card">
              <div class="comment-head">
                <strong>${escapeHtml(reply.username || "Reply")}</strong>
                <span>${escapeHtml(formatTimestamp(reply.timestamp))}</span>
              </div>
              <p>${escapeHtml(reply.commentText || "")}</p>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

function formatTimestamp(value) {
  return String(value || "").replace("?", " ");
}

function friendlyHealth(flag) {
  if (flag === "red") return "Needs Attention";
  if (flag === "#ecb753" || flag === "yellow") return "Watch Closely";
  if (flag === "green") return "On Track";
  return "In View";
}

function friendlyPhase(phase) {
  const map = {
    initiation: "Planning",
    planning: "Execution",
    execution: "Live",
    live: "Completed",
    completed: "Review",
    review: "All Done",
  };
  return map[String(phase || "").toLowerCase()] || "In Progress";
}

function stakeholderProgress(items) {
  if (!items.length) return 0;
  const completed = items.filter((item) => item.deliverableCompleted === true).length;
  return Math.round((completed / items.length) * 100);
}

function routeLabel(route) {
  return ROUTES.find((item) => item.key === route)?.label || route;
}

function renderMessage() {
  if (!state.message) return "";
  return `<div class="message ${state.message.tone}">${escapeHtml(state.message.text)}</div>`;
}

function attachEvents() {
  hydrateDraftForms();

  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", async () => {
      clearFlash();
      const nextRoute = button.dataset.route;
      if (nextRoute === "Projects" && !state.projectsLoaded) await loadProjects();
      setRoute(nextRoute);
    });
  });

  document.querySelectorAll("[data-project-open]").forEach((button) => {
    button.addEventListener("click", async () => {
      const projectId = button.dataset.projectOpen;
      setSelectedProject(projectId);
      await Promise.all([
        loadProjectDeliverables(projectId),
        loadProjectStakeholders(projectId),
      ]);
      setRoute("ProjectDetails");
    });
  });

  document.querySelectorAll("[data-deliverable-open]").forEach((button) => {
    button.addEventListener("click", async () => {
      const deliverableId = button.dataset.deliverableOpen;
      setSelectedDeliverable(deliverableId);
      const targetRoute = button.dataset.routeOpen || "ProjectDeliverables";
      const deliverable = getSelectedDeliverable();
      if (deliverable) {
        await loadComments(deliverable.id).catch(() => {});
      }
      setRoute(targetRoute);
    });
  });

  document.querySelectorAll("[data-stakeholder-open]").forEach((button) => {
    button.addEventListener("click", async () => {
      const key = button.dataset.stakeholderOpen;
      state.selectedDeliverableId = key;
      const stakeholder = (state.projectStakeholders[state.selectedProjectId] || []).find((item) => stakeholderCacheKey(state.selectedProjectId, item) === key);
      if (stakeholder) {
        await loadStakeholderWork(state.selectedProjectId, stakeholder);
      }
      render();
    });
  });

  document.querySelectorAll("[data-action='logout']").forEach((button) => {
    button.addEventListener("click", () => logout("Signed out from RAW Web."));
  });

  document.querySelectorAll("[data-action='clear-draft']").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.draftKey;
      if (!key) return;
      clearFormDraft(key);
      render();
    });
  });

  document.querySelectorAll("[data-action='verify-session']").forEach((button) => {
    button.addEventListener("click", () => verifyStoredSession(true));
  });

  document.querySelectorAll("[data-action='cancel-profile-setup']").forEach((button) => {
    button.addEventListener("click", () => logout("Profile setup canceled. Signed out."));
  });

  const loginForm = document.querySelector("#login-form");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  const profileSetupForm = document.querySelector("#profile-setup-form");
  if (profileSetupForm) profileSetupForm.addEventListener("submit", handleProfileSetup);

  const settingsProfileForm = document.querySelector("#settings-profile-form");
  if (settingsProfileForm) settingsProfileForm.addEventListener("submit", handleSettingsProfileSave);

  const projectSelect = document.querySelector("#project-select");
  if (projectSelect) {
    projectSelect.addEventListener("change", async (event) => {
      const value = event.target.value;
      setSelectedProject(value);
      if (value) {
        await Promise.all([
          loadProjectDeliverables(value),
          loadProjectStakeholders(value),
        ]);
      }
      render();
    });
  }

  const deliverableSelect = document.querySelector("#deliverable-select");
  if (deliverableSelect) {
    deliverableSelect.addEventListener("change", async (event) => {
      const value = event.target.value;
      setSelectedDeliverable(value);
      if (value) {
        await loadComments(value).catch(() => {});
      }
      render();
    });
  }

  const commentForm = document.querySelector("#comment-form");
  if (commentForm) {
    commentForm.addEventListener("submit", handleCommentSubmit);
  }

  const manageDeliverableSelect = document.querySelector("#manage-deliverable-select");
  if (manageDeliverableSelect) {
    manageDeliverableSelect.addEventListener("change", (event) => {
      setManagerSelectedDeliverable(event.target.value);
    });
  }

  const createProjectForm = document.querySelector("#create-project-form");
  if (createProjectForm) {
    createProjectForm.addEventListener("submit", handleCreateProject);
  }

  const addDeliverableForm = document.querySelector("#add-deliverable-form");
  if (addDeliverableForm) {
    addDeliverableForm.addEventListener("submit", handleAddDeliverable);
  }

  const editDeliverableForm = document.querySelector("#edit-deliverable-form");
  if (editDeliverableForm) {
    editDeliverableForm.addEventListener("submit", handleEditDeliverable);
  }

  const deleteProjectForm = document.querySelector("#delete-project-form");
  if (deleteProjectForm) {
    deleteProjectForm.addEventListener("submit", handleDeleteProject);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();
  if (!username || !password) {
    flash("Please enter both your username or email and your password.", "warn");
    render();
    return;
  }

  const payload = { username, password, login: username };
  if (username.includes("@")) {
    payload.email = username.toLowerCase();
    payload.username = username.toLowerCase();
  }

  try {
    clearFlash();
    const data = await apiRequest("POST", "/login_verification", { body: payload });
    clearFormDraft("login-form");
    saveAuth(data);
    if (!isProfileSetupComplete(data)) {
      flash("You're almost in. Please finish a few profile details first.", "warn");
      render();
      return;
    }
    await ensureBaseData();
    await verifyStoredSession(true);
  } catch (error) {
    flash(extractApiError(error), "error");
    render();
  }
}

async function handleProfileSetup(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = {
    username: currentUsername(),
    first_name: String(formData.get("first_name") || "").trim(),
    last_name: String(formData.get("last_name") || "").trim(),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    phone_number: String(formData.get("phone_number") || "").trim(),
  };

  try {
    clearFlash();
    const data = await apiRequest("POST", "/auth/update-phone", { body: payload });
    clearFormDraft("profile-setup-form");
    saveAuth({ ...state.auth, ...payload, ...(data || {}), profile_setup_complete: true });
    await ensureBaseData();
    flash("Thanks. Your profile is ready now.", "success");
    render();
  } catch (error) {
    flash(extractApiError(error), "error");
    render();
  }
}

async function handleSettingsProfileSave(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = {
    username: currentUsername(),
    first_name: String(formData.get("first_name") || "").trim(),
    last_name: String(formData.get("last_name") || "").trim(),
    phone_number: String(formData.get("phone_number") || "").trim(),
  };

  try {
    clearFlash();
    const data = await apiRequest("POST", "/user_profile_update", { body: payload });
    clearFormDraft("settings-profile-form");
    saveAuth({ ...state.profile, ...payload, ...(data || {}) });
    flash("Your details have been updated.", "success");
    render();
  } catch (error) {
    flash(extractApiError(error), "error");
    render();
  }
}

async function handleCommentSubmit(event) {
  event.preventDefault();
  const deliverable = getSelectedDeliverable();
  const formData = new FormData(event.currentTarget);
  const commentText = String(formData.get("commentText") || "").trim();
  if (!deliverable || !commentText) {
    flash("Please write a message before posting.", "warn");
    render();
    return;
  }

  try {
    state.sendingComment = true;
    render();
    await postComment(deliverable, commentText);
    clearFormDraft(`comment-form:${deliverable.id}`);
    state.sendingComment = false;
    flash("Your message was posted.", "success");
    render();
  } catch (error) {
    state.sendingComment = false;
    flash(extractApiError(error), "error");
    render();
  }
}

async function handleCreateProject(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = {
    setView: "createProject",
    projectName: String(formData.get("projectName") || "").trim(),
    projectType: String(formData.get("projectType") || "").trim(),
    projectColor: String(formData.get("projectColor") || "").trim(),
    startDate: fromDateInputValue(String(formData.get("startDate") || "").trim()),
    dueDate: fromDateInputValue(String(formData.get("dueDate") || "").trim()),
    shortDescription: String(formData.get("shortDescription") || "").trim(),
    longDescription: String(formData.get("longDescription") || "").trim(),
    image: String(formData.get("image") || "").trim(),
    deliverables: [],
  };

  const deliverableName = String(formData.get("deliverableName") || "").trim();
  const deliverableDetails = String(formData.get("deliverableDetails") || "").trim();
  const deliverableStartDate = fromDateInputValue(String(formData.get("deliverableStartDate") || "").trim());
  const deliverableEndDate = fromDateInputValue(String(formData.get("deliverableEndDate") || "").trim());
  const deliverableOwner = String(formData.get("deliverableOwner") || "").trim();
  const deliverableSecondaryOwner = String(formData.get("deliverableSecondaryOwner") || "").trim();
  const deliverableColor = String(formData.get("deliverableColor") || "").trim();
  if (deliverableName || deliverableDetails || deliverableOwner) {
    payload.deliverables.push({
      name: deliverableName,
      details: deliverableDetails,
      startDate: deliverableStartDate,
      endDate: deliverableEndDate,
      owner: deliverableOwner,
      secondaryOwner: deliverableSecondaryOwner,
      color: deliverableColor,
    });
  }

  try {
    clearFlash();
    await apiRequest("POST", "/propose_project", { body: payload });
    clearFormDraft("create-project-form");
    await loadProjects();
    state.managerProjectDraft = {
      projectName: "",
      projectType: "Relationship",
      projectColor: "#00FF00",
      startDate: "",
      dueDate: "",
      shortDescription: "",
      longDescription: "",
      image: "",
    };
    state.managerCreateDeliverable = {
      name: "",
      details: "",
      startDate: "",
      endDate: "",
      owner: currentUsername(),
      secondaryOwner: "",
      color: "#00FF00",
    };
    flash("Project created.", "success");
    render();
  } catch (error) {
    flash(extractApiError(error), "error");
    render();
  }
}

async function handleAddDeliverable(event) {
  event.preventDefault();
  if (!state.selectedProjectId) {
    flash("Choose a project first.", "warn");
    render();
    return;
  }
  const formData = new FormData(event.currentTarget);
  const deliverable = {
    name: String(formData.get("name") || "").trim(),
    details: String(formData.get("details") || "").trim(),
    startDate: fromDateInputValue(String(formData.get("startDate") || "").trim()),
    endDate: fromDateInputValue(String(formData.get("endDate") || "").trim()),
    owner: String(formData.get("owner") || "").trim(),
    secondaryOwner: String(formData.get("secondaryOwner") || "").trim(),
    color: String(formData.get("color") || "").trim(),
  };

  try {
    clearFlash();
    await apiRequest("POST", "/update_deliverables", {
      body: {
        deliverables: [deliverable],
        projectName: Number(state.selectedProjectId),
      },
    });
    clearFormDraft("add-deliverable-form");
    delete state.projectDeliverables[state.selectedProjectId];
    await loadProjectDeliverables(state.selectedProjectId);
    state.managerCreateDeliverable = {
      name: "",
      details: "",
      startDate: "",
      endDate: "",
      owner: currentUsername(),
      secondaryOwner: "",
      color: "#00FF00",
    };
    flash("Deliverable added.", "success");
    render();
  } catch (error) {
    flash(extractApiError(error), "error");
    render();
  }
}

async function handleEditDeliverable(event) {
  event.preventDefault();
  if (!state.managerSelectedDeliverableId || !state.selectedProjectId) {
    flash("Choose a deliverable first.", "warn");
    render();
    return;
  }
  const formData = new FormData(event.currentTarget);
  try {
    clearFlash();
    await apiRequest("POST", "/edit_deliverables", {
      body: {
        id: Number(state.managerSelectedDeliverableId),
        name: String(formData.get("name") || "").trim(),
        detail: String(formData.get("detail") || "").trim(),
        startDate: fromDateInputValue(String(formData.get("startDate") || "").trim()),
        endDate: fromDateInputValue(String(formData.get("endDate") || "").trim()),
        owner: String(formData.get("owner") || "").trim(),
        secondaryOwner: String(formData.get("secondaryOwner") || "").trim(),
        projectName: Number(state.selectedProjectId),
      },
    });
    clearFormDraft(`edit-deliverable-form:${state.managerSelectedDeliverableId || "default"}`);
    delete state.projectDeliverables[state.selectedProjectId];
    await loadProjectDeliverables(state.selectedProjectId);
    flash("Deliverable updated.", "success");
    render();
  } catch (error) {
    flash(extractApiError(error), "error");
    render();
  }
}

async function handleDeleteProject(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const projectId = String(formData.get("projectId") || state.selectedProjectId || "").trim();
  if (!projectId) {
    flash("Choose a project first.", "warn");
    render();
    return;
  }
  try {
    clearFlash();
    await apiRequest("POST", "/project_admin_ops", {
      body: {
        setView: "delete_project",
        project_id: Number(projectId),
        requester_username: currentUsername(),
      },
    });
    if (String(state.selectedProjectId) === String(projectId)) {
      state.selectedProjectId = "";
      localStorage.removeItem(PROJECT_STORAGE_KEY);
    }
    delete state.projectDeliverables[projectId];
    delete state.projectStakeholders[projectId];
    await loadProjects();
    flash("Project removed.", "success");
    render();
  } catch (error) {
    flash(extractApiError(error), "error");
    render();
  }
}

function extractApiError(error) {
  const data = error?.data;
  const raw = typeof data === "string"
    ? data
    : Array.isArray(data)
      ? String(data[0] || "")
      : data?.detail || data?.error || data?.message || data?.non_field_errors?.[0] || data?.username?.[0] || data?.email?.[0] || data?.password?.[0] || "";

  const normalized = String(raw || error?.message || "").trim();
  if (!normalized) return "Something went wrong. Please try again.";
  if (/unable to log in with provided credentials/i.test(normalized)) {
    return "That username, email, or password didn't match our records. Please try again, or use the app if you need account help.";
  }
  if (/network/i.test(normalized) || /failed to fetch/i.test(normalized)) {
    return "We couldn't reach RAW right now. Please check your connection and try again.";
  }
  if (/inactive/i.test(normalized) || /disabled/i.test(normalized)) {
    return "This account is not active right now. Please use the app if you need help.";
  }
  if (/required/i.test(normalized)) {
    return "A few details are missing. Please review the form and try again.";
  }
  return normalized.startsWith("{") ? "Something went wrong. Please try again." : normalized;
}

function colorLabel(hex) {
  return COLOR_LABELS[String(hex || "").toUpperCase()] || hex || "Color";
}

function draftStorageKey(key) {
  return `${FORM_DRAFT_PREFIX}${key}`;
}

function saveFormDraft(form) {
  const draftKey = form?.dataset?.draftKey;
  if (!draftKey) return;
  const payload = {};
  [...form.elements].forEach((element) => {
    if (!element.name || element.disabled) return;
    if (element.type === "password" || element.dataset.noPersist === "true") return;
    if (element.type === "checkbox" || element.type === "radio") {
      payload[element.name] = element.checked;
      return;
    }
    payload[element.name] = element.value;
  });
  localStorage.setItem(draftStorageKey(draftKey), JSON.stringify(payload));
}

function applyFormDraft(form) {
  const draftKey = form?.dataset?.draftKey;
  if (!draftKey) return;
  let draft = null;
  try {
    draft = JSON.parse(localStorage.getItem(draftStorageKey(draftKey)) || "null");
  } catch {
    draft = null;
  }
  if (!draft || typeof draft !== "object") return;
  [...form.elements].forEach((element) => {
    if (!element.name || !(element.name in draft) || element.type === "password") return;
    if (element.type === "checkbox" || element.type === "radio") {
      element.checked = Boolean(draft[element.name]);
      return;
    }
    element.value = draft[element.name];
  });
}

function clearFormDraft(draftKey) {
  localStorage.removeItem(draftStorageKey(draftKey));
}

function hydrateDraftForms() {
  document.querySelectorAll("form[data-draft-key]").forEach((form) => {
    applyFormDraft(form);
    const persist = () => saveFormDraft(form);
    form.addEventListener("input", persist);
    form.addEventListener("change", persist);
  });
}

function toDateInputValue(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [mm, dd, yyyy] = text.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

function fromDateInputValue(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [yyyy, mm, dd] = text.split("-");
    return `${mm}/${dd}/${yyyy}`;
  }
  return text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
