# Data Model Audit — BTU Campus OS

14 MongoDB collections, all accessed via Mongoose 9. Connection is cached on `globalThis.mongooseCache` (`src/lib/db.ts:11-17`). Uses Cloudflare/Google DNS fallback for SRV lookup on Windows (`src/lib/db.ts:22-28`). 8 s server-selection timeout.

---

## Collection: `students`

Schema: `src/models/Student.ts`

Uses `_id: String` (not ObjectId) — the string ID from BTU ERP, or a synthesized `STU_<uuid>` (`src/lib/studentParser.ts:123`).

### Top-level fields

| Field | Type | Default | Indexed |
|---|---|---|---|
| `_id` | String | — | PK |
| `university` | String | `'BTU'` | ✓ |
| `status` | String | `'student'` | ✓ |
| `studyMode` | String | `'Credit Transfer'` | — |
| `applicationID` | String | — | ✓ |
| `enrollmentID` | String | — | ✓ |
| `enrollmentType` | String | `'Permanent'` | — |
| `admissionBatch` | String | — | ✓ |
| `marketingBatch` | String | — | — |
| `programLevel` | Number | — | — |
| `isProfileVerified` | Boolean | `false` | — |
| `verificationPending` | Boolean | `true` | — |
| `isFeeCompleted` | Boolean | `false` | — |
| `paymentLevel` | String | — | — |
| `importedAt` | Date | `Date.now` | — |
| `createdAt`, `updatedAt` | Date | auto | — |
| `fee` | Mixed | — | — |
| `invoices` | [Mixed] | — | — |
| `exams` | [Mixed] | — | — |

Compound index: `{ enrollmentID: 1, applicationID: 1, 'personalDetails.email': 1 }`.

### `personalDetails` subdoc

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, trim, indexed |
| `fatherName`, `motherName` | String | — |
| `dateOfBirth` | String | — |
| `mobileNumber`, `whatsAppNumber`, `alternateContact`, `fatherContactNumber`, `motherContactNumber` | Mixed | accept string or number |
| `email` | String | lowercase, trim, indexed |
| `religion`, `category`, `gender`, `bloodGroup`, `nationality` | String | — |
| `district`, `state`, `country` | String | — |
| `pincode` | Mixed | — |
| `idCardNumber`, `permanentAddress`, `correspondenceAddress`, `knownDisease` | String | — |
| `photo`, `idCard`, `signature`, `medicalRecord` | Mixed | shape `{ url?: string; isSubmitted?: boolean }` |

### `academicDetails` subdoc

| Field | Type | Notes |
|---|---|---|
| `nameOfPrograme` | String | trim, indexed |
| `branch` | String | string name (separate from ObjectId ref at top level) |
| `courseCategory` | String | — |
| `courseCompletionYear` | String | e.g. `'2024-06'` |
| `parentUniversity` | String | — |
| `periodOfStudyAtParentUniversity` | String | — |
| `lastExamAtParentUniversity` | String | — |
| `semesterCompletedAtParentUniversity` | Number | — |
| `ABCUserId` | String | — |
| `numberOfBacklogsAtParentUniversity` | `{ theory: Number, lab: Number }` | both default 0 |
| `projectCompletedAtParentUniversity` | `{ completed: Boolean, nameOfProject, organization }` | — |
| `academicSession` | String | — |

### `qualificationDetails` subdoc

Secondary / senior-secondary / diploma boards, marks, percentages, Mixed mark-list docs. `migrationCertificate` and `affidavit` are Mixed. **UI never reads this subdoc.**

### References (ObjectId)

| Field | Points to |
|---|---|
| `course` | `Course._id` |
| `branch` | `Branch._id` |
| `prevUniSubjects` | `PrevUniSubjects._id` |
| `evaluation` | `Evaluation._id` |

**Note:** `branch` exists both as `ObjectId` ref (top-level) and as a `String` inside `academicDetails.branch`. Consumers check `typeof s.branch === 'object'` to decide which to use.

---

## Collection: `courses`

Schema: `src/models/Course.ts`

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, trim |
| `university` | String | required, trim |
| `shortCode` | String | required, trim (first 6 alphanumeric chars of name) |
| `numberOfSemesters` | Number | default 8 |
| `semestersRequired` | Number | default 4 |
| `status` | Boolean | default true |

Unique compound: `{ name: 1, university: 1 }`. Written by `studentService.ts:106-116` on import (upsert).

---

## Collection: `branches`

Schema: `src/models/Branch.ts`

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, trim |
| `shortCode` | String | required, trim |
| `course` | ObjectId → Course | — |
| `status` | Boolean | default true |
| `subjects` | `[{ semester, subjectTitle, subjectCode, credit, status }]` | BTU syllabus subjects |

Unique compound: `{ course: 1, name: 1 }`. Written by `studentService.ts:119-129` on import.

---

## Collection: `prevunisubjects`

Schema: `src/models/PrevUniSubjects.ts`

| Field | Type | Notes |
|---|---|---|
| `student` | String | indexed (Student._id) |
| `prevUniSubDetails` | `[{ subjectTitle, subjectCode, credits, grade, mark, result, semester }]` | previous-university transcript |
| `markList` | `[{ semester, name: [String], isSubmitted }]` | upload status per semester |

Written by `studentService.ts:135-143` (upsert keyed by student string ID).

---

## Collection: `evaluations`

Schema: `src/models/Evaluation.ts`

| Field | Type | Notes |
|---|---|---|
| `student` | String | indexed (Student._id string) |
| `course` | ObjectId | — |
| `branch` | ObjectId | — |
| `syllabus` | ObjectId | written nowhere; effectively dead |
| `approvalStage` | Number | default 0 |
| `evaluationStatus` | String | default `'Pending'` |
| `totalCredits` | Number | default 0 — stored but rarely used |
| `remainingCreditsNeeded` | Number | default 0 — stored but never read or written by app logic |
| `subjects` | [Mixed] | see shape below |

### `subjects` element shape (inferred from TypeScript interfaces across 3 files)

| Field | Where used |
|---|---|
| `btuSubjectCode` | students.tsx, StudentDashboard.tsx, report.tsx |
| `btuSubjectTitle` | students.tsx, StudentDashboard.tsx, report.tsx |
| `semester` | all consumers |
| `equalized` | values: `equalized`, `reappear`, `re-submission`, `improvement` |
| `equalizedSubject` | import normalizer regex source |
| `mark`, `grade`, `credits` | report.tsx, StudentDashboard.tsx |
| `examBatch` | students.tsx, report.tsx |
| `examStatus` | classification — see business-logic.md |
| `result` | report.tsx |
| `subjectCode`, `subjectTitle` | fallback in StudentDashboard.tsx |
| `examBatchSr`, `examSession`, `examSessionSr`, `semesterSet` | StudentDashboard.tsx |

**No single TypeScript type covers all these fields; each file defines its own interface.**

---

## Collection: `announcements`

Schema: `src/models/Announcement.ts`

| Field | Type | Notes |
|---|---|---|
| `title` | String | required |
| `message` | String | required |
| `targetType` | enum(`'all'`,`'branch'`,`'student'`) | required |
| `targetBranch` | String | default `''` |
| `targetStudentId` | String | default `''` |
| `priority` | enum(`'normal'`,`'high'`,`'urgent'`) | default `'normal'` |
| `expiresAt` | Date | required; computed from `durationHours` on creation |

Active filter: `expiresAt > now` (computed, not stored). Expired docs stay in the collection — no cleanup job.

Sort bug: `priority: -1` on a string enum sorts alphabetically (`high < normal < urgent`), not by severity.

---

## Collection: `notifications`

Schema: `src/models/Notification.ts`

| Field | Type | Notes |
|---|---|---|
| `studentId` | String | indexed; optional for ADMIN recipients |
| `recipientType` | enum(`'STUDENT'`,`'ADMIN'`) | required, indexed |
| `kind` | enum(`'ticket_opened'`,`'ticket_replied'`,`'ticket_status_changed'`,`'ticket_resolved'`,`'system'`,`'announcement'`) | required |
| `title` | String | required |
| `body` | String | required |
| `link` | String | optional deep-link — **never used by the UI** |
| `isRead` | Boolean | default false, indexed |
| `isDeleted` | Boolean | default false (soft-delete) |
| `readAt` | Date | — |

Compound indexes: `{ studentId, isDeleted, createdAt: -1 }` and `{ recipientType, isDeleted, createdAt: -1 }`.

Kinds `system` and `announcement` are defined but never created by any current code path.

---

## Collection: `supportthreads`

Schema: `src/models/SupportThread.ts`

| Field | Type | Notes |
|---|---|---|
| `studentId` | String | required, indexed |
| `studentName` | String | — |
| `subject` | String | required, trim |
| `status` | enum(`'open'`,`'in_progress'`,`'resolution_pending'`,`'resolved'`,`'closed'`) | default `'open'`, indexed |
| `priority` | enum(`'low'`,`'normal'`,`'high'`,`'urgent'`) | default `'normal'` |
| `category` | enum(`'general'`,`'academic'`,`'assignment'`,`'project'`,`'documents'`,`'fee'`,`'technical'`,`'administration'`,`'facility'`,`'other'`) | default `'general'` |
| `assignedTo` | String | — |
| `lastMessageAt` | Date | default `Date.now` |
| `resolutionRequestedAt` | Date | stamped when status → `resolution_pending` |

Compound indexes: `{ studentId, status, createdAt: -1 }` and `{ status, priority, lastMessageAt: -1 }`.

**Hack:** model file force-deletes `mongoose.models.SupportThread` on import and re-registers (lines 63–66). Intended to fix cached enum in dev hot-reload. All other models use safe `mongoose.models.X || mongoose.model(...)` pattern.

---

## Collection: `supportmessages`

Schema: `src/models/SupportMessage.ts`

| Field | Type | Notes |
|---|---|---|
| `threadId` | ObjectId → SupportThread | required, indexed |
| `senderType` | enum(`'student'`,`'admin'`) | required |
| `senderId` | String | required |
| `senderName` | String | required |
| `body` | String | required, trim |

`updatedAt` disabled. Index: `{ threadId, createdAt: 1 }`.

---

## Collection: `supportevents`

Schema: `src/models/SupportEvent.ts`

| Field | Type | Notes |
|---|---|---|
| `threadId` | ObjectId → SupportThread | required, indexed |
| `actorType` | enum(`'student'`,`'admin'`) | required |
| `actorName` | String | required |
| `eventType` | enum(`'created'`,`'status_changed'`,`'priority_changed'`,`'category_changed'`,`'assigned'`,`'message_sent'`,`'resolved'`,`'reopened'`) | required |
| `oldValue` | String | — |
| `newValue` | String | — |

`updatedAt` disabled. Index: `{ threadId, createdAt: 1 }`.

Only `status_changed` events are shown in the UI timeline. Other event types are written but never displayed.

---

## Collection: `assignments`

Schema: `src/models/Assignment.ts`

| Field | Type | Default |
|---|---|---|
| `title` | String | required |
| `course` | String | required |
| `deadline` | String | required |
| `submitted` | Number | 0 |
| `total` | Number | 50 |
| `status` | String | `'Active'` (no enum) |
| `priority` | String | `'Medium'` (no enum) |

---

## Collection: `classitems`

Schema: `src/models/ClassItem.ts`

| Field | Type | Default |
|---|---|---|
| `title` | String | required |
| `code` | String | required |
| `instructor` | String | required |
| `time` | String | `'TBD'` |
| `room` | String | `'TBD'` |
| `status` | String | `'Upcoming'` (toggled between `'Live Now'` and `'Completed'`) |
| `students` | Number | 0 |

---

## Collection: `internships`

Schema: `src/models/Internship.ts`

| Field | Type | Default |
|---|---|---|
| `company` | String | required |
| `role` | String | required |
| `location` | String | `'Remote'` |
| `stipend` | String | `'N/A'` |
| `applicants` | Number | 0 |
| `status` | String | `'Open'` (no enum) |
| `logo` | String | `'🏢'` (emoji) |

---

## Collection: `projects`

Schema: `src/models/Project.ts`

| Field | Type | Default |
|---|---|---|
| `title` | String | required |
| `lead` | String | required |
| `tech` | [String] | — |
| `progress` | Number | 0–100, default 0 |
| `status` | String | `'Development'` (no enum) |
| `category` | String | `'General'` (no enum) |

---

## Relationships Summary

```
Student.course          → Course._id
Student.branch          → Branch._id   (also Student.academicDetails.branch: String — dual)
Student.prevUniSubjects → PrevUniSubjects._id
Student.evaluation      → Evaluation._id
Branch.course           → Course._id
Evaluation.student      → Student._id  (String, not ObjectId ref)
PrevUniSubjects.student → Student._id  (String, not ref)
SupportMessage.threadId → SupportThread._id
SupportEvent.threadId   → SupportThread._id
Notification.studentId  → Student._id  (String, not ref)
```

Populated on fetch: `studentService.ts:26-30, 227-231` populates `course`, `branch`, `evaluation`, `prevUniSubjects` on both auth and directory fetch.

---

## Computed vs Stored

| Value | Where | How |
|---|---|---|
| Announcement "active" | `announcementService.ts:39` | Computed: `expiresAt > now` |
| Notification soft-delete | `notificationService.ts:61-64` | Stored flag `isDeleted` |
| Evaluation credit totals (`equalizedCredits`, `theoryCredits`, etc.) | `report.tsx:161-181`, `StudentDashboard.tsx:212-215` | Computed on demand every render |
| `Evaluation.totalCredits` | DB field | Stored but used only as fallback (`report.tsx:183`) |
| `Student.verificationPending` / `isProfileVerified` | DB fields | Independent stored booleans |
| Dashboard 6-month rollups | `api/dashboard-stats.ts:68-105` | MongoDB aggregation computed every request |
