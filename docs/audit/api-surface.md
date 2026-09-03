# API Surface Audit — BTU Campus OS

Every endpoint exists in two places: `vite.config.ts` (dev middleware) and `api/*.ts` (Vercel prod). Where they differ, both are noted. All requests use relative `fetch('/api/...')` from the browser (same-origin).

---

## Canonical error shape

```json
{ "success": false, "error": "<message>" }
```

HTTP status codes: `400` validation, `401` bad login, `403` missing/wrong admin key, `404` not found, `405` method not allowed, `413` payload too large, `500` unexpected, `503` admin password not configured.

---

## `POST /api/auth/student-login`

- Dev: `vite.config.ts:28-43` → `src/server/studentService.ts:9-84`
- Prod: `api/login.ts:4-24`
- Auth: **none** (public)

**Request body:**
```json
{ "phone": "string", "dob": "string" }
```
`university: 'BTU'` is also sent by LoginPage but ignored server-side.

**Response 200:**
```json
{ "success": true, "student": { /* full populated Student doc */ } }
```

**Response 401:**
```json
{ "success": false, "error": "<one of 5 messages>" }
```

**Algorithm:**
1. Strip non-digits from phone; use last 10 digits.
2. Fetch all students (`Student.find({})`) with full populates, iterate in-memory.
3. Match phone against `mobileNumber`, `whatsAppNumber`, `alternateContact`, `fatherContactNumber`.
4. Normalize DOB to `DDMMYYYY`; accepts raw digits or ISO string (`2002-09-18T...`).
5. Compare digit strings.

**Scale issue:** O(N × 4-populates) for every login. Will not scale past a few thousand students.

---

## `POST /api/auth/admin-login`

- Dev: `vite.config.ts:45-76`
- Prod: `api/admin-login.ts:3-38`
- Auth: **none** (public)

**Request body:** `{ "email": "string", "password": "string" }`

**Response 200:** `{ "success": true, "role": "staff" }`
**Response 401:** `{ "success": false, "error": "Invalid email or password." }`
**Response 503:** when `ADMIN_PASSWORD` env is not set

Compares plain-text against `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars. No hashing, no rate limit, no lockout.

---

## `POST /api/students/import`

- Dev: `vite.config.ts:78-102`
- Prod: `api/import.ts:4-28`
- Auth: **none** — no `x-admin-key` check despite touching every collection

**Request body:** Raw JSON — single student object or array. 5 MB size limit (413 if exceeded).

**Response 200:**
```json
{ "success": true, "count": 0, "upsertedCount": 0, "modifiedCount": 0, "records": [ /* first 10 */ ] }
```

**Behavior per record:** upsert Course → upsert Branch → upsert PrevUniSubjects → upsert Evaluation (normalizes subjects) → bulkWrite upsert Student.

---

## `GET /api/students`

- Dev: `vite.config.ts:104-110`
- Prod: `api/students.ts:14-18`
- Auth: **none** — returns full PII with no auth check

**Query params:** `?q=<search>` — regex-escaped, case-insensitive, matched against `_id | enrollmentID | applicationID | personalDetails.name | personalDetails.email | academicDetails.nameOfPrograme`.

**Response 200:**
```json
{ "success": true, "students": [ /* populated Student docs, max 100, sorted updatedAt: -1 */ ] }
```

---

## `DELETE /api/students`

- Dev: `vite.config.ts:130-141`
- Prod: `api/students.ts:20-27`
- Auth: `X-Admin-Key: <ADMIN_PASSWORD>` header required (403 if wrong/missing)

**Response 200:** `{ "success": true, "deletedCount": 0 }`

**Destructive:** wipes Students, Courses, Branches, Evaluations, PrevUniSubjects in one call (`studentService.ts:284-293`).

---

## `POST /api/evaluation/update-subjects`

- **Dev only** (`vite.config.ts:112-128`) — **no matching `api/*.ts` file; 404 in prod**
- Auth: **none**

**Request body:**
```json
[{ "enrollmentID": "", "btuSubjectCode": "", "btuSubjectTitle": "", "semester": 0, "credits": 0 }]
```

**Response:** `{ "success": true, "updated": 0, "notFound": [] }`

**Match algorithm:** finds Evaluation by enrollmentID → matches subject by `(semester, credits, subject has no code yet)`. If multiple subjects share same semester+credits and none has a code, only the first is updated — others silently appear in `notFound`.

---

## `GET /api/announcements`

- Dev: `vite.config.ts:144-177`
- Prod: `api/announcements.ts:9-51`

**Student mode** (no auth):
- Query: `?studentId=&enrollmentID=&applicationID=&branch=`
- Returns active announcements (`expiresAt > now`) matching `targetType='all'` OR `branch=<name>` OR student in ID array, sorted `priority: -1, createdAt: -1`

**Admin mode** (`?mode=admin`):
- Auth: `x-admin-key` header required
- Returns all announcements sorted `createdAt: -1`

---

## `POST /api/announcements`

- Auth: `x-admin-key` header required

**Request body:**
```json
{
  "title": "string",
  "message": "string",
  "targetType": "all|branch|student",
  "targetBranch": "optional",
  "targetStudentId": "optional",
  "priority": "normal|high|urgent",
  "durationHours": 24
}
```

**Response 201:** `{ "success": true, "announcement": { /* ... */ } }`

`expiresAt` = `now + durationHours * 3_600_000`.

---

## `DELETE /api/announcements`

- Auth: `x-admin-key` header required
- Query: `?id=<announcementId>`
- Hard delete. No update/edit endpoint exists.

---

## `GET /api/notifications`

- Auth: **none**

**Actions via query param:**

| `?action=` | Additional params | Returns |
|---|---|---|
| `unreadCount` | `recipientType`, `studentId?` | `{ success, count }` |
| (default) | `recipientType`, `studentId?`, `filter=all\|unread\|read`, `page`, `limit` (default 20) | `{ success, items, total, page, totalPages }` |

---

## `POST /api/notifications`

- Auth: **none** — anyone can create or modify any notification

**Body actions:**

| `action` | Additional fields | Effect |
|---|---|---|
| `markRead` | `id` | Sets `isRead=true`, stamps `readAt` |
| `markAllRead` | `studentId?`, `recipientType` | Bulk update |
| `delete` | `id` | Soft-delete: `isDeleted=true` |
| `clearAll` | `studentId?`, `recipientType` | Soft-delete many |
| `create` | `data: { studentId?, recipientType, kind, title, body, link? }` | Creates notification |

---

## `GET /api/support`

- Auth: `x-admin-key` required only for `action=allThreads`

| `?action=` | Auth | Returns |
|---|---|---|
| `studentThreads&studentId=X` | none | `{ success, threads }` sorted `lastMessageAt: -1` |
| `thread&threadId=X` | none | `{ success, thread, messages, events }` or 404 |
| `allThreads&status=&category=&page=&limit=` | admin key | paginated thread list; `category=support` uses `$nin: ['assignment','project']` |

---

## `POST /api/support`

**Body actions:**

| `action` | Auth | Behavior | Side effects |
|---|---|---|---|
| `createThread` | none | Creates thread, initial message | SupportEvent `created`; ADMIN Notification `ticket_opened` |
| `sendMessage` | none (student) / admin key (senderType=admin) | Appends message | Updates thread status; event `message_sent`; notification to opposite party |
| `reopenThread` | none (must be own thread) | Forces status → `open` | Event `status_changed`; bumps `lastMessageAt` |
| `updateStatus` | admin key | Sets any status | Event `status_changed`; stamps `resolutionRequestedAt` if `resolution_pending`; STUDENT notification |

---

## `GET/POST/PUT/DELETE /api/assignments` — **Prod only**

- `api/assignments.ts:9-63`; **404 in dev**
- Auth: none for GET; `x-admin-key` for POST/PUT/DELETE
- GET: `{ success, assignments }` sorted `createdAt: -1`
- POST required fields: `title`, `course`, `deadline`
- PUT: `{ id, ...updates }`
- DELETE: `{ id }` in body

---

## `GET/POST/PUT/DELETE /api/classes` — **Prod only**

- `api/classes.ts:9-63`; **404 in dev**
- POST required fields: `title`, `code`, `instructor`

---

## `GET/POST/PUT/DELETE /api/internships` — **Prod only**

- `api/internships.ts:9-63`; **404 in dev**
- POST required fields: `company`, `role`

---

## `GET/POST/PUT/DELETE /api/projects` — **Prod only**

- `api/projects.ts:9-62`; **404 in dev**
- POST required fields: `title`, `lead`; `tech` must be array (defaults to `[]` if not)

---

## `GET /api/dashboard-stats` — **Prod only**

- `api/dashboard-stats.ts:10-150`; **404 in dev**
- Auth: `x-admin-key` required

**Response 200:**
```json
{
  "success": true,
  "totalStudents": 0,
  "pendingVerifications": 0,
  "feeIncomplete": 0,
  "departmentDistribution": [{ "name": "string", "value": 0, "color": "string" }],
  "monthlyData": [{ "month": "string", "year": 0, "enrollments": 0, "assignments": 0, "tickets": 0 }],
  "ticketSummary": { "open": 0, "inProgress": 0, "resolved": 0, "urgent": 0 }
}
```

Uses MongoDB aggregation with `$lookup` on `courses`. Computed every request — no caching.

---

## Pagination Summary

| Endpoint | Strategy |
|---|---|
| `/api/notifications` | Server-side: `page` + `limit` (default 20), returns `total`, `totalPages` |
| `/api/support` allThreads | Server-side: `page` + `limit` (default 30) |
| `/api/students` | Server-caps at 100; client paginates 20/page in memory |
| Assignments / Classes / Internships / Projects / Announcements | No pagination |

---

## Missing endpoints

| Missing operation | Notes |
|---|---|
| PATCH/DELETE single student | No way to update or remove one student record |
| Update `isProfileVerified` or `isFeeCompleted` | Schema has fields; no write path |
| Update announcement | Only create/delete; no edit |
| Update ticket priority or category | Schema has enums; no API route |
| `/api/evaluation/update-subjects` in prod | Only exists in dev Vite middleware |
