# TechBridge Enterprise Progressive Web Application (PWA)

TechBridge is an enterprise IT service desk and issue-management platform built with a **Laravel 13 REST API backend** and a **React + TypeScript + Vite + Tailwind CSS PWA frontend**. It connects non-technical employees (Reporters) with technical support teams (Technicians, Team Leads, System Administrators).

---

## Technical Stack

### Frontend (PWA)
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Dark Design System Tokens
- **Offline & Storage Engine**: Dexie.js (IndexedDB wrapper)
- **PWA Shell & Cache**: Custom Service Worker (`public/sw.js`) with background sync
- **Form Validation**: React Hook Form + Zod

### Backend (Laravel 13 REST API)
- **Framework**: Laravel 13 (PHP 8.3+)
- **Authentication**: Laravel Sanctum (Token-based API Auth)
- **Database**: MySQL 8.0+
- **Queues & Push Notifications**: Redis / Database Queue & Web Push (VAPID)
- **RBAC**: Multi-role permission matrix & Policy controllers

---

## Core Features

1. **Mobile-First Progressive Web Application**:
   - Installable on Android, iOS, Windows, macOS, and ChromeOS.
   - Touch-optimized navigation for mobile & collapsible sidebar for desktop.

2. **Offline-First Ticket Management Engine**:
   - Local ticket drafting in IndexedDB when network connection is degraded or offline.
   - Background Synchronization via Service Worker to automatically post queued drafts upon reconnection.
   - Idempotent ticket creation preventing duplicate entries.

3. **Multi-Role Perspectives**:
   - **Employee (Reporter)**: Simple non-technical creation wizard, camera photo capture, real-time KB solution suggestions, public comments, resolution rating.
   - **Technician Workbench**: Assigned tickets view, unassigned queue claiming, SLA deadline countdown timers, private internal technical notes.
   - **Team Lead Overview**: SLA target compliance tracking, critical incident alerts, technician workload distribution.
   - **Administrator**: Organization user role management, system health monitoring, immutable audit trail logger, CSV report exporter.

---

## Project Directory Structure

```text
TechBridge/
├── backend/                  # Laravel 13 REST API Engine
│   ├── app/
│   │   ├── Http/Controllers/Api/ (AuthController, TicketController, SyncController, etc.)
│   │   └── Models/ (User, Ticket, Department, Team, ITSystem, KnowledgeArticle, AuditLog)
│   ├── database/
│   │   ├── migrations/ (Database schema)
│   │   └── seeders/ (DatabaseSeeder with rich mock enterprise records)
│   ├── routes/
│   │   └── api.php (REST API Endpoint definitions)
│   ├── Procfile (Railway deployment configuration)
│   └── composer.json
│
└── frontend/                 # React 18 PWA Application
    ├── public/
    │   ├── manifest.json (PWA Web App Manifest)
    │   └── sw.js (Service Worker caching & background sync engine)
    ├── src/
    │   ├── components/ (Dashboards, Tickets, KB, Layout, UI badges)
    │   ├── context/ (AuthContext & PWAContext)
    │   ├── db/ (Dexie.js IndexedDB schema)
    │   ├── services/ (API client & background syncEngine)
    │   └── App.tsx
    ├── vercel.json (Vercel SPA routing configuration)
    ├── package.json
    └── vite.config.ts
```

---

## Quick Start Guide (Local Development)

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:3000`.

### 2. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
REST API runs at `http://localhost:8000/api/v1`.

---

## Cloud Deployment (Vercel + Railway)

### 1. Backend & Database (Railway)
1. Deploy `backend/` directory to Railway.
2. Add a **MySQL** database plugin on Railway.
3. Configure environment variables in Railway:
   - `DB_CONNECTION=mysql`
   - `DB_HOST=${{MySQL.MYSQLHOST}}`
   - `DB_PORT=${{MySQL.MYSQLPORT}}`
   - `DB_DATABASE=${{MySQL.MYSQLDATABASE}}`
   - `DB_USERNAME=${{MySQL.MYSQLUSER}}`
   - `DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}`
   - `CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app`

### 2. Frontend (Vercel)
1. Deploy `frontend/` directory to Vercel (Framework: Vite).
2. Set environment variable in Vercel:
   - `VITE_API_BASE_URL=https://your-railway-app.up.railway.app/api/v1`
