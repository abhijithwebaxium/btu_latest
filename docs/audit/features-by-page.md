# Features by Page — BTU Campus OS

---

## `/login` — Student Sign-in

**Files:** `src/routes/login.tsx` → `src/components/LoginPage.tsx`

- Two-panel card; background `/image/btu.jpg`
- Fields:
  - `phone` — `type="tel" required`, placeholder `9876543210`
  - `dob` — `type="text" required`, placeholder `18092002 (DDMMYYYY)`. ISO format also accepted by server.
- Loading state: button text `'Verifying account...'`, disabled
- Error state: red panel above form with `AlertCircle` icon
- No client-side validation beyond `required`
- Link to staff sign-in on branding panel

---

## `/admin/login` — Staff Sign-in

**Files:** `src/routes/admin/login.tsx` → `src/components/AdminLoginPage.tsx`

- Same two-panel layout, styled slate/rose
- Fields: `email (type=email required)`, `password (type=password required)`
- Loading text: `'Verifying credentials...'`
- Feature list preview panel in branding panel (Students, Import evaluations, Announcements)

---

## `/` — Dashboard (role-split)

**Files:** `src/routes/index.tsx` → `src/components/Dashboard.tsx`

### Role split

- `JSON.parse(localStorage['current-student'])` succeeds → renders `<StudentDashboard>`
- Else → admin dashboard (see below)

### Admin Dashboard

**Active tab** determined by `sessionStorage['admin-active-tab']` (validated against known tab list); falls back to `'dashboard'`.

**Data fetch on mount** (`Dashboard.tsx:318-374`): `Promise.allSettled` over 7 endpoints. Missing responses degrade silently.

#### Tab: `dashboard`

- Greeting header "Welcome back, Academic Portal 👋"
- 4 KPI cards:
  - **TOTAL STUDENTS** — click → `/students`
  - **PENDING VERIFICATION** — count from `verificationPending: true` (server count)
  - **ACADEMIC CHATS** — open threads with `category in ['assignment','project']` (client-side split)
  - **OPEN SUPPORT TICKETS** — open threads with `category NOT IN ['assignment','project']`; shows `X Urgent` or `X In Progress` badge
- 6-month performance table: `month, enrollments, assignments, tickets` with "Health" derived (`0=Excellent, ≤5=Strong, else Watch`)
- Department distribution pie chart (recharts PieChart)
- "Today's Live Classes" — first 3 classes; button toggles `Live Now` ↔ `Completed` (calls `PUT /api/classes`)
- "Recent Support Tickets" — first 3 open tickets; "Resolve" button calls `POST /api/support {action:'updateStatus', status:'resolved'}`

**Bug:** `totalStudents` displayed on dashboard card comes from `students.length` (client array, capped at 100), while `pendingVerifications` comes from a full server count. If DB > 100 students, "verified" KPI is wrong.

#### Tab: `assignments`

Renders `<AdminTicketDesk initialCategoryFilter="assignment">`

#### Tab: `projects`

Renders `<AdminTicketDesk initialCategoryFilter="project">`

#### Tab: `tickets`

Renders `<AdminTicketDesk initialCategoryFilter="support">`

#### Tab: `classes`

List of all classes with status toggle button (`Live Now` / `Completed`).

#### Tab: `internships`

Read-only card grid of internship listings.

#### Tab: `announcements`

Renders `<AdminAnnouncementDesk>`

---

## `/students` — Student Directory

**Files:** `src/routes/students.tsx`

- Header: title, refresh button, "Import Evaluation" button → `/import`
- Search bar: debounced 300 ms, sends `?q=...` to `GET /api/students`
- Loading state: full-panel spinner
- Empty state: text message
- Pagination: 20 per page in memory (`PAGE_SIZE = 20`); page numbers with ellipsis. Both mobile cards and desktop table views.

### Per-student actions

Four actions available in both mobile and desktop views:

| Button | Behavior |
|---|---|
| **Report** | Sets `localStorage['admin-preview-student']`, opens `${APP_URL}/report?admin=1` in new tab |
| **Assignments** | Opens `<StudentAcademicModal>` pre-filtered to assignments tab |
| **Projects** | Opens `<StudentAcademicModal>` pre-filtered to projects tab |
| **Internships** | Opens `<StudentAcademicModal>` pre-filtered to internships tab |

### StudentAcademicModal

Computes subject buckets from `student.evaluation.subjects` where `equalized ∈ ['reappear','re-submission','improvement']`:

| `examStatus` value | Bucket |
|---|---|
| `A.E.B.T.U.C` | Assignments |
| `M.I.P.R.S`, `M.A.P.R.S.I`, `M.A.P.R.S.II` | Projects |
| `I.R.S` | Internships |

Per-subject cards show: semester, credits, exam batch, exam session. Assignments also show `ASSIGNMENT_DATES[batch]` deadline.

ESC key closes modal. Backdrop click closes modal.

---

## `/import` — JSON Import

**Files:** `src/routes/import.tsx`

- Drag-and-drop + click-to-browse `.json` file input
- Client validates extension/mime is `.json`
- Sends raw file text to `POST /api/students/import`
- Success: "Successfully processed N student record(s)…" + "Go to Directory" button
- Shows first 10 imported preview cards (`lastImported`)
- **"Clear DB" button** (trash icon): confirm dialog → `DELETE /api/students` with `X-Admin-Key`. On success, clears counts.
- Loads DB count on mount by fetching all students and reading `.length` — inefficient.

---

## `/report` — Credit Evaluation Report

**Files:** `src/routes/report.tsx`

### Modes

| Mode | Condition | Data source |
|---|---|---|
| Admin preview | `?admin=1` + `localStorage['admin-preview-student']` | Staff-set preview student |
| Student view | else | `localStorage['current-student']` |

### Runtime dependencies (injected via `<link>`/`<script>` tags, unmounted on cleanup)

- Bootstrap CSS (CDN)
- MDB UI Kit CSS (CDN)
- `html-docx-js` (CDN)
- `FileSaver.js` (CDN)

### Actions

- **Back / Close** — navigate back or close preview
- **Save as PDF** — `printTable()` opens a print-formatted window with Bootstrap layout
- **Save as Word** — `convertToWord()` uses `window.htmlDocx.asBlob` + `window.saveAs`; references a hard-coded Google Static image URL in the Word template

### Report content

- Personal details table
- Academic background
- Transfer equivalency table
- Equalized credit summary
- Reappear / re-submission list with `ASSIGNMENT_DATES` deadlines
- Complex credit-completion matrix with `rowspan`/`colspan`
- Hard-coded: "BTU syllabus - 166 Credits" (line 402), Additional Credit = `max(0, 83 - totalCredits)` (line 442)
- LH (Learning Hours) figures hard-coded per project type

**Dead code:** `if (student.CERValidation?.status)` validator signature block (line 539–555) — no schema field exists for `CERValidation`.

---

## StudentDashboard

**File:** `src/components/StudentDashboard.tsx`

Rendered by `Dashboard.tsx:384-386` when `current-student` is present.

### Tabs

`overview | evaluation | transcripts | classes | assignments | projects | profile | support | chat-assignments | chat-projects`

### On mount

- Fetches active announcements: `GET /api/announcements?studentId=&enrollmentID=&applicationID=&branch=`
- Reads/writes theme

### Tab: `overview`

- Welcome header + program + branch
- Announcement banners (color-coded by priority; time remaining label)
- 3 KPI cards: EQUALIZED CREDITS, REAPPEAR CREDITS, TOTAL CREDITS
- Academic Profile grid (8 fields)
- Credit Summary progress bars: BTU Evaluation, Credit Transfers, Semesters Completed (of 8)
- Fee status pill

### Tab: `evaluation`

- 4 stat cards: total subjects, total credits, equalized credits, equalized subjects
- Subject table; regex `BTU_CODE_RE = /^([A-Z]{2,6}\d{2,5}[A-Z]?)\s*-\s*(.+)$/` splits embedded `CODE - Title`
- "Credit Evaluation Report" link → `/report` in new tab

### Tab: `transcripts`

- Previous-university subjects table (falls back to equalized evaluation subjects when `prevUniSubDetails` missing)
- Reappear/Re-submission table with type badges: Improvement / Re-submission / Reappear

### Tab: `classes`

- Grouped by semester; all reappear subjects shown as "current enrollment"
- Per-card: `subjectCode`, title, credits, exam batch, `ASSIGNMENT_DATES[batch]` due date, exam session

### Tab: `assignments`

- Filter: `reappearSubs.filter(s => s.examStatus === 'A.E.B.T.U.C')`
- Grouped by semester
- "Chat" button → `openChat()` → `POST /api/support {action:'createThread', category:'assignment'}` → navigate to `chat-assignments` tab

### Tab: `projects`

- Filter: `examStatus ∈ ['M.I.P.R.S','M.A.P.R.S.I','M.A.P.R.S.II','I.R.S']`
- `projectTypeLabel`: `M.I.P.R.S: 'Mini Project'`, `M.A.P.R.S.I: 'Major Project I'`, `M.A.P.R.S.II: 'Major Project II'`, `I.R.S: 'Internship'`
- "Chat" → creates thread with `category:'project'`

### Tab: `support`

Renders `<SupportTicketView categoryFilter=undefined>` — shows only general/non-academic tickets.

### Tab: `chat-assignments`

Renders `<SupportTicketView categoryFilter='assignment'>`

### Tab: `chat-projects`

Renders `<SupportTicketView categoryFilter='project'>`

### Tab: `profile`

- Hero banner with 4 stat pills (University, Batch, Mode, Status), verified/pending badge, fee-cleared pill
- Personal Details grid, Contact grid, Address grid
- Student ID card visual (with fake barcode generated from `sid.charCodeAt` values)
- Academic Snapshot key-value rows
- Fee status card

**Footer:** hard-coded `academics@btu.ac.in`.

---

## SupportTicketView (Student)

**File:** `src/components/SupportTicketView.tsx`

- Props: `studentId`, `studentName`, `initialThread?`, `categoryFilter?`
- Filters threads by category: if `categoryFilter` set → only that category; else exclude `assignment` and `project`
- Status filter chips: All, Open, In Progress, Pending, Resolved
- Left pane: thread list; Right pane: messages + events timeline
- "New Ticket" button (only when no `categoryFilter`): opens form with subject, category, priority, message body
  - **Bug:** category option `"exams"` is in the UI dropdown but NOT in the SupportThread schema enum → server Mongoose ValidationError
- Chat send: Enter to send, Shift+Enter for newline
- Polls thread list every 10 s; polls active thread messages every 4 s
- If thread status is `resolved` or `closed`: hides reply box, shows "Reopen" button → `POST /api/support {action:'reopenThread'}`

---

## AdminTicketDesk

**File:** `src/components/AdminTicketDesk.tsx`

- Props: `initialCategoryFilter`, `initialStatusFilter='all'`
- Same left/right layout as SupportTicketView
- Sends `x-admin-key` header on all fetches
- Status filter chips: all, open, in_progress, resolution_pending, resolved
- Colored left stripe for assignment (violet) and project (cyan) threads
- Header "Set status:" buttons: `open`, `in_progress`, `resolved` only — cannot set `resolution_pending` or `closed` from admin UI
- Reply hard-codes `senderType:'admin'`, `senderId:'admin'`, `senderName:'BTU Admin'`

---

## AdminAnnouncementDesk

**File:** `src/components/AdminAnnouncementDesk.tsx`

- Form: title (required), message (required, textarea), targetType (all/branch/student), priority (normal/high/urgent), targetValue (conditional), duration chip picker (1h/6h/12h/1d/3d/1w/2w/30d)
- Announcement list: title, priority badge, active/expired badge, target label, time remaining
- Delete: confirm dialog → `DELETE /api/announcements?id=`

---

## NotificationCenter

**File:** `src/components/NotificationCenter.tsx`

- Props: `studentId?`, `recipientType='STUDENT'`
- Bell button with unread badge (capped at "99+")
- Polls unread count every 30 s; fetches full list only when popover opens
- Filter tabs: All updates / Unread only
- Per-notification: click marks read (if unread), trash icon soft-deletes, timestamp via `timeAgo()`
- "Mark all read", "Refresh", "Clear all" controls
- Admin-only new-ticket toast: when unread count grows AND `recipientType='ADMIN'`, shows 10 s toast
- **Bug:** clicking a notification never navigates via `n.link` — only marks as read. The `link` field is populated by server but unused in the UI.
- No "load more" / pagination — always shows first 20 items

---

## AdminPageShell

**File:** `src/components/AdminPageShell.tsx`

Wraps `/students` and `/import` (not `/`). Renders `AdminSidebar` + `AdminNavbar` + children.

Theme detection order: `document.documentElement.dataset.theme` → `localStorage['university-theme']` → `prefers-color-scheme`.

---

## AdminSidebar

**File:** `src/components/AdminSidebar.tsx`

Nav groups:
- Overview: Dashboard
- Academics: Students (`/students`), Import Evaluation (`/import`)
- Support: Support Tickets, Assignment Chats, Project Chats, Announcements (all navigate via `sessionStorage['admin-active-tab']` + `navigate('/')`)

Uses `framer-motion layoutId="admin-sidebar-active"` for animated active pill.

---

## AdminNavbar

**File:** `src/components/AdminNavbar.tsx`

- Search bar (state wired up in `AdminPageShell` but **never consumed** by `/students` or `/import` — each page has its own local search state)
- Theme toggle
- Notification control slot (accepts `notificationControl` ReactNode)
