# Sprint 2, Part 1 — Work Distribution & Branch Plan

> **Team:** [Intesar Jawad (IJ)](#ij-intesar--foundation--landing-page) · [Jason (JH)](#jh-jason--login-backend--forgot-password-backend--session-management) · [Aziz (AA)](#aa-aziz--login-frontend--forgot-password-frontend) · [Jose (JC)](#jc-jose--signup-frontend--email-verification-frontend) · [Shenal (SU)](#su-shenal--signup-backend--email-verification-backend)
> **Sprint 2 Focus:** Authentication + Landing Page + Database Foundation

---

## Merge Order (This Matters)

IJ's foundation branches must merge to `dev` **before** anyone else's branches, because every other branch depends on the files IJ provides. Recommended merge sequence:

```
1. IJ: #75_database-schema-setup         ← SQL tables + seed + db_config
2. IJ: #38_landing-page-frontend          ← App shell, libs, components, NavBar, routes, Landing page
3. IJ: #39_landing-page-backend           ← helpers.php, mail.php, landing.php, cron
   ── At this point dev has the full foundation ──
4. SU: #41_signup-backend                 ← Can now use helpers.php, db_config, mail.php, tokens table
5. JH: #43_login-backend                  ← Can now use helpers.php, db_config, session logic
6. JC: #40_signup-frontend                ← Can now use auth.ts, api.ts, NavBar, routes
7. AA: #42_login-frontend                 ← Can now use auth.ts, api.ts, NavBar, routes
```

Cards 4–7 can merge in any order once 1–3 are in `dev`. But backend before frontend within each feature is cleaner since the FE folks can test against real endpoints.

---

## IJ (Intesar) — Foundation + Landing Page

> You provide the scaffolding that the entire team builds on. Nothing works without your branches merging first.

### Branch: `#75_database-schema-setup`
**Card:** #75 (+ #76–84 work is embedded in the same SQL files)
**Blocks:** US #11, US #10, and transitively everything else

**Files to create/commit:**

| File | What it does |
|---|---|
| [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql) | Creates all 17 tables |
| [`sql/admin-setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/admin-setup.sql) | Inserts admin user (id=1, role='admin') — gitignored on main, committed for team reference |
| [`sql/seed.sql`](https://github.com/intesarjawad/hive/blob/main/sql/seed.sql) | 1,000 users, 2,000 services, 5,000 orders, 27 universities of demo data |
| [`api/db_config.example.php`](https://github.com/intesarjawad/hive/blob/main/api/db_config.example.php) | PDO connection template with placeholder credentials |
| `.gitignore` entry | Ensure `api/db_config.php` is gitignored |

**Manual server work (not in Git):**
- Create `api/db_config.php` on aptitude with real credentials
- Run `setup.sql` → `admin-setup.sql` → `seed.sql` on aptitude phpMyAdmin
- Repeat on cattle (setup + admin-setup only, no seed on production)

---

### Branch: `#38_landing-page-frontend`
**Card:** #38
**Blocks:** US #1

**Files to create/commit — Frontend App Shell (everyone depends on these):**

| File | What it does |
|---|---|
| [`src/main.tsx`](https://github.com/intesarjawad/hive/blob/main/src/main.tsx) | React DOM entry point |
| [`src/App.tsx`](https://github.com/intesarjawad/hive/blob/main/src/App.tsx) | Root component: `AuthProvider` + `AccountStatusGate` + `RouterProvider` + `Toaster` |
| [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx) | All route definitions — public (/, /signup, /login, /forgot-password, /safety, /terms, /privacy) + protected routes wrapped in `ProtectedRoute` |
| [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts) | `apiGet`, `apiPost`, `apiPatch`, `apiDelete` — every page uses these |
| [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts) | `AuthProvider`, `useAuth()` hook, `User` interface, login/signup/logout functions, `refreshUser()` |
| [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts) | `CATEGORIES`, `CATEGORY_COLORS`, timezone helpers |
| [`src/lib/universities.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/universities.ts) | `DOMAIN_TO_UNIVERSITY` map, `universityFromEmail()` |
| [`src/lib/data.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/data.ts) | Static mock data arrays for dev reference |
| [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx) | Both logged-out and logged-in variants |
| [`src/components/ProtectedRoute.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProtectedRoute.tsx) | Route guard — redirects unauthed users to 404 |
| [`src/components/AccountStatusGate.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/AccountStatusGate.tsx) | Blocks banned/suspended users |
| [`src/components/ui/*`](https://github.com/intesarjawad/hive/tree/main/src/components/ui) | All ShadCN/ui primitives (buttons, inputs, input-otp, etc.) |
| [`src/styles/globals.css`](https://github.com/intesarjawad/hive/blob/main/src/styles/globals.css) | Color system, fonts, Tailwind theme config |
| [`src/index.css`](https://github.com/intesarjawad/hive/blob/main/src/index.css) | Global styles, font imports, animations |
| [`index.html`](https://github.com/intesarjawad/hive/blob/main/index.html) | Vite entry point |
| [`package.json`](https://github.com/intesarjawad/hive/blob/main/package.json) + [`package-lock.json`](https://github.com/intesarjawad/hive/blob/main/package-lock.json) | All NPM dependencies |
| [`vite.config.ts`](https://github.com/intesarjawad/hive/blob/main/vite.config.ts) | Vite config with path aliases and dev proxy |
| [`public/favicon.svg`](https://github.com/intesarjawad/hive/blob/main/public/favicon.svg) | Site favicon |

**Files to create/commit — Landing Page itself:**

| File | What it does |
|---|---|
| [`src/pages/Landing.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Landing.tsx) | Full landing page: Three.js hero, GSAP animations, intro sequence, stat counters, featured categories, CTA, footer |
| [`src/pages/NotFound.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/NotFound.tsx) | 404 page (needed by ProtectedRoute) |
| [`src/pages/Safety.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Safety.tsx) | Safety guidelines (footer link target) |
| [`src/pages/Terms.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Terms.tsx) | Terms of service (footer link target) |
| [`src/pages/Privacy.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Privacy.tsx) | Privacy policy (footer link target) |
| [`src/pages/DesignSystem.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/DesignSystem.tsx) | Component gallery for dev reference |

---

### Branch: `#39_landing-page-backend`
**Card:** #39
**Blocks:** US #1

**Files to create/commit:**

| File | What it does |
|---|---|
| [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php) | `cors()`, `json_response()`, `require_auth()`, `require_admin()`, `require_method()`, `get_json_body()`, `create_notification()`, cosmetic helpers, session config (30-day, httponly, samesite) |
| [`api/mail.php`](https://github.com/intesarjawad/hive/blob/main/api/mail.php) | `send_verification_email()` — HTML emails for signup verification, password reset, email change |
| [`api/landing.php`](https://github.com/intesarjawad/hive/blob/main/api/landing.php) | GET endpoint — total_services, total_providers, total_universities, total_completed, categories, featured_services |
| [`api/cron/auto-resolve.php`](https://github.com/intesarjawad/hive/blob/main/api/cron/auto-resolve.php) | Background job called from me.php — auto-completes stale orders, resolves disputes |
| [`api/uploads/profiles/.gitkeep`](https://github.com/intesarjawad/hive/blob/main/api/uploads/profiles/.gitkeep) | Placeholder for profile image uploads |
| [`api/uploads/services/.gitkeep`](https://github.com/intesarjawad/hive/blob/main/api/uploads/services/.gitkeep) | Placeholder for service image uploads |
| [`.htaccess`](https://github.com/intesarjawad/hive/blob/main/.htaccess) | Apache rewrite rules for SPA routing |

---

## SU (Shenal) — Signup Backend + Email Verification Backend

> **Depends on:** IJ's `#75` (database tables) and `#39` ([`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php), [`api/mail.php`](https://github.com/intesarjawad/hive/blob/main/api/mail.php), db_config)
> **Must merge after:** IJ's three branches are in `dev`

### Branch: `#41_signup-backend`
**Card:** #41
**Blocks:** US #11 (student create account)

**Files to create/commit:**

| File | What it does |
|---|---|
| [`api/auth/signup.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/signup.php) | POST. Validates .edu email, password strength (8–72 chars, uppercase + number), checks duplicate email/username (including deactivated accounts). Creates user with `password_hash(PASSWORD_DEFAULT)`. Generates 6-digit verification token (24-hour expiry), stores in `tokens` table as `email_verification` type. Calls `send_verification_email()`. Starts session (browser-session cookie, NOT 30-day — only login with remember-me gets 30-day). Returns user data (id, email, username, names, verified=false) with 201 status. Does NOT set `$_SESSION['user_role']`. |
| [`api/auth/verify.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/verify.php) | POST. Validates 6-digit code against `tokens` table. Test bypass code "696969" always succeeds. Marks user as `verified = 1`, sets `last_verified_at`. Awards 10 HiveCoin welcome bonus via `transactions` table (prevents duplicate bonuses). Invalidates used token. |
| [`api/auth/resend-verification.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/resend-verification.php) | POST. Requires active session. Invalidates old verification tokens for this user. Generates new 6-digit code, stores in `tokens` table. Calls `send_verification_email()` with new code. |

**What Shenal needs from IJ's branches (already in dev):**
- [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php) — for `cors()`, `json_response()`, `require_auth()`, `get_json_body()`, `require_method()`
- [`api/mail.php`](https://github.com/intesarjawad/hive/blob/main/api/mail.php) — for `send_verification_email()`
- [`api/db_config.example.php`](https://github.com/intesarjawad/hive/blob/main/api/db_config.example.php) — copy to `api/db_config.php` with own credentials
- [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql) — `users` and `tokens` tables must exist
- [`sql/seed.sql`](https://github.com/intesarjawad/hive/blob/main/sql/seed.sql) — optional, for testing login with existing accounts

**Key implementation requirements:**
- Use `$pdo->prepare()` with bound parameters for ALL queries (prepared statements)
- Use `password_hash($password, PASSWORD_DEFAULT)` — never MD5, SHA, or plaintext
- Verify `.edu` email suffix server-side (don't trust frontend validation alone)
- Return JSON with proper HTTP status codes (201 on success, 400/409/500 on error)
- Never return `password_hash` in any response

---

## JH (Jason) — Login Backend + Forgot Password Backend + Session Management

> **Depends on:** IJ's `#75` (database tables) and `#39` ([`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php), [`api/mail.php`](https://github.com/intesarjawad/hive/blob/main/api/mail.php))
> **Must merge after:** IJ's three branches are in `dev`

### Branch: `#43_login-backend`
**Card:** #43
**Blocks:** US #10 (registered customer secure login)

**Files to create/commit:**

| File | What it does |
|---|---|
| [`api/auth/login.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/login.php) | POST. Accepts email + password + optional `remember_me` boolean. Verifies password with `password_verify()`. If `remember_me` is true, sets session cookie lifetime to 30 days (2592000 seconds) via `session_set_cookie_params()` + `session_regenerate_id()`. Stores `user_id` and `user_role` in `$_SESSION`. Checks `banned_at` (reject if set, returns 403 with `ban_reason`), `suspended_until` (reject if future, returns 403 with `suspended_until`), `deactivated_at` (auto-reactivate by setting to NULL). Checks annual re-verification (`last_verified_at` > 1 year ago → invalidates verification, sends new code, returns `needs_reverification: true`). Returns user data with raw `active_frame_id`/`active_badge_id`/`active_theme_id` integers — does NOT resolve cosmetic metadata (that's [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php)'s job, which the frontend calls via `refreshUser()` immediately after login). Also updates `last_seen_at`. |
| [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php) | GET. Returns current authenticated user if session is valid. Queries user with LEFT JOINs on `shop_items` for frame, badge, AND theme (3 JOINs) — this is where cosmetic metadata gets resolved into gradient/glow/tag/colors/animations. Sets `$_SESSION['user_role']`. Handles admin impersonation (checks `$_SESSION['impersonating_user_id']`). Calls `require_once __DIR__.'/../cron/auto-resolve.php'` on every request (throttled internally to max once per 5 min). Destroys session if user not found or deactivated. Returns user data + full `cosmetics` object + `impersonating` flag. |
| [`api/auth/logout.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/logout.php) | POST. Clears `$_SESSION`, calls `session_destroy()`. Returns `{"ok": true}`. |
| [`api/auth/forgot-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/forgot-password.php) | POST. Accepts email. Looks up user by email. If found: generates 6-digit code, stores in `tokens` table as `password_reset` type with 1-hour expiry. Calls `send_verification_email($email, $code, 'reset')`. Always returns success message even if email not found (email enumeration prevention). |
| [`api/auth/reset-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/reset-password.php) | POST. Accepts email + code + new_password. Validates code against `tokens` table (type = 'password_reset', not expired, not used). Test bypass code "696969" always succeeds. Validates new password strength (same rules as signup). Updates `password_hash` in `users` table. Marks token as used. If user was deactivated, sets `deactivated_at = NULL` to revive account. |

**What Jason needs from IJ's branches (already in dev):**
- [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php) — for `cors()`, `json_response()`, `require_auth()`, `get_json_body()`, `require_method()`, session config. Note: [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php) builds its cosmetic JOINs and object inline (does not use the `build_cosmetics_from_row()` / `cosmetic_join_sql()` helpers — those are for other endpoints), but the helpers file still must be present since every endpoint requires it.
- [`api/mail.php`](https://github.com/intesarjawad/hive/blob/main/api/mail.php) — for `send_verification_email()` (used by forgot-password)
- [`api/cron/auto-resolve.php`](https://github.com/intesarjawad/hive/blob/main/api/cron/auto-resolve.php) — called from [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php)
- [`api/db_config.example.php`](https://github.com/intesarjawad/hive/blob/main/api/db_config.example.php) — copy to `api/db_config.php` with own credentials
- [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql) — `users`, `tokens`, `shop_items` tables must exist (shop_items for cosmetic JOINs)

**Key implementation requirements:**
- Use `password_verify()` — never compare hashes directly
- Remember-me cookie: set lifetime to `2592000` (30 days), call `session_regenerate_id(true)` after setting
- Always set `httponly`, `samesite=Lax`, `secure` (on HTTPS) on session cookies
- Never return `password_hash` in any response
- [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php) must work without authentication (return 401, not crash) since the frontend calls it on every page load to check session status

---

## JC (Jose) — Signup Frontend + Email Verification Frontend

> **Depends on:** IJ's `#38` (app shell, [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts), [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts), NavBar, routes) and SU's `#41` (signup backend endpoints)
> **Can start building UI immediately** against IJ's frontend shell. Backend integration can happen once SU's branch merges.

### Branch: `#40_signup-frontend`
**Card:** #40
**Blocks:** US #11 (student create account)

**Files to create/commit:**

| File | What it does |
|---|---|
| [`src/pages/Signup.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Signup.tsx) | Registration form. Fields: Full Name (first + last parsed), Email (.edu validation with real-time inline error), Password (show/hide toggle via Eye/EyeOff icon, strength indicator with 4 colored bars: red → amber → honey → emerald). "Create Account" button calls `apiPost('/auth/signup.php', {...})`. On success, navigates to `/verify`. Error handling: duplicate email (409), duplicate username (409), validation errors (400). Link to login page. |
| [`src/pages/EmailVerification.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/EmailVerification.tsx) | 6-digit OTP entry using 6 individual `<input>` elements with refs (custom implementation, NOT the `input-otp` ShadCN component). Auto-advances focus on digit entry, supports backspace navigation and paste. Auto-submits when all 6 digits entered. Calls `apiPost('/auth/verify.php', {code})`. Test code "696969" always works. "Resend Code" button with 60-second countdown timer — calls `apiPost('/auth/resend-verification.php')`. On success, shows toast and navigates to `/onboarding` (or `/discover` if already onboarded). Redirects to `/login` if not authenticated, redirects past if already verified. |
| [`src/pages/Onboarding.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Onboarding.tsx) | Post-signup profile setup. Photo upload (drag-and-drop + click, sends base64 via `apiPost('/users/upload-avatar.php', {image})`). Bio textarea. Major text input. Year dropdown (Freshman through Graduate). Submit calls `apiPost('/users/onboarding.php', {...})`. Auto-redirects to `/discover` if `onboarding_done` is already true. |

**What Jose needs from IJ's branches (already in dev):**
- [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts) — `apiPost` for calling signup/verify/resend endpoints
- [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts) — `useAuth()` to update user state after signup, `AuthProvider` for context
- [`src/lib/universities.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/universities.ts) — `universityFromEmail()` to show university name after email entry
- [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx) — logged-out variant renders on signup page
- [`src/components/ui/*`](https://github.com/intesarjawad/hive/tree/main/src/components/ui) — input, button, input-otp, and other primitives
- [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx) — routes for `/signup`, `/verify`, `/onboarding` must exist
- [`src/styles/globals.css`](https://github.com/intesarjawad/hive/blob/main/src/styles/globals.css) + [`src/index.css`](https://github.com/intesarjawad/hive/blob/main/src/index.css) — design tokens, fonts

**What Jose needs from SU's branch (for integration testing):**
- [`api/auth/signup.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/signup.php), [`api/auth/verify.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/verify.php), [`api/auth/resend-verification.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/resend-verification.php) running on aptitude

**Key implementation requirements:**
- .edu email validation must happen on both frontend (real-time UX) and backend (security)
- Password strength indicator: 4 bars filling left-to-right based on length + complexity
- OTP input must auto-focus first digit on page load and auto-submit on 6th digit
- Resend button must show countdown timer (60 seconds) to prevent spam
- All API errors must display as user-friendly toast or inline error messages

---

## AA (Aziz) — Login Frontend + Forgot Password Frontend

> **Depends on:** IJ's `#38` (app shell, [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts), [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts), NavBar, routes) and JH's `#43` (login backend endpoints)
> **Can start building UI immediately** against IJ's frontend shell. Backend integration can happen once JH's branch merges.

### Branch: `#42_login-frontend`
**Card:** #42
**Blocks:** US #10 (registered customer secure login)

**Files to create/commit:**

| File | What it does |
|---|---|
| [`src/pages/Login.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Login.tsx) | Login form. Fields: Email, Password (show/hide toggle). "Remember me" checkbox — sends `remember_me: true` in the POST body to `apiPost('/auth/login.php', {...})`. Error handling: wrong password (401), banned account (403 — show ban reason from response), suspended account (403 — show suspension timer), unverified account (redirect to `/verify`), deactivated account (auto-reactivated by backend, login succeeds). On success: if `onboarding_done` is false → navigate to `/onboarding`, else → navigate to `/discover`. Link to `/forgot-password`. Link to `/signup`. |
| [`src/pages/ForgotPassword.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ForgotPassword.tsx) | Two-step flow in one page. **Step 1:** Email input + "Send Reset Code" button → calls `apiPost('/auth/forgot-password.php', {email})`. On success, switches to Step 2. **Step 2:** 6-digit OTP input + new password field (with strength indicator + show/hide) + "Reset Password" button → calls `apiPost('/auth/reset-password.php', {email, code, password})`. "Resend Code" button with cooldown timer. On success, shows toast and navigates to `/login`. |

**What Aziz needs from IJ's branches (already in dev):**
- [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts) — `apiPost` for calling login/forgot-password/reset endpoints
- [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts) — `useAuth()` to update user state after login, check `onboarding_done`
- [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx) — logged-out variant renders on login page
- [`src/components/ui/*`](https://github.com/intesarjawad/hive/tree/main/src/components/ui) — input, button, checkbox, input-otp primitives
- [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx) — routes for `/login`, `/forgot-password` must exist
- [`src/styles/globals.css`](https://github.com/intesarjawad/hive/blob/main/src/styles/globals.css) + [`src/index.css`](https://github.com/intesarjawad/hive/blob/main/src/index.css) — design tokens, fonts

**What Aziz needs from JH's branch (for integration testing):**
- [`api/auth/login.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/login.php), [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php), [`api/auth/logout.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/logout.php), [`api/auth/forgot-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/forgot-password.php), [`api/auth/reset-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/reset-password.php) running on aptitude

**Key implementation requirements:**
- Remember-me checkbox must actually send `remember_me: true` in the request body — the backend uses this to set a 30-day cookie
- Banned accounts: display the `ban_reason` from the API response
- Suspended accounts: display a countdown timer showing when suspension lifts (parse `suspended_until` from response)
- Forgot password must not reveal whether an email exists (backend returns success regardless, frontend should show "If an account exists, we sent a code")

---

## Onboarding Backend (IJ provides, Jose's FE calls it)

These files are included in IJ's `#39` branch since they're part of the backend foundation:

| File | What it does |
|---|---|
| [`api/users/onboarding.php`](https://github.com/intesarjawad/hive/blob/main/api/users/onboarding.php) | POST. Sets major, year, bio. Marks `onboarding_done = true`. |
| [`api/users/upload-avatar.php`](https://github.com/intesarjawad/hive/blob/main/api/users/upload-avatar.php) | POST. Accepts base64 data URL. GD center-crop + resize to 400×400. Saves to `api/uploads/profiles/`. |

---

## Quick Reference: Who Owns What

| Person | Card # | Branch | Feature | Files they write |
|---|---|---|---|---|
| **IJ** | #75 | `#75_database-schema-setup` | DB foundation | [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql), [`sql/admin-setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/admin-setup.sql), [`sql/seed.sql`](https://github.com/intesarjawad/hive/blob/main/sql/seed.sql), [`api/db_config.example.php`](https://github.com/intesarjawad/hive/blob/main/api/db_config.example.php) |
| **IJ** | #38 | `#38_landing-page-frontend` | App shell + Landing FE | All [`src/lib/*`](https://github.com/intesarjawad/hive/tree/main/src/lib), [`src/components/*`](https://github.com/intesarjawad/hive/tree/main/src/components), [`src/pages/Landing.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Landing.tsx), [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx), [`src/App.tsx`](https://github.com/intesarjawad/hive/blob/main/src/App.tsx), build config |
| **IJ** | #39 | `#39_landing-page-backend` | Backend foundation + Landing BE | [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php), [`api/mail.php`](https://github.com/intesarjawad/hive/blob/main/api/mail.php), [`api/landing.php`](https://github.com/intesarjawad/hive/blob/main/api/landing.php), [`api/cron/*`](https://github.com/intesarjawad/hive/tree/main/api/cron), [`api/users/onboarding.php`](https://github.com/intesarjawad/hive/blob/main/api/users/onboarding.php), [`api/users/upload-avatar.php`](https://github.com/intesarjawad/hive/blob/main/api/users/upload-avatar.php) |
| **SU** | #41 | `#41_signup-backend` | Signup + Verification BE | [`api/auth/signup.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/signup.php), [`api/auth/verify.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/verify.php), [`api/auth/resend-verification.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/resend-verification.php) |
| **JH** | #43 | `#43_login-backend` | Login + Forgot PW + Session BE | [`api/auth/login.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/login.php), [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php), [`api/auth/logout.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/logout.php), [`api/auth/forgot-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/forgot-password.php), [`api/auth/reset-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/reset-password.php) |
| **JC** | #40 | `#40_signup-frontend` | Signup + Verification + Onboarding FE | [`src/pages/Signup.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Signup.tsx), [`src/pages/EmailVerification.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/EmailVerification.tsx), [`src/pages/Onboarding.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Onboarding.tsx) |
| **AA** | #42 | `#42_login-frontend` | Login + Forgot PW FE | [`src/pages/Login.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Login.tsx), [`src/pages/ForgotPassword.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ForgotPassword.tsx) |

---

## Dependency Graph

```
IJ #75 (DB)
  │
  ├──→ IJ #39 (Backend Foundation)
  │      │
  │      ├──→ SU #41 (Signup BE)  ──→  JC #40 (Signup FE)
  │      │
  │      └──→ JH #43 (Login BE)  ──→  AA #42 (Login FE)
  │
  └──→ IJ #38 (Frontend Foundation)
           │
           ├──→ JC #40 (Signup FE)
           │
           └──→ AA #42 (Login FE)
```

**Translation:** JC and AA can start building their React pages as soon as IJ's `#38` merges (they don't need the backend yet — they can hardcode responses while developing). But for real integration testing, SU and JH's backends need to be live on aptitude.
