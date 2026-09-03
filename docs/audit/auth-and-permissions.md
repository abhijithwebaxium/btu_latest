# Auth & Permissions Audit — BTU Campus OS

## Mechanism Overview

**No session cookies. No JWT. No server-side sessions.** All auth state lives in browser `localStorage` and is re-verified by API calls only at login time. Subsequent requests reuse stored tokens.

Two authenticated identities:
1. **Student** — authenticates via phone + DOB; receives full Student JSON stored in localStorage.
2. **Staff/Admin** — authenticates via email + password (env-backed); stores plaintext password as a bearer key for all subsequent admin API calls.

---

## localStorage Keys

| Key | Set at | Cleared at | Contents |
|---|---|---|---|
| `current-student` | `LoginPage.tsx:25` | logout (Dashboard.tsx:378/498/677, AdminPageShell.tsx:54, AdminLoginPage.tsx:24) | Full populated Student JSON — the entire object returned by `POST /api/auth/student-login` |
| `staff-session` | `AdminLoginPage.tsx:25` | logout | Literal string `'1'` (presence = staff authenticated) |
| `admin-key` | `AdminLoginPage.tsx:26` | logout | Plaintext of the admin password entered; reused as `x-admin-key` header |
| `admin-preview-student` | `students.tsx:323` | **never** | Full Student JSON of whichever student a staff member is previewing in `/report?admin=1` |
| `university-theme` | `AdminPageShell.tsx:49`, `Dashboard.tsx:393`, `StudentDashboard.tsx:165` | never | `'dark' \| 'light'` |

`sessionStorage['admin-active-tab']` tracks which admin dashboard tab is active across navigations (`AdminPageShell.tsx:40`, `Dashboard.tsx:275/491/621`).

---

## Login Flows

### Student login (`LoginPage.tsx:12-35`)

1. `POST /api/auth/student-login` with `{ phone, dob }`.
2. Success: remove `staff-session`, set `current-student = JSON.stringify(data.student)`, navigate to `/`.
3. Failure: show inline error.

Server algorithm:
- Strips non-digits from phone; uses last 10 digits.
- Fetches ALL students with full populates (O(N) in-memory scan).
- Matches phone against 4 fields: `mobileNumber`, `whatsAppNumber`, `alternateContact`, `fatherContactNumber`.
- Normalizes DOB to `DDMMYYYY` string; accepts ISO format too.
- No lockout, no rate limit.

### Staff login (`AdminLoginPage.tsx:12-36`)

1. `POST /api/auth/admin-login` with `{ email, password }`.
2. Success: remove `current-student`, set `staff-session='1'`, set `admin-key=<password>`, navigate to `/`.
3. Server compares plain-text against `ADMIN_EMAIL` (default `admin@btu.ac.in`) and `ADMIN_PASSWORD` env vars.
4. No hashing, no rate limit, no MFA, no session invalidation mechanism.

### Logout (duplicated in 5 places)

All clear `staff-session`, `current-student`, `admin-key`, then navigate:
- Student logout → `/login` (`Dashboard.tsx:376-382`)
- Admin logout → `/admin/login` (`Dashboard.tsx:496-501`, `AdminPageShell.tsx:52-57`)
- Dead inline sidebar logout → `Dashboard.tsx:672-688`
- Admin login page clears on new login → `AdminLoginPage.tsx:24`

### Role routing on `/`

`Dashboard.tsx:384-386`: if `JSON.parse(localStorage['current-student'])` succeeds → render `<StudentDashboard>`. Else → admin dashboard.

---

## Route Guards

All guards are client-side `beforeLoad` callbacks reading `localStorage`. Trivially bypassable. SSR is neutered (`if (typeof window === 'undefined') return`).

| Route | Guard logic |
|---|---|
| `/` | `staff-session` OR `current-student` in localStorage, else → `/login` |
| `/login` | `current-student` → `/`; `staff-session` → `/admin/login` |
| `/admin/login` | `staff-session` → `/` |
| `/students` | any auth (student OR staff), else → `/admin/login` |
| `/import` | any auth, else → `/admin/login` |
| `/report` | `?admin=1` + `admin-preview-student`, OR `current-student` present |

---

## Admin API Authentication

All admin-protected API calls send:
```
x-admin-key: <value of localStorage['admin-key']>
```

Server checks: `req.headers['x-admin-key'] === process.env.ADMIN_PASSWORD`

- Simple string equality (`===`) — not timing-safe.
- `ADMIN_PASSWORD` is a single global credential; no per-user keys.
- If ADMIN_PASSWORD is empty/undefined: some endpoints return 503; others return 403.

---

## Role Capability Matrix

| Action | Student | Staff |
|---|---|---|
| `POST /api/auth/student-login` | ✓ | — |
| `POST /api/auth/admin-login` | — | ✓ |
| `GET /api/students` (all PII) | ✓ (no auth check) | ✓ |
| `DELETE /api/students` (wipe all) | — | ✓ (`x-admin-key`) |
| `POST /api/students/import` (bulk write) | ✓ (no auth check) | ✓ |
| `GET /api/announcements` | ✓ | ✓ |
| `GET /api/announcements?mode=admin` | — | ✓ |
| `POST/DELETE /api/announcements` | — | ✓ |
| `GET/POST /api/notifications` (any user's) | ✓ (no auth check) | ✓ |
| `POST /api/support` createThread | ✓ | ✓ (but not in admin UI) |
| `POST /api/support` sendMessage (student) | ✓ | ✓ |
| `POST /api/support` sendMessage (admin) | — | ✓ (`x-admin-key`) |
| `POST /api/support` reopenThread (own) | ✓ | ✓ |
| `POST /api/support` updateStatus | — | ✓ (`x-admin-key`) |
| `GET /api/support` allThreads | — | ✓ |
| `GET /api/assignments` / `classes` / `internships` / `projects` | ✓ | ✓ |
| Mutate assignments/classes/internships/projects | — | ✓ (`x-admin-key`) |
| `GET /api/dashboard-stats` | — | ✓ (`x-admin-key`) |
| `POST /api/evaluation/update-subjects` | ✓ (no auth, dev only) | ✓ |

---

## Security Issues (for rebuild planning)

| Issue | Severity | Detail |
|---|---|---|
| No-auth `GET /api/students` | Critical | Full PII (phone, email, DOB, addresses, parent contacts) of all students accessible to anyone |
| No-auth `POST /api/students/import` | Critical | Anyone can bulk-overwrite courses, branches, evaluations, students |
| No-auth `GET/POST /api/notifications` | High | Any actor can enumerate or create notifications for any student |
| Plaintext admin password in localStorage | High | XSS or localStorage inspection yields full admin capability |
| No-auth `POST /api/evaluation/update-subjects` | Medium | Anyone can stamp arbitrary BTU codes onto evaluation subjects (dev only) |
| Wildcard CORS (`Access-Control-Allow-Origin: *`) | Medium | The no-auth endpoints above are callable cross-origin from any website |
| Student DOB as password | Medium | DOB matched from last-10-digits of any of 4 phone fields; no lockout; no rate limit |
| Plain-text comparison for admin key | Low | Simple `===`, not timing-safe; not currently exploitable without the key |
| SupportThread model force-recreation | Low | Hot-reload stable but unusual pattern; can mask dev issues |
| `admin-preview-student` never cleared | Low | Stale student data persists in localStorage across sessions |

---

## Rebuild Recommendations

- Use server-side sessions or short-lived signed JWTs; never store credentials in localStorage.
- Add `x-admin-key` or equivalent auth to `GET /api/students`, `POST /api/students/import`, and `GET/POST /api/notifications`.
- Hash the admin password at rest (bcrypt); use a timing-safe compare on the server.
- Rotate the MongoDB Atlas connection string (currently committed).
- Generate a long random secret for admin API key (not a human-memorable password).
- Add rate-limiting and lockout to all auth endpoints.
- Remove `CORS: *`; scope to the app's own domain.
- Route guards should be enforced server-side, not just in `beforeLoad`.
