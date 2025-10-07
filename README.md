# VNote Sales Companion

A delightful, offline-first workspace for sales and success teams to capture guided discovery notes. Built with React, TypeScript, Tailwind, Framer Motion, and local-first storage so it runs perfectly on GitHub Pages.

👉 **Live site:** https://vtoool.github.io/VNote/

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

### Try your Gemini API key

Head to the **Settings** page from the sidebar to find the Gemini API tester card. Paste a valid API key, enter a prompt, and send a test request to confirm your credentials. The call is made straight from your browser using the official REST endpoint, so avoid sharing keys you would not be comfortable exposing client-side.

## Future roadmap

- **Real-time collaboration:** Introduce a multiplayer canvas powered by a CRDT engine such as [Yjs](https://yjs.dev/) to keep cards, scripts, and guided prompts in sync across participants. Pair the CRDT document with awareness metadata so teams can see who is editing in real time.
- **Syncable workspace backend:** Layer a lightweight synchronization service (e.g., a Node.js or Go API) behind the local store to persist projects, handle authentication, and stream CRDT updates between devices.
- **CRM connectivity:** Provide connectors for CRM APIs such as Salesforce and HubSpot. Allow users to authenticate, map fields between canvases and CRM objects, and push captured answers or mutual action plans directly into opportunity records.

Enjoy smoother discovery calls!
