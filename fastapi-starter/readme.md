# Real Estate CRM API — `readme.md`

**Version:** 2.x (async)  
**Base URL (local):** `http://127.0.0.1:8000`  
**Swagger UI:** `GET /docs` | **ReDoc:** `GET /redoc`  
**OpenAPI (JSON):** `GET /openapi.json`

---

## Table of Contents

0. [Setup & Run (Install, venv, start)](#setup--run-install-venv-start)  
1. [Overview](#overview)  
2. [Auth & Security](#auth--security)  
   2.1. [Get Token (OAuth2 Password Flow)](#get-token-oauth2-password-flow)  
   2.2. [JSON Login (Alternative)](#json-login-alternative)  
   2.3. [Using the Token](#using-the-token)  
3. [Users](#users)  
   3.1. [Register](#register)  
   3.2. [Me](#me)  
4. [Leads](#leads)  
   4.1. [List Leads (Search/Filter/Paginate)](#list-leads-searchfilterpaginate)  
   4.2. [Create Lead(s) — Single or Bulk](#create-leads--single-or-bulk)  
   4.3. [Get Lead by ID](#get-lead-by-id)  
   4.4. [Update Lead](#update-lead)  
   4.5. [Delete Lead (Soft Delete)](#delete-lead-soft-delete)  
5. [Activities](#activities)  
   5.1. [List Activities for a Lead](#list-activities-for-a-lead)  
   5.2. [Create Activity(ies) — Single or Bulk](#create-activities--single-or-bulk)  
6. [Dashboard](#dashboard)  
7. [Models & Schemas](#models--schemas)  
   7.1. [Token](#token)  
   7.2. [User Models](#user-models)  
   7.3. [Lead Models](#lead-models)  
   7.4. [Activity Models](#activity-models)  
   7.5. [DashboardStats](#dashboardstats)  
8. [Status Codes & Error Payloads](#status-codes--error-payloads)  
9. [Filtering & Pagination Notes](#filtering--pagination-notes)  
10. [Curl Quickstart](#curl-quickstart)  
11. [Implementation Notes (for Maintainers)](#implementation-notes-for-maintainers)

---

## Setup & Run (Install, venv, start)

### Prerequisites
- **Python** 3.10–3.12 (3.11+ recommended)
- **pip** and **venv** available
- (Optional) **Git** if you clone a repo

### 1) Create & activate a virtual environment
**macOS / Linux**
```bash
python -m venv .venv
source .venv/bin/activate
```

**Windows (PowerShell)**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2) Create `requirements.txt` (or copy this content)
```txt
fastapi>=0.115
uvicorn[standard]>=0.30
sqlmodel>=0.0.21
SQLAlchemy>=2.0
pydantic-settings>=2.3
python-jose[cryptography]>=3.3
passlib[bcrypt,argon2]>=1.7
argon2-cffi>=23.1.0
aiosqlite>=0.20.0
greenlet>=3.0
# If using Postgres instead of SQLite, also:
# asyncpg>=0.29.0
```

### 3) Install dependencies
```bash
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### 4) Create a `.env` file in your project root
```env
# Use an **async** driver (aiosqlite for dev). Do NOT use "sqlite:///..."
DATABASE_URL=sqlite+aiosqlite:///./app.db

SECRET_KEY=change-me
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 5) Run the FastAPI app (from the **project root**)
```bash
uvicorn app.main:app --reload
```
Open: `http://127.0.0.1:8000/docs`

### 6) Quick health check
- `GET /` → `{"status": "ok"}`
- In Swagger, use **Authorize** to log in via `/api/users/token` (OAuth2 password flow).

### Troubleshooting (common)
- **ModuleNotFoundError: app.core**  
  - Run from the **project root** (the folder containing `app/`).  
  - Ensure empty files exist: `app/__init__.py`, `app/core/__init__.py`, `app/routers/__init__.py`.

- **ValueError: the greenlet library is required**  
  - `pip install "greenlet>=3.0"` (and ensure you’re in the same venv used by `uvicorn`).

- **AsyncContextNotStarted** / DB errors  
  - Your `DATABASE_URL` must be async (e.g., `sqlite+aiosqlite:///./app.db`), not `sqlite:///...`.  
  - Confirm `aiosqlite` (or `asyncpg`) is installed.

- **401 in Swagger after Authorize**  
  - Ensure `/api/users/token` exists (OAuth2 form), and you used a registered `username`/`password`.

- **405 Method Not Allowed on activities POST**  
  - Make sure the **activities router** is included in `main.py` and you’re posting to `/api/leads/{lead_id}/activities` (trailing slash allowed).

---

## Overview

This API powers a minimal CRM with **Users**, **Leads**, **Activities**, and a **Dashboard** of aggregate metrics.  
It is built with **FastAPI** (async), **SQLModel/SQLAlchemy 2.0**, **JWT** auth, and **Argon2** password hashing.

**Routers & Base Paths**

- Users (Auth): `/api/users/*`
- Leads: `/api/leads/*`
- Activities (per Lead): `/api/leads/{lead_id}/activities/*`
- Dashboard: `/api/dashboard`

---

## Auth & Security

JWT Bearer tokens using **OAuth2 password** flow. Passwords are hashed with **argon2** (supports long passphrases).

### Get Token (OAuth2 Password Flow)

`POST /api/users/token`  
**Content-Type:** `application/x-www-form-urlencoded`

**Form fields**
- `username` — string  
- `password` — string

**Response**
```json
{ "access_token": "<JWT>", "token_type": "bearer" }
```

> In Swagger, click **Authorize**, enter username/password, and the token is attached automatically.

### JSON Login (Alternative)

`POST /api/users/login`  
**Body (JSON)**
```json
{ "username": "agent1", "password": "pass123" }
```

**Response**
```json
{ "access_token": "<JWT>", "token_type": "bearer" }
```

### Using the Token

Add `Authorization: Bearer <JWT>` to all protected endpoints.

---

## Users

### Register

`POST /api/users/register`  
Create a new user/agent.

**Body**
```json
{
  "username": "agent1",
  "email": "a1@example.com",
  "password": "pass123456",
  "first_name": "Agent",
  "last_name": "One"
}
```

**Responses**
- `201` → `UserOut`
- `409` → username/email already exists
- `422` → validation errors

**UserOut Example**
```json
{
  "id": 1,
  "username": "agent1",
  "email": "a1@example.com",
  "first_name": "Agent",
  "last_name": "One",
  "created_at": "2025-10-07T18:10:00.000000"
}
```

### Me

`GET /api/users/me` *(auth required)*  
Returns the current authenticated user.

**Responses:** `200` → `UserOut`; `401` if invalid/expired token.

---

## Leads

**Base:** `/api/leads`  
Leads support **soft delete** (`is_active=false`) and **bulk create**.

### List Leads (Search/Filter/Paginate)

`GET /api/leads` *(auth)*

**Query params**
- `q`: text search in `first_name`, `last_name`, `email`, `phone` (case-insensitive)
- `status`: filter by status; **pass `""` (empty) or `"all"` to return all statuses**
- `source`: optional source (e.g., `website`, `referral`, …)
- `min_budget`, `max_budget`: ints; match if either `budget_min` or `budget_max` crosses bound
- `page`: int (default `1`)
- `size`: int (default `10`)

**Response:** `200` → `LeadOut[]` (sorted by `created_at` desc)  
**Errors:** `401`

**Example**
```
GET /api/leads?q=john&status=all&page=1&size=10
Authorization: Bearer <JWT>
```

### Create Lead(s) — Single or Bulk

`POST /api/leads` *(auth)*

**Body — single**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "john.smith@example.com",
  "phone": "+1-555-0100",
  "status": "new",
  "source": "website",
  "budget_min": 300000,
  "budget_max": 450000,
  "property_interest": "2BR condo"
}
```

**Body — array (bulk, atomic)**
```json
[
  { "first_name": "Alice", "last_name": "Ng", "email": "alice@example.com",  "phone": "+1-555-0101", "status": "contacted", "source": "referral" },
  { "first_name": "Miguel", "last_name": "Ortiz","email": "miguel@example.com","phone": "+1-555-0102", "status": "new",       "source": "website" }
]
```

**Responses**
- `201` → `LeadOut` (single) **or** `LeadOut[]` (bulk)
- `400` → bulk insert failed (rolled back)
- `401`, `422`

**LeadOut Example**
```json
{
  "id": 7,
  "first_name": "John",
  "last_name": "Smith",
  "email": "john.smith@example.com",
  "phone": "+1-555-0100",
  "status": "new",
  "source": "website",
  "budget_min": 300000,
  "budget_max": 450000,
  "property_interest": "2BR condo",
  "is_active": true,
  "created_at": "2025-10-07T18:10:00.000000",
  "updated_at": "2025-10-07T18:10:00.000000",
  "activity_count": 0
}
```

### Get Lead by ID

`GET /api/leads/{lead_id}` *(auth)*  
**Responses:** `200` → `LeadOut`, `404` if not found/inactive, `401`

### Update Lead

`PUT /api/leads/{lead_id}` *(auth)*  
**Body:** partial via `LeadUpdate` (all fields optional)  
**Responses:** `200` → updated `LeadOut`, `404`, `401`, `422`

### Delete Lead (Soft Delete)

`DELETE /api/leads/{lead_id}` *(auth)*  
**Responses:** `204` (no body), `404`, `401`

---

## Activities

**Base (per lead):** `/api/leads/{lead_id}/activities`  
Trailing slash is accepted; creating activities increments `lead.activity_count`.

### List Activities for a Lead

`GET /api/leads/{lead_id}/activities` *(auth)*  
**Response:** `200` → `ActivityOut[]` in reverse chronological order (by `activity_date`, then `created_at`)  
**Errors:** `404` (lead not found/inactive), `401`

**ActivityOut Example**
```json
{
  "id": 3,
  "lead_id": 7,
  "user_id": 1,
  "activity_type": "call",
  "title": "Intro call",
  "notes": "Talked about financing",
  "duration": 12,
  "activity_date": "2025-10-03",
  "created_at": "2025-10-07T18:15:00.000000",
  "user_name": "Agent One"
}
```

### Create Activity(ies) — Single or Bulk

`POST /api/leads/{lead_id}/activities` *(auth)*

**Body — single**
```json
{
  "activity_type": "email",
  "title": "Sent listings",
  "notes": "3 condos near PATH",
  "duration": 10,
  "activity_date": "2025-10-03"
}
```

**Body — array (bulk, atomic)**
```json
[
  { "activity_type": "meeting", "title": "Property tour", "duration": 45, "activity_date": "2025-10-04" },
  { "activity_type": "call",    "title": "Follow-up call",               "activity_date": "2025-10-05" }
]
```

**Responses**
- `201` → `ActivityOut` (single) **or** `ActivityOut[]` (bulk)
- `400` → bulk insert failed (rolled back)
- `404` → lead not found/inactive
- `401`, `422`

> Server sets `lead_id`, `user_id`, `user_name` automatically from the URL and the authenticated user.

---

## Dashboard

`GET /api/dashboard` *(auth)*  
Returns aggregate counts and recent activity.

**Response (`DashboardStats`)**
```json
{
  "total_leads": 128,
  "new_leads_this_week": 9,
  "closed_leads_this_month": 3,
  "total_activities": 412,
  "leads_by_status": [
    {"status": "new", "count": 57},
    {"status": "contacted", "count": 29},
    {"status": "qualified", "count": 20},
    {"status": "negotiation", "count": 12},
    {"status": "closed", "count": 7},
    {"status": "lost", "count": 3}
  ],
  "recent_activities": [ /* last 10 ActivityOut objects */ ]
}
```

---

## Models & Schemas

### Token
```ts
Token {
  access_token: string
  token_type: "bearer"
}
```

### User Models
```ts
UserCreate {
  username: string  // min 3
  email: string
  password: string  // min 8, long passphrases supported
  first_name: string
  last_name: string
}

UserOut {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  created_at: string  // ISO timestamp
}
```

### Lead Models
```ts
LeadCreate {
  first_name: string
  last_name: string
  email: string
  phone: string
  status?: string = "new"
  source?: string = "website"
  budget_min?: number | null
  budget_max?: number | null
  property_interest?: string | null
}

LeadUpdate { // all optional
  first_name?, last_name?, email?, phone?, status?, source?,
  budget_min?, budget_max?, property_interest?, is_active?
}

LeadOut = LeadCreate & {
  id: number
  is_active: boolean
  created_at: string
  updated_at: string
  activity_count: number
}
```

### Activity Models
```ts
ActivityCreate {
  activity_type: string    // e.g., "call" | "email" | "meeting" | "note"
  title: string
  notes?: string
  duration?: number
  activity_date: string    // YYYY-MM-DD
}

ActivityOut = ActivityCreate & {
  id: number
  lead_id: number
  user_id: number
  created_at: string
  user_name: string
}
```

### DashboardStats
```ts
DashboardStats {
  total_leads: number
  new_leads_this_week: number
  closed_leads_this_month: number
  total_activities: number
  leads_by_status: Array<{ status: string, count: number }>
  recent_activities: ActivityOut[]
}
```

---

## Status Codes & Error Payloads

- `200` OK — successful GET/PUT.
- `201` Created — successful POST (single or bulk).
- `204` No Content — successful soft delete.
- `400` Bad Request — e.g., bulk insert failed or empty list.
- `401` Unauthorized — missing/invalid token.
- `404` Not Found — missing lead or inactive.
- `409` Conflict — uniqueness violation (e.g., registering existing username/email).
- `422` Unprocessable Entity — validation errors.

**Error JSON**
```json
{ "detail": "message" }
```
(Pydantic validation errors return a standard array of field issues.)

---

## Filtering & Pagination Notes

- `GET /api/leads` supports `page` and `size`. Response returns page items only (no `total` field).
- `status` handling: `status=all`, `status=` (empty), or **omitting** `status` → no filter (return all statuses).
- `q` does case-insensitive `%like%` search over `first_name`, `last_name`, `email`, `phone`.

---

## Curl Quickstart

```bash
# 1) Register
curl -X POST http://127.0.0.1:8000/api/users/register   -H "Content-Type: application/json"   -d '{"username":"agent1","email":"a1@example.com","password":"pass123456","first_name":"Agent","last_name":"One"}'

# 2) Get token (OAuth2 password flow)
curl -X POST http://127.0.0.1:8000/api/users/token   -H "Content-Type: application/x-www-form-urlencoded"   -d "username=agent1&password=pass123456"

# 3) Use token
TOKEN="<paste_jwt_here>"

# List leads (all statuses)
curl -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:8000/api/leads?status=all&page=1&size=10"

# Create 2 leads in bulk
curl -X POST http://127.0.0.1:8000/api/leads   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '[{"first_name":"Alice","last_name":"Ng","email":"alice@example.com","phone":"+1-555-0101"},
       {"first_name":"Miguel","last_name":"Ortiz","email":"miguel@example.com","phone":"+1-555-0102"}]'

# Add two activities to lead 1
curl -X POST http://127.0.0.1:8000/api/leads/1/activities   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '[{"activity_type":"email","title":"Sent comps","activity_date":"2025-10-03"},
       {"activity_type":"meeting","title":"Tour","duration":45,"activity_date":"2025-10-04"}]'

# Dashboard
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/dashboard
```

---

## Implementation Notes (for Maintainers)

- **Async stack:** use `sqlite+aiosqlite` (dev) or `postgresql+asyncpg` (prod). Engine/session are async (`AsyncEngine`, `AsyncSession`), and DB calls are awaited (`await session.exec/get/commit/refresh`).
- **Auth:** OAuth2 Password flow at `POST /api/users/token` (Swagger-compatible). JSON login also available at `POST /api/users/login`. JWT uses `SECRET_KEY` & `ALGORITHM` from env.
- **Password hashing:** `argon2` via Passlib (supports long passphrases). Backward compatibility with `bcrypt_sha256`/`bcrypt` if present; automatic rehash on login when needed.
- **Soft delete:** `DELETE /api/leads/{id}` sets `is_active=false`. All lead queries include `Lead.is_active == True`.
- **Bulk creates:** For leads/activities, passing an array inserts atomically; any row error → `rollback()` and `400`.
- **CORS:** Origins controlled via `.env` (`CORS_ORIGINS`).  
- **Swagger Tips:** Use **Authorize** to attach the bearer token; trailing slash is accepted on activities endpoints.

--- 

**End of `readme.md`**