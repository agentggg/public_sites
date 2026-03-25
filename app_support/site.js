function revealOnScroll() {
  const nodes = document.querySelectorAll("[data-reveal]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );
  nodes.forEach((node) => observer.observe(node));
}

function setGlobalAppLinks(app) {
  document.querySelectorAll("[data-link='support']").forEach((el) => {
    el.href = pageUrl("index.html", app);
  });
  document.querySelectorAll("[data-link='privacy']").forEach((el) => {
    el.href = pageUrl("privacy.html", app);
  });
  document.querySelectorAll("[data-link='marketing']").forEach((el) => {
    el.href = pageUrl("marketing.html", app);
  });
  document.querySelectorAll("[data-link='apps']").forEach((el) => {
    el.href = pageUrl("apps.html", app);
  });
}

function setBrandAssets() {
  document.querySelectorAll("[data-brand-image]").forEach((el) => {
    el.src = sitePath(TECH_AND_FAITH.logoSrc);
    el.alt = TECH_AND_FAITH.logoAlt;
  });
}

function ensureComingSoonModal() {
  if (document.getElementById("coming-soon-modal")) return;
  const modal = document.createElement("div");
  modal.id = "coming-soon-modal";
  modal.className = "coming-soon hidden";
  modal.innerHTML = `
    <div class="coming-soon__backdrop" data-coming-soon-close></div>
    <div class="coming-soon__dialog">
      <button class="coming-soon__close" type="button" data-coming-soon-close aria-label="Close">×</button>
      <div class="eyebrow"><strong>Coming Soon</strong> In development</div>
      <h2 id="coming-soon-title"></h2>
      <p id="coming-soon-copy"></p>
      <div class="button-row">
        <button class="btn btn--primary" type="button" data-coming-soon-close>Got It</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-coming-soon-close]").forEach((node) => {
    node.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  });
}

function showComingSoonModal(app) {
  ensureComingSoonModal();
  const modal = document.getElementById("coming-soon-modal");
  document.getElementById("coming-soon-title").textContent = `${app.name} is still in development`;
  document.getElementById("coming-soon-copy").textContent = app.comingSoonBlurb || `${app.name} is still in development.`;
  modal.classList.remove("hidden");
}

function wireComingSoonAction(element, app) {
  if (!element || !app || app.status !== "development") return;
  element.addEventListener("click", (event) => {
    event.preventDefault();
    showComingSoonModal(app);
  });
}

function renderSelector(container, selectedKey) {
  container.innerHTML = "";
  APP_KEYS.forEach((key) => {
    const app = APP_CONFIG[key];
    const card = document.createElement("a");
    card.className = "app-pick";
    if (selectedKey === key) card.classList.add("active");
    card.href = app.status === "development" ? "#" : pageUrl("index.html", app);
    card.innerHTML = `
      <span class="app-pick__badge"><img class="app-logo app-logo--card" src="${app.iconSrc}" alt="${app.name} app icon"></span>
      <span class="app-pick__name">${app.name}</span>
      <span class="app-pick__tag">${app.tag}</span>
      <span class="store-card__hint">Look for this icon in the App Store.</span>
    `;
    if (app.status === "development") wireComingSoonAction(card, app);
    container.appendChild(card);
  });
}

function renderStoreCards(container, platform) {
  container.innerHTML = "";
  APP_KEYS.forEach((key) => {
    const app = APP_CONFIG[key];
    const inDevelopment = app.status === "development";
    const url = platform === "android" ? app.androidUrl : app.iosUrl;
    const card = document.createElement("a");
    card.className = "store-card";
    if (inDevelopment || !url || url === "#") {
      card.href = "#";
      wireComingSoonAction(card, app);
    } else {
      card.href = url;
      card.target = "_blank";
      card.rel = "noreferrer";
    }
    card.innerHTML = `
      <span class="store-card__mark"><img class="app-logo app-logo--card" src="${app.iconSrc}" alt="${app.name} app icon"></span>
      <span class="store-card__meta">
        <span class="store-card__name">${app.name}</span>
        <span class="store-card__desc">${app.storeLabel}</span>
      </span>
      <span class="store-card__cta">${inDevelopment ? "Still in development" : platform === "android" ? "Open in Google Play" : "Open in App Store"}</span>
      <span class="store-card__hint">Look for this icon when searching in the store.</span>
      ${inDevelopment ? '<span class="store-card__status">In Development</span>' : ""}
    `;
    container.appendChild(card);
  });
}

function renderSubmissionFields(app, container) {
  const meta = appStoreSubmissionDetails(app);
  const fields = [
    ["Operator", meta.operator],
    ["Support Email", meta.supportEmail],
    ["Version", meta.version],
    ["Copyright", meta.copyright]
  ];
  container.innerHTML = fields
    .map(
      ([label, value]) => `
        <div class="meta-row">
          <span class="meta-row__label">${label}</span>
          <span class="meta-row__value">${value}</span>
        </div>
      `
    )
    .join("");
}

function disableActionsForDevelopment(app, selectors) {
  if (!app || app.status !== "development") return;
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      wireComingSoonAction(node, app);
    });
  });
}

function setDocumentTitle(title) {
  document.title = title;
}
