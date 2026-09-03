# Build Plan — BTU Campus OS (Rebuild)

Ordered checklist for rebuilding on TanStack Start + Tailwind + shadcn/ui against the existing MongoDB/API backend.

Each item lists: the audit doc(s) it draws from, and any open questions from `gaps-and-questions.md` that should be resolved **before** writing that item.

---

## Phase 1 — Auth + Shell

The entire app requires auth and layout before any page can be built. These items have no cross-dependencies and must land first.

---

### 1.1 Server-side route guards / middleware

- **Audit refs:** `auth-and-permissions.md` §Route Guards, §Role capability matrix
- **What to build:** Replace the existing client-side `beforeLoad` guards with server-enforced middleware (TanStack Start `loader`/middleware). Two identities: `current-student` (student) and `staff-session` (admin). Routes `/`, `/students`, `/import` and their children must reject unauthenticated requests before any HTML is sent.
- **Open questions:** None blocking. Decide session storage strategy (HTTP-only cookie vs signed token) before starting — it affects everything below.

---

### 1.2 Student login page (`/login`)

- **Audit refs:** `features-by-page.md` §/login, `api-surface.md` §POST /api/auth/student-login, `auth-and-permissions.md` §Student login
- **What to build:**
  - [ ] Two-field form: phone (`type="tel"`) + DOB (`type="text"`, placeholder `DDMMYYYY`)
  - [ ] Loading state on submit
  - [ ] Inline error display
  - [ ] On success: establish session, redirect to `/`
  - [ ] Link to staff sign-in
- **Open questions:**
  - GaQ #1: The server accepts ISO-format DOB strings as well as `DDMMYYYY`. The UI placeholder only shows `DDMMYYYY`. Confirm which format the new UI should guide users toward (the server tolerates both, but the UX should be explicit).

---

### 1.3 Admin / staff login page (`/admin/login`)

- **Audit refs:** `features-by-page.md` §/admin/login, `api-surface.md` §POST /api/auth/admin-login, `auth-and-permissions.md` §Staff login
- **What to build:**
  - [ ] Two-field form: email + password
  - [ ] Loading state; error display
  - [ ] On success: establish staff session, redirect to `/`
  - [ ] Feature list preview panel (static copy)
- **Open questions:**
  - GaQ #11: Does BTU plan to have multiple named admin users? The current system is a single shared credential (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). If multi-user is coming, design the auth table now rather than retrofitting.

---

### 1.4 Logout (unified)

- **Audit refs:** `auth-and-permissions.md` §Logout
- **What to build:** A single logout action/server-function that clears the session. Currently duplicated across 5 files — consolidate into one callable utility.
- **Note:** Student logout → `/login`; staff logout → `/admin/login`. Role must be detectable at logout time.
- **Open questions:** None.

---

### 1.5 Admin layout shell (sidebar + navbar)

- **Audit refs:** `features-by-page.md` §AdminPageShell, §AdminSidebar, §AdminNavbar, `architecture.md` §Routing
- **What to build:**
  - [ ] Sidebar nav groups: Overview (Dashboard), Academics (Students, Import Evaluation), Support (Support Tickets, Assignment Chats, Project Chats, Announcements)
  - [ ] Mobile hamburger + overlay
  - [ ] Navbar: page title slot, search slot, theme toggle, notification bell slot
  - [ ] Animated active-nav pill (currently `framer-motion layoutId`)
  - [ ] Theme toggle: `dark | light`, persisted to user preference store
  - [ ] Sidebar navigation logic: `students → /students`, `import → /import`, all other tabs → `/ ` with tab param (currently via `sessionStorage['admin-active-tab']` — replace with URL search param or router state)
- **Note:** The `AdminNavbar` search input is currently wired to dead state on `/students` and `/import` (each page has its own local search). In the rebuild, remove the navbar search entirely or wire it properly per-page.
- **Open questions:** None blocking.

---

### 1.6 Student layout shell (sidebar / tab bar)

- **Audit refs:** `features-by-page.md` §StudentDashboard (sidebar portion), `auth-and-permissions.md`
- **What to build:**
  - [ ] Tab navigation: overview, evaluation, transcripts, classes, assignments, projects, profile, support (+ chat-assignments, chat-projects as sub-tabs)
  - [ ] Theme toggle
  - [ ] Logout action (calls 1.4)
  - [ ] Notification bell (wired to NotificationCenter component, built in Phase 2)
- **Open questions:** None.

---

## Phase 2 — Read-only / Low-risk Pages

Pages that only read data or perform soft/safe writes (mark-read). Build these after the shell is stable.

---

### 2.1 Admin dashboard — KPI cards

- **Audit refs:** `features-by-page.md` §Dashboard admin "dashboard" tab, `api-surface.md` §GET /api/dashboard-stats, `business-logic.md` §Dashboard Aggregation
- **What to build:**
  - [ ] Four stat cards: Total Students, Pending Verification, Academic Chats, Open Support Tickets
  - [ ] "Total Students" → links to `/students`
  - [ ] Open Support Tickets: shows `X Urgent` or `X In Progress` badge
  - [ ] Graceful degradation: each card shows "—" if its API call fails
- **Bug to fix:** The current app computes "verified count" as `clientStudents.length - serverPendingCount`. This is wrong when the DB has >100 students (`students` fetch is capped at 100; `pendingVerifications` is a full server count). In the rebuild, fetch the verified count directly from the dashboard-stats response or a dedicated count endpoint.
- **Open questions:**
  - GaQ #11: Multi-admin user question affects whether the dashboard greeting is personalised.

---

### 2.2 Admin dashboard — department chart + 6-month table

- **Audit refs:** `features-by-page.md` §dashboard tab (performance table, pie chart), `api-surface.md` §GET /api/dashboard-stats
- **What to build:**
  - [ ] Pie / donut chart from `departmentDistribution` (top-6 courses by student count, percentage values pre-computed by API)
  - [ ] 6-month table: month, enrollments, assignments, tickets, Health badge (`0=Excellent`, `≤5=Strong`, else `Watch`)
- **Open questions:** None.

---

### 2.3 Admin dashboard — Today's Live Classes (read view)

- **Audit refs:** `features-by-page.md` §dashboard tab classes section, `api-surface.md` §GET /api/classes
- **What to build:** Read-only card list of the first 3 classes. Status toggle lives in Phase 3 (2.6 / 3.6).
- **Open questions:** None.

---

### 2.4 Admin dashboard — Recent Support Tickets (read view)

- **Audit refs:** `features-by-page.md` §dashboard tab tickets section, `api-surface.md` §GET /api/support
- **What to build:** First 3 open tickets. "Resolve" button lives in Phase 3.
- **Open questions:** None.

---

### 2.5 Student directory listing (`/students`)

- **Audit refs:** `features-by-page.md` §/students, `api-surface.md` §GET /api/students, `data-model.md` §students
- **What to build:**
  - [ ] Search bar: debounced 300 ms, `?q=` query param
  - [ ] Desktop table view + mobile card view
  - [ ] Pagination: 20 per page in memory (server hard-caps at 100 results)
  - [ ] Loading + empty states
  - [ ] Per-row action buttons (Assignments, Projects, Internships → modal in Phase 4; Report → Phase 3)
- **Security note (for new stack):** `GET /api/students` currently has no auth. Add server-side auth enforcement on this endpoint before exposing the listing.
- **Open questions:** None blocking the listing itself. The student academic modal (GaQ #1, #8) is Phase 4.

---

### 2.6 Student dashboard — Overview tab

- **Audit refs:** `features-by-page.md` §StudentDashboard overview, `business-logic.md` §Credit Computation, §equalized field, `api-surface.md` §GET /api/announcements
- **What to build:**
  - [ ] Announcement banners (color by priority; "Xd left" / "Xh left" countdown from `expiresAt`)
  - [ ] 3 KPI cards: EQUALIZED CREDITS, REAPPEAR CREDITS, TOTAL CREDITS (all computed client-side from `evaluation.subjects`)
  - [ ] Academic Profile grid: Enrollment ID, Programme, Branch, Parent University, Academic Session, Admission Batch, Study Mode, Profile Status
  - [ ] Credit progress bars: BTU Evaluation, Credit Transfers, Semesters Completed (of 8)
  - [ ] Fee status pill
- **Open questions:**
  - GaQ #7: `improvement`-equalized subjects are shown in Classes tab but excluded from report credit totals. Confirm whether they should appear in the overview KPI numbers.

---

### 2.7 Student dashboard — Evaluation tab

- **Audit refs:** `features-by-page.md` §StudentDashboard evaluation, `data-model.md` §evaluations, `business-logic.md` §equalized field, §examStatus, §Subject Code Normalization
- **What to build:**
  - [ ] 4 stat cards: total subjects, total credits, equalized credits, equalized subjects
  - [ ] Subject table with code/title parsed via `BTU_CODE_RE = /^([A-Z]{2,6}\d{2,5}[A-Z]?)\s*-\s*(.+)$/`
  - [ ] Link to Credit Evaluation Report
- **Open questions:**
  - GaQ #1: Confirm the meaning of all `examStatus` codes so column labels are correct.

---

### 2.8 Student dashboard — Transcripts tab

- **Audit refs:** `features-by-page.md` §StudentDashboard transcripts, `data-model.md` §prevunisubjects
- **What to build:**
  - [ ] Previous-university subjects table (falls back to equalized evaluation subjects when `prevUniSubDetails` is empty)
  - [ ] Reappear/Re-submission table with type badges: Improvement / Re-submission / Reappear
- **Open questions:** None.

---

### 2.9 Student dashboard — Classes tab

- **Audit refs:** `features-by-page.md` §StudentDashboard classes, `business-logic.md` §examStatus, §ASSIGNMENT_DATES
- **What to build:**
  - [ ] Grouped by semester; all reappear subjects (`equalized ∈ ['reappear','re-submission','improvement']`) as current enrollment
  - [ ] Per-card: subject code, title, credits, exam batch, `ASSIGNMENT_DATES[batch]` due date, exam session
- **Open questions:**
  - GaQ #8: The `ASSIGNMENT_DATES` map in `students.tsx` only has 2 entries (`Dec-2024`, `June-2025`). `report.tsx` appears to have more. Get the full authoritative map before building — cards with unknown batches will show no due date.
  - GaQ #7: Should `improvement` subjects appear here? Currently they do in the existing code.

---

### 2.10 Student dashboard — Profile tab

- **Audit refs:** `features-by-page.md` §StudentDashboard profile, `data-model.md` §students §personalDetails §academicDetails
- **What to build:**
  - [ ] Hero banner: University, Batch, Mode, Status pills; verified/pending badge; fee-cleared pill
  - [ ] Personal Details, Contact, Address grids
  - [ ] Student ID card visual (barcode is decorative — generate from student ID characters)
  - [ ] Academic Snapshot key-value rows
  - [ ] Fee status card
- **Note:** `qualificationDetails` subdoc exists in schema but the UI never reads it. Do not expose unless explicitly required.
- **Open questions:**
  - GaQ #4: `isProfileVerified` and `isFeeCompleted` are stored booleans but no app write path exists. Clarify what external process sets them so the new UI can display them accurately.
  - GaQ #5: `paymentLevel` field exists but nothing reads it. Confirm whether it should appear on the profile.

---

### 2.11 Notification center (read + mark-read)

- **Audit refs:** `features-by-page.md` §NotificationCenter, `api-surface.md` §GET/POST /api/notifications, `business-logic.md` §Notification Triggers
- **What to build:**
  - [ ] Bell with unread count badge (cap at "99+")
  - [ ] Popover/panel: filter tabs (All / Unread only)
  - [ ] Per-notification: icon by kind, timestamp via `timeAgo()`, click to mark read, trash to soft-delete
  - [ ] "Mark all read", "Clear all" actions
  - [ ] Poll unread count every 30 s
  - [ ] Admin-only new-ticket toast (unread count growth detection)
  - [ ] Pagination / "load more" — the current app only shows the first 20 items with no load-more control. Add it.
- **Open questions:**
  - GaQ #10: `notification.link` is populated by the server with deep-link URLs (`/tickets/${id}`, `/my-tickets/${id}`) but the routes don't exist and the UI never navigates. Decide: (a) implement the deep-link routes in the new stack, or (b) drop the `link` field. This affects the notification click handler.

---

### 2.12 Admin internships tab (read-only card grid)

- **Audit refs:** `features-by-page.md` §Dashboard internships tab, `api-surface.md` §GET /api/internships, `data-model.md` §internships
- **What to build:** Read-only card grid. Create/edit/delete is Phase 3.
- **Open questions:** None.

---

## Phase 3 — Core Write Flows

Forms, mutations, exports. Require stable auth (Phase 1) and confirmed data shapes.

---

### 3.1 JSON student import (`/import`)

- **Audit refs:** `features-by-page.md` §/import, `api-surface.md` §POST /api/students/import, `business-logic.md` §Subject Code Normalization, `data-model.md`
- **What to build:**
  - [ ] Drag-and-drop + click-to-browse `.json` file picker; client validates extension
  - [ ] POST raw JSON to `/api/students/import`
  - [ ] Success state: "Processed N records" + preview of first 10 imported students + "Go to Directory" button
  - [ ] Error state with message
  - [ ] DB record count display on mount
- **Open questions:**
  - GaQ #3: Is `Student._id` always the BTU ERP string in production, or is the `STU_<uuid>` fallback ever triggered? Matters for displaying IDs.
  - GaQ #12: Should `/api/evaluation/update-subjects` exist in the new prod backend? Currently dev-only and missing from prod. Decide before building the import flow, as it is the only way to stamp BTU subject codes post-import.

---

### 3.2 Clear database action (import page)

- **Audit refs:** `api-surface.md` §DELETE /api/students, `auth-and-permissions.md`
- **What to build:**
  - [ ] Trash button with confirm dialog
  - [ ] DELETE `/api/students` with admin auth
  - [ ] On success: reset local counts
- **Security note:** `GET /api/students` is currently called just to get a count on mount — replace with a proper count endpoint or read from dashboard-stats.
- **Open questions:** None.

---

### 3.3 Announcement create + delete (AdminAnnouncementDesk)

- **Audit refs:** `features-by-page.md` §AdminAnnouncementDesk, `api-surface.md` §POST/DELETE /api/announcements, `business-logic.md` §Announcement Targeting & Expiry
- **What to build:**
  - [ ] Create form: title, message (textarea), targetType (all/branch/student), priority (normal/high/urgent), targetValue (conditional on type), duration chip picker (1h/6h/12h/1d/3d/1w/2w/30d)
  - [ ] Announcement list with priority badge, active/expired badge, target label, time-remaining label
  - [ ] Delete with confirm dialog
- **Known gap to consciously add:** No edit/update endpoint exists in the current API. If editing announcements is needed, add `PUT /api/announcements` to the new backend.
- **Bug to fix:** Server sorts by `priority: -1` on a string field — alphabetical order (`high < normal < urgent`) rather than severity order. Fix the sort in the new backend.
- **Open questions:** None blocking.

---

### 3.4 Support ticket create (student)

- **Audit refs:** `features-by-page.md` §SupportTicketView "New Ticket", `api-surface.md` §POST /api/support createThread, `business-logic.md` §Ticket State Machine, `data-model.md` §supportthreads
- **What to build:**
  - [ ] Form: subject, category dropdown, priority (low/normal/high/urgent), message body
  - [ ] POST `action:'createThread'`
  - [ ] Navigate to new thread on success
- **Bug to fix:** The existing UI category dropdown includes `"exams"` which is NOT in the `SupportThread.category` schema enum — server returns a Mongoose ValidationError. Remove `"exams"` from the dropdown (or add it to the schema enum, after confirming with domain owner).
- **Open questions:**
  - GaQ #9: Is `closed` ticket status intended for future use? If yes, should staff be able to set it from the new UI?

---

### 3.5 Support ticket messaging — student + admin

- **Audit refs:** `features-by-page.md` §SupportTicketView, §AdminTicketDesk, `api-surface.md` §POST /api/support sendMessage, `business-logic.md` §Ticket State Machine, §Notification Triggers
- **What to build:**
  - [ ] Message list (left thread list + right message pane)
  - [ ] Events timeline (status-changed events only are shown; other event types are written but not displayed)
  - [ ] Send box: Enter to send, Shift+Enter for newline
  - [ ] If thread is `resolved` or `closed`: hide reply box, show "Reopen" button
  - [ ] Poll thread list every 10 s; poll active thread messages every 4 s (or replace with SSE/WS)
  - [ ] Status filter chips: All, Open, In Progress, Pending, Resolved
- **Note:** Admin reply hard-codes `senderName: 'BTU Admin'`. If multi-user admin is implemented (GaQ #11), use the authenticated admin's name instead.
- **Open questions:**
  - GaQ #9: `resolution_pending` can be set via API but is not in the admin UI's status buttons. Should the new admin UI surface it?
  - GaQ #11: Multi-admin affects the sender name displayed in messages.

---

### 3.6 Admin ticket status update

- **Audit refs:** `features-by-page.md` §AdminTicketDesk status buttons, `api-surface.md` §POST /api/support updateStatus, `business-logic.md` §Ticket State Machine
- **What to build:**
  - [ ] "Set status:" button row for the active thread: `open`, `in_progress`, `resolved`
  - [ ] Calls `action:'updateStatus'`; updates thread list on success
- **Known gap:** `resolution_pending` and `closed` statuses have no UI trigger. Add if confirmed needed (GaQ #9).
- **Open questions:**
  - GaQ #9: Confirm desired final state of the status machine.

---

### 3.7 Admin CRUD — Assignments

- **Audit refs:** `features-by-page.md` §Dashboard assignments tab, `api-surface.md` §GET/POST/PUT/DELETE /api/assignments, `data-model.md` §assignments
- **What to build:**
  - [ ] Assignment list (sorted `createdAt: -1`)
  - [ ] Create form: title (required), course (required), deadline (required), submitted, total, status, priority
  - [ ] Edit (PUT) inline or modal
  - [ ] Delete with confirm
- **Note:** `status` and `priority` are free-form strings in the current schema (no enum). Decide whether to enforce values in the UI.
- **Open questions:** None.

---

### 3.8 Admin CRUD — Classes

- **Audit refs:** `features-by-page.md` §Dashboard classes tab, `api-surface.md` §GET/POST/PUT/DELETE /api/classes, `data-model.md` §classitems
- **What to build:**
  - [ ] Class list
  - [ ] Create form: title (required), code (required), instructor (required), time, room, students count
  - [ ] Status toggle: `Live Now` ↔ `Completed` (PUT)
  - [ ] Edit + Delete
- **Open questions:** None.

---

### 3.9 Admin CRUD — Internships

- **Audit refs:** `features-by-page.md` §Dashboard internships tab, `api-surface.md` §GET/POST/PUT/DELETE /api/internships, `data-model.md` §internships
- **What to build:**
  - [ ] Create form: company (required), role (required), location, stipend, applicants, status, logo (emoji)
  - [ ] Edit + Delete
- **Open questions:** None.

---

### 3.10 Admin CRUD — Projects

- **Audit refs:** `features-by-page.md` §Dashboard projects tab (currently not a distinct admin tab — live in assignments tab via AdminTicketDesk), `api-surface.md` §GET/POST/PUT/DELETE /api/projects, `data-model.md` §projects
- **What to build:**
  - [ ] Create form: title (required), lead (required), tech (array), progress (0–100), status, category
  - [ ] Edit + Delete
- **Note:** `tech` must be an array — if sent as a string the API defaults to `[]`.
- **Open questions:** None.

---

### 3.11 Credit Evaluation Report — view (`/report`)

- **Audit refs:** `features-by-page.md` §/report, `business-logic.md` §Credit Computation, §ASSIGNMENT_DATES, §examStatus, `data-model.md` §evaluations
- **What to build:**
  - [ ] Dual mode: admin preview (`?admin=1` + server-held preview student) and student self-view
  - [ ] Full multi-section report table: personal, academic, transfer equivalency, equalized credit summary, reappear list with deadlines, credit-completion matrix
  - [ ] Static figures: "BTU syllabus - 166 Credits", Additional Credit = `max(0, 83 - totalCredits)`
  - [ ] LH (Learning Hours) figures per project type (currently hard-coded; confirm values with domain owner)
- **Open questions:**
  - GaQ #2: What is `CERValidation`? The existing code shows a validator signature block when `student.CERValidation?.status` is set, but no schema field exists. Either implement the feature or drop the block.
  - GaQ #6: Is the 83-credit threshold ever going to change? If yes, make it configurable.
  - GaQ #7: Should `improvement` subjects count toward totals in the report? Currently they don't.
  - GaQ #8: Get the full `ASSIGNMENT_DATES` map — only 2 entries are in the most-read file; `report.tsx` has more.

---

### 3.12 Credit Evaluation Report — PDF export

- **Audit refs:** `features-by-page.md` §/report printTable, `architecture.md` §Third-party integrations
- **What to build:**
  - [ ] "Save as PDF" → opens print-formatted window using Bootstrap layout
- **Note:** Current implementation injects Bootstrap and MDB CSS via CDN `<link>` tags at runtime. In the rebuild, either bundle the print styles locally or use a headless-print library to avoid CDN leakage and offline breakage.
- **Open questions:** None blocking.

---

### 3.13 Credit Evaluation Report — Word export

- **Audit refs:** `features-by-page.md` §/report convertToWord
- **What to build:**
  - [ ] "Save as Word" → generates `.docx` file
- **Note:** Current implementation uses `html-docx-js` and `FileSaver.js` injected from CDN, and references a hard-coded `encrypted-tbn0.gstatic.com` image URL inside the Word template. In the rebuild: use `html-docx-js` or `docx` as a proper npm dependency; host the template image locally.
- **Open questions:** None.

---

### 3.14 Student — initiate assignment/project chat

- **Audit refs:** `features-by-page.md` §StudentDashboard assignments/projects tabs, `api-surface.md` §POST /api/support createThread
- **What to build:**
  - [ ] Assignments tab: filtered reappear subjects (`examStatus === 'A.E.B.T.U.C'`), grouped by semester, "Chat" button per subject
  - [ ] Projects tab: filtered reappear subjects (`examStatus ∈ ['M.I.P.R.S','M.A.P.R.S.I','M.A.P.R.S.II','I.R.S']`), grouped by semester, "Chat" button per subject
  - [ ] "Chat" POSTs `action:'createThread'` with `category:'assignment'` or `category:'project'` and navigates to the relevant chat sub-tab
- **Open questions:**
  - GaQ #1: Confirm all `examStatus` codes and their meaning so subject-type badges are correctly labelled.

---

### 3.15 Student — ticket reopen

- **Audit refs:** `features-by-page.md` §SupportTicketView reopen, `api-surface.md` §POST /api/support reopenThread, `business-logic.md` §Ticket State Machine
- **What to build:** "Reopen" button shown when `thread.status ∈ ['resolved','closed']`. Calls `action:'reopenThread'`.
- **Open questions:** None.

---

## Phase 4 — Edge Cases & Admin-only Screens

Permissions, states that require the core pages to be working first, and features with open design questions.

---

### 4.1 Student academic modal (admin `/students` page)

- **Audit refs:** `features-by-page.md` §StudentAcademicModal, `business-logic.md` §equalized field, §examStatus, §ASSIGNMENT_DATES
- **What to build:**
  - [ ] Segmented pill tabs: Assignments / Projects / Internships
  - [ ] Per-tab subject cards: subject code, title, semester, credits, exam batch, deadline (from `ASSIGNMENT_DATES`), exam session
  - [ ] Subject counts on tabs
  - [ ] ESC + backdrop click to close
- **Open questions:**
  - GaQ #1: Confirm all `examStatus` code meanings.
  - GaQ #8: Get the full `ASSIGNMENT_DATES` map before building — cards with unknown batch keys will show no due date.

---

### 4.2 Admin report preview (`/report?admin=1`)

- **Audit refs:** `features-by-page.md` §/report admin mode, `auth-and-permissions.md` §localStorage Keys
- **What to build:**
  - [ ] "Report" button on `/students` page stores preview student server-side (not in localStorage) and opens `/report?admin=1` in a new tab
  - [ ] `/report` in admin mode reads from server session, not `localStorage['admin-preview-student']`
  - [ ] "Close" button instead of "Back"
- **Note:** The existing implementation stores the full student JSON in `localStorage['admin-preview-student']` and never clears it — stale data persists across sessions. In the rebuild, store the preview student ID in the session and re-fetch on the report page.
- **Open questions:**
  - GaQ #2: `CERValidation` block resolution (same as 3.11).

---

### 4.3 Notification deep-link navigation

- **Audit refs:** `business-logic.md` §Notification Triggers (§6 "Links used"), `features-by-page.md` §NotificationCenter
- **What to build:** Currently `notification.link` is populated by the server (`/tickets/${threadId}`, `/my-tickets/${threadId}`) but the routes don't exist and the click handler ignores it. If deep links are wanted, implement the routes and wire the click handler. If not, drop the `link` field from the API contract.
- **Open questions:**
  - GaQ #10: **Must be resolved before building this.** Should clicking a notification navigate to the thread? If yes, what are the target routes?

---

### 4.4 Role enforcement — student accessing admin routes

- **Audit refs:** `auth-and-permissions.md` §Role capability matrix, §Route Guards
- **What to build:** In the new server-rendered stack, enforce on the server that:
  - Students cannot reach `/students`, `/import`, or any admin-only dashboard tab
  - Staff cannot reach student-facing evaluation/transcript/profile tabs as their own view
- **Note:** The existing client-side guards are trivially bypassable. This must be server-enforced in TanStack Start loaders.
- **Open questions:** None.

---

### 4.5 Empty states — all listing views

- **Audit refs:** `features-by-page.md` (each section notes the empty state)
- **What to build:** Consistent empty state component for: student directory, assignments, classes, internships, projects, announcements, support threads, notifications.
- **Open questions:** None.

---

### 4.6 Error states — all API call failures

- **Audit refs:** `api-surface.md` §Canonical error shape
- **What to build:** Consistent error display for `{ success: false, error: string }` responses, and for network failures. Each listing view and form should show a recoverable error state with a retry option.
- **Open questions:** None.

---

### 4.7 Announcement targeting — branch + individual student

- **Audit refs:** `features-by-page.md` §AdminAnnouncementDesk, `business-logic.md` §Announcement Targeting
- **What to build:**
  - [ ] When `targetType='branch'`: show branch name input (or dropdown if branches are fetched)
  - [ ] When `targetType='student'`: show student ID input; server matches against `[studentId, enrollmentID, applicationID]`
  - [ ] Student-facing banner: show announcements matching all/branch/student targeting rules
- **Open questions:** None.

---

### 4.8 Support ticket polling / real-time

- **Audit refs:** `features-by-page.md` §SupportTicketView (polling intervals), `business-logic.md` §Delivery
- **Current behaviour:** Thread list polled every 10 s; active thread messages polled every 4 s; notification unread count polled every 30 s.
- **What to build:** Replicate poll-based behaviour at minimum. Consider replacing with SSE or WebSocket if the new server runtime supports it — the polling intervals are aggressive and will generate load at scale.
- **Open questions:** None blocking (polling works; SSE/WS is a deliberate upgrade choice).

---

### 4.9 Admin — profile verification + fee-completed update

- **Audit refs:** `data-model.md` §students (`isProfileVerified`, `isFeeCompleted`), `gaps-and-questions.md`
- **What to build:** The existing app has no UI or API to update these fields. If admin staff need to verify profiles or mark fees complete, add: a toggle/button on the student detail view and a `PATCH /api/students/:id` endpoint.
- **Open questions:**
  - GaQ #4: **Must be resolved first.** Who sets `isProfileVerified` and `isFeeCompleted`? Is it an external ERP process, or should staff do it in this app? The answer determines whether this feature belongs in the rebuild at all.

---

### 4.10 Evaluation update-subjects (import page)

- **Audit refs:** `api-surface.md` §POST /api/evaluation/update-subjects, `business-logic.md` §Evaluation Subject Update Logic
- **What to build:** Currently dev-only (no prod endpoint). If this feature is needed, add `api/evaluation-update.ts` to the new backend.
- **Open questions:**
  - GaQ #12: **Must be resolved first.** Should this endpoint exist in production? It's the only mechanism to stamp BTU subject codes post-import. If yes, it also needs auth (currently unprotected even in dev).

---

### 4.11 Notification `system` and `announcement` kinds

- **Audit refs:** `data-model.md` §notifications, `business-logic.md` §Notification Triggers
- **What to build:** These two `kind` values are defined in the enum but never created by any current code path. If system alerts or announcement notifications are desired features in the new app, implement the creation triggers and ensure `NotificationCenter` displays them correctly.
- **Open questions:** None blocking (these are additive features).

---

### 4.12 Support ticket `resolution_pending` state

- **Audit refs:** `business-logic.md` §Ticket State Machine, `features-by-page.md` §AdminTicketDesk
- **What to build:** `resolution_pending` is a valid schema status and `resolutionRequestedAt` is stamped when it is set, but there is no admin UI button to set it and no student UI button to request it. Decide:
  - (a) Add a "Request Resolution" button to the student ticket view
  - (b) Add it to the admin status buttons
  - (c) Remove it from the schema
- **Open questions:**
  - GaQ #9: **Must be resolved** before building the ticket status UI.

---

### 4.13 Support ticket `closed` status

- **Audit refs:** `business-logic.md` §Ticket State Machine, `data-model.md` §supportthreads
- **What to build:** `closed` is in the enum but no code path sets it. Either add a UI trigger for admin to close tickets permanently, or remove the value from the schema.
- **Open questions:**
  - GaQ #9: **Must be resolved** — same question as 4.12.

---

## Open Questions Summary (from `gaps-and-questions.md`)

Questions that block specific items are noted above. Full list for reference:

| # | Question | Blocks |
|---|---|---|
| 1 | What do `A.E.B.T.U.C`, `A.L.V`, `M.I.P.R.S`, `M.A.P.R.S.I`, `M.A.P.R.S.II`, `I.R.S` abbreviations mean in full? | 1.2, 2.7, 3.14, 4.1 |
| 2 | What is `CERValidation`? Who sets it? | 3.11, 4.2 |
| 3 | Is `Student._id` always the BTU ERP string in prod? | 3.1 |
| 4 | Who sets `isProfileVerified` / `isFeeCompleted`? | 4.9 |
| 5 | Is `Student.paymentLevel` meaningful? Should it appear on profile? | 2.10 |
| 6 | Are the 166-credit target and 83-credit threshold ever going to change? | 3.11 |
| 7 | Should `improvement`-equalized subjects count toward credit totals? | 2.6, 2.9, 3.11 |
| 8 | What are all the `ASSIGNMENT_DATES` batch → deadline mappings? | 2.9, 3.11, 4.1 |
| 9 | What is the intended final state of the ticket status machine (`closed`, `resolution_pending`)? | 3.4, 3.6, 4.12, 4.13 |
| 10 | Should clicking a notification navigate to the thread? If yes, what are the routes? | 4.3 |
| 11 | Will BTU ever need multiple named admin users? | 1.3, 2.1, 3.5 |
| 12 | Should `/api/evaluation/update-subjects` exist in the new prod backend? | 3.1, 4.10 |
| 13 | What `ASSIGNMENT_DATES` entries cover exam batches beyond Dec-2024 and June-2025? | 2.9, 4.1 |
