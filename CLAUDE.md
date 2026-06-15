# Public Sites — Tech & Faith

Static marketing/support site (plain HTML/CSS/JS, no build step). Hosted from GitHub
(`agentggg/public_sites`); pushing to `main` publishes the live site.

## App support hub (`app_support/`)
All five app pages (RAW, All Nations, Revealed Mysteries, Lions Den, NeuroEdge) are
**config-driven** — one shared template per page, swapped by the `?app=<key>` URL param.

- `config.js` — `APP_CONFIG` holds every app's content (name, copy, features, FAQ,
  store URLs, `status`, optional `disclaimer`). Edit copy here, not in the HTML.
- `index.html` — support page + app hub. `marketing.html`, `privacy.html`, `apps.html`
  — shared templates rendered from the selected app's config.
- `site.js` — rendering helpers (selector, store cards, coming-soon modal).
- `redirects.js` — `SITE_CONFIG` (base path) and `TECH_AND_FAITH` (operator/contact).

`status: "live"` makes an app open its pages directly; `status: "development"` shows a
coming-soon popup. Apps without published store URLs (`"#"`) degrade to a friendly
"listing coming soon" state. An optional `disclaimer` string renders a callout on the
support and marketing pages.

Keep public copy plain and non-technical — these are marketing pages for regular users.
