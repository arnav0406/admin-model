# Admin Document Management CMS — Implementation Plan

## Background & Context

### Existing System (What's Already Built)
You have **two existing projects** sharing the same `userdir` PostgreSQL database:

| Project | Purpose | Port |
|---|---|---|
| `directorynic` (user-directory) | Users log in, manage employee records, upload/compress PDFs stored as binary in `users.resume_pdf` | 5000 |
| `admin-panel` | Admins log in, view all users & their `resume_pdf` field, manage accounts, view audit logs | 5001 |

### Key Finding from `directorynic`
The user directory stores the **PDF as a file on disk** (`uploads/`) and the **path as a string** in `users.resume_pdf`. There is **no separate `documents` table** — documents are tightly coupled to user records. The `pdfRoutes.js` handles PDF compression via Ghostscript but **not permanent document storage**.

### What We're Building
A **new standalone Admin Document Management CMS** — a fresh project at port `5002` that:
- Connects to the **same `userdir` database**
- Adds a proper **`documents` table** (independent entity, not a field on `users`)
- Gives admins a **full document management interface**: search, filter, preview metadata, download files, update status, delete, bulk actions
- Also shows **full user profile info** (name, email, role, department, bio, phone, gender, LinkedIn, join date, profile image) when viewing a user or their document
- Logs every admin action to `audit_logs`

---

## Open Questions

> [!IMPORTANT]
> **Where are user-uploaded files stored?**
> The `directorynic` backend saves PDFs to an `uploads/` folder on the same server. For the admin to **download** those files, our new CMS will need access to the same disk path. For now we'll assume **both projects run on the same machine** and share the uploads path via env var.

> [!IMPORTANT]
> **Does the new project need its own document upload flow?**
> Based on your clarification: **No**. Users upload in `directorynic`. The admin CMS only **reads, manages, and acts on** already-uploaded documents. We will add a `documents` table that `directorynic` will write to, and the admin CMS will read from.

---

## Proposed Changes

### New Project: `eo-doc-cms`

**Location**: `/home/arnav_sr/projects/eo-doc-cms/`  
**Stack**: Node.js + Express (CommonJS) + PostgreSQL + React 19 + Vite  
**Port**: Backend `5002`, Frontend `5173` (or similar)

---

### Database Layer

#### [NEW] `setup.sql` — Documents table + indexes

```sql
CREATE TABLE IF NOT EXISTS documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    category    VARCHAR(100) DEFAULT 'general',
    file_name   TEXT NOT NULL,
    file_path   TEXT NOT NULL,         -- relative path from uploads root
    file_size   BIGINT NOT NULL,
    mime_type   VARCHAR(100) NOT NULL,
    status      VARCHAR(20) DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected','archived')),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by INTEGER REFERENCES admin_accounts(id),
    reviewed_at TIMESTAMPTZ,
    review_note TEXT
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_documents_owner    ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_status   ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- Full-text search
ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(category,''))
    ) STORED;
CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents USING GIN(search_vector);
```

> **Note for `directorynic` integration**: When the user-directory saves a file, it should also `INSERT` a row into this `documents` table. That wiring is done in `directorynic`, not here — our CMS only reads.

---

### Backend Structure

```
eo-doc-cms/
├── server.js                  ← Express app entry point (port 5002)
├── db.js                      ← Same userdir DB connection pool
├── setup.sql                  ← Documents table DDL
├── .env                       ← DB creds + JWT secret + uploads path
├── package.json
├── uploads/                   ← Symlink or env-configured path to shared uploads
├── middleware/
│   ├── adminAuth.js           ← Reuse same JWT verification pattern
│   └── csrf.js                ← Same double-submit CSRF pattern
├── models/
│   └── documentModel.js       ← All document SQL queries
├── controllers/
│   └── documentController.js  ← Business logic
└── routes/
    ├── adminAuthRoutes.js     ← Login/logout/me (same as admin-panel)
    └── adminDocRoutes.js      ← All document management endpoints
```

#### API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/admin/auth/login` | Admin login |
| `POST` | `/api/admin/auth/logout` | Admin logout |
| `GET` | `/api/admin/auth/me` | Current session |
| `GET` | `/api/admin/documents` | List all docs (search, filter, paginate) |
| `GET` | `/api/admin/documents/stats` | Dashboard counts by status/type |
| `GET` | `/api/admin/documents/:id` | Single document detail |
| `PATCH` | `/api/admin/documents/:id/status` | Approve / Reject / Archive |
| `DELETE` | `/api/admin/documents/:id` | Delete document + file |
| `DELETE` | `/api/admin/documents/bulk` | Bulk delete |
| `GET` | `/api/admin/documents/:id/download` | Secure file download (stream) |
| `GET` | `/api/admin/users` | List all user accounts (search, paginate) |
| `GET` | `/api/admin/users/:id` | Full user profile (text fields + their documents) |

#### Query Parameters for `GET /api/admin/documents`
- `search` — full-text search on title/description
- `status` — filter: `pending | approved | rejected | archived`
- `category` — filter by category
- `owner_id` — filter by account (user/owner)
- `mime_type` — filter: `application/pdf | image/*`
- `from` / `to` — date range on `uploaded_at`
- `page` / `limit` — pagination (default limit: 20)
- `sort` — `uploaded_at | title | file_size | status`
- `order` — `asc | desc`

---

### Frontend Structure

```
client/
└── src/
    ├── App.jsx                  ← Router (Login + protected layout)
    ├── App.css                  ← Design system tokens + global styles
    ├── main.jsx
    ├── context/
    │   ├── AuthContext.jsx      ← Admin session state
    │   └── ThemeContext.jsx     ← Light/dark mode
    └── components/
        ├── AdminLogin.jsx       ← Login page
        ├── Layout.jsx           ← Sidebar + header shell
        ├── Dashboard.jsx        ← Stats cards (pending/approved/rejected/total)
        ├── DocumentsTable.jsx   ← Main table: title, owner, status, type, date
        ├── DocumentDetail.jsx   ← Slide-over panel: full metadata + actions
        ├── UsersTable.jsx       ← Table of all user accounts
        ├── UserProfile.jsx      ← Full user profile view: ALL fields + their docs list
        ├── StatusBadge.jsx      ← Reusable status chip
        ├── FilterBar.jsx        ← Search input + filter dropdowns
        └── ThemeToggle.jsx      ← Dark/light toggle
```

#### `UserProfile.jsx` — what it shows
When an admin clicks on a user (from Users table or from a document's owner link):

| Section | Fields |
|---|---|
| **Identity** | Name, Email, Phone, Gender, LinkedIn |
| **Work** | Role, Department, Location, Join Date |
| **Bio** | Bio text (full paragraph) |
| **Avatar** | Profile image (if exists) |
| **Documents** | List of all their uploaded documents with status badges + download buttons |

#### Design Direction
- **Same design language as `admin-panel`** so it looks like a cohesive system
- Dark-first, CSS custom properties for tokens
- Clean data-dense layout (not card-heavy) — suits admin tools
- Subtle status color coding: pending=amber, approved=green, rejected=red, archived=gray
- Smooth row-level animations on status change
- No heavy libraries — pure CSS + React

---

## Verification Plan

### Automated
- `npm run dev` starts both backend (5002) and frontend cleanly
- All API routes return correct HTTP status codes
- Auth middleware rejects unauthenticated requests with `401`
- CSRF validation rejects state-changing requests without token

### Manual
1. Admin logs in → session cookie set
2. Dashboard shows correct counts per status
3. Search by name/description returns filtered results
4. Filter by status `pending` shows only pending docs
5. Download button streams the actual file
6. Status change updates DB and re-renders table row
7. Delete removes from DB (and optionally disk) + creates audit log entry
8. Audit log in existing admin-panel shows new doc management actions
