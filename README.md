# VNote Sales Companion

A delightful, offline-first workspace for sales and success teams to capture guided discovery notes. Built with React, TypeScript, Tailwind, Framer Motion, and local-first storage so it runs perfectly on GitHub Pages.

## Features

- ✨ Project dashboard with template-based project creation, fuzzy search, duplication, and friendly empty states.
- 🗺️ Infinite canvas per project with draggable cards (sticky, checklist, question, media, text), frames, and snap grid toggles.
- 🎯 Guided Mode showing natural-language script variants with quick branching capture.
- 🧠 Autosave to IndexedDB with up to ten versions per project and manual snapshot saves.
- 🔍 Global fuzzy search, command palette, keyboard shortcuts, and per-project personal bullet lists.
- 📤 Export projects as JSON or clean Markdown, plus import with safety checks.
- 📱 Installable PWA with offline cache and responsive UI tuned for dark/light themes.

## Getting started

```bash
npm install
npm run dev
```

Open the Vite dev server URL in your browser to start building.

### Build for production

```bash
npm run build
```

The build output lives in `dist/` and is what GitHub Pages will deploy.

## GitHub Pages configuration

VNote is ready for both user/organization pages and project pages.

- For user/org pages (`username.github.io`), set the base in `vite.config.ts` to `'/'`.
- For project pages (`username.github.io/<REPO_NAME>`), set the base to `'/<REPO_NAME>/'`.

Update the `BASE` constant in `vite.config.ts` in one place to switch modes.

If you need a custom domain, add your domain to `public/CNAME`.

## Deploying automatically

The included workflow in `.github/workflows/deploy.yml` builds the app and publishes `dist/` to the `gh-pages` branch whenever you push to `main`.

## Optional tweaks

- Update icons under `public/icons/` to match your brand.
- Adjust the three starter templates in `src/lib/templates.ts`.
- Localize strings in `src/lib/i18n.ts`.

Enjoy smoother discovery calls!
