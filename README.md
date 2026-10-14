# Ngaa-Tai-E-Rua-Paa

A content management system for a marae. It provides a public website for visitors and role-based tools for members, caretakers, and administrators.

## Quick setup for a first-time user

This runs the project on your own computer with Node.js and PostgreSQL.

### 1. Install the tools

- **Node.js 20 (LTS)** from https://nodejs.org. Check it with `node -v`.
- **PostgreSQL 16** (newer versions should also work) from https://www.postgresql.org/download. Remember the password you set for the `postgres` user. Check it with `psql --version`.
- **Git**, to download the project.

### 2. Create the database

Open a terminal and run:

```bash
psql -U postgres -c "CREATE DATABASE marae_db;"
```

Enter your PostgreSQL password when asked. (You can also use a free hosted Postgres such as Neon instead; just use its connection string in step 3.)

> **Mac with Homebrew?** A Homebrew install has no `postgres` user and no password, so the command above fails with `role "postgres" does not exist`. Use your Mac username instead:
>
> - Step 2: run `createdb marae_db`.
> - Step 3: set `DATABASE_URL` to `postgresql://YOUR_MAC_USERNAME@localhost:5432/marae_db` (no password). Find your username with `whoami`.
> - Step 4: run `psql -d marae_db -v ON_ERROR_STOP=1 -f database/schema.sql` (leave out `-U postgres`).

### 3. Create the local environment file

The project reads its settings from a file named `.env` in the project folder (next to this README). It is not part of a GitHub download, so each developer creates their own.

1. Copy `.env.example` and name the copy `.env`.
2. Set `DATABASE_URL` to match your PostgreSQL password, for example `postgresql://postgres:YOUR_PASSWORD@localhost:5432/marae_db`.
3. Set `JWT_SECRET` to a long random value. You can make one with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

> Use a different `JWT_SECRET` for every installation and never share or commit your `.env`.

### 4. Create the tables

Run this once, from the project folder, on an empty database:

```bash
psql -U postgres -d marae_db -v ON_ERROR_STOP=1 -f database/schema.sql
```

If the database already contains the project tables, do not run it again.

The schema also seeds the Marae Guide with its saved categories and item order, then creates the default Cleaning & Checkout checklist. Existing guide items remain editable in **Content Manager -> Arrival Guide**. Staff can edit the booking template at `/checklists/default`.

### 5. Install the packages

```bash
cd backend && npm ci
cd ../frontend && npm ci
```

### 6. Start the project

Open two terminals.

```bash
# Terminal 1: the backend (API on port 4000)
cd backend
npm run dev
```

```bash
# Terminal 2: the website (port 3000)
cd frontend
npm run dev
```

Then open **http://localhost:3000** in your browser. Stop either one with **Ctrl + C**.

### 7. Create Admin and Manager accounts

Create separate Admin and Manager accounts on a fresh database. Admins manage content and site settings; Managers manage users, booking approvals, and issues. From the `backend` folder run:

```bash
node scripts/createAdmin.js "Admin Name" admin@example.com "your-admin-password" admin
node scripts/createAdmin.js "Manager Name" manager@example.com "your-manager-password" manager
```

Replace the names, emails and passwords with your own. Passwords should be at least 8 characters. Anyone who registers on the website becomes a `member`; the Manager can create caretaker accounts from the app.

### 8. Email while developing

If `SMTP_HOST` is not set in `.env`, the app prints each email (for example a password-reset link) in the backend terminal instead of sending it. To send real email, fill in the `SMTP_*` and `EMAIL_FROM` settings with the details from your email provider.

### 9. Run the checks

```bash
cd backend && npm test && npm run lint
cd ../frontend && npm run lint && npm run build
```

The backend tests use a mocked database, so they do not need PostgreSQL.

## Deploying a demo for the client (Render + Neon)

This puts the whole app at one public URL so the client can try it. The Express backend also
serves the built frontend (`backend/server.js`), so the site and API share one origin -- this
is what makes the login cookie work. `render.yaml` describes the web service.

1. **Database** -- create a free Postgres project on [Neon](https://neon.tech) and copy its
   connection string (it should end in `?sslmode=require`).
2. **Load the schema** -- on a fresh, empty database run `database/schema.sql` only (do not apply
   the `migration_*.sql` files; the schema already includes them):
   `psql "<connection string>" -v ON_ERROR_STOP=1 -f database/schema.sql`
3. **Web service** -- on [Render](https://render.com): New -> Blueprint -> pick this GitHub repo.
   When prompted, set `DATABASE_URL` (step 1) and `FRONTEND_URL` (the `https://...onrender.com`
   address Render gives the service). `JWT_SECRET` is generated automatically.
4. **Demo accounts** -- from your own computer, with `DATABASE_URL` pointing at the Neon database:
   `cd backend && DATABASE_URL="<connection string>" node scripts/createAdmin.js "Name" email password manager`
   (roles: `admin` or `manager`; caretakers and members can then be created from the app).
5. Every push to `main` redeploys automatically.

Things to know: the free tier sleeps when idle (first load can take ~1 minute); images uploaded
through the Content Manager are lost on each redeploy (no persistent disk); password-reset emails
need a real SMTP service (`SMTP_*` variables); use demo data only.

## Local addresses

- Website: http://localhost:3000
- Backend API: http://localhost:4000
- Database: PostgreSQL on port 5432 (the default)

## Environment variables

Set these in the `.env` file in the project folder (copy `.env.example` to start):

| Variable | Used for | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://postgres:password@localhost:5432/marae_db` |
| `JWT_SECRET` | Signing/verifying login session tokens | any long random string |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Sending email. If `SMTP_HOST` is empty, emails are printed in the backend terminal | `smtp.example.com`, `587`, `false` |
| `EMAIL_FROM` | Sender name and address on emails | `Manage My Marae <no-reply@example.com>` |
| `FRONTEND_URL` | Production only: the public address of the site | `https://your-site.example.com` |
| `NODE_ENV` | Set to `production` on a live site | `production` |

Without `JWT_SECRET`, `jwt.sign()` in `backend/routes/auth.js` will throw and login/register
will fail.

## Database

Run `database/schema.sql` only on an empty database, using the command in step 4. It includes the current tables, guide seed, and booking checklist template; do not apply all historical migrations afterward.

For an existing database, back it up first and apply only migrations missing from that installation. Filenames are not a chronological migration sequence. `migration_content_v2.sql` is only for the old `type`/`audience` content schema and must not be rerun on the current schema.

For an installation updated before the latest cleaning checklist and issue changes, apply these files in this order (skip any already applied):

```bash
psql -U postgres -d marae_db -v ON_ERROR_STOP=1 -f database/migration_issue_completion_notes.sql
psql -U postgres -d marae_db -v ON_ERROR_STOP=1 -f database/migration_checklist_completions.sql
psql -U postgres -d marae_db -v ON_ERROR_STOP=1 -f database/migration_arrival_content.sql
psql -U postgres -d marae_db -v ON_ERROR_STOP=1 -f database/migration_booking_cleaning_checklist.sql
psql -U postgres -d marae_db -v ON_ERROR_STOP=1 -f database/migration_default_checklist_editor.sql
```

The guide seed inserts missing items without changing existing categories or text. Do not rerun the historical `migration_arrival_categories.sql` or `migration_arrival_groups.sql`: they reassign categories and can undo Content Manager edits. The default-template migration fills an empty template but preserves a populated staff-edited template.

For older installations, inspect their tables and apply the relevant earlier migrations before these commands. This project does not yet record applied migrations automatically.

## User roles

| Role | Can do |
|---|---|
| `member` | Request bookings, report issues, access the Marae Guide with an approved booking, complete assigned checklists |
| `caretaker` | View the guide, schedule and tasks, manage checklists and tutorials |
| `manager` | Manage users, bookings and issues; view the guide and edit the default checklist |
| `admin` | Manage content and site settings; view the guide and edit the default checklist |

## Folder structure

```
marae-app/
│
├── README.md
├── .env.example
│
├── database/
│   ├── schema.sql               ← source of truth for a fresh database
│   ├── migration_*.sql         ← apply only missing migrations on an existing db
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
| `/bookings` | member, caretaker, manager, admin |
| `/content` | member, caretaker, manager, admin |
| `/report-issue` | member, caretaker, manager, admin |
| `/caretaker/checklists`, `/caretaker/tutorials` | caretaker, admin |
| `/admin`, `/admin/content`, `/admin/site-settings` | admin |
| `/manager`, `/manager/users`, `/manager/bookings`, `/manager/issues` | manager |
| `/arrival` | staff; members with an approved booking |
| `/checklists/default` | admin, manager, caretaker |

## Setting this up for a different marae

This app is built as a single-tenant system: one deployment (one database, one running copy of the app) per marae. If another marae wants their own version, they fork this repo and
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
5. **First staff accounts** — follow step 7 to create both an Admin and a Manager. Log in as the Manager to create or update other users; use the Admin for Content Manager and Site Settings.
6. **Everything else is content, not code.** Once you've got an admin account, log in and use
   the Content Manager to write your own Home/History/Facilities/Events/Map copy, your own
   arrival guide sections (equipment, cleaning, facilities info), and set your own colors per
   content block. None of that needs a code change or a redeploy.

Site Settings supports the site name, logo, map, booking options, and secondary colour. The navigation also provides a dark mode toggle.

Database content, accounts, bookings and uploaded files are local data, not shared by Git. Back them up separately when moving an existing installation. The guide seed preserves its initial categories and order; subsequent changes belong to that installation's database.

## Known gaps / TODO

- No multi-tenancy: each marae needs its own deployment and database.
- Applied database migrations are not tracked automatically; record which migrations you run.
