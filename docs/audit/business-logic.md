# Business Logic Audit — BTU Campus OS

---

## Core domain: BTU Credit Transfer

The app's primary function is to track students who transferred to BTU from another university under a "Credit Transfer" scheme. Each student's subjects from their previous university are imported, evaluated against BTU's curriculum, and each subject is tagged with an `equalized` status and an `examStatus` code. The resulting "Credit Evaluation Report" is the main output artifact.

---

## 1. Evaluation `equalized` Field Values

Each element in `evaluation.subjects` has an `equalized` field indicating the outcome of the credit transfer assessment:

| Value | Meaning | Credit treatment |
|---|---|---|
| `'equalized'` | Subject accepted for credit transfer | Contributes to `equalizedCredits` |
| `'reappear'` | Student must appear at BTU exam | Contributes to `theoryCredits` / lab / project buckets (in report) |
| `'re-submission'` | Same treatment as reappear for report totals | Shown as "Re-submission" badge in student UI |
| `'improvement'` | Shown in student Classes tab as current enrollment | NOT included in `report.tsx` credit totals — silently dropped |

**Source:** `report.tsx:161-181`, `StudentDashboard.tsx:212-215`, `students.tsx:87-90`

Reappear subjects (shown in the admin modal and student portal) are those where `equalized ∈ ['reappear', 're-submission', 'improvement']`.

---

## 2. Evaluation `examStatus` Classification

Each reappear subject also has an `examStatus` code indicating what type of assessment is required. These codes are used to split subjects into three buckets:

| `examStatus` code | Label (from `PROJECT_LABELS` / `projectTypeLabel`) | Bucket | Credit variable in report |
|---|---|---|---|
| `A.E.B.T.U.C` | (Externally examined by the University Committee) | Assignments | `theoryCredits`, `countsOfTheory` |
| `A.L.V` | (Attendance Lab Viva — implicit) | Lab | `labCredits`, `countOfLab` |
| `M.I.P.R.S` | Mini Project | Projects | `miniProjectCredits` |
| `M.A.P.R.S.I` | Major Project I | Projects | `majorProjectICredits` |
| `M.A.P.R.S.II` | Major Project II | Projects | `majorProjectIICredits` |
| `I.R.S` | Internship | Internships / Projects tab | `InternshipCredits` |

**Aggregation rule** (`report.tsx:172-181`): a subject only counts toward credit totals if both:
1. `equalized ∈ {'reappear', 're-submission'}` (improvement is excluded)
2. `examStatus` matches one of the codes above

Unknown `examStatus` values are silently dropped from credit totals.

---

## 3. Credit Computation

All credit totals are **computed on demand** — never cached. Computed identically in two places: `report.tsx:161-181` and `StudentDashboard.tsx:212-215`.

| Variable | Computation |
|---|---|
| `equalizedCredits` | Sum of `subject.credits` where `equalized === 'equalized'` |
| `theoryCredits` | Sum where `equalized ∈ {reappear,re-submission}` AND `examStatus === 'A.E.B.T.U.C'` |
| `labCredits` | Sum where `equalized ∈ {reappear,re-submission}` AND `examStatus === 'A.L.V'` |
| `miniProjectCredits` | Sum where `equalized ∈ {reappear,re-submission}` AND `examStatus === 'M.I.P.R.S'` |
| `majorProjectICredits` | Sum where `equalized ∈ {reappear,re-submission}` AND `examStatus === 'M.A.P.R.S.I'` |
| `majorProjectIICredits` | Sum where `equalized ∈ {reappear,re-submission}` AND `examStatus === 'M.A.P.R.S.II'` |
| `InternshipCredits` | Sum where `equalized ∈ {reappear,re-submission}` AND `examStatus === 'I.R.S'` |
| `totalCredits` | `equalizedCredits + theoryCredits + labCredits + miniProjectCredits + majorProjectICredits + majorProjectIICredits + InternshipCredits` |

Hard-coded rules in report:
- `report.tsx:402`: "BTU syllabus - 166 Credits" — hard-coded target
- `report.tsx:442`: Additional Credit Requirement = `max(0, 83 - totalCredits)` — hard-coded threshold

---

## 4. Assignment Deadline Mapping

A static map `ASSIGNMENT_DATES` translates exam batch strings to deadline strings. Defined **redundantly in three files** with slightly different key coverage:

| File | Lines |
|---|---|
| `report.tsx` | 15–33 |
| `students.tsx` | 75–79 |
| `StudentDashboard.tsx` | 217–221 |

Known entries (from students.tsx):
```
'Dec-2024' → '30th October 2024'
'June-2025' → '30th April 2025'
```
(Other entries likely in report.tsx which has more keys.)

---

## 5. Subject Code Normalization (Import)

During import (`studentService.ts:151-163`), each evaluation subject is normalized:

**Regex:** `^([A-Z]{2,6}\d{2,5}[A-Z]?)\s*-\s*(.+)$`

If `equalizedSubject` matches → extract `btuSubjectCode` and `btuSubjectTitle`.  
Otherwise → fall back to raw `subjectCode` / `subjectTitle`.

This normalization only runs at import time. Subjects can be re-stamped later via `updateEvaluationSubjects`.

---

## 6. Evaluation Subject Update Logic

`updateEvaluationSubjects` (`studentService.ts:238-282`):

1. Look up Evaluation by `enrollmentID` (via populated Student).
2. For each input row: find the first subject where `semester === row.semester` AND `credits === row.credits` AND subject has no `btuSubjectCode` yet.
3. Stamp `btuSubjectCode` and `btuSubjectTitle`.
4. If no match found, add row to `notFound` list.

**Ambiguity hazard:** if multiple subjects share the same `(semester, credits)` and none has a code, only the first match is updated per row. Others silently appear in `notFound`.

---

## 7. Ticket State Machine

`SupportThread.status` enum: `open | in_progress | resolution_pending | resolved | closed`

### Transitions

| Trigger | From | To | Side effects |
|---|---|---|---|
| `createThread` | — | `open` | SupportMessage created; `created` event; ADMIN notification |
| Admin `sendMessage` | any | `in_progress` | `message_sent` event; STUDENT notification |
| Student `sendMessage` (on resolved thread) | `resolved` | `open` | `message_sent` event; ADMIN notification |
| Student `sendMessage` (on non-resolved thread) | any | (unchanged) | `message_sent` event; ADMIN notification |
| Admin `updateStatus` to any | any | target | `status_changed` event; if `resolution_pending` stamps `resolutionRequestedAt`; STUDENT notification |
| Student `reopenThread` | any | `open` | `status_changed` event; bumps `lastMessageAt` |

### Unreachable states

- **`closed`**: no code path sets this status. The admin UI only exposes `open`, `in_progress`, `resolved`.
- **`resolution_pending`**: can be set by admin API but not via the admin UI.

### `lastMessageAt`

Bumped by both `sendMessage` and `reopenThread`. Used for sorting thread lists (`lastMessageAt: -1`).

---

## 8. Notification Triggers

All triggered from `src/server/supportService.ts` via `createNotification(...)`:

| Trigger | Recipient | Kind | Created at |
|---|---|---|---|
| Thread created | ADMIN | `ticket_opened` | `supportService.ts:58-64` |
| Admin sends message | STUDENT (thread.studentId) | `ticket_replied` | `supportService.ts:107-115` |
| Student sends message | ADMIN | `ticket_replied` | `supportService.ts:117-123` |
| Admin updateStatus → `resolved` | STUDENT | `ticket_resolved` | `supportService.ts:154-166` |
| Admin updateStatus → other | STUDENT | `ticket_status_changed` | `supportService.ts:154-166` |

### Notification deep-links (unused)

Notifications are created with `link` values:
- Admin notification: `/tickets/${threadId}`
- Student notification: `/my-tickets/${threadId}`

Neither route exists in the app's router. `NotificationCenter.tsx` never uses `n.link` — clicks only mark as read.

Kinds `'system'` and `'announcement'` are in the enum but never created by any current code path.

---

## 9. Announcement Targeting & Expiry

### Targeting

When resolving announcements for a student (`announcementService.ts:35-42`), matches any of:
- `targetType === 'all'`
- `targetType === 'branch'` AND `targetBranch === student.branch`
- `targetType === 'student'` AND `targetStudentId ∈ [studentId, enrollmentID, applicationID]`

### Expiry

`expiresAt = now + durationHours * 3_600_000` set at creation. Query filter: `expiresAt: { $gt: now }`. Expired docs accumulate in the collection — no cleanup job.

**Sort bug:** `priority: -1` on a string enum sorts alphabetically (`high < normal < urgent`) — not by intended severity order.

---

## 10. Delivery Model

- **No push notifications, no email, no WebSockets.**
- All notification delivery is pull-based:
  - `NotificationCenter` polls unread count every 30 s
  - `SupportTicketView` polls thread list every 10 s, active thread messages every 4 s
- Admin-only toast: `NotificationCenter` compares unread count to previous — if it grew AND `recipientType='ADMIN'`, shows a 10 s toast.

---

## 11. Dashboard Aggregation Logic

Computed every request by `api/dashboard-stats.ts`:

| Stat | Source |
|---|---|
| `totalStudents` | `Student.countDocuments({})` |
| `pendingVerifications` | `Student.countDocuments({ verificationPending: true })` |
| `feeIncomplete` | `Student.countDocuments({ isFeeCompleted: { $ne: true } })` |
| `departmentDistribution` | Aggregation: group by `course`, lookup course names, top-6 by count, compute `%` |
| `monthlyData` | 6-month enrollment, assignment, ticket counts via `$group` by month |
| `ticketSummary` | `SupportThread.countDocuments()` for each status + priority=urgent |

**Bug:** `Dashboard.tsx:723` computes "verified" as `students.length - pendingVerifications`. `students.length` is the client array (capped at 100 by fetch), while `pendingVerifications` is the full server count. Result is wrong when DB has >100 students.

---

## 12. Student Matching Algorithm (Login)

1. Strip non-digits from input phone; take last 10 digits.
2. Fetch **all** students (`Student.find({})`) with full populate — O(N) in-memory scan.
3. For each student, normalize all 4 phone fields the same way and compare.
4. On phone match, normalize both stored DOB and input to `DDMMYYYY` digit string and compare.
5. Return first matching student.

**No account lockout, no rate limit, no brute-force protection.**

---

## 13. Course shortCode Derivation

On import, `shortCode = courseName.replace(/[^A-Z0-9]/g, '').substring(0, 6)` (uppercase).

Two different program names starting with the same 6 alphanumerics will produce the same `shortCode`. This doesn't violate the unique index (which is `{name, university}`), but `shortCode` collisions can cause display confusion.

---

## 14. Scheduled Jobs

None exist. No cron, no webhook receiver, no background worker. All data is live-queried from MongoDB per request.
