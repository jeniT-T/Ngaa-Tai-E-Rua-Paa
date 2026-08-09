# Ngaa-Tai-E-Rua-Paa

A content management system for a marae, built to give visitors a public landing page
(history, facilities, booking requests, events) and give members, caretakers and admins
role-specific tools (checklists, content library, issue reporting, booking approval, user
management).

## Tech stack

- **Frontend**: React 19 + Vite, React Router, Tailwind CSS
- **Backend**: Node.js + Express, JWT auth via httpOnly cookies
- **Database**: PostgreSQL
- **Infra**: Docker Compose (frontend, backend, db)

## Setup

### Requirements

- Docker Desktop installed

### Start project

Clone repo:

```bash
git clone https://github.com/jeniT-T/Ngaa-Tai-E-Rua-Paa
cd marae-app
```

Create env file:

```bash
cp .env.example .env
```

Then open `.env` and fill in real values — see [Environment variables](#environment-variables)
below. In particular, add a `JWT_SECRET`; it's required for login/register to work and isn't
included in `.env.example` yet.

Run project:

```bash
docker compose up --build
```

Open:

http://localhost:3000

### Stop containers

Press:

CTRL + C

## Environment variables

Set these in `.env` (backend reads them via `docker-compose.yml`'s `env_file`):

| Variable | Used for | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://postgres:password@db:5432/marae_db` |
| `JWT_SECRET` | Signing/verifying login session tokens | any long random string |
| `PAYLOAD_SECRET` | Reserved, not currently read by the app | `notsetyet` |

Without `JWT_SECRET`, `jwt.sign()` in `backend/routes/auth.js` will throw and login/register
will fail.

## Database

Run `database/schema.sql` against a fresh database to create the `users`, `bookings`,
`content_items` and `issues` tables. If you already have a database from an earlier version,
use `database/migration_content_v2.sql` instead of re-running the full schema.

## User roles

| Role | Can do |
|---|---|
| `member` | Log in, request bookings, view the content library, report issues |
| `caretaker` | Everything a member can, plus checklists and tutorials |
| `admin` | Everything above, plus manage users, manage content, view reported issues, and (once wired up — see Known gaps) approve/deny bookings |

## Folder structure

```
marae-app/
│
├── docker-compose.yml
├── README.md
├── .env.example
│
├── database/
│   ├── schema.sql               ← source of truth for a fresh database
│   ├── migration_content_v2.sql ← run instead of schema.sql on an existing db
│   └── bookings.sql
│
├── frontend/
│   ├── public/
│   │   └── images/               ← logo, hero photos used on the landing page
│   ├── src/
│   │   ├── pages/                ← one file per route
│   │   │   ├── HomePage.jsx           public landing page (history/facilities/booking boxes)
│   │   │   ├── HistoryPage.jsx        public — /history
│   │   │   ├── FacilitiesPage.jsx     public — /facilities
│   │   │   ├── EventsPage.jsx         public — /events
│   │   │   ├── ContactPage.jsx        public — /contacts
│   │   │   ├── ArrivalPage.jsx        operations guide for hirers/caretakers — /arrival
│   │   │   ├── HealthAndSafetyPage.jsx
│   │   │   ├── MapPage.jsx
│   │   │   ├── LoginPage.jsx / RegisterPage.jsx / UnauthorizedPage.jsx
│   │   │   ├── BookingRequestPage.jsx protected — /bookings
│   │   │   ├── ContentLibraryPage.jsx protected — /content
│   │   │   ├── ReportIssuePage.jsx    protected — /report-issue
│   │   │   ├── arrival/               arrival sub-pages (gas, wifi, emergency, etc.)
│   │   │   ├── caretaker/             ChecklistsPage.jsx, TutorialsPage.jsx
│   │   │   └── admin/                 AdminDashboardPage, UserManagementPage,
│   │   │                              ContentManagementPage, IssuesInboxPage
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx        Home / Events / Contact Us + auth-aware login/logout
│   │   │   └── RoleRoute.jsx     wraps protected routes, redirects by auth/role
│   │   │
│   │   ├── context/AuthContext.jsx  current user, login/register/logout
│   │   ├── App.jsx                  routes only
│   │   ├── main.jsx
│   │   └── index.css
│
├── backend/
│   ├── server.js
│   ├── middleware/
│   │   ├── requireAuth.js       verifies the JWT cookie, attaches req.user
│   │   └── requireRole.js       restricts a route to specific roles
│   ├── models/                  raw SQL via `pg`, one file per table
│   │   ├── User.js
│   │   ├── Booking.js
│   │   ├── ContentItem.js
│   │   └── Issue.js
│   └── routes/                  route handlers, mounted in server.js under /api/*
│       ├── auth.js              /api/auth — register, login, logout, me
│       ├── bookings.js          /api/bookings — create, list mine, admin list/approve
│       ├── content.js           /api/content — library + admin content management
│       ├── issues.js            /api/issues — report + admin review
│       └── admin.js             /api/admin — user management
```

## Public routes

| Route | Page |
|---|---|
| `/` | Home — hero + History / Facilities / Make a Booking boxes |
| `/history` | History of the marae |
| `/facilities` | Available facilities |
| `/events` | Upcoming events |
| `/contacts` | Contact information |
| `/login`, `/register` | Auth |

## Protected routes

| Route | Allowed roles |
|---|---|
| `/bookings` | member, caretaker, admin |
| `/content` | member, caretaker, admin |
| `/report-issue` | member, caretaker, admin |
| `/caretaker/checklists`, `/caretaker/tutorials` | caretaker, admin |
| `/admin`, `/admin/users`, `/admin/issues`, `/admin/content` | admin |

## Known gaps / TODO

- **History and Facilities copy is placeholder.** Swap the text in `HistoryPage.jsx` and
  `FacilitiesPage.jsx` for the marae's real history and facility details.
- **Events has no backend yet.** `/events` currently just shows a static "no events" message —
  there's no `events` table or admin UI to publish events.
- **No admin UI for bookings yet.** `backend/routes/bookings.js` supports an admin listing
  and approve/deny endpoint (`GET /api/bookings`, `PATCH /api/bookings/:id`), but there's no
  frontend page for admins to review booking requests — only the requester-facing form exists.
- **`backend/routes/checklists.js` and `backend/controllers/` are empty/unused.** Routes are
  defined inline inside each `routes/*.js` file rather than in separate controllers; the
  `controllers` folder is left over from an earlier structure and isn't required by anything.
- **`JWT_SECRET`** isn't in `.env.example` — see Environment variables above.
