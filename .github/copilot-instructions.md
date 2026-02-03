# Copilot / AI Agent Instructions for Chatbot_project

## Quick summary
- Small single-page React app built with Vite (dev server + HMR). Entry: `src/main.jsx`.
- Routing handled in `src/App.jsx` using `react-router` / `react-router-dom` (v7.x).
- Global UI state is stored in a simple React context provider `src/UserContext/User.jsx` and consumed in pages/components (see `Home.jsx`).
- UI components live in `src/Pages/` (e.g., `Home.jsx`, `Chat.jsx`). Styling lives in `src/App.css` and `src/index.css`.

## Developer workflows (explicit commands)
- Start dev server: `npm run dev` (uses `vite`) ✅
- Build release: `npm run build` ✅
- Preview production build: `npm run preview` ✅
- Lint: `npm run lint` (ESLint configuration in `eslint.config.js`) ✅

If you need to reproduce or debug locally, run `npm i` then `npm run dev` and open the browser (Vite HMR enabled).

## Architecture & file map (what matters to make changes)
- `src/main.jsx` — root render, wraps `<App />` with `User` provider and `BrowserRouter`.
- `src/UserContext/User.jsx` — single simple context provider. Exposes state keys `{ popup, setpopup, inp, setinp, feature, setfeature, res, setres }`.
- `src/App.jsx` — sets up routes:
  - `/` -> `Home` (main UI)
  - `/chat` -> `Chat`
- `src/Pages/Home.jsx` — main UI that:
  - reads/writes context (`useContext(DataContext)`) for input, popup, feature, res
  - toggles features by calling `setfeature("Generate Image")`, `setfeature("Uplode Image")`, `setfeature("Let's Chat")` (note: strings are compared directly in UI logic)
  - controlled input bound to `inp` / `setinp`
- `src/Pages/Chat.jsx` — placeholder chat view. When modifying, prefer to consume `DataContext` via `useContext` rather than referencing top-level variables.

## Project-specific patterns & gotchas (concrete guidance)
- State keys are short/ambiguous (e.g., `res`, `inp`, `popup`, `feature`). When you add or refactor state, prefer descriptive names or carefully mirror current names to avoid breaking UI logic.
- Feature strings are compared as exact strings in code (e.g., `feature == "Generate Image"`). If you change a label, update all comparisons/usages.
- Form submission handling in `Home.jsx` is currently minimal/bug-prone (the `onSubmit` handler returns a conditional button instead of preventing default). If implementing submit behavior, call `event.preventDefault()` and use context state to drive behavior.
- `Chat.jsx` currently renders `inp` in JSX but doesn't call `useContext(DataContext)`; prefer canonical consumption via `useContext`.
- Asset usage: images can come from `src/assets` or `public/`. Import images in components to get bundler benefits.

## Coding & linting notes
- ESLint config: `eslint.config.js`. Rule override: unused vars ignore pattern `^[A-Z_]` — be mindful of local variable names to avoid false positives.
- Run `npm run lint` and fix ESLint errors before creating PRs.

## Where to add things
- New pages/components: `src/Pages/`.
- Shared small components: `src/components/` (not present now — create if needed and update `README` or add to this file).
- New context/data flow: expand `src/UserContext/User.jsx` or add new contexts under `src/UserContext/`.

## Integration points / external deps to watch
- react-router v7: route API is v7-style (`<Routes><Route path=... element={...} /></Routes>`). When upgrading, check router API changes.
- `react-icons` and `@mui/icons-material` used for icons — prefer consistent usage.
- Vite dev environment: HMR will reload pages quickly; do not rely on server-side rendering.

## Examples (explicit in-repo references)
- To find state usage: search for `useContext(DataContext)` in `src/Pages/Home.jsx`.
- To add a route: modify `src/App.jsx` and add `<Route path='/new' element={<NewPage/>} />`.
- To add global state: update `src/UserContext/User.jsx` and add the state and setter to `<DataContext.Provider value={{ ... }}>`.

## When making changes, be cautious
- Preserve string literals used as flags (`"Generate Image"`, `"Uplode Image"`, `"Let's Chat"`) or update all call sites.
- Do not assume tests exist — add unit or component tests in `src/__tests__/` if requested, and document commands to run them (not present in current repo).

---
If anything above is unclear or you'd like me to include short code examples (e.g., a safe `onSubmit` template for `Home.jsx` or a migration plan to rename `feature` strings), say which section to expand and I'll iterate. 👇

