# Integration hand-off

- **Backend:** None. This is a static, browser-only SPA; no API server, run command, port, or health endpoint.
- **Frontend:** Workspace root (`.`). Build: `npm run build`. Dev: `npm run dev` (Vite, default port 5173).
- **Data wiring:** No API client, mock data, or live-data seam. Do not add a backend; PDF selection and encryption are intentionally local in `src/features/pdf-protection/`.
- **API routes:** `GET /` serves the static SPA. No application API routes.
- **Database:** None. No migration tool or migration directory. No seed data.
- **Environment:** None required.
- **Shared types:** None; no shared package or import alias.
- **Services:** Essential — Azure Static Web Apps (static hosting only). Enhancements — none.
- **Verification:** Run frontend tests with `npm test` and production build with `npm run build`. Verify PDF processing does not upload documents and protected downloads use the selected opening password.

## Integration results — 2026-10-30

- **Migrations / backend:** Not applicable. The approved app has no database, API server, or application API routes; no backend or datastore was introduced.
- **Frontend wiring:** No mock-data layer or API seam was present. The existing PDF workflow reads the selected file with `File.arrayBuffer()`, encrypts it locally through `@cantoo/pdf-lib`, then downloads a browser-created Blob. Source scan found no `fetch`, `XMLHttpRequest`, `FormData`, `sendBeacon`, or `WebSocket` usage in `src/`.
- **Static smoke test:** Served the existing production output locally. `GET /`, the JavaScript bundle, and the CSS asset each returned HTTP 200. This is the only service path; frontend/backend communication is not applicable.
- **Build / unit tests:** `npm test` and `npm run build` could not run because Node.js and npm are not installed or available on PATH in this environment. The existing `dist/` output was used for the static smoke test; the PDF encryption test is present in `tests/pdf-protection/protection-service.test.ts` but was not executable here.
