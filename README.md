# Ngaa-Tai-E-Rua-Paa

A content management system for a marae. It provides a public website for visitors and role-based tools for members, caretakers, and administrators.

## Quick setup for a first-time user

This guide is intended for a non-technical user who wants to run the project locally using Visual Studio Code and Docker.

### 1. Check that Docker is available

Install Docker before continuing:

- **Windows and macOS:** Docker Desktop
- **Linux:** Docker Engine and Docker Compose

Open Docker Desktop or Docker Engine and make sure Docker is running. If you are using Visual Studio Code, also install the **Docker** extension.

### 2. Open the project in Visual Studio Code

1. Open Visual Studio Code.
2. Select **File → Open Folder**.
3. Choose the folder containing this project.

### 3. Create the local environment file

The project uses a file named `.env` to store local settings.

If `.env` does not already exist:

1. Open `.env.example` in Visual Studio Code.
2. Copy all of its contents.
3. Create a new file named `.env` in the project root.
4. Paste the copied contents into `.env`.

The project already includes a local `.env` file in this workspace, so you can skip this step if that file is present.

### 4. Add the login secret

The backend needs a `JWT_SECRET` for login and registration to work.

Open `.env` and add this line near the other settings:

```env
JWT_SECRET=replace-this-with-a-long-random-value
```

Use a long value that contains letters, numbers, and symbols. For example:

```env
JWT_SECRET=local-development-secret-1234567890
```

> This is only for local development. Do not use this value in a public or production environment.

### 5. Start the project with Docker

Open the VS Code terminal by selecting **Terminal → New Terminal**. Then enter:

```bash
docker compose up --build
```

Wait for Docker to build the images and start the services. The first run can take a few minutes.

### 6. Open the website

After the containers start, open this address in your web browser:

**http://localhost:3000**

The project website should appear.

### 7. Set up the database

The local database is managed by Docker. If you are using a fresh copy of the project and the database has no tables yet, open the terminal and run:

```bash
docker compose exec -T db psql -U postgres -d marae_db -v ON_ERROR_STOP=1 < database/schema.sql
```

If the database already contains the project tables, do not run this command again.

### 8. Create an administrator account

Only complete this step if you need an administrator account.

Run this command in the terminal:

```bash
docker compose exec backend node scripts/createAdmin.js "Your Name" your@email.com yourPassword123
```

Replace `Your Name`, `your@email.com`, and `yourPassword123` with the details you want to use.

### 9. Stop the project

Press **Ctrl + C** in the terminal where Docker Compose is running.

To stop it later from another terminal, run:

```bash
docker compose down
```

To start the project again, run:

```bash
docker compose up
```

## Local addresses

- Website: http://localhost:3000
- Backend API: http://localhost:4000
- Email inbox: http://localhost:8025
- Database: port 5433

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

## Setting this up for a different marae

This app is built as a single-tenant system: one deployment (one database, one Docker
Compose stack) per marae. If another marae wants their own version, they fork this repo and
run their own copy — no code sharing or shared login between maraes. Here's everything that
needs to change to make a fork "theirs":

1. **Env vars** — copy `.env.example` to `.env` and set your own `DATABASE_URL`, `JWT_SECRET`,
   and (when ready to send real email) `SMTP_*`/`EMAIL_FROM`. See
   [Environment variables](#environment-variables).
2. **Browser tab title** — `frontend/index.html`, the `<title>` tag.
3. **Logo and favicon** — replace `frontend/public/images/logo.png` and
   `frontend/public/favicon.svg` with your own files of the same name (same filenames means
   no code changes needed).
4. **Map image and pins** — `frontend/src/pages/MapPage.jsx`. Replace the imported map image,
   then update the `MARKER_POSITIONS` array's `x`/`y` values (percentage from the top-left of
   the image) so the numbered pins land on the right spots for your own site. The pin
   name/description text itself is CMS-editable once the app is running (Content Manager →
   Map).
5. **First admin account** — there's no admin user in a fresh database, and admin accounts
   are normally created by an existing admin. Run this once:
   ```bash
   docker compose exec backend node scripts/createAdmin.js "Your Name" you@example.com yourPassword123
   ```
   Then log in as that account and use Manage Users to create/promote any other admin or
   caretaker accounts.
6. **Everything else is content, not code.** Once you've got an admin account, log in and use
   the Content Manager to write your own Home/History/Facilities/Events/Map copy, your own
   arrival guide sections (equipment, cleaning, facilities info), and set your own colors per
   content block. None of that needs a code change or a redeploy.

Two things worth knowing about the current codebase if you're forking it:

- `frontend/src/pages/ArrivalPage.jsx` ships a small set of generic `FALLBACK_ITEMS`, shown
  only until an admin adds real arrival-guide content via the CMS. Don't add real operational
  details (WiFi passwords, phone numbers, equipment locations) to that fallback array directly
  in code — it's shipped in the public JS bundle. Add real content through the Content Manager
  instead, where it lives in the database.
- The visual theme (colors, layout) isn't a CMS setting — it's Tailwind classes throughout the
  component files. A fork that wants a different look and feel needs to edit those directly;
  there's no theming system yet.

## Known gaps / TODO

- **History and Facilities copy is placeholder.** Swap the text in `HistoryPage.jsx` and
  `FacilitiesPage.jsx` for the marae's real history and facility details (or better, migrate
  them to the CMS like the other pages).
- **Events has no backend yet.** `/events` currently just shows a static "no events" message —
  there's no `events` table or admin UI to publish events.
- **`backend/routes/checklists.js` and `backend/controllers/` are empty/unused.** Routes are
  defined inline inside each `routes/*.js` file rather than in separate controllers; the
  `controllers` folder is left over from an earlier structure and isn't required by anything.
- **No multi-tenancy.** One deployment = one marae. See "Setting this up for a different
  marae" above if that's what you need.
