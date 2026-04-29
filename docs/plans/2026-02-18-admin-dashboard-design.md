# Admin Dashboard & Moderation System Design

**Date:** 2026-02-18
**Status:** Approved

## Overview

A single `/admin` page with four tabs (Overview, Reports, Users, Revenue) that gives the HiveFive team full visibility into platform health, moderation, and financials. Includes a user reporting system with automated escalation and a "View As" impersonation feature.

## Access Model

- Single `role` column on `users` table: `ENUM('user','admin') DEFAULT 'user'`
- Admin account auto-created in `sql/admin-setup.sql` (gitignored, never pushed to repo)
  - Email: `admin@hivefive.com` (not .edu — avoids university liability)
  - Password: `Admin@team.random()` (stored as bcrypt hash only)
  - User ID 1; seed data starts from ID 2
- `/admin` route returns 404 for non-admin users (don't reveal the route exists)
- Admin nav item only visible when `role === 'admin'`

## Database Changes

### Users table — new columns
```sql
role              ENUM('user','admin') DEFAULT 'user'
suspended_until   DATETIME DEFAULT NULL
ban_reason        VARCHAR(255) DEFAULT NULL
banned_at         DATETIME DEFAULT NULL
```

### New `reports` table
```sql
CREATE TABLE reports (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id     INT NOT NULL,
    reported_id     INT NOT NULL,
    reason          ENUM('harassment','academic_dishonesty','scam_fraud',
                         'inappropriate_content','spam','impersonation','other'),
    description     TEXT NOT NULL,
    status          ENUM('pending','reviewed','dismissed','actioned') DEFAULT 'pending',
    admin_note      TEXT DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at     DATETIME DEFAULT NULL,
    resolved_by     INT DEFAULT NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (reported_id) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);
```

## Automated Escalation

Checked on each new report submission:
- 3+ actioned reports in last 30 days -> auto-suspend 7 days
- 5+ total actioned reports ever -> auto-suspend 30 days
- 3+ total suspensions -> permanent ban

Each auto-action creates a system log entry visible to admins. Admins can always override manually (unsuspend, unban, or escalate).

## Admin Page Tabs

### Overview Tab
- **4 stat cards** (animated counters on load): Total Revenue, Active Users (7d), Open Reports, Orders This Month
- **2 charts** (recharts): Revenue over time (30d line chart, service fees + shop), Orders by status (donut)
- **Recent Activity feed**: Last 10 platform events (signups, completed orders, reports, shop purchases)

### Reports Tab
- Filterable table: All | Pending | Reviewed | Dismissed | Actioned
- Row data: reporter, reported user, reason badge, description preview, timestamp, status
- Expandable row detail: full description, user profiles, report history, current status
- Action buttons: Dismiss (with note), Warn, Suspend (7d/30d), Ban

### Users Tab
- Search bar (name, username, email)
- Table: avatar, name, username, email, university, role, status, joined date
- Status indicators: Active (green), Suspended (amber + date), Banned (red)
- Inline actions: View Profile, Suspend, Ban/Unban, View As

### Revenue Tab
- Period selector: 7d | 30d | 90d | All time
- **4 breakdown cards**: Service Fees, Shop Revenue, Total Revenue, Avg Order Value
- **Stacked area chart**: daily service fees + shop purchases over period
- **Top shop items table**: item, type, purchases, revenue (sorted by revenue)
- **Top categories table**: category, order count, fees collected

## View As (Impersonation)

- Admin clicks "View As" on any user -> `POST /api/admin/impersonate.php`
- Backend sets `$_SESSION['impersonating_user_id']`; `me.php` returns impersonated user data
- Frontend shows sticky banner above NavBar: "Viewing as @username" + "Back to Admin" button
- Full access — admin can do everything that user can do
- "Back to Admin" -> `POST /api/admin/stop-impersonate.php` -> returns to `/admin`
- Impersonation banner is a top-level component in `App.tsx`

## User-Facing Report Flow

- Report button on `UserProfile.tsx` (hidden on own profile, hidden for admin's own profile)
- Modal with reason dropdown + description textarea (min 20 chars)
- One active report per reporter->reported pair
- Toast confirmation on submit
- Button changes to "Reported" (disabled) after submission

## API Endpoints

### Admin endpoints (all require role=admin)
- `GET /api/admin/stats.php` — overview stats + chart data
- `GET /api/admin/reports.php?status=pending` — report list with filters
- `PATCH /api/admin/reports.php` — update report status, add admin note
- `GET /api/admin/users.php?search=query` — user list with search
- `PATCH /api/admin/users.php` — suspend/ban/unban a user
- `GET /api/admin/revenue.php?period=30d` — revenue breakdown + chart data
- `GET /api/admin/activity.php` — recent activity feed
- `POST /api/admin/impersonate.php` — start viewing as user
- `POST /api/admin/stop-impersonate.php` — stop impersonation

### User endpoints (authenticated)
- `POST /api/reports/create.php` — submit a report
- `GET /api/reports/check.php?user_id=X` — check if already reported this user

## Security

- All `/api/admin/*` endpoints check `$_SESSION['user_role'] === 'admin'`, return 403 otherwise
- Impersonation preserves real admin ID in `$_SESSION['user_id']`, impersonated ID in separate key
- Frontend: `/admin` route renders 404 for non-admins
- Admin credentials never committed to git (admin-setup.sql is gitignored)
- Suspended users see a "Your account is suspended" screen with the date it lifts
- Banned users see a "Your account has been banned" screen with the reason

## Safety Page Fix

Update `src/pages/Safety.tsx` reporting section to accurately describe the feature:
- Report button on user profiles
- Automated escalation system
- Admin review within 24 hours
- Remove references to report buttons on listings/messages (only profiles)

## Files

| File | Action |
|------|--------|
| `sql/setup.sql` | Modify — add role, suspended_until, ban_reason, banned_at columns; add reports table |
| `sql/admin-setup.sql` | Create — gitignored, creates admin account with ID 1 |
| `.gitignore` | Modify — add sql/admin-setup.sql |
| `src/pages/Admin.tsx` | Create — tabbed admin dashboard |
| `src/routes.tsx` | Modify — add /admin route (public but renders 404 for non-admin) |
| `api/admin/stats.php` | Create — overview stats |
| `api/admin/reports.php` | Create — report list + update |
| `api/admin/users.php` | Create — user list + actions |
| `api/admin/revenue.php` | Create — revenue data |
| `api/admin/activity.php` | Create — recent activity feed |
| `api/admin/impersonate.php` | Create — start impersonation |
| `api/admin/stop-impersonate.php` | Create — stop impersonation |
| `api/reports/create.php` | Create — user submits a report |
| `api/reports/check.php` | Create — check if already reported |
| `src/pages/UserProfile.tsx` | Modify — add Report button |
| `src/lib/auth.ts` | Modify — add role to User type, add impersonation state |
| `src/components/NavBar.tsx` | Modify — add Admin nav item for admins |
| `src/components/ImpersonationBanner.tsx` | Create — sticky banner during View As |
| `src/App.tsx` | Modify — render ImpersonationBanner |
| `src/pages/Safety.tsx` | Modify — fix reporting section to match reality |
| `api/auth/me.php` | Modify — return role, handle impersonation |
