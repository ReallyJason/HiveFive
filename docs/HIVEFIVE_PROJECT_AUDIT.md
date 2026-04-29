# HiveFive - Complete Project Audit & Reconstruction Guide

> **Purpose:** A comprehensive, ordered listing of every feature, subfeature, and script in the HiveFive codebase, organized so that 5 developers can distribute work and reconstruct the project from scratch.
>
> **Tech Stack:** React 18 + TypeScript + Vite (frontend) | PHP 8.2 + MySQL (backend) | Tailwind CSS v4 + ShadCN/ui (styling) | Docker + Apache (deployment)

---

## Table of Contents

1. [Foundation & Shared Infrastructure](#1-foundation--shared-infrastructure)
2. [Authentication & Onboarding](#2-authentication--onboarding)
3. [Landing Page & Public Discovery](#3-landing-page--public-discovery)
4. [Service Marketplace](#4-service-marketplace)
5. [Request Marketplace](#5-request-marketplace)
6. [Order & Transaction System](#6-order--transaction-system)
7. [Messaging System](#7-messaging-system)
8. [User Profiles & Settings](#8-user-profiles--settings)
9. [Dashboard & Notifications](#9-dashboard--notifications)
10. [Wallet & Financial System](#10-wallet--financial-system)
11. [Leaderboard & Buzz Score](#11-leaderboard--buzz-score)
12. [Hive Shop (Cosmetics)](#12-hive-shop-cosmetics)
13. [Reporting & Moderation](#13-reporting--moderation)
14. [Admin Dashboard](#14-admin-dashboard)
15. [Legal & Informational Pages](#15-legal--informational-pages)
16. [Orphans & Infrastructure](#16-orphans--infrastructure)

---

## 1. Foundation & Shared Infrastructure

> **Build this first.** Everything else depends on these files. No frontend-backend pairing here — these are the scaffolding that both sides share.

### 1A. Database Schema
*Build order: run these SQL files to create the database before anything else.*

| # | Script | Description |
|---|--------|-------------|
| 1 | [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql) | Creates all 17 tables: users, services, service_images, requests, proposals, orders, reviews, client_reviews, review_votes, conversations, messages, transactions, shop_items, shop_purchases, tokens, notifications, reports. All foreign keys, indexes, and ENUMs defined here. |
| 2 | [`sql/admin-setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/admin-setup.sql) | Inserts the admin user (id=1) with role='admin'. Run after setup.sql, before seed.sql. |
| 3 | [`sql/seed.sql`](https://github.com/intesarjawad/hive/blob/main/sql/seed.sql) | Generates 1000 users, 2000 services, 5000 orders, 27 colleges of demo data. Uses procedural SQL with helper tables. For development only. |

### 1B. Backend Core (PHP Helpers)
*These files are `require_once`'d by every API endpoint.*

| # | Script | Description |
|---|--------|-------------|
| 1 | [`api/db_config.php`](https://github.com/intesarjawad/hive/blob/main/api/db_config.php) | PDO database connection with UTC timezone, error mode exception, charset utf8mb4. |
| 2 | [`api/db_config.example.php`](https://github.com/intesarjawad/hive/blob/main/api/db_config.example.php) | Template version of db_config for other devs to copy. |
| 3 | [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php) | Shared functions: `cors()` (CORS headers), `json_response()` (JSON output + exit), `require_auth()` (session check), `require_admin()` (role check), `require_method()` (HTTP verb check), `get_json_body()` (parse JSON POST), `create_notification()` (insert notification row), cosmetic builder helpers for frames/badges/themes. |
| 4 | [`api/mail.php`](https://github.com/intesarjawad/hive/blob/main/api/mail.php) | `send_verification_email()` — sends HTML emails for signup verification, password reset, and email change. Uses PHP `mail()`. |
| 5 | [`api/cron/auto-resolve.php`](https://github.com/intesarjawad/hive/blob/main/api/cron/auto-resolve.php) | Background job: auto-completes orders after 48h of `awaiting_completion`, auto-resolves disputes with 50/50 split after 7 days. Throttled via lock file to run max once per 5 minutes. Called from [`me.php`](https://github.com/intesarjawad/hive/blob/main/me.php) on every auth check. |

### 1C. Frontend Core (App Shell)
*These files bootstrap the React app. Build them in this order.*

| # | Script | Description |
|---|--------|-------------|
| 1 | [`src/main.tsx`](https://github.com/intesarjawad/hive/blob/main/src/main.tsx) | React DOM entry point. Renders `<App />` into root div. |
| 2 | [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts) | API client module. Exports generic `api<T>()` function, convenience wrappers (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`). Handles credentials, JSON serialization, `ApiError` class. |
| 3 | [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts) | Auth context & provider (`AuthProvider`). Manages user state, login/signup/logout functions, `refreshUser()` to poll `/api/auth/me`. Exports `User` TypeScript interface and `useAuth()` hook. |
| 4 | [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts) | Centralized constants: `CATEGORIES`, `CATEGORY_COLORS`, `BUDGET_RANGES`, `PRICE_FILTER_OPTIONS`, `SORT_OPTIONS`. Also timezone helpers: `toUTCBooking()`, `formatSchedule()`, `parseUTC()`, `parseLocalDate()`. |
| 5 | [`src/lib/universities.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/universities.ts) | `DOMAIN_TO_UNIVERSITY` mapping (50+ .edu domains). `universityFromEmail()` extracts university name from email. `buildList()` helper. |
| 6 | [`src/lib/data.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/data.ts) | Static mock/seed data arrays for development reference: services, conversations, activeOrders, userStats, leaderboardData, hiveShopItems, requests. |
| 7 | [`src/components/ProtectedRoute.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProtectedRoute.tsx) | Route guard. Redirects unauthenticated users to the 404 page. Shows logged-out NavBar for unauthenticated visitors. Depends on [`auth.ts`](https://github.com/intesarjawad/hive/blob/main/auth.ts). |
| 8 | [`src/components/AccountStatusGate.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/AccountStatusGate.tsx) | Blocks banned/suspended users from accessing the app. Shows customized error pages with ban reasons and suspension timers. Depends on [`auth.ts`](https://github.com/intesarjawad/hive/blob/main/auth.ts), [`constants.ts`](https://github.com/intesarjawad/hive/blob/main/constants.ts). |
| 9 | [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx) | React Router configuration. Defines all 30+ routes — public routes (/, /signup, /login, /forgot-password, /safety, /terms, /privacy) and protected routes wrapped in `ProtectedRoute`. Catch-all 404. Imports `ProtectedRoute`. |
| 10 | [`src/App.tsx`](https://github.com/intesarjawad/hive/blob/main/src/App.tsx) | Root component. Wraps the app in `AuthProvider` + `AccountStatusGate` + `RouterProvider` + `Toaster` (sonner). Imports [`auth.ts`](https://github.com/intesarjawad/hive/blob/main/auth.ts), [`routes.tsx`](https://github.com/intesarjawad/hive/blob/main/routes.tsx), `AccountStatusGate`. Must be last since it ties everything together. |

### 1D. Frontend Styling
*Set up the design system before building any pages.*

| # | Script | Description |
|---|--------|-------------|
| 1 | [`src/styles/globals.css`](https://github.com/intesarjawad/hive/blob/main/src/styles/globals.css) | CSS custom properties defining the HiveFive color system (Honey, Charcoal, Cream palettes), semantic colors (success/warning/error/info), font families (Fraunces, DM Sans, JetBrains Mono), Tailwind theme config, ShadCN compatibility mappings. |
| 2 | [`src/index.css`](https://github.com/intesarjawad/hive/blob/main/src/index.css) | Global styles: font imports, scrollbar hiding, category card hover animations, footer link underline sweep, Tailwind CSS v4 imports. |

### 1E. Frontend UI Primitives (ShadCN/ui)
*Pre-built accessible components. Install these via ShadCN CLI or copy from the repo. Listed alphabetically — install as needed by features.*

| # | Script | Description |
|---|--------|-------------|
| 1 | [`src/components/ui/utils.ts`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/utils.ts) | `cn()` utility combining `clsx` + `tailwind-merge`. Used by every UI component. |
| 2 | [`src/components/ui/use-mobile.ts`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/use-mobile.ts) | `useMobile()` hook — returns boolean for viewport < 768px. |
| 3 | [`src/components/ui/accordion.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/accordion.tsx) | Collapsible accordion panels (Radix) |
| 4 | [`src/components/ui/alert-dialog.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/alert-dialog.tsx) | Confirmation dialogs with overlay (Radix) |
| 5 | [`src/components/ui/alert.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/alert.tsx) | Alert banner component |
| 6 | [`src/components/ui/aspect-ratio.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/aspect-ratio.tsx) | Responsive aspect ratio container (Radix) |
| 7 | [`src/components/ui/avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/avatar.tsx) | Avatar with image + fallback (Radix) |
| 8 | [`src/components/ui/badge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/badge.tsx) | Small badge/tag label (CVA variants) |
| 9 | [`src/components/ui/breadcrumb.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/breadcrumb.tsx) | Breadcrumb navigation |
| 10 | [`src/components/ui/button.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/button.tsx) | Button with variants: default, destructive, outline, secondary, ghost, link (CVA) |
| 11 | [`src/components/ui/calendar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/calendar.tsx) | Calendar date picker (react-day-picker) |
| 12 | [`src/components/ui/card.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/card.tsx) | Card container with header/content/footer |
| 13 | [`src/components/ui/carousel.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/carousel.tsx) | Image/content carousel (embla-carousel) |
| 14 | [`src/components/ui/chart.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/chart.tsx) | Chart wrapper for Recharts integration |
| 15 | [`src/components/ui/checkbox.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/checkbox.tsx) | Checkbox input (Radix) |
| 16 | [`src/components/ui/collapsible.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/collapsible.tsx) | Collapsible section (Radix) |
| 17 | [`src/components/ui/command.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/command.tsx) | Command palette / combobox (cmdk) |
| 18 | [`src/components/ui/context-menu.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/context-menu.tsx) | Right-click context menu (Radix) |
| 19 | [`src/components/ui/dialog.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/dialog.tsx) | Modal dialog (Radix) |
| 20 | [`src/components/ui/drawer.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/drawer.tsx) | Bottom sheet drawer (vaul) |
| 21 | [`src/components/ui/dropdown-menu.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/dropdown-menu.tsx) | Dropdown menu (Radix) |
| 22 | [`src/components/ui/form.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/form.tsx) | Form components with react-hook-form integration |
| 23 | [`src/components/ui/hover-card.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/hover-card.tsx) | Hover-triggered info card (Radix) |
| 24 | [`src/components/ui/input-otp.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/input-otp.tsx) | OTP digit input fields (input-otp) |
| 25 | [`src/components/ui/input.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/input.tsx) | Text input field |
| 26 | [`src/components/ui/label.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/label.tsx) | Form label (Radix) |
| 27 | [`src/components/ui/menubar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/menubar.tsx) | Horizontal menu bar (Radix) |
| 28 | [`src/components/ui/navigation-menu.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/navigation-menu.tsx) | Navigation menu with dropdowns (Radix) |
| 29 | [`src/components/ui/pagination.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/pagination.tsx) | Pagination controls |
| 30 | [`src/components/ui/popover.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/popover.tsx) | Popover with positioning (Radix) |
| 31 | [`src/components/ui/progress.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/progress.tsx) | Progress bar (Radix) |
| 32 | [`src/components/ui/radio-group.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/radio-group.tsx) | Radio button group (Radix) |
| 33 | [`src/components/ui/resizable.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/resizable.tsx) | Resizable split panels (react-resizable-panels) |
| 34 | [`src/components/ui/scroll-area.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/scroll-area.tsx) | Custom scroll area (Radix) |
| 35 | [`src/components/ui/select.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/select.tsx) | Dropdown select (Radix) |
| 36 | [`src/components/ui/separator.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/separator.tsx) | Horizontal/vertical separator (Radix) |
| 37 | [`src/components/ui/sheet.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/sheet.tsx) | Side panel overlay (Radix dialog variant) |
| 38 | [`src/components/ui/sidebar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/sidebar.tsx) | Sidebar layout component |
| 39 | [`src/components/ui/skeleton.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/skeleton.tsx) | Loading skeleton placeholder |
| 40 | [`src/components/ui/slider.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/slider.tsx) | Range slider (Radix) |
| 41 | [`src/components/ui/sonner.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/sonner.tsx) | Toast notification provider (sonner) |
| 42 | [`src/components/ui/switch.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/switch.tsx) | Toggle switch (Radix) |
| 43 | [`src/components/ui/table.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/table.tsx) | Data table with header/body/row/cell |
| 44 | [`src/components/ui/tabs.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/tabs.tsx) | Tab navigation (Radix) |
| 45 | [`src/components/ui/textarea.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/textarea.tsx) | Multi-line text input |
| 46 | [`src/components/ui/toggle-group.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/toggle-group.tsx) | Grouped toggles (Radix) |
| 47 | [`src/components/ui/toggle.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/toggle.tsx) | Single toggle button (Radix) |
| 48 | [`src/components/ui/tooltip.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/tooltip.tsx) | Hover tooltip (Radix) |

### 1F. Shared Custom Components
*Reusable components used across multiple features. Build alongside the features that need them.*

*Build order: leaf components (no project imports) first, then compound components that import them.*

| # | Script | Description | Used By |
|---|--------|-------------|---------|
| 1 | [`src/components/figma/ImageWithFallback.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/figma/ImageWithFallback.tsx) | Image component with loading fallback/error handling. No project dependencies. | Various |
| 2 | [`src/components/EmptyState.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/EmptyState.tsx) | Reusable empty-state UI with icon, title, description, and optional action button. No project dependencies. | Multiple list pages |
| 3 | [`src/components/StatusBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/StatusBadge.tsx) | Order/request status indicator (Pending, In Progress, Completed, Cancelled, Disputed) with color coding. No project dependencies. | Orders, Dashboard |
| 4 | [`src/components/CategoryBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CategoryBadge.tsx) | Category chip using `CATEGORY_COLORS`. Supports linked mode navigating to `/discover?category=`. Depends on [`constants.ts`](https://github.com/intesarjawad/hive/blob/main/constants.ts). | Service/Request cards, detail pages |
| 5 | [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx) | User avatar with fallback initials, sizing variants, optional profile frame (gradient ring with CSS animation), online indicator dot. No project component dependencies. | Profiles, Messages, NavBar, Cards |
| 6 | [`src/components/ProfileBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProfileBadge.tsx) | Cosmetic achievement badge with gradient/solid background and custom CSS animation. No project component dependencies. | Profiles, Cards |
| 7 | [`src/components/ServiceCard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ServiceCard.tsx) | Service listing card: title, category badge, provider name/avatar, price, rating/review count, image with fallback. No custom component imports. | Discover, Search, Landing, Profile |
| 8 | [`src/components/CustomSelect.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CustomSelect.tsx) | Dropdown select with options array, placeholder, label, compact sizing. No project dependencies. | Multiple forms |
| 9 | [`src/components/DatePicker.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/DatePicker.tsx) | Custom date picker with calendar dropdown, month/year navigation, disabled dates. No project dependencies. | Booking, Requests |
| 10 | [`src/components/TimePicker.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/TimePicker.tsx) | 12-hour time picker with scrollable hour/minute columns and AM/PM toggle. No project dependencies. | Booking, Proposals |
| 11 | [`src/components/CurrencyInput.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CurrencyInput.tsx) | HiveCoin (⬡) currency input. Handles number formatting, backspace, paste, 2 decimal places. No project dependencies. | Service posting, Proposals, Wallet |
| 12 | [`src/components/UniversitySearch.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/UniversitySearch.tsx) | Autocomplete search for 300+ US universities with alias support (e.g., "MIT"). Depends on [`universities.ts`](https://github.com/intesarjawad/hive/blob/main/universities.ts). | Signup, Settings |
| 13 | [`src/components/LinkPreviewCard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/LinkPreviewCard.tsx) | Rich previews for service/request/user links in messages. Caches preview data. Depends on [`api.ts`](https://github.com/intesarjawad/hive/blob/main/api.ts). | Messages |
| 14 | [`src/components/ProposalModal.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProposalModal.tsx) | Modal for submitting proposals: price, message, scheduled date/time. Validates before submission. Imports `CurrencyInput`, `DatePicker`, `TimePicker`. | Request detail |
| 15 | [`src/components/ImpersonationBanner.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ImpersonationBanner.tsx) | Fixed banner when admin is impersonating a user. Shows username + "Back to Admin" button. Depends on [`auth.ts`](https://github.com/intesarjawad/hive/blob/main/auth.ts). | App shell (admin only) |
| 16 | [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx) | Main navigation bar. Two variants: logged-out (logo + login/signup) and logged-in (search, notifications dropdown with polling every 15s, profile avatar dropdown, mobile hamburger menu). Imports `Avatar`, `ImpersonationBanner`. | Every page |

---

## 2. Authentication & Onboarding

> **Major Category: User Entry Flow**
> Covers everything from signup to being a fully verified, onboarded user.

### 2A. Signup

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/Signup.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Signup.tsx) | Registration form | Full name, email (.edu required), password (strength indicator), university auto-fill from email domain. Validates .edu requirement, password rules (8+ chars, uppercase, number). On success, navigates to email verification. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/auth/signup.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/signup.php) | Registration endpoint | POST. Validates .edu email, password strength (8-72 chars, uppercase + number), checks duplicate email/username. Creates user with bcrypt hash. Generates 6-digit verification token. Calls `send_verification_email()`. Returns user data. |

### 2B. Email Verification

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/EmailVerification.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/EmailVerification.tsx) | OTP entry page | 6-digit code input using input-otp component. Auto-submits when all digits entered. Countdown timer for resend button (60s cooldown). Shows success toast on verification. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/auth/verify.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/verify.php) | Verification endpoint | POST. Validates 6-digit code against tokens table. Test code "696969" always succeeds. Marks user as verified, awards 10 HiveCoin welcome bonus (prevents duplicate bonuses). Invalidates used token. |
| 2 | [`api/auth/resend-verification.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/resend-verification.php) | Resend code | POST. Invalidates old tokens, generates new 6-digit code, sends new verification email. |

### 2C. Login

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/Login.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Login.tsx) | Login form | Email + password fields with show/hide toggle. "Remember me" checkbox. Error handling for banned/suspended accounts (shows specific messages). Link to forgot-password. On success, navigates to dashboard or onboarding. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/auth/login.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/login.php) | Login endpoint | POST. Verifies bcrypt password. Sets session with 30-day cookie if remember-me. Checks annual re-verification (accounts >1 year must re-verify .edu). Auto-reactivates soft-deleted accounts. Returns full user data with cosmetics. |
| 2 | [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php) | Session check | GET. Returns current authenticated user data with cosmetics. Triggers auto-resolve cron. Handles admin impersonation. Destroys session if user not found. |
| 3 | [`api/auth/logout.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/logout.php) | Logout endpoint | POST. Destroys PHP session completely. |

### 2D. Forgot Password / Reset

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/ForgotPassword.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ForgotPassword.tsx) | Password reset flow | Two-step UI: (1) Enter email → sends code, (2) Enter OTP code + new password. Shows cooldown timer for resend. Password strength validation. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/auth/forgot-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/forgot-password.php) | Request reset | POST. Sends password reset email with 6-digit code. 1-hour code expiry. Email enumeration prevention (always returns success). |
| 2 | [`api/auth/reset-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/reset-password.php) | Complete reset | POST. Validates code (test bypass "696969"), sets new password. Can revive soft-deleted accounts. Invalidates used token. |

### 2E. Onboarding

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/Onboarding.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Onboarding.tsx) | First-time setup | Photo upload (drag-and-drop + click), bio textarea, major text input, year dropdown (Freshman-Graduate). Custom styled select dropdowns. Auto-redirects if already completed. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/users/onboarding.php`](https://github.com/intesarjawad/hive/blob/main/api/users/onboarding.php) | Complete onboarding | POST. Sets major, year, bio fields. Marks `onboarding_done = true`. |
| 2 | [`api/users/upload-avatar.php`](https://github.com/intesarjawad/hive/blob/main/api/users/upload-avatar.php) | Profile image upload | POST. Accepts base64 data URL. Uses GD library for center-crop and resize to 400x400. Saves to [`api/uploads/profiles/`](https://github.com/intesarjawad/hive/blob/main/api/uploads/profiles/). |

---

## 3. Landing Page & Public Discovery

> **Major Category: First Impressions**
> What users see before and right after logging in.

### 3A. Landing Page

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/Landing.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Landing.tsx) | Homepage | Hero section with animated text, statistics counters (total services, providers, universities — animated on scroll via GSAP), featured categories grid with icons, top providers sidebar. CTA buttons for signup/explore. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/landing.php`](https://github.com/intesarjawad/hive/blob/main/api/landing.php) | Landing stats | GET. Returns total services, providers, universities, completed orders. Category breakdown (service count per category). Featured 6 services with images and provider data. |

### 3B. Discover / Browse

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/Discover.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Discover.tsx) | Marketplace browse | Main marketplace page. Two tabs: Services and Requests. Filter sidebar (category, price range, minimum rating). Sort options (newest, price low/high, top rated). Pagination. Sidebar showing top providers and categories. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/services/list.php`](https://github.com/intesarjawad/hive/blob/main/api/services/list.php) | Browse services | GET. Filtering by category, price range, min rating. Sorting by created_at, price, avg_rating. Pagination (12/page). Returns provider data with cosmetics. |
| 2 | [`api/requests/list.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/list.php) | Browse requests | GET. Filtering by status, category, search query. Returns proposal counts. Includes requester cosmetics. |
| 3 | [`api/discover/sidebar.php`](https://github.com/intesarjawad/hive/blob/main/api/discover/sidebar.php) | Sidebar data | GET. Top 8 categories by service count. Top 3 providers by this-month earnings with cosmetics. |

### 3C. Search

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/SearchResults.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/SearchResults.tsx) | Search results | Filters by category, price range, rating. Sort options. Shows combined services and requests matching query. Pagination. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/search.php`](https://github.com/intesarjawad/hive/blob/main/api/search.php) | Global search | GET. Searches services (title, description) and requests (title, description). Batch-fetches service images. Sorts by relevance/rating. |

---

## 4. Service Marketplace

> **Major Category: Provider-Side Workflow**
> Creating, editing, viewing, and managing services.

### 4A. Post a Service

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/PostService.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/PostService.tsx) | 5-step wizard | Step 1: Title + category selection. Step 2: Description + included items list (add/remove). Step 3: Pricing type (hourly/flat/custom) + price + custom unit. Step 4: Image upload (base64 preview). Step 5: Review & publish. Shows price hints per category. |
| 2 | [`src/pages/ServicePublished.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ServicePublished.tsx) | Success page | Confetti animation (motion/react), service preview card, action buttons (view service, copy link, browse marketplace). |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/services/create.php`](https://github.com/intesarjawad/hive/blob/main/api/services/create.php) | Create service | POST. Validates title (150 chars), description (2000 chars), category (21 valid options), pricing_type (hourly/flat/custom), price (0-9999.99). Saves included items as JSON. Handles base64 image upload to [`api/uploads/services/`](https://github.com/intesarjawad/hive/blob/main/api/uploads/services/). |
| 2 | [`api/services/price-hint.php`](https://github.com/intesarjawad/hive/blob/main/api/services/price-hint.php) | Price suggestions | GET. Returns min/max/avg price for a category (requires 3+ services). |

### 4B. Edit a Service

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/EditService.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/EditService.tsx) | Edit wizard | Same 5-step flow as PostService. Fetches current service data to pre-fill. Includes delete button with confirmation dialog. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/services/mine.php`](https://github.com/intesarjawad/hive/blob/main/api/services/mine.php) | My services | GET. Lists provider's own services with order stats and earnings per service. Build first — a dev needs to see the list before editing/deleting. |
| 2 | [`api/services/update.php`](https://github.com/intesarjawad/hive/blob/main/api/services/update.php) | Update service | PATCH. Same validation as create. Ownership verification. Image replacement support. |
| 3 | [`api/services/delete.php`](https://github.com/intesarjawad/hive/blob/main/api/services/delete.php) | Delete service | DELETE. Prevents deletion if active orders exist (pending/in_progress/awaiting_completion). Ownership check. |
| 4 | [`api/services/toggle-active.php`](https://github.com/intesarjawad/hive/blob/main/api/services/toggle-active.php) | Toggle visibility | PATCH. Simple boolean toggle for `is_active`. Simplest endpoint, built last. |

### 4C. Service Detail

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/ServiceDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ServiceDetail.tsx) | Service detail page | Full description, included items list, provider card (avatar, rating, response time, cosmetics), recent reviews (up to 5), "Book Now" button with date/time selection. Message provider button. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/services/get.php`](https://github.com/intesarjawad/hive/blob/main/api/services/get.php) | Get service | GET. Returns full service data, provider info (rating, response time), service images, recent 5 reviews with reviewer data. |
| 2 | [`api/services/reviews.php`](https://github.com/intesarjawad/hive/blob/main/api/services/reviews.php) | Service reviews | GET. Paginated reviews filterable by service_id or provider_id. |

---

## 5. Request Marketplace

> **Major Category: Client-Side Workflow**
> Posting requests, receiving proposals, accepting providers.

### 5A. Post a Request

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/PostRequest.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/PostRequest.tsx) | 4-step wizard | Step 1: Title + category. Step 2: Description. Step 3: Budget range (under-50, 50-100, 100-200, 200-500, over-500, flexible) + deadline date. Step 4: Review & publish. Shows category hints (pricing, proposals, response time). |
| 2 | [`src/pages/RequestPublished.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/RequestPublished.tsx) | Success page | Preview card with timeline and notification indicators. Action buttons. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/requests/create.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/create.php) | Create request | POST. Validates title, category, description, budget_range, deadline. Creates request with status 'open'. |
| 2 | [`api/requests/category-hints.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/category-hints.php) | Category stats | GET. Returns pricing ranges, average proposals, median time to first proposal for a category. |

### 5B. Request Detail & Proposals

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/components/ProposalModal.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProposalModal.tsx) | Submit proposal | Modal with: price input, message textarea, scheduled date/time pickers. Validates required fields. Imports `CurrencyInput`, `DatePicker`, `TimePicker`. Build first — it's a dependency of RequestDetail. |
| 2 | [`src/pages/RequestDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/RequestDetail.tsx) | Request detail | Shows request info, proposals from providers (if owner, sees all; otherwise only own proposal). Accept/reject proposal buttons. Edit/delete own request. Message provider button. Imports `ProposalModal`. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/requests/get.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/get.php) | Get request | GET. Owner sees all proposals; others see only their own. Returns proposal count. |
| 2 | [`api/requests/update.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/update.php) | Update request | PATCH. Only allows editing requests with status 'open'. |
| 3 | [`api/requests/delete.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/delete.php) | Delete request | DELETE. Cascade-deletes proposals. |
| 4 | [`api/requests/proposals.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/proposals.php) | Manage proposals | Multi-method: GET (list proposals), POST (submit proposal with price/message/schedule), PATCH (update proposal), DELETE (withdraw proposal). Unique constraint: one proposal per provider per request. |
| 5 | [`api/requests/proposals-respond.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/proposals-respond.php) | Accept/reject | PATCH. Accept: creates order (5% fee), deducts client balance, rejects all other proposals, notifies provider. Reject: notifies provider. |

---

## 6. Order & Transaction System

> **Major Category: Core Business Logic**
> Booking, order lifecycle, disputes, reviews.

### 6A. Order Booking

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/OrderBooking.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/OrderBooking.tsx) | Booking confirmation | Fetches service details. Two-step process: (1) Enter date, time, notes (2) Confirm order. Shows price breakdown (price + 10% service fee = total). Balance check. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/orders/create.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/create.php) | Create order | POST. Looks up service, calculates 10% fee, checks client balance atomically (SELECT FOR UPDATE), deducts total, creates order with payment_status='held_in_escrow'. Creates transaction record. Notifies provider. Cannot order own service. |

### 6B. Order Tracking & Lifecycle

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/OrderTracking.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/OrderTracking.tsx) | Order management | View all orders with filters (role: buyer/seller, status). Shows order cards with status badge, provider/client info, scheduled time, price. Buttons for: start work, mark complete, cancel, dispute, leave review. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/orders/list.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/list.php) | List orders | GET. Role filter (buyer/seller), status filter. Returns orders with cosmetics, review status flags (has_reviewed, has_client_reviewed). |
| 2 | [`api/orders/update-status.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/update-status.php) | Status transitions | PATCH. State machine: pending→in_progress (provider starts), in_progress→awaiting_completion (first party marks done, starts 48h auto-complete timer), awaiting_completion→completed (second party confirms, releases payment to provider). Cancellation refunds client. Notifications at each step. |

### 6C. Disputes

#### Frontend
*Dispute UI is integrated into [`OrderTracking.tsx`](https://github.com/intesarjawad/hive/blob/main/OrderTracking.tsx) — dispute button, split proposal form, accept/withdraw buttons.*

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/orders/dispute.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/dispute.php) | Dispute management | POST: raise dispute (reason required), sets 7-day resolution deadline. PATCH actions: `propose_split` (provider_pct 0-100), `accept_split` (other party accepts, splits payment), `withdraw_dispute` (returns to awaiting_completion). Auto-resolve after 7 days = 50/50 split. |

### 6D. Reviews

#### Frontend
*Review forms are integrated into [`OrderTracking.tsx`](https://github.com/intesarjawad/hive/blob/main/OrderTracking.tsx) — star rating selector + comment textarea.*

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/orders/review.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/review.php) | Client reviews provider | POST. 1-5 stars + comment. Updates service `avg_rating` and `review_count`. One review per order. |
| 2 | [`api/orders/client-review.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/client-review.php) | Provider reviews client | POST. Provider-side review of client behavior. Stored in separate `client_reviews` table. |

---

## 7. Messaging System

> **Major Category: Communication**
> Direct messaging between users, with context linking.

### 7A. Messages

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/components/LinkPreviewCard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/LinkPreviewCard.tsx) | Link previews | Generates rich preview cards for service/request/user links within messages. Caching system for preview data. Build first — it's imported by Messages.tsx. |
| 2 | [`src/pages/Messages.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Messages.tsx) | Messaging page | Left panel: conversation list with unread counts, online status, last message preview, search/filter. Right panel: message thread with infinite scroll, timestamp grouping, auto-scroll to bottom. Message input with send button. Context chips (linked service/request/order). Imports `LinkPreviewCard`, `Avatar`. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/messages/conversations.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/conversations.php) | List conversations | GET. Returns conversations with: other user info + cosmetics, unread count, online status (last_seen < 5 min), last message, context_type/context_id. |
| 2 | [`api/messages/messages.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/messages.php) | Get messages | GET. Paginated (50/page). Marks unread messages as read. Ordered by created_at ASC. |
| 3 | [`api/messages/send.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/send.php) | Send message | POST. Creates or updates conversation. Supports context_type (service/order/request) and context_id for contextual messaging. Creates notification for recipient. |

---

## 8. User Profiles & Settings

> **Major Category: Identity & Preferences**
> Viewing profiles, editing settings, managing account.

### 8A. My Profile

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/MyProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/MyProfile.tsx) | Own profile | Stats display (earnings, completed orders, rating). Two tabs: "My Services" (list of own services with edit links) and "Reviews" (reviews received). Profile header with avatar, cosmetics, bio. |

### 8B. Public User Profile

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/UserProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/UserProfile.tsx) | Public profile | Accessed via `/:username`. Shows bio, stats, active services, reviews. Displays cosmetics (frame, badge, theme). "Message" and "Report" buttons. |

#### Backend (shared)
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/users/profile.php`](https://github.com/intesarjawad/hive/blob/main/api/users/profile.php) | User profile data | GET. Returns public profile: bio, major, year, university, services count, review stats, buzz score, average response time, cosmetics. Works for both own profile and other users. |
| 2 | [`api/users/stats.php`](https://github.com/intesarjawad/hive/blob/main/api/users/stats.php) | User statistics | GET. Total earnings, total spent, services offered, average rating, buzz score calculation. |

### 8C. Settings

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/Settings.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Settings.tsx) | Settings page | 4 tabs: **Account** (edit name, username, bio, major, year, avatar upload), **Wallet** (balance display, transaction history, deposit/withdraw/transfer), **Notifications** (toggle order/message/proposal notifications), **Security** (change password with show/hide toggles, change email with .edu validation, delete account with password confirmation). |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/users/update.php`](https://github.com/intesarjawad/hive/blob/main/api/users/update.php) | Update profile | PATCH. Updates name, username, bio, major, year, profile_image, notification preferences, cosmetic selections. Cosmetic ownership verification. Text length limits. Core profile endpoint — build first. |
| 2 | [`api/users/upload-avatar.php`](https://github.com/intesarjawad/hive/blob/main/api/users/upload-avatar.php) | Upload avatar | POST. Base64 image → GD center-crop/resize to 400x400 → save to [`api/uploads/profiles/`](https://github.com/intesarjawad/hive/blob/main/api/uploads/profiles/). Part of basic profile editing — build early. |
| 3 | [`api/auth/change-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/change-password.php) | Change password | POST. Requires old password verification. Same strength rules as signup. |
| 4 | [`api/auth/change-email.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/change-email.php) | Change email | POST. Requires .edu domain. Marks user as unverified. Sends verification to new email address. |
| 5 | [`api/users/delete.php`](https://github.com/intesarjawad/hive/blob/main/api/users/delete.php) | Delete account | DELETE. Soft-delete (sets `deactivated_at`). Requires password confirmation. Destructive action — build last. |

---

## 9. Dashboard & Notifications

> **Major Category: User Home**
> The authenticated user's home base.

### 9A. Dashboard

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/Dashboard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Dashboard.tsx) | User dashboard | Stats widgets (total earnings, total spent, active services, active orders, average rating). Recent orders table. My requests list. Redirects admin users to `/admin`. |

### 9B. Notifications

#### Frontend
*Notification UI is in [`NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/NavBar.tsx) — dropdown list triggered by bell icon with unread count badge. Polls every 15 seconds.*

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/notifications/list.php`](https://github.com/intesarjawad/hive/blob/main/api/notifications/list.php) | Get notifications | GET. Paginated (20/page). Returns unread count. Types: message, order, order_status, payment, proposal, review. |
| 2 | [`api/notifications/read.php`](https://github.com/intesarjawad/hive/blob/main/api/notifications/read.php) | Mark read | PATCH. Mark single notification or all as read. Returns new unread count. |

---

## 10. Wallet & Financial System

> **Major Category: Virtual Currency**
> HiveCoin balance, transactions, transfers.

### 10A. Wallet

#### Frontend
*Wallet UI is the "Wallet" tab within [`Settings.tsx`](https://github.com/intesarjawad/hive/blob/main/Settings.tsx) — shows balance, transaction history table, deposit/withdraw/transfer forms.*

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/wallet/balance.php`](https://github.com/intesarjawad/hive/blob/main/api/wallet/balance.php) | Get balance | GET. Returns current HiveCoin balance. |
| 2 | [`api/wallet/transactions.php`](https://github.com/intesarjawad/hive/blob/main/api/wallet/transactions.php) | Transaction history | GET. Paginated (20/page). Types: earning, spending, purchase, refund, bonus. Shows amount, description, timestamp. |
| 3 | [`api/wallet/transfer.php`](https://github.com/intesarjawad/hive/blob/main/api/wallet/transfer.php) | Transfer/deposit/withdraw | POST. Peer transfer: locks balance atomically (SELECT FOR UPDATE), validates sufficient funds, creates paired transaction records. Deposit/withdraw for development testing. |

---

## 11. Leaderboard & Buzz Score

> **Major Category: Gamification**
> Competitive rankings and reputation scoring.

### 11A. Leaderboard

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/Leaderboard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Leaderboard.tsx) | Leaderboard page | Top providers ranked by buzz score. Filter by timeframe (month/year/all-time) and category. Shows completed orders, rating, position badges (gold/silver/bronze for top 3). |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/leaderboard.php`](https://github.com/intesarjawad/hive/blob/main/api/leaderboard.php) | Leaderboard data | GET. Calculates buzz scores using action-based formula: +15 provider completion, +5 client completion, +10/-8 per rating star, +4 for leaving review, +8 repeat relationship, -10 cancellation, +10 complete profile, -1/day inactivity (capped -20). Normalized: `1000 × (1 - e^(-raw/300))`. Period and category filters. |

### 11B. Buzz Score Info

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/BuzzScoreInfo.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/BuzzScoreInfo.tsx) | Info page | Explains buzz score system: point values for different actions, category rankings, logarithmic normalization curve. |

---

## 12. Hive Shop (Cosmetics)

> **Major Category: Monetization**
> In-app cosmetic items purchased with HiveCoins.

### 12A. Hive Shop

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/HiveShop.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/HiveShop.tsx) | Shop page | Three tabs: Frames (avatar border effects), Badges (profile achievement tags), Themes (profile banner styles). Each item shows preview, price, owned/equipped status. Purchase button (deducts HiveCoins). Equip/unequip toggle. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/shop/items.php`](https://github.com/intesarjawad/hive/blob/main/api/shop/items.php) | Browse shop | GET. Type filter (frame/badge/theme). Shows ownership status if authenticated. Returns metadata (gradients, colors, animations). |
| 2 | [`api/shop/purchase.php`](https://github.com/intesarjawad/hive/blob/main/api/shop/purchase.php) | Purchase item | POST. Locks balance atomically. Checks duplicate ownership (unique constraint user+item). Deducts HiveCoins. Creates transaction record. |
| 3 | [`api/shop/inventory.php`](https://github.com/intesarjawad/hive/blob/main/api/shop/inventory.php) | My inventory | GET. Lists purchased items. Marks currently equipped items. Ordered by purchase date DESC. |

---

## 13. Reporting & Moderation

> **Major Category: Trust & Safety**
> User-to-user reporting system.

### 13A. Report User

#### Frontend
*Report UI is a button + modal on [`UserProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/UserProfile.tsx) and [`RequestDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/RequestDetail.tsx) — reason dropdown + description textarea.*

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/reports/create.php`](https://github.com/intesarjawad/hive/blob/main/api/reports/create.php) | Submit report | POST. Reasons: harassment, academic_dishonesty, scam_fraud, inappropriate_content, spam, other. Notifies all admin users. Auto-escalation: 3 reports in 30 days → 7-day suspend, 5 total → 30-day suspend. |
| 2 | [`api/reports/check.php`](https://github.com/intesarjawad/hive/blob/main/api/reports/check.php) | Check pending report | GET. Returns boolean: does the current user have a pending report against target user. Prevents duplicate reports. |

---

## 14. Admin Dashboard

> **Major Category: Platform Administration**
> Admin-only tools for managing the platform.

### 14A. Admin Dashboard

#### Frontend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`src/pages/Admin.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Admin.tsx) | Admin page | Multi-tab dashboard: **Overview** (stats cards: revenue, active users, open reports + charts for fee revenue, order distribution), **Reports** (table with status filters, admin notes, action buttons: acknowledge/dismiss/action with suspension), **Users** (search/filter by status, suspend 7d/30d, ban/unban), **Orders** (search, status/period filters), **Activity** (recent signups, completions, reports, purchases). Admin impersonation start/stop. |

#### Backend
| # | Script | Subfeature | Description |
|---|--------|------------|-------------|
| 1 | [`api/admin/stats.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/stats.php) | Dashboard stats | GET. Total revenue (sum of service_fee), active users (30 days), open reports count, orders this month, daily revenue chart data. |
| 2 | [`api/admin/revenue.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/revenue.php) | Revenue analytics | GET. Period filter. Top items, top categories, average order value, daily revenue breakdown. |
| 3 | [`api/admin/reports.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/reports.php) | Manage reports | GET: list with status filter. PATCH: acknowledge, dismiss, or action (with optional suspension). Auto-escalation on action. |
| 4 | [`api/admin/users.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/users.php) | Manage users | GET: search, filter by status (active/suspended/banned). PATCH: suspend_7d, suspend_30d, ban (with reason), unban, unsuspend. |
| 5 | [`api/admin/orders.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/orders.php) | View orders | GET. Search by order ID or user. Status filter, period filter (7d/30d/90d). Pagination. |
| 6 | [`api/admin/activity.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/activity.php) | Activity feed | GET. Recent signups, completed orders, reports, shop purchases (5 each, top 10 combined by timestamp). |
| 7 | [`api/admin/impersonate.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/impersonate.php) | Start impersonation | POST. Sets `$_SESSION['impersonating_user_id']`. Cannot impersonate other admins. |
| 8 | [`api/admin/stop-impersonate.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/stop-impersonate.php) | Stop impersonation | POST. Clears session impersonation flag. |

---

## 15. Legal & Informational Pages

> **Major Category: Static Content**
> These are frontend-only pages with no backend pairing.

| # | Script | Description |
|---|--------|-------------|
| 1 | [`src/pages/Privacy.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Privacy.tsx) | Privacy policy page. Styled dark hero section, standard sections (data collection, usage, retention, rights). Effective date display. |
| 2 | [`src/pages/Terms.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Terms.tsx) | Terms of Service page. Platform rules and usage guidelines. |
| 3 | [`src/pages/Safety.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Safety.tsx) | Safety guidelines page. Community protections, reporting system explanation, ban policies. |
| 4 | [`src/pages/TeamAgreement.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/TeamAgreement.tsx) | Internal team IP/ownership agreement. Admin-only (redirects non-admins to 404). |
| 5 | [`src/pages/DesignSystem.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/DesignSystem.tsx) | Design system showcase page. Component gallery for development reference. |
| 6 | [`src/pages/NotFound.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/NotFound.tsx) | 404 error page. Large "404" text, friendly message, home button. Adapts layout for logged-in vs logged-out users. |

---

## 16. Orphans & Infrastructure

> **Non-feature files** that don't belong to a frontend-backend pair. Deployment, config, documentation.

### 16A. Build & Deployment
| # | Script | Description |
|---|--------|-------------|
| 1 | [`Dockerfile`](https://github.com/intesarjawad/hive/blob/main/Dockerfile) | Multi-stage Docker build. Stage 1: Node 20 builds React with Vite. Stage 2: PHP 8.2 + Apache serves built frontend + PHP API. Enables mod_rewrite for SPA routing. |
| 2 | [`docker-entrypoint.sh`](https://github.com/intesarjawad/hive/blob/main/docker-entrypoint.sh) | Generates [`db_config.php`](https://github.com/intesarjawad/hive/blob/main/db_config.php) from environment variables at container startup. Starts Apache. |
| 3 | [`.dockerignore`](https://github.com/intesarjawad/hive/blob/main/.dockerignore) | Excludes node_modules, .git, etc. from Docker context. |

### 16B. Project Config
| # | Script | Description |
|---|--------|-------------|
| 1 | [`package.json`](https://github.com/intesarjawad/hive/blob/main/package.json) | NPM dependencies: React 18, Vite 6, Tailwind, ShadCN/Radix UI, GSAP, Motion, Recharts, Sonner, React Router, etc. Scripts: `dev`, `build`. |
| 2 | [`package-lock.json`](https://github.com/intesarjawad/hive/blob/main/package-lock.json) | Auto-generated dependency lock file. Do not edit manually — regenerated by `npm install`. |
| 3 | [`vite.config.ts`](https://github.com/intesarjawad/hive/blob/main/vite.config.ts) | Vite config: React SWC plugin, `@` path alias to `./src`, dev server on port 3000 with `/api` proxy to `localhost:8080`, build output to [`build/`](https://github.com/intesarjawad/hive/blob/main/build/). |
| 4 | [`index.html`](https://github.com/intesarjawad/hive/blob/main/index.html) | Root HTML file. Loads [`src/main.tsx`](https://github.com/intesarjawad/hive/blob/main/src/main.tsx). Vite entry point. |
| 5 | [`.gitignore`](https://github.com/intesarjawad/hive/blob/main/.gitignore) | Standard ignores for Node/PHP project. |

### 16C. Static Assets
| # | Path | Description |
|---|------|-------------|
| 1 | [`public/favicon.svg`](https://github.com/intesarjawad/hive/blob/main/public/favicon.svg) | Site favicon (SVG). Copied to build output as-is by Vite. |

### 16D. Upload Directories
| # | Path | Description |
|---|------|-------------|
| 1 | [`api/uploads/profiles/.gitkeep`](https://github.com/intesarjawad/hive/blob/main/api/uploads/profiles/.gitkeep) | Placeholder for user profile image uploads. |
| 2 | [`api/uploads/services/.gitkeep`](https://github.com/intesarjawad/hive/blob/main/api/uploads/services/.gitkeep) | Placeholder for service cover image uploads. |

### 16E. Build Artifacts (DO NOT REBUILD — auto-generated)
| # | Path | Description |
|---|------|-------------|
| 1 | [`build/index.html`](https://github.com/intesarjawad/hive/blob/main/build/index.html) | Production HTML entry point. |
| 2 | [`build/assets/index-DfVocig5.css`](https://github.com/intesarjawad/hive/blob/main/build/assets/index-DfVocig5.css) | Compiled CSS bundle. |
| 3 | [`build/assets/index-e8YWmzny.js`](https://github.com/intesarjawad/hive/blob/main/build/assets/index-e8YWmzny.js) | Compiled JS bundle. |
| 4 | [`build/favicon.svg`](https://github.com/intesarjawad/hive/blob/main/build/favicon.svg) | Copy of [`public/favicon.svg`](https://github.com/intesarjawad/hive/blob/main/public/favicon.svg) placed by Vite build. |

### 16F. Documentation
| # | Path | Description |
|---|------|-------------|
| 1 | [`README.md`](https://github.com/intesarjawad/hive/blob/main/README.md) | Project README. |
| 2 | [`src/Attributions.md`](https://github.com/intesarjawad/hive/blob/main/src/Attributions.md) | Third-party attributions and credits. |
| 3 | [`src/guidelines/Guidelines.md`](https://github.com/intesarjawad/hive/blob/main/src/guidelines/Guidelines.md) | Development guidelines for the team. |
| 4 | [`docs/plans/2026-02-18-admin-dashboard-design.md`](https://github.com/intesarjawad/hive/blob/main/docs/plans/2026-02-18-admin-dashboard-design.md) | Admin dashboard design document. |
| 5 | [`docs/plans/2026-02-18-admin-dashboard-plan.md`](https://github.com/intesarjawad/hive/blob/main/docs/plans/2026-02-18-admin-dashboard-plan.md) | Admin dashboard implementation plan. |

---

## Summary: Complete File Count

| Category | Frontend Files | Backend Files | Other Files | Total |
|----------|---------------|---------------|-------------|-------|
| Foundation / Shared | 59 (UI lib + core) | 5 | 3 (SQL) | 67 |
| Authentication & Onboarding | 5 pages | 10 endpoints | — | 15 |
| Landing & Discovery | 3 pages | 4 endpoints | — | 7 |
| Service Marketplace | 4 pages | 8 endpoints | — | 12 |
| Request Marketplace | 3 pages + 1 component | 7 endpoints | — | 11 |
| Orders & Transactions | 1 page | 5 endpoints | — | 6 |
| Messaging | 1 page + 1 component | 3 endpoints | — | 5 |
| Profiles & Settings | 3 pages | 5 endpoints | — | 8 |
| Dashboard & Notifications | 1 page | 2 endpoints | — | 3 |
| Wallet | (in Settings) | 3 endpoints | — | 3 |
| Leaderboard & Buzz | 2 pages | 1 endpoint | — | 3 |
| Hive Shop | 1 page | 3 endpoints | — | 4 |
| Reports | (in other pages) | 2 endpoints | — | 2 |
| Admin | 1 page | 8 endpoints | — | 9 |
| Legal/Info | 6 pages | — | — | 6 |
| Infrastructure | — | — | 9 | 9 |
| **TOTAL** | **~90 frontend** | **~66 backend** | **~15 other** | **~171** |

---

## Suggested Dev Team Distribution (5 People)

| Dev | Scope | Est. Weight |
|-----|-------|-------------|
| **Dev 1** | Foundation (DB schema, helpers, core app shell, styling, UI primitives) + Deployment | Heavy upfront, lighter later |
| **Dev 2** | Auth & Onboarding (signup, login, verify, forgot-password, onboarding) + Profiles & Settings | Medium-heavy |
| **Dev 3** | Service Marketplace (post, edit, detail, browse) + Request Marketplace (post, detail, proposals) + Search | Heavy |
| **Dev 4** | Orders & Transactions (booking, tracking, disputes, reviews) + Wallet + Messaging | Heavy (core business logic) |
| **Dev 5** | Dashboard + Notifications + Leaderboard + Hive Shop + Admin Dashboard + Legal Pages + Reports | Medium-heavy (many smaller features) |

> **Build order recommendation:** Dev 1 starts first (foundation must exist). Devs 2-5 can begin once the DB schema, helpers, auth context, API client, and routing are in place. Dev 3 and Dev 4 should coordinate closely since orders depend on services/requests.
