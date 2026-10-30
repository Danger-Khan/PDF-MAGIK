# Project Plan

**Status**: Integrated
**Created**: 2026-10-30
**Mode**: NEW

---

## 1. Project Overview

**Goal**: Build PDF Magik, a browser-based tool for selecting a PDF, setting and confirming an opening password, and downloading a protected copy while keeping document processing local in the browser. The project is designed so that every module is independently testable.

**App Type**: Static web app (single-page application; no API)

**API Login**: No

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Frontend — Web App

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Framework** | React + Vite |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

---

## 3. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| Azure Static Web Apps | Host the built React single-page application as static assets; no server-side PDF processing | — | Not applicable; local development uses Vite | Essential |

---

## 4. Prerequisites

The app's local development server and test runner require Node.js and npm. Browser-based debugging uses Chromium. Double-check that all tools marked ❓ are installed before proceeding.

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | frontend | ❓ | Unconfirmed |
| npm | frontend | ❓ | Unconfirmed |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Google Chrome | frontend | ✅ | 156.0.8078.79 |

---

## 5. Design System & UI

**Component Library**: Fluent UI v9
**Style Direction**: A calm, polished browser utility with an uncluttered work surface, a clear selected-file summary, reassuring local-processing cues, and direct recovery guidance. Retain restrained teal accents, high-contrast controls, and generous separation around password entry so the security-sensitive step feels deliberate on desktop and smaller screens.
**Typography**: Segoe UI Variable, system-ui, sans-serif

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#0F766E` | Protect-and-download action, selected controls, and local-processing indicators |
| `accent`  | `#7C3AED` | Secondary highlights and password-strength guidance |
| `surface` | `#F4F7F8` | Main PDF work area and app background |
| `text`    | `#17252A` | File names, field labels, and primary status text |
| `muted`   | `#5D6B70` | File metadata, helper copy, and secondary status |
| `border`  | `#D7E0E2` | File-summary panels, input borders, and section dividers |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| PDF Workbench | `/` | Select one local PDF, enter and confirm its opening password, then download the protected copy | `header, main, split(card-list|form), actions, footer` |

### Sample Content

PDF Workbench — alternative one-file sessions (illustrative examples, not a batch or stored history):

| Input PDF | Size | State | Download name |
|------------|------|-------|---------------|
| `Quarterly-Report-2026.pdf` | 2.4 MB | Ready to protect | `Quarterly-Report-2026-protected.pdf` |
| `Project-Proposal.pdf` | 1.6 MB | Ready to protect | `Project-Proposal-protected.pdf` |
| `Workshop-Handbook.pdf` | 5.7 MB | Ready to protect | `Workshop-Handbook-protected.pdf` |

Password form — opening password: blank until user entry · confirm password: blank until user entry · output: browser download named from the selected PDF. The requirements do not specify a particular encryption implementation, algorithm, or reader-compatibility target; those must be verified before making encryption-strength or compatibility claims.

---

## 6. Project Structure

```text
pdf-magik/
├── .azure/
│   └── project-plan.md
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── PdfFilePicker/
│   │   ├── OpeningPasswordForm/
│   │   └── DownloadResult/
│   ├── features/
│   │   └── pdf-protection/
│   │       ├── browser-file.ts
│   │       └── protection-service.ts
│   └── styles/
├── tests/
│   ├── fixtures/
│   └── pdf-protection/
└── public/
```

---

## 7. Route Definitions

There are no application API routes. The single browser route serves the static React application; PDF selection, processing, and download stay within the browser.

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/` | Serve the PDF Magik single-page application | — | Static application shell and assets | 200, 404 |

---

## 8. Next Steps

1. Scaffolding and integration are complete; the app has no backend, API, or datastore.
2. Install Node.js and npm, then run `npm test` and `npm run build`; these could not be verified in the current environment.
3. Configure Azure Static Web Apps only if hosted deployment is desired.
