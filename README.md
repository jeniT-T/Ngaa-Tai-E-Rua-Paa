# Ngaa-Tai-E-Rua-Paa

## Setup

### Requirements

* Docker Desktop installed

### Start project

Clone repo:

```bash
git clone https://github.com/jeniT-T/Ngaa-Tai-E-Rua-Paa
cd marae-app
docker compose up --build
```

Create env file:

```bash
cp .env.example .env
```

Run project:

```bash
docker compose up --build
```

Open:

http://localhost:3000

### Stop containers

Press:

CTRL + C


Updated Folder Structure:

marae-app/
│
├── docker-compose.yml
├── README.md
├── .gitignore
│
├── frontend/
│
│   ├── public/
│   │   └── images/
│   │       └── entrance.jpg
│   │
│   ├── src/
│   │
│   │   ├── pages/                  ← ALL ROUTE PAGES
│   │   │   ├── HomePage.jsx
│   │   │   ├── ArrivalPage.jsx
│   │   │   ├── ContactPage.jsx
│   │   │   ├── HealthAndSafetyPage.jsx
│   │   │   │
│   │   │   ├── arrival/            ← ARRIVAL FEATURE GROUP
│   │   │   │   ├── GasPage.jsx
│   │   │   │   ├── WifiPage.jsx
│   │   │   │   ├── MapPage.jsx
│   │   │   │   ├── EmergencyPage.jsx
│   │   │   │   ├── AccessibilityPage.jsx
│   │   │   │   └── RulesPage.jsx
│   │   │   │
│   │   │   ├── tutorials/
│   │   │   │   ├── 
│   │   │   │   └── 
│   │   │   │
│   │   │   └── checklists/
│   │   │       ├── 
│   │   │       └── 
│   │
│   │   ├── components/             ← REUSABLE UI ONLY
│   │   │   ├── Navbar.jsx
│   │   │   ├── ArrivalCard.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── ChecklistItem.jsx
│   │
│   │   ├── App.jsx                 ← ROUTES ONLY
│   │   ├── main.jsx
│   │   └── index.css
│
├── backend/
│   └── (future API / CMS)
│
└── database/
    └── schema.sql