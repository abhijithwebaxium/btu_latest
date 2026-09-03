# Gaps, Inconsistencies, Hacks & Dead Code — BTU Campus OS

This document enumerates everything that is incomplete, broken, inconsistent, or potentially harmful. Use it to avoid rebuilding the same issues into the new stack.

---

## Security

### Critical

| Issue | Location | Detail |
|---|---|---|
| `GET /api/students` unauthenticated | `api/students.ts:14-18` | Returns full PII (phone, email, DOB, addresses, parent contacts) for every student. No auth check. Trivially callable cross-origin. |
| `POST /api/students/import` unauthenticated | `api/import.ts:14-22` | Anyone can bulk-overwrite students, courses, branches, evaluations, prevUniSubjects. |
| Live MongoDB Atlas credentials committed | `.env` line 1 | Full SRV connection string with `abhijithsd_db_user` credentials in working tree. `.gitignore` excludes `.env` but it has been present throughout development. Rotate before going public. |
| Weak default admin password | `.env` line 4 | `admin@123` — trivially guessable |

### High

| Issue | Location | Detail |
|---|---|---|
| `GET/POST /api/notifications` unauthenticated | `api/notifications.ts` | Any actor can enumerate any student's notifications, mark them read, or create arbitrary notifications on their behalf. |
| Plaintext admin password in localStorage | `AdminLoginPage.tsx:26` | `localStorage['admin-key']` = the password. XSS or localStorage inspection yields full admin capability. |
| `Access-Control-Allow-Origin: *` | All `api/*.ts` | The no-auth endpoints above are callable cross-origin from any website. |

### Medium

| Issue | Location | Detail |
|---|---|---|
| `POST /api/evaluation/update-subjects` unauthenticated | `vite.config.ts:112-128` | Anyone (in dev) can stamp arbitrary BTU codes onto evaluation subjects. No prod equivalent. |
| Student DOB as password with no lockout | `studentService.ts:9-84` | Last-10 digits of phone + DOB; no rate limit; matched against 4 phone fields per student. |

### Low

| Issue | Location | Detail |
|---|---|---|
| Timing-unsafe admin key compare | All admin-protected endpoints | `===` string compare, not timing-safe. |
| `SupportThread` model force-recreation | `SupportThread.ts:63-66` | `delete mongoose.models.SupportThread` on every import. Can mask dev hot-reload issues. Differs from every other model. |
| `admin-preview-student` never cleared | `students.tsx:323` | Stale full student JSON accumulates in localStorage across sessions. |

---

## Dev/Prod Backend Divergence

| Endpoint | Dev | Prod |
|---|---|---|
| `/api/assignments` | 404 | ✓ `api/assignments.ts` |
| `/api/classes` | 404 | ✓ `api/classes.ts` |
| `/api/internships` | 404 | ✓ `api/internships.ts` |
| `/api/projects` | 404 | ✓ `api/projects.ts` |
| `/api/dashboard-stats` | 404 | ✓ `api/dashboard-stats.ts` |
| `/api/evaluation/update-subjects` | ✓ `vite.config.ts:112` | 404 |

**Consequence in dev:** admin dashboard shows empty lists and zero stats for assignments, classes, internships, projects, and KPI cards. The import flow's `update-subjects` path cannot be tested in prod at all.

---

## Data Model Issues

| Issue | Location | Detail |
|---|---|---|
| `branch` dual representation | `Student.ts:137,178` | Exists as `String` inside `academicDetails.branch` AND as `ObjectId` ref at top level. Consumers check `typeof s.branch === 'object'` to decide which to use. |
| `Student.syllabus` missing from schema | `Student.ts:77` (TS interface only) | Referenced in TypeScript interface but not declared in Mongoose schema block. If passed, dropped silently. Same for `Evaluation.syllabus`. |
| `evaluation.subjects` is `Mixed` | `Evaluation.ts:40` | Each consumer (`students.tsx`, `StudentDashboard.tsx`, `report.tsx`) defines its own local TypeScript interface with different field lists. No single source of truth. |
| `student.CERValidation` | `report.tsx:539-555` | Used in report renderer but no schema field exists anywhere. Dead code path. |
| `Evaluation.remainingCreditsNeeded` | `Evaluation.ts` | Stored field; no code ever writes or reads it. |
| `Evaluation.totalCredits` | `Evaluation.ts` | Stored but only used as fallback in `report.tsx:183`. All actual totals are recomputed. |
| `Student.paymentLevel`, `marketingBatch`, `exams`, `invoices` | `Student.ts` | In schema; nothing writes to or reads from them. |
| `qualificationDetails` subdoc | `Student.ts:157-175` | Fully defined; no UI ever reads it. |

---

## Missing API Endpoints

| Missing operation | Notes |
|---|---|
| PATCH/DELETE single student | No way to update or remove one student |
| Update `isProfileVerified` or `isFeeCompleted` | Fields exist; no write path |
| Edit announcement | Only create/delete; no update |
| Update ticket priority or category | Schema has enums; no API route |
| `/api/evaluation/update-subjects` in prod | Only dev Vite middleware |

---

## UI Bugs & Inconsistencies

| Bug | Location | Detail |
|---|---|---|
| Category `"exams"` not in schema enum | `SupportTicketView.tsx:319` | UI dropdown offers "exams" as a support category, but it is NOT in `SupportThread.category` enum. Submitting causes Mongoose ValidationError with no helpful UI error message. |
| `AdminNavbar` search unused | `AdminPageShell.tsx`, `AdminNavbar.tsx` | Search input wired to `AdminPageShell.searchQuery` state but `/students` and `/import` each have their own local search state. The navbar search does nothing. |
| `notification.link` never used | `NotificationCenter.tsx` | Server populates `link` with deep-link URLs but clicking a notification only marks it read — never navigates. Deep-link routes (`/tickets/[id]`, `/my-tickets/[id]`) don't exist. |
| Dashboard "verified count" bug | `Dashboard.tsx:723` | `students.length - pendingVerifications` — `students` is capped at 100 (client array), `pendingVerifications` is full server count. Wrong when DB > 100 students. |
| Announcement priority sort wrong | `announcementService.ts:39` | `priority: -1` on string enum sorts alphabetically (`high < normal < urgent`), not by severity. |
| `AdminTicketDesk` missing status options | `AdminTicketDesk.tsx:368` | Only exposes `open`, `in_progress`, `resolved` buttons. `resolution_pending` and `closed` are unreachable from admin UI. |
| `SupportTicketView` "resolution_pending" filter visible to student | `SupportTicketView.tsx:388` | Students can filter by `resolution_pending` status but no student action can put a thread in that state (only admin can). |
| Ticket `closed` status unreachable | All | `closed` is in the schema enum but no code path sets it. |
| `ASSIGNMENT_DATES` tripled | `report.tsx:15-33`, `students.tsx:75-79`, `StudentDashboard.tsx:217-221` | Same static map defined in 3 files with slightly different key coverage. |
| Hard-coded "BTU syllabus - 166 Credits" | `report.tsx:402` | Not a configurable value. |
| Hard-coded threshold `83` | `report.tsx:442` | Additional Credit Requirement = `max(0, 83 - totalCredits)`. Not documented or configurable. |
| Google Static image in Word export | `report.tsx:92` | Hard-coded `encrypted-tbn0.gstatic.com` URL. Brittle external asset. |
| Bootstrap/MDB CDN for report | `report.tsx:106-129` | Leaks viewer to external CDNs; breaks offline. |
| `printTable` CSP | `report.tsx` `printTable()` | Writes raw HTML into a new window. No CSP considerations. |
| `Dashboard.tsx ticketSummary.resolved` discarded | `Dashboard.tsx:365` | Destructures `{open, inProgress, urgent}` from `ticketSummary` but API also returns `resolved` — it is discarded. |

---

## Dead Code

| Dead item | Location | Detail |
|---|---|---|
| Old sidebar block | `Dashboard.tsx:580-689` | `{false && <>...</>}` |
| Old assignments tab | `Dashboard.tsx:1010-1080` | `{false && <>...</>}` |
| Old projects tab | `Dashboard.tsx:1132-1183` | `{false && <>...</>}` |
| Old tickets tab | `Dashboard.tsx:1236-1316` | `{false && <>...</>}` |
| `src/entry-server.tsx` | — | SSR entry never referenced by any build target or script |
| `xlsx` dependency | `package.json` | No import anywhere |
| `@tanstack/react-start` dependency | `package.json` | No import anywhere |
| `dotenv` dependency | `package.json` | Vite loads `.env` automatically; never imported |
| `student.CERValidation` code | `report.tsx:539-555` | Schema field doesn't exist |
| Multiple logout implementations | `Dashboard.tsx:376-382`, `Dashboard.tsx:496-501`, `Dashboard.tsx:672-688`, `AdminPageShell.tsx:52-57`, `AdminLoginPage.tsx:24` | Same clear-3-keys logic duplicated 5 times |
| Three sidebar implementations | `AdminSidebar.tsx`, `Dashboard.tsx:580-689` (dead), `StudentDashboard.tsx:300-389` | Three copies of the same visual pattern |
| Notification `link` field | `Notification.ts` | Populated by server, never consumed in UI; routes don't exist |
| Notification kinds `system`, `announcement` | `Notification.ts` | Defined in enum, never created by any code |
| SupportEvent types beyond `status_changed` | `SupportEvent.ts` | `priority_changed`, `category_changed`, `assigned`, `message_sent`, `resolved`, `reopened` are written but never displayed in UI |
| `Evaluation.remainingCreditsNeeded` | `Evaluation.ts` | Stored field; never written or read |

---

## Performance Concerns

| Issue | Location | Detail |
|---|---|---|
| O(N) in-memory student scan on login | `studentService.ts:33` | `Student.find({})` with 4 populates, then iterate in-memory for phone match. Will not scale past a few thousand students. |
| Full student list fetch for count | `import.tsx:40-50`, `Dashboard.tsx:326` | Both fetch all students (capped at 100) just to display a count. |
| No pagination on assignments/classes/internships/projects/announcements | Various | Fetches all records; will degrade as collections grow. |
| Dashboard stats recomputed every request | `api/dashboard-stats.ts` | No caching; 6-month aggregation hit every dashboard load. |

---

## Open Questions for Rebuild

1. **What does `A.E.B.T.U.C` stand for?** Abbreviated exam status codes are not documented; their full names and business meanings are inferred from context. Confirm all codes with the domain owner.
2. **What is `CERValidation`?** The field is referenced in `report.tsx` but has no schema definition. Was this a planned feature? Who sets it?
3. **Is `Student._id` always the BTU ERP string, or is the `STU_<uuid>` fallback ever actually used in production?**
4. **What triggers `isProfileVerified` and `isFeeCompleted` to change?** No write path exists in the app — are these set directly in the database by an external process?
5. **What is `Student.paymentLevel`? Is it meaningful?** No code reads or writes it via the app.
6. **Is the 166-credit target and 83-credit threshold ever going to change?** Both are hard-coded.
7. **Should `improvement` equalized subjects count toward credit totals?** Currently excluded from `report.tsx` totals but shown in student Classes tab. Inconsistent.
8. **What are the full `ASSIGNMENT_DATES` mappings beyond the two keys in `students.tsx`?** `report.tsx` appears to have more entries.
9. **Is the `closed` ticket status intended for future use, or can it be removed?** Nothing sets it.
10. **Is `notification.link` navigation planned?** The deep-link routes don't exist. Should they?
11. **Does BTU plan to have multiple admin users?** Current system is single-credential (`ADMIN_EMAIL`/`ADMIN_PASSWORD`).
12. **Should `/api/evaluation/update-subjects` exist in production?** It's currently dev-only.
13. **What determines which exam batches get deadlines?** The `ASSIGNMENT_DATES` map only covers `Dec-2024` and `June-2025`. What happens for other batches?
