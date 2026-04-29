# HiveFive — Scrum-Organized Reconstruction Map

> **Purpose:** Maps every file and feature from the `intesarjawad/hive` repo (as catalogued in [`HIVEFIVE_PROJECT_AUDIT.md`](https://github.com/intesarjawad/hive/blob/main/HIVEFIVE_PROJECT_AUDIT.md)) to existing Scrum Board user story and task card numbers. Features not yet covered by existing cards are assigned placeholder letter IDs (e.g., User Story #A, Task #A1) pending PM approval.
>
> **How to use this:** Find your assigned User Story / Task Card → see exactly which files from the repo you need to copy and reimplement → commit to the project repo organically.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **US #N** | Existing User Story card number from Scrum Board |
| **TC #N** | Existing Task Card number from Scrum Board |
| **US #X** | NEW proposed User Story (letter = needs PM meeting to get a real number) |
| **TC #X.n** | NEW proposed Task Card under that User Story |
| ✅ | Already assigned in current sprint |
| 🔜 | Backlog / future sprint |
| 📦 | Infrastructure / shared — no single user story owns this |

---

## 0. Foundation & Shared Infrastructure

> **📦 These files underpin everything. They don't map 1:1 to a user story — they're prerequisites for ALL stories.**

### 0A. Database Schema

| Scrum Card | File | What It Does |
|---|---|---|
| TC #75 | [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql) | Creates all 17 tables (users, services, orders, etc.) |
| TC #76 | [`sql/admin-setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/admin-setup.sql) | Inserts admin user (id=1) |
| TC #77 | [`sql/seed.sql`](https://github.com/intesarjawad/hive/blob/main/sql/seed.sql) | Generates 1000 users, 2000 services, 5000 orders of demo data |
| TC #78 | [`api/db_config.php`](https://github.com/intesarjawad/hive/blob/main/api/db_config.php) | PDO database connection config |
| TC #79 | [`api/db_config.example.php`](https://github.com/intesarjawad/hive/blob/main/api/db_config.example.php) | Template version for teammates to copy |
| TC #80 | Users table schema | Part of setup.sql — the `users` table |
| TC #81 | Services table schema | Part of setup.sql — `services` + `service_images` |
| TC #82 | Orders table schema | Part of setup.sql — `orders`, `reviews`, `client_reviews` |
| TC #83 | Messaging table schema | Part of setup.sql — `conversations`, `messages` |
| TC #84 | Remaining tables schema | `transactions`, `shop_items`, `shop_purchases`, `tokens`, `notifications`, `reports`, `proposals`, `requests`, `review_votes` |

### 0B. Backend Core (PHP Helpers) — Bake into existing DB setup cards

| Scrum Card | File | What It Does |
|---|---|---|
| TC #78 (bake in) | [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php) | Shared functions: CORS, JSON response, auth check, admin check, notification creator, cosmetic builders |
| TC #78 (bake in) | [`api/mail.php`](https://github.com/intesarjawad/hive/blob/main/api/mail.php) | `send_verification_email()` — HTML emails for signup, password reset, email change |
| TC #A.1 (NEW) | [`api/cron/auto-resolve.php`](https://github.com/intesarjawad/hive/blob/main/api/cron/auto-resolve.php) | Background job: auto-completes orders after 48h, auto-resolves disputes after 7 days |

### 0C. Frontend Core (App Shell)

| Scrum Card | File | What It Does |
|---|---|---|
| TC #A.2 (NEW) | [`src/main.tsx`](https://github.com/intesarjawad/hive/blob/main/src/main.tsx) | React DOM entry point |
| TC #A.2 (bake in) | [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts) | API client module (`apiGet`, `apiPost`, etc.) |
| TC #A.2 (bake in) | [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts) | Auth context & provider, `useAuth()` hook |
| TC #A.2 (bake in) | [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts) | Categories, colors, budget ranges, timezone helpers |
| TC #A.2 (bake in) | [`src/lib/universities.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/universities.ts) | 300+ .edu domain → university name mapping |
| TC #A.2 (bake in) | [`src/lib/data.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/data.ts) | Static mock data for development |
| TC #A.2 (bake in) | [`src/components/ProtectedRoute.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProtectedRoute.tsx) | Route guard for authenticated pages |
| TC #A.2 (bake in) | [`src/components/AccountStatusGate.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/AccountStatusGate.tsx) | Blocks banned/suspended users |
| TC #A.2 (bake in) | [`src/App.tsx`](https://github.com/intesarjawad/hive/blob/main/src/App.tsx) | Root app component with router, providers |
| TC #A.2 (bake in) | [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx) | All route definitions |
| TC #A.2 (bake in) | [`src/index.css`](https://github.com/intesarjawad/hive/blob/main/src/index.css) | Global styles, Tailwind config |

> **US #A — "As a developer, I want the frontend app shell and shared infrastructure set up so that all feature pages can be built on a common foundation."**
> This is a research/infrastructure story. TC #A.1 = backend helpers + cron, TC #A.2 = frontend shell + routing.

### 0D. ShadCN UI Component Library (48 files)

| Scrum Card | Files | What They Are |
|---|---|---|
| TC #A.2 (bake in) | `src/components/ui/*.tsx` (48 files) | Accordion, Alert, Avatar, Badge, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, Dialog, Drawer, Dropdown, Form, Input, Label, Menubar, Navigation, OTP Input, Pagination, Popover, Progress, Radio, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Switch, Table, Tabs, Textarea, Toggle, Tooltip |

### 0E. Shared Custom Components

| Scrum Card | File | What It Does | Used By |
|---|---|---|---|
| TC #A.2 (bake in) | [`ImageWithFallback.tsx`](https://github.com/intesarjawad/hive/blob/main/ImageWithFallback.tsx) | Image with loading fallback | Various |
| TC #A.2 (bake in) | [`EmptyState.tsx`](https://github.com/intesarjawad/hive/blob/main/EmptyState.tsx) | Empty state UI | Multiple list pages |
| TC #A.2 (bake in) | [`StatusBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/StatusBadge.tsx) | Order/request status indicator | Orders, Dashboard |
| TC #A.2 (bake in) | [`CategoryBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/CategoryBadge.tsx) | Category chip | Cards, detail pages |
| TC #A.2 (bake in) | [`Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/Avatar.tsx) | User avatar with cosmetics | Everywhere |
| TC #A.2 (bake in) | [`ProfileBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/ProfileBadge.tsx) | Achievement badge | Profiles, Cards |
| TC #A.2 (bake in) | [`ServiceCard.tsx`](https://github.com/intesarjawad/hive/blob/main/ServiceCard.tsx) | Service listing card | Discover, Search, Landing |
| TC #A.2 (bake in) | [`CustomSelect.tsx`](https://github.com/intesarjawad/hive/blob/main/CustomSelect.tsx) | Dropdown select | Multiple forms |
| TC #A.2 (bake in) | [`DatePicker.tsx`](https://github.com/intesarjawad/hive/blob/main/DatePicker.tsx) | Calendar date picker | Booking, Requests |
| TC #A.2 (bake in) | [`TimePicker.tsx`](https://github.com/intesarjawad/hive/blob/main/TimePicker.tsx) | 12-hour time picker | Booking, Proposals |
| TC #A.2 (bake in) | [`CurrencyInput.tsx`](https://github.com/intesarjawad/hive/blob/main/CurrencyInput.tsx) | HiveCoin currency input | Service posting, Wallet |
| TC #A.2 (bake in) | [`UniversitySearch.tsx`](https://github.com/intesarjawad/hive/blob/main/UniversitySearch.tsx) | University autocomplete | Signup, Settings |
| TC #A.2 (bake in) | [`LinkPreviewCard.tsx`](https://github.com/intesarjawad/hive/blob/main/LinkPreviewCard.tsx) | Rich link previews in messages | Messages |
| TC #A.2 (bake in) | [`ProposalModal.tsx`](https://github.com/intesarjawad/hive/blob/main/ProposalModal.tsx) | Proposal submission modal | Request detail |
| TC #A.2 (bake in) | [`ImpersonationBanner.tsx`](https://github.com/intesarjawad/hive/blob/main/ImpersonationBanner.tsx) | Admin impersonation banner | Admin only |
| TC #A.2 (bake in) | [`NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/NavBar.tsx) | Main navigation bar (logged-in + logged-out variants) | Every page |

---

## 1. Authentication & Onboarding

### US #10 — Secure Signup
> *"As a proactive college student exploring a new campus marketplace, I want to create an account with my .edu email so that I can trust the platform is exclusively for verified students."*

| Scrum Card | File | What It Does |
|---|---|---|
| **TC #40** ✅ (JC — Signup FE) | [`src/pages/Signup.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Signup.tsx) | Registration form: name, .edu email, password w/ strength indicator, university auto-fill, confirm password |
| **TC #41** ✅ (SU — Signup BE) | [`api/auth/signup.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/signup.php) | POST. Validates .edu, password strength, duplicates. Creates user w/ bcrypt. Generates verification token. Sends email. |

### US #11 — Secure Login
> *"As a returning student, I want to log in securely so that I can access my account and marketplace features."*

| Scrum Card | File | What It Does |
|---|---|---|
| **TC #42** ✅ (AA — Login FE) | [`src/pages/Login.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Login.tsx) | Email + password, show/hide toggle, remember me, error handling for banned/suspended |
| **TC #43** ✅ (JH — Login BE) | [`api/auth/login.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/login.php) | POST. bcrypt verify, session w/ 30-day cookie, annual re-verification check |
| TC #43 (bake in) | [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php) | GET. Session check, returns user data, triggers cron, handles impersonation |
| TC #43 (bake in) | [`api/auth/logout.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/logout.php) | POST. Destroys session |

### US #B — Email Verification (NEW)
> *"As a newly registered student, I want to verify my .edu email with a code so that I can prove I'm a real student."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #B.1 (NEW — FE) | [`src/pages/EmailVerification.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/EmailVerification.tsx) | 6-digit OTP entry, auto-submit, resend countdown, success toast |
| TC #B.2 (NEW — BE) | [`api/auth/verify.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/verify.php) | POST. Validates code, marks verified, awards 10 HiveCoin welcome bonus |
| TC #B.3 (NEW — BE) | [`api/auth/resend-verification.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/resend-verification.php) | POST. Invalidates old tokens, generates + sends new code |

### US #C — Forgot/Reset Password (NEW)
> *"As a forgetful student, I want to reset my password via email so that I can regain access to my account."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #C.1 (NEW — FE) | [`src/pages/ForgotPassword.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ForgotPassword.tsx) | Two-step: enter email → enter OTP + new password, cooldown timer, strength validation |
| TC #C.2 (NEW — BE) | [`api/auth/forgot-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/forgot-password.php) | POST. Sends reset email, 1-hour expiry, email enumeration prevention |
| TC #C.3 (NEW — BE) | [`api/auth/reset-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/reset-password.php) | POST. Validates code, sets new password, can revive soft-deleted accounts |

### US #D — Onboarding (NEW)
> *"As a first-time user who just verified my email, I want to complete a quick profile setup so that other students can learn about me and I can start using the marketplace."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #D.1 (NEW — FE) | [`src/pages/Onboarding.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Onboarding.tsx) | Photo upload, bio, major, year dropdown. Auto-redirects if already done. |
| TC #D.2 (NEW — BE) | [`api/users/onboarding.php`](https://github.com/intesarjawad/hive/blob/main/api/users/onboarding.php) | POST. Sets major, year, bio. Marks `onboarding_done = true`. |
| TC #D.2 (bake in) | [`api/users/upload-avatar.php`](https://github.com/intesarjawad/hive/blob/main/api/users/upload-avatar.php) | POST. Base64 → GD center-crop → 400x400 save. (Also used by Settings.) |

---

## 2. Landing Page & Public Discovery

### US #1 — Platform Exploration
> *"As a proactive college student exploring a new campus marketplace, I want to see what services are available so that I can evaluate whether the platform is trustworthy and useful."*

| Scrum Card | File | What It Does |
|---|---|---|
| **TC #38** ✅ (DS — Landing FE) | [`src/pages/Landing.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Landing.tsx) | Hero section, animated stats (GSAP), featured categories grid, top providers, CTA buttons |
| **TC #39** ✅ (DS — Landing BE) | [`api/landing.php`](https://github.com/intesarjawad/hive/blob/main/api/landing.php) | GET. Total services/providers/universities/orders, category breakdown, featured 6 services |

### US #29 — Browse Discover Feed (Services)
> *"As a student looking for help, I want to browse available services on a Discover feed so that I can find someone to hire."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #E.1 (NEW — FE) | [`src/pages/Discover.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Discover.tsx) | Two tabs (Services/Requests), filter sidebar, sort options, pagination, top providers sidebar |
| TC #E.2 (NEW — BE) | [`api/services/list.php`](https://github.com/intesarjawad/hive/blob/main/api/services/list.php) | GET. Filter by category/price/rating, sort, paginate (12/page) |
| TC #E.3 (NEW — BE) | [`api/discover/sidebar.php`](https://github.com/intesarjawad/hive/blob/main/api/discover/sidebar.php) | GET. Top 8 categories, top 3 providers by monthly earnings |

### US #30 — Browse Discover Feed (Requests)
> *"As a skilled student, I want to browse open requests on the Discover feed so that I can find opportunities to offer my services."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #E.1 (bake in — same Discover page) | [`src/pages/Discover.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Discover.tsx) | Requests tab within Discover |
| TC #E.4 (NEW — BE) | [`api/requests/list.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/list.php) | GET. Filter by status/category/search, returns proposal counts |

### US #F — Search (NEW)
> *"As a student with a specific need, I want to search for services and requests by keyword so that I can quickly find what I'm looking for."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #F.1 (NEW — FE) | [`src/pages/SearchResults.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/SearchResults.tsx) | Combined services + requests results, filters, sort, pagination |
| TC #F.2 (NEW — BE) | [`api/search.php`](https://github.com/intesarjawad/hive/blob/main/api/search.php) | GET. Searches title + description across services and requests |

---

## 3. Service Marketplace

### US #6 — Publish a Service Listing
> *"As a skilled provider, I want to publish a service listing so that students can discover and book my services."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #G.1 (NEW — FE) | [`src/pages/PostService.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/PostService.tsx) | 5-step wizard: title+category → description+included items → pricing type+price → image upload → review & publish |
| TC #G.2 (NEW — FE) | [`src/pages/ServicePublished.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ServicePublished.tsx) | Success page with confetti, preview card, action buttons |
| TC #G.3 (NEW — BE) | [`api/services/create.php`](https://github.com/intesarjawad/hive/blob/main/api/services/create.php) | POST. Validates all fields, handles image upload, saves included items as JSON |
| TC #G.4 (NEW — BE) | [`api/services/price-hint.php`](https://github.com/intesarjawad/hive/blob/main/api/services/price-hint.php) | GET. Returns min/max/avg price for a category |

### US #7 — View Provider Ratings/Reviews
> *"As a service provider, I want to see my ratings and reviews so that I can understand how customers perceive my work."*

This is covered by the Service Detail page and My Profile page. Bake into:

| Scrum Card | File | What It Does |
|---|---|---|
| TC #H.1 (NEW — FE) | [`src/pages/ServiceDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ServiceDetail.tsx) | Full description, provider card, recent reviews (up to 5), "Book Now" button |
| TC #H.2 (NEW — BE) | [`api/services/get.php`](https://github.com/intesarjawad/hive/blob/main/api/services/get.php) | GET. Full service + provider info + recent 5 reviews |
| TC #H.3 (NEW — BE) | [`api/services/reviews.php`](https://github.com/intesarjawad/hive/blob/main/api/services/reviews.php) | GET. Paginated reviews filterable by service or provider |

### US #G — Edit/Manage Services (NEW)
> *"As a provider, I want to edit, pause, or delete my service listings so that I can keep my offerings accurate and up-to-date."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #G.5 (NEW — FE) | [`src/pages/EditService.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/EditService.tsx) | Same 5-step flow as PostService, pre-filled with current data, includes delete |
| TC #G.6 (NEW — BE) | [`api/services/mine.php`](https://github.com/intesarjawad/hive/blob/main/api/services/mine.php) | GET. Lists provider's own services with order stats and earnings |
| TC #G.7 (NEW — BE) | [`api/services/update.php`](https://github.com/intesarjawad/hive/blob/main/api/services/update.php) | PATCH. Same validation as create, ownership check, image replacement |
| TC #G.8 (NEW — BE) | [`api/services/delete.php`](https://github.com/intesarjawad/hive/blob/main/api/services/delete.php) | DELETE. Prevents deletion if active orders exist |
| TC #G.9 (NEW — BE) | [`api/services/toggle-active.php`](https://github.com/intesarjawad/hive/blob/main/api/services/toggle-active.php) | PATCH. Toggle `is_active` visibility |

---

## 4. Request Marketplace

### US #H — Post a Request (NEW)
> *"As a student who needs a specific service, I want to post a request describing what I need so that providers can find me and submit proposals."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #H.4 (NEW — FE) | [`src/pages/PostRequest.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/PostRequest.tsx) | 4-step wizard: title+category → description → budget+deadline → review & publish |
| TC #H.5 (NEW — FE) | [`src/pages/RequestPublished.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/RequestPublished.tsx) | Success page with preview card and timeline |
| TC #H.6 (NEW — BE) | [`api/requests/create.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/create.php) | POST. Validates fields, creates request with status 'open' |
| TC #H.7 (NEW — BE) | [`api/requests/category-hints.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/category-hints.php) | GET. Pricing ranges, avg proposals, median time to first proposal |

### US #I — Request Detail & Proposals (NEW)
> *"As a student who posted a request, I want to view proposals from providers and accept/reject them so that I can hire the best person for the job."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #I.1 (bake in from shared) | [`src/components/ProposalModal.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProposalModal.tsx) | Modal: price, message, date/time pickers |
| TC #I.2 (NEW — FE) | [`src/pages/RequestDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/RequestDetail.tsx) | Request info, proposals list, accept/reject buttons, edit/delete own request |
| TC #I.3 (NEW — BE) | [`api/requests/get.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/get.php) | GET. Owner sees all proposals; others see only own |
| TC #I.4 (NEW — BE) | [`api/requests/update.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/update.php) | PATCH. Edit open requests only |
| TC #I.5 (NEW — BE) | [`api/requests/delete.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/delete.php) | DELETE. Cascade-deletes proposals |
| TC #I.6 (NEW — BE) | [`api/requests/proposals.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/proposals.php) | Multi-method: GET/POST/PATCH/DELETE for proposal CRUD |
| TC #I.7 (NEW — BE) | [`api/requests/proposals-respond.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/proposals-respond.php) | PATCH. Accept creates order + deducts balance + rejects others. Reject notifies. |

---

## 5. Order & Transaction System

### US #67 — Book a Service
> *"As a customer, I want to book a service and schedule a time so that I can hire a provider."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #J.1 (NEW — FE) | [`src/pages/OrderBooking.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/OrderBooking.tsx) | Two-step: date+time+notes → confirm. Shows price + 10% fee breakdown. Balance check. |
| TC #J.2 (NEW — BE) | [`api/orders/create.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/create.php) | POST. Calculates fee, checks balance atomically, creates order with escrow, notifies provider |

### US #J — Order Tracking & Lifecycle (NEW)
> *"As a buyer or seller, I want to track my orders through their lifecycle (pending → in progress → complete) so that I can manage my transactions."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #J.3 (NEW — FE) | [`src/pages/OrderTracking.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/OrderTracking.tsx) | All orders with role/status filters, action buttons (start, complete, cancel, dispute, review) |
| TC #J.4 (NEW — BE) | [`api/orders/list.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/list.php) | GET. Role + status filters, returns orders with cosmetics and review flags |
| TC #J.5 (NEW — BE) | [`api/orders/update-status.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/update-status.php) | PATCH. State machine: pending→in_progress→awaiting_completion→completed. Cancellation refunds. |

### US #K — Disputes (NEW)
> *"As a party in a transaction, I want to raise and resolve disputes so that unfair situations can be handled."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #K.1 (bake into OrderTracking FE) | Dispute UI in [`OrderTracking.tsx`](https://github.com/intesarjawad/hive/blob/main/OrderTracking.tsx) | Dispute button, split proposal form, accept/withdraw |
| TC #K.2 (NEW — BE) | [`api/orders/dispute.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/dispute.php) | POST/PATCH. Raise dispute, propose split, accept split, withdraw. 7-day auto-resolve. |

### US #8 — Provider Score / Reviews
> *"As an untrusting single mom looking for a tutor for her child, I want to check a provider's score and reviews so that I can evaluate trustworthiness."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #K.3 (bake into OrderTracking FE) | Review forms in [`OrderTracking.tsx`](https://github.com/intesarjawad/hive/blob/main/OrderTracking.tsx) | Star rating + comment textarea |
| TC #K.4 (NEW — BE) | [`api/orders/review.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/review.php) | POST. 1-5 stars + comment, updates service avg_rating |
| TC #K.5 (NEW — BE) | [`api/orders/client-review.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/client-review.php) | POST. Provider reviews client behavior |

---

## 6. Messaging System

### US #26 — Chat Functionality
> *"As a student, I want to chat with other students so that I can discuss services, ask questions, and coordinate orders."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #L.1 (bake in from shared) | [`src/components/LinkPreviewCard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/LinkPreviewCard.tsx) | Rich previews for service/request/user links in messages |
| TC #L.2 (NEW — FE) | [`src/pages/Messages.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Messages.tsx) | Left panel: conversation list. Right panel: message thread with infinite scroll, context chips. |
| TC #L.3 (NEW — BE) | [`api/messages/conversations.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/conversations.php) | GET. Conversations with unread count, online status, last message, context |
| TC #L.4 (NEW — BE) | [`api/messages/messages.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/messages.php) | GET. Paginated (50/page), marks unread as read |
| TC #L.5 (NEW — BE) | [`api/messages/send.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/send.php) | POST. Creates/updates conversation, supports context linking, creates notification |

### US #37 — Conversation Threads
> *"As a user engaged in multiple conversations, I want threaded conversations so that I can keep track of different discussions."*

Covered by the same Messages page above — US #37 is satisfied by the conversation list + thread UI in TC #L.2.

---

## 7. User Profiles & Settings

### US #M — My Profile (NEW)
> *"As a logged-in student, I want to view my profile with stats, services, and reviews so that I can track my reputation."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #M.1 (NEW — FE) | [`src/pages/MyProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/MyProfile.tsx) | Stats (earnings, orders, rating), two tabs: My Services + Reviews, profile header with cosmetics |

### US #N — Public User Profile (NEW)
> *"As a student evaluating a provider, I want to view their public profile so that I can see their bio, services, and reviews."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #N.1 (NEW — FE) | [`src/pages/UserProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/UserProfile.tsx) | Accessed via `/:username`. Bio, stats, active services, reviews. Message + Report buttons. |
| TC #N.2 (NEW — BE) | [`api/users/profile.php`](https://github.com/intesarjawad/hive/blob/main/api/users/profile.php) | GET. Public profile data: bio, major, year, services count, buzz score, cosmetics |
| TC #N.3 (NEW — BE) | [`api/users/stats.php`](https://github.com/intesarjawad/hive/blob/main/api/users/stats.php) | GET. Total earnings, spent, services, rating, buzz score |

### US #12 — Account Settings
> *"As a registered student, I want to manage my account settings so that I can update my profile, security, and notification preferences."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #O.1 (NEW — FE) | [`src/pages/Settings.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Settings.tsx) | 4 tabs: Account (edit profile), Wallet (balance/history), Notifications (toggles), Security (password/email/delete) |
| TC #O.2 (NEW — BE) | [`api/users/update.php`](https://github.com/intesarjawad/hive/blob/main/api/users/update.php) | PATCH. Update name, username, bio, major, year, image, notification prefs, cosmetics |
| TC #O.3 (bake in from Onboarding) | [`api/users/upload-avatar.php`](https://github.com/intesarjawad/hive/blob/main/api/users/upload-avatar.php) | POST. Base64 image → GD crop → 400x400 |
| TC #O.4 (NEW — BE) | [`api/auth/change-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/change-password.php) | POST. Requires old password, same strength rules |
| TC #O.5 (NEW — BE) | [`api/auth/change-email.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/change-email.php) | POST. Requires .edu, marks unverified, sends verification |
| TC #O.6 (NEW — BE) | [`api/users/delete.php`](https://github.com/intesarjawad/hive/blob/main/api/users/delete.php) | DELETE. Soft-delete, requires password confirmation |

---

## 8. Dashboard & Notifications

### US #P — Dashboard (NEW)
> *"As a logged-in student, I want a personal dashboard so that I can see my stats, recent orders, and quick actions at a glance."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #P.1 (NEW — FE) | [`src/pages/Dashboard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Dashboard.tsx) | Stats widgets, recent orders table, my requests list. Redirects admins to `/admin`. |

### US #Q — Notifications (NEW)
> *"As an active marketplace participant, I want real-time notifications so that I never miss an order update, message, or proposal."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #Q.1 (bake into NavBar) | Notification dropdown in [`NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/NavBar.tsx) | Bell icon, unread count badge, polls every 15s |
| TC #Q.2 (NEW — BE) | [`api/notifications/list.php`](https://github.com/intesarjawad/hive/blob/main/api/notifications/list.php) | GET. Paginated (20/page), returns unread count |
| TC #Q.3 (NEW — BE) | [`api/notifications/read.php`](https://github.com/intesarjawad/hive/blob/main/api/notifications/read.php) | PATCH. Mark single or all as read |

---

## 9. Wallet & Financial System

### US #R — Wallet (NEW)
> *"As a student earning and spending HiveCoins, I want a wallet to view my balance, transaction history, and transfer funds."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #R.1 (bake into Settings FE) | Wallet tab in [`Settings.tsx`](https://github.com/intesarjawad/hive/blob/main/Settings.tsx) | Balance, transaction history, deposit/withdraw/transfer |
| TC #R.2 (NEW — BE) | [`api/wallet/balance.php`](https://github.com/intesarjawad/hive/blob/main/api/wallet/balance.php) | GET. Current HiveCoin balance |
| TC #R.3 (NEW — BE) | [`api/wallet/transactions.php`](https://github.com/intesarjawad/hive/blob/main/api/wallet/transactions.php) | GET. Paginated (20/page) transaction history |
| TC #R.4 (NEW — BE) | [`api/wallet/transfer.php`](https://github.com/intesarjawad/hive/blob/main/api/wallet/transfer.php) | POST. Atomic balance lock, peer transfer, deposit/withdraw |

---

## 10. Leaderboard & Buzz Score

### US #9 — Leaderboard Access
> *"As a competitive student, I want to access a leaderboard so that I can see top providers and strive to improve my ranking."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #S.1 (NEW — FE) | [`src/pages/Leaderboard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Leaderboard.tsx) | Top providers by buzz score, time/category filters, gold/silver/bronze for top 3 |
| TC #S.2 (NEW — BE) | [`api/leaderboard.php`](https://github.com/intesarjawad/hive/blob/main/api/leaderboard.php) | GET. Calculates buzz scores, normalized 0-1000, period + category filters |

### US #T — Buzz Score Info (NEW)
> *"As a curious student, I want to understand how the Buzz Score works so that I know how to improve my ranking."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #T.1 (NEW — FE) | [`src/pages/BuzzScoreInfo.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/BuzzScoreInfo.tsx) | Explains point values, category rankings, normalization curve |

---

## 11. Hive Shop (Cosmetics)

### US #5 — Profile Customization Shop
> *"As an affluent student, I want to shop for profile customizations so that I can express my personality and stand out."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #U.1 (NEW — FE) | [`src/pages/HiveShop.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/HiveShop.tsx) | Three tabs: Frames, Badges, Themes. Preview, price, owned/equipped status. Purchase + equip. |
| TC #U.2 (NEW — BE) | [`api/shop/items.php`](https://github.com/intesarjawad/hive/blob/main/api/shop/items.php) | GET. Type filter, ownership status, cosmetic metadata |
| TC #U.3 (NEW — BE) | [`api/shop/purchase.php`](https://github.com/intesarjawad/hive/blob/main/api/shop/purchase.php) | POST. Atomic balance lock, duplicate check, deduct HiveCoins |
| TC #U.4 (NEW — BE) | [`api/shop/inventory.php`](https://github.com/intesarjawad/hive/blob/main/api/shop/inventory.php) | GET. Purchased items, marks equipped |

---

## 12. Reporting & Moderation

### US #V — Report User (NEW)
> *"As a student who encountered inappropriate behavior, I want to report another user so that the platform stays safe."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #V.1 (bake into UserProfile + RequestDetail FE) | Report button + modal | Reason dropdown + description textarea |
| TC #V.2 (NEW — BE) | [`api/reports/create.php`](https://github.com/intesarjawad/hive/blob/main/api/reports/create.php) | POST. 6 reason types, notifies admins, auto-escalation (3 reports → 7-day suspend) |
| TC #V.3 (NEW — BE) | [`api/reports/check.php`](https://github.com/intesarjawad/hive/blob/main/api/reports/check.php) | GET. Prevents duplicate pending reports |

---

## 13. Admin Dashboard

### US #W — Admin Dashboard (NEW)
> *"As a platform administrator, I want a comprehensive dashboard so that I can manage users, reports, orders, and platform health."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #W.1 (NEW — FE) | [`src/pages/Admin.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Admin.tsx) | Multi-tab: Overview (stats+charts), Reports (manage), Users (suspend/ban), Orders (search), Activity (feed). Impersonation. |
| TC #W.2 (NEW — BE) | [`api/admin/stats.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/stats.php) | GET. Revenue, active users, open reports, orders, daily chart data |
| TC #W.3 (NEW — BE) | [`api/admin/revenue.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/revenue.php) | GET. Period filter, top items/categories, avg order value |
| TC #W.4 (NEW — BE) | [`api/admin/reports.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/reports.php) | GET/PATCH. List + manage reports (acknowledge/dismiss/action w/ suspension) |
| TC #W.5 (NEW — BE) | [`api/admin/users.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/users.php) | GET/PATCH. Search, suspend/ban/unban |
| TC #W.6 (NEW — BE) | [`api/admin/orders.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/orders.php) | GET. Search, status/period filter |
| TC #W.7 (NEW — BE) | [`api/admin/activity.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/activity.php) | GET. Recent signups, completions, reports, purchases |
| TC #W.8 (NEW — BE) | [`api/admin/impersonate.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/impersonate.php) | POST. Start impersonation |
| TC #W.9 (NEW — BE) | [`api/admin/stop-impersonate.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/stop-impersonate.php) | POST. Stop impersonation |

---

## 14. Legal & Informational Pages

### US #X — Legal Pages (NEW)
> *"As a cautious student, I want to review privacy policy, terms, and safety guidelines so that I understand platform rules."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #X.1 (NEW — FE) | [`src/pages/Privacy.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Privacy.tsx) | Privacy policy page |
| TC #X.2 (NEW — FE) | [`src/pages/Terms.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Terms.tsx) | Terms of Service page |
| TC #X.3 (NEW — FE) | [`src/pages/Safety.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Safety.tsx) | Safety guidelines page |
| TC #X.4 (NEW — FE) | [`src/pages/TeamAgreement.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/TeamAgreement.tsx) | Internal team IP agreement (admin-only) |
| TC #X.5 (NEW — FE) | [`src/pages/DesignSystem.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/DesignSystem.tsx) | Design system showcase (dev reference) |
| TC #X.6 (NEW — FE) | [`src/pages/NotFound.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/NotFound.tsx) | 404 error page |

---

## 15. Infrastructure & Deployment

### US #Y — Deployment (NEW)
> *"As a developer, I want Docker + Apache deployment configured so that the app runs on UB servers."*

| Scrum Card | File | What It Does |
|---|---|---|
| TC #Y.1 (NEW) | [`Dockerfile`](https://github.com/intesarjawad/hive/blob/main/Dockerfile) | Multi-stage: Node builds React, PHP+Apache serves it |
| TC #Y.2 (NEW) | [`docker-entrypoint.sh`](https://github.com/intesarjawad/hive/blob/main/docker-entrypoint.sh) | Generates db_config from env vars, starts Apache |
| TC #Y.3 (NEW) | [`.dockerignore`](https://github.com/intesarjawad/hive/blob/main/.dockerignore) | Excludes node_modules, .git from Docker context |
| TC #Y.4 (NEW) | [`package.json`](https://github.com/intesarjawad/hive/blob/main/package.json) / [`package-lock.json`](https://github.com/intesarjawad/hive/blob/main/package-lock.json) | NPM dependencies and lock file |
| TC #Y.5 (NEW) | [`vite.config.ts`](https://github.com/intesarjawad/hive/blob/main/vite.config.ts) | Vite config: React SWC, path aliases, dev proxy, build output |
| TC #Y.6 (NEW) | [`index.html`](https://github.com/intesarjawad/hive/blob/main/index.html) | Root HTML, Vite entry point |
| TC #Y.7 (NEW) | [`.gitignore`](https://github.com/intesarjawad/hive/blob/main/.gitignore) | Standard ignores |

---

## Quick Reference: Existing Card → Feature Mapping

| Existing Card | Type | Feature Area | Status |
|---|---|---|---|
| US #1 | User Story | Platform Exploration / Landing | ✅ Sprint 2 |
| US #5 | User Story | Hive Shop Cosmetics | 🔜 Backlog |
| US #6 | User Story | Publish Service Listing | 🔜 Backlog |
| US #7 | User Story | View Provider Ratings | 🔜 Backlog |
| US #8 | User Story | Check Provider Score | 🔜 Backlog |
| US #9 | User Story | Leaderboard | 🔜 Backlog |
| US #10 | User Story | Secure Signup | ✅ Sprint 2 |
| US #11 | User Story | Secure Login | ✅ Sprint 2 |
| US #12 | User Story | Account Settings | 🔜 Backlog |
| US #22 | User Story | Investor Walkthrough | ✅ Sprint 1 (Closed) |
| US #26 | User Story | Chat / Messaging | 🔜 Backlog |
| US #29 | User Story | Discover Feed (Services) | 🔜 Backlog |
| US #30 | User Story | Discover Feed (Requests) | 🔜 Backlog |
| US #37 | User Story | Conversation Threads | 🔜 Backlog |
| US #67 | User Story | Book a Service | 🔜 Backlog |
| TC #38 | Task | Landing Page FE | ✅ Sprint 2 (DS) |
| TC #39 | Task | Landing Page BE | ✅ Sprint 2 (DS) |
| TC #40 | Task | Signup FE | ✅ Sprint 2 (JC) |
| TC #41 | Task | Signup BE | ✅ Sprint 2 (SU) |
| TC #42 | Task | Login FE | ✅ Sprint 2 (AA) |
| TC #43 | Task | Login BE | ✅ Sprint 2 (JH) |
| TC #75-84 | Task | Database Schema Setup | ✅ Sprint 2 (DS) |

---

## Quick Reference: NEW Cards Needed

| Proposed ID | Type | Feature | Notes |
|---|---|---|---|
| US #A | User Story | Frontend App Shell & Infrastructure | Research/infra story |
| US #B | User Story | Email Verification | Critical auth flow |
| US #C | User Story | Forgot/Reset Password | Critical auth flow |
| US #D | User Story | Onboarding | First-time user setup |
| US #F | User Story | Search | Global search |
| US #G | User Story | Edit/Manage Services | Provider tools |
| US #H | User Story | Post a Request | Client workflow |
| US #I | User Story | Request Detail & Proposals | Client+provider workflow |
| US #J | User Story | Order Tracking & Lifecycle | Core business logic |
| US #K | User Story | Disputes | Trust & safety |
| US #M | User Story | My Profile | Identity |
| US #N | User Story | Public User Profile | Identity |
| US #P | User Story | Dashboard | User home |
| US #Q | User Story | Notifications | Real-time updates |
| US #R | User Story | Wallet | Virtual currency |
| US #T | User Story | Buzz Score Info | Gamification info |
| US #V | User Story | Report User | Trust & safety |
| US #W | User Story | Admin Dashboard | Platform admin |
| US #X | User Story | Legal Pages | Static content |
| US #Y | User Story | Deployment Infrastructure | DevOps |

---

## Sprint Planning Suggestion

### Sprint 3 Candidates (build on Sprint 2 auth)
1. **US #B** — Email Verification (depends on signup)
2. **US #C** — Forgot/Reset Password (depends on login)
3. **US #D** — Onboarding (depends on verification)
4. **US #29 / #30** — Discover Feed (depends on landing + services list)
5. **US #6** — Publish Service Listing (core marketplace)

### Sprint 4 Candidates
1. **US #H / #I** — Request Marketplace + Proposals
2. **US #67 / #J** — Order Booking + Tracking
3. **US #26 / #37** — Messaging
4. **US #12** — Settings
5. **US #9** — Leaderboard

### Sprint 5 (Polish)
1. **US #5** — Hive Shop
2. **US #R** — Wallet
3. **US #W** — Admin Dashboard
4. **US #V** — Reporting
5. **US #X** — Legal Pages
