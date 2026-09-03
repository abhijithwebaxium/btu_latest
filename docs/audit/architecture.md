# Architecture Audit — BTU Campus OS

## Frameworks & Versions

| Layer | Package | Version |
|---|---|---|
| UI | React + React-DOM | 19.2.8 |
| Router | `@tanstack/react-router` | 1.170.31 |
| Router codegen | `@tanstack/router-plugin` | 1.168.34 |
| Bundler / dev server | Vite | 8.2.2 |
| React Vite plugin | `@vitejs/plugin-react` | 6.1.0 |
| Styling | Tailwind CSS | 4.3.3 (via `@tailwindcss/vite`) |
| Animation | `framer-motion` | 13.1.1 |
| Icons | `lucide-react` | 1.33.0 |
| Charts | `recharts` | 3.10.1 (Pie only, Dashboard.tsx) |
| DB driver | `mongoose` | 9.9.3 (MongoDB Atlas) |
| Serverless types | `@vercel/node` | 6.0.0 |
| TypeScript | — | 7.0.2 |

**Dead dependencies** (declared, never imported): `xlsx ^0.18.5`, `@tanstack/react-start 1.168.48`, `dotenv 17.4.2`.

---

## Two-headed backend

The project deploys the same service layer twice, with different transports:

### Dev (Vite middleware)
`vite.config.ts` (lines 7–293) contains a custom Vite plugin `apiServerPlugin` that intercepts every `/api/*` request and dispatches to `src/server/*Service.ts` functions inline.

**Endpoints exposed in dev only:**
- `POST /api/auth/student-login`
- `POST /api/auth/admin-login`
- `POST /api/students/import`
- `GET/DELETE /api/students`
- `POST /api/evaluation/update-subjects` ← **ONLY in dev; 404 in prod**
- `GET/POST/DELETE /api/announcements`
- `GET/POST /api/notifications`
- `GET/POST /api/support`

**Missing in dev (404):** `/api/assignments`, `/api/classes`, `/api/internships`, `/api/projects`, `/api/dashboard-stats`

### Prod (Vercel serverless)
Individual files in `api/*.ts` re-implement the same handlers by calling the same `src/server/*` service modules. `vercel.json` rewrites each pretty URL to its `.ts` file; everything else → `/index.html` (SPA fallback).

All API files set `Access-Control-Allow-Origin: *`.

---

## Folder Structure

```
btu_new1/
├── api/                    Vercel serverless handlers (prod backend)
│   ├── admin-login.ts
│   ├── assignments.ts
│   ├── classes.ts
│   ├── dashboard-stats.ts
│   ├── import.ts
│   ├── internships.ts
│   ├── login.ts
│   ├── notifications.ts
│   ├── projects.ts
│   ├── students.ts
│   └── support.ts
├── src/
│   ├── components/         All page components + reusable shells
│   ├── lib/
│   │   ├── config.ts       VITE_APP_URL export
│   │   ├── db.ts           Mongoose connection (cached on globalThis)
│   │   └── studentParser.ts JSON → Student shape normalizer
│   ├── models/             Mongoose schemas (14 collections)
│   ├── routes/             TanStack file-based routes
│   │   ├── __root.tsx      Plain <Outlet /> + styles.css
│   │   ├── index.tsx       / (Dashboard)
│   │   ├── login.tsx       /login
│   │   ├── students.tsx    /students
│   │   ├── import.tsx      /import
│   │   ├── report.tsx      /report
│   │   └── admin/
│   │       └── login.tsx   /admin/login
│   ├── server/             Service layer (shared by api/* and vite middleware)
│   ├── entry-client.tsx    Client bootstrap
│   ├── entry-server.tsx    SSR entry — DEAD (no SSR build target)
│   ├── router.tsx          createTanStackRouter factory
│   ├── routeTree.gen.ts    Auto-generated route tree
│   └── styles.css          Tailwind entry + light-theme overrides
├── public/image/           btu.jpg, btu_logo.png
├── .env                    Committed credentials — see gaps doc
├── vercel.json             Route rewrites for prod
├── vite.config.ts          Vite config + inline dev API server
├── tsconfig.json           @/* → ./src/*
└── index.html              SPA shell
```

---

## Routing

File-based via `@tanstack/router-plugin`. `routeTree.gen.ts` is auto-generated.

| Route | File | Guard |
|---|---|---|
| `/` | `routes/index.tsx` | `staff-session` OR `current-student` in localStorage, else → `/login` |
| `/login` | `routes/login.tsx` | `current-student` → `/`; `staff-session` → `/admin/login` |
| `/admin/login` | `routes/admin/login.tsx` | `staff-session` → `/` |
| `/students` | `routes/students.tsx` | any auth, else → `/admin/login` |
| `/import` | `routes/import.tsx` | any auth, else → `/admin/login` |
| `/report` | `routes/report.tsx` | `?admin=1`+`admin-preview-student`, OR `current-student` |

All guards are client-side `beforeLoad` callbacks that read `localStorage`. SSR guards are neutered (`if (typeof window === 'undefined') return`).

---

## Frontend → Backend Transport

All calls use **relative** `fetch('/api/...')` (same-origin).

`VITE_APP_URL` (from `src/lib/config.ts:1`) is only used for `window.open` / `<a target="_blank">` links to `/report`:
- `students.tsx:324` — staff preview report
- `StudentDashboard.tsx:634` — student's own report

If `VITE_APP_URL` is empty, path-only URLs are used (functional). If mis-set, the report opens against the wrong host.

---

## Environment Variables

| Name | Where read | Controls |
|---|---|---|
| `MONGO_URI` | `src/lib/db.ts:35` | MongoDB Atlas SRV connection string |
| `ADMIN_EMAIL` | `api/admin-login.ts:18`, `vite.config.ts:51` | Staff login email (fallback `admin@btu.ac.in`) |
| `ADMIN_PASSWORD` | admin-login, all admin API files, vite middleware | Staff password AND bearer key for every admin-only endpoint |
| `VITE_APP_URL` | `src/lib/config.ts:1` | Base URL for `/report` window.open links |

`ADMIN_PASSWORD` is dual-purpose: used for login comparison AND stored plaintext in `localStorage['admin-key']` and sent as `x-admin-key` header on every admin API call.

---

## Third-party Integrations

- **MongoDB Atlas** — primary data store, Mongoose 9
- **Vercel** — serverless function host
- **Bootstrap CDN + MDB UI Kit + html-docx-js + FileSaver.js** — injected at runtime by `report.tsx` (lines 106–129) for the print/Word export page only
- **Google Static images** — hard-coded `encrypted-tbn0.gstatic.com` URL in Word export (`report.tsx:92`)

No payment, email, S3, push-notification, analytics, or WebSocket integration exists.

---

## Dead / Unused Files

| File / Code | Reason dead |
|---|---|
| `src/entry-server.tsx` | SSR entry never referenced by any build target |
| `{false && <>...</>}` blocks in `Dashboard.tsx` (lines 580–689, 1010–1080, 1132–1183, 1236–1316) | Old sidebar + old tab UIs wrapped in false, dead but shipped |
| `xlsx` dep | No import anywhere in `src/` or `api/` |
| `@tanstack/react-start` dep | No import anywhere |
| `dotenv` dep | Vite loads `.env` automatically; never imported |
