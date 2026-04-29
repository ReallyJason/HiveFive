This is the current internal QA card set for the Hive repo itself.

These cards are not abstract rubric notes. They are operator-run scenario cards for the current Aptitude deployment and they should be treated like live regression checks.

Feature numbering intentionally matches the packet IDs in the [Mirror Guide](/docs/mirror-rebuild-guide).

### Fixed Environment

- Frontend root: [https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/)
- API root: [https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/api](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/api)
- Route format: `https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/<route>`
- DB verification: [https://aptitude.cse.buffalo.edu/phpmyadmin/](https://aptitude.cse.buffalo.edu/phpmyadmin/)

Do not use cattle for this doc. Do not write these as local-only checks. This tab is for the Aptitude environment.

### Shared Session Setup

Use separate browser profiles or separate cookie jars. Do not keep logging one account in and out in the same browser tab and pretend the test is trustworthy.

- Session A, requester: `demo@hivefive.com` / `demo`
- Session B, provider A: `adabolt@buffalo.edu` / `team.random()`
- Session C, provider B: `elmobanner@cmu.edu` / `team.random()`
- Session D, admin: use the current Aptitude admin account provided by the team lead
- Session E, throwaway QA account: create one when a test says to use a reversible or destructive account

### Shared Postman Setup

1. Create a Postman environment named `hivefive-aptitude`.
2. Add `apiBase = https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/api`
3. Keep cookies enabled.
4. Use separate Postman tabs, windows, or workspaces for Sessions A to D when a card compares role behavior.
5. Save dynamic IDs as variables when a card tells you to reuse them later.

### How To Read These Cards

- Every packet gets its own section so QA can map directly to the mirror packet list.
- Every packet has a frontend card, a backend card, or both.
- The frontend cards are browser-execution checks.
- The backend cards are Postman or phpMyAdmin checks.
- When a packet has no standalone UI, the frontend card tells you where that packet shows up indirectly.
- When a packet mutates shared Aptitude state, use the smallest safe test data and roll it back if the card says so.

### Non-Negotiable Rules

- Use the current Aptitude labels, states, and errors. If the UI text or API contract changed intentionally, update the card after confirming the change is real.
- Do not test a packet by looking only at one obvious page file. If the packet says it includes a sibling surface, test the sibling surface too.
- For write endpoints, verify both status code and response body shape.
- For FE cards, check both visible behavior and console health when the feature is interactive.
- For destructive cards, use Session E or a reversible test object whenever possible.

---

## P00. Start the App and Deploy It

**Broader Feature:** `Foundation`

**Frontend card:** `FE-P00-01 App boot, 404, and protected-route sanity`

- Route 1: [Landing](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/)
- Route 2: [Unknown route](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/does-not-exist)
- Route 3: [Dashboard](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/dashboard)
- Session: logged out
- Steps:
  1. Open the landing route in a fresh tab.
  2. Open DevTools console.
  3. Confirm the app boots without a blank screen or uncaught runtime error.
  4. Open the unknown route.
  5. Verify the app shows the current not-found behavior instead of crashing.
  6. Open `/dashboard` while logged out.
- Verify:
  - landing renders cleanly
  - 404 is deterministic
  - protected content is not exposed while logged out

**Backend card:** `BE-P00-01 Aptitude frontend and API entry smoke`

- Session: unauthenticated
- Method and endpoints:
  - `GET {{apiBase}}/landing.php`
  - `GET {{apiBase}}/settings/public.php`
- Body: `N/A`
- Verify:
  - both endpoints return `200`
  - responses are JSON, not PHP warnings or HTML fragments
  - `landing.php` returns non-empty landing payload data

---

## P01. Database Setup and Upload Folders

**Broader Feature:** `Foundation`

**Frontend card:** `FE-P01-01 Seeded data and runtime-file contract smoke`

- Routes:
  - [Discover](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/discover)
  - [Messages](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/messages)
- Session: Session A
- Steps:
  1. Open Discover and confirm the marketplace is populated.
  2. Open Messages and check whether any seeded conversations or previously uploaded attachments still render cleanly.
  3. If a message shows an attachment download card, click download.
- Verify:
  - seeded DB-backed content is present
  - no obvious filesystem-backed media is broken
  - if attachment rows exist but files are missing, mark this packet failed because the runtime storage contract is broken

**Backend card:** `BE-P01-01 Core tables and runtime directories exist`

- Tools:
  - phpMyAdmin
  - Aptitude file/runtime awareness from deployment
- Queries:
```sql
SHOW TABLES;
SELECT COUNT(*) AS users_c FROM users;
SELECT COUNT(*) AS services_c FROM services;
SELECT COUNT(*) AS orders_c FROM orders;
SELECT COUNT(*) AS requests_c FROM requests;
SELECT COUNT(*) AS messages_c FROM messages;
```
- Verify:
  - core tables exist
  - counts are non-zero for seeded tables
  - deployment includes the runtime folders required by current Hive behavior, especially private message attachment storage

---

## P02. Shared UI Pieces and Helper Code

**Broader Feature:** `Foundation UI`

**Frontend card:** `FE-P02-01 Shared component consistency across live pages`

- Routes:
  - [Discover](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/discover)
  - [Orders](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/orders)
  - [Messages](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/messages)
- Session: Session A
- Steps:
  1. Compare badges, avatars, buttons, empty states, and shared spacing between the three routes.
  2. Resize to mobile width and open or close the NavBar menu on a route that supports it.
  3. Watch the console while switching routes.
- Verify:
  - shared UI patterns stay visually consistent
  - mobile nav does not get stuck
  - there are no cross-route component crashes

**Backend card:** `BE-P02-01 Shared frontend contracts are present`

- Session: authenticated Session A
- Method and endpoints:
  - `GET {{apiBase}}/auth/me.php`
  - `GET {{apiBase}}/discover/sidebar.php`
- Body: `N/A`
- Verify:
  - `auth/me.php` returns the identity fields used by shared shell components
  - `discover/sidebar.php` returns the collections consumed by shared sidebar widgets

---

## P03. App Layout and Login State

**Broader Feature:** `Auth Shell`

**Frontend card:** `FE-P03-01 Session survives reload and shell updates correctly`

- Routes:
  - [Login](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/login)
  - [Discover](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/discover)
- Session: Session A
- Steps:
  1. Log in as Session A.
  2. Confirm the signed-in NavBar state appears.
  3. Refresh the page.
  4. Open another protected route like `/discover`.
  5. Log out from the account menu.
- Verify:
  - session survives reload
  - current-user shell state stays coherent across routes
  - logout returns the app to logged-out shell behavior

**Backend card:** `BE-P03-01 Login, me, and logout contract`

- Session: Session A in Postman
- Method and endpoints:
  - `POST {{apiBase}}/auth/login.php`
  - `GET {{apiBase}}/auth/me.php`
  - `POST {{apiBase}}/auth/logout.php`
- Body:
```json
{"email":"demo@hivefive.com","password":"demo"}
```
- Verify:
  - login sets a reusable session
  - `auth/me.php` returns the canonical current-user payload
  - logout invalidates that session cleanly

---

## P04. Route Guards, Nav, Feature Flags, and View-As

**Broader Feature:** `Auth + Flags`

**Frontend card:** `FE-P04-01 Route gates and flag-driven visibility line up`

- Routes:
  - [Admin](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/admin)
  - [Messages](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/messages)
  - [Shop](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/shop)
  - [Leaderboard](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/leaderboard)
- Sessions: Session A and Session D
- Steps:
  1. In Session A, try `/admin` directly.
  2. In Session A, open the feature-gated routes that are currently enabled on Aptitude.
  3. In Session D, open `/admin`.
- Verify:
  - non-admin users cannot access `/admin`
  - routes that are enabled by public settings are reachable and stable
  - admin shell loads only for the admin account

**Backend card:** `BE-P04-01 Public flags and protected admin routes agree`

- Session: unauthenticated for public settings, Session A for admin denial
- Method and endpoints:
  - `GET {{apiBase}}/settings/public.php`
  - `GET {{apiBase}}/admin/stats.php`
- Body: `N/A`
- Verify:
  - `settings/public.php` exposes the currently readable feature flags
  - a non-admin session cannot read admin analytics data

---

## P05. Sign Up

**Broader Feature:** `Auth`

**Frontend card:** `FE-P05-01 Signup happy path and duplicate guard`

- Route: [Signup](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/signup)
- Session: logged out
- Steps:
  1. Create a unique test identity using a timestamped username and `.edu` email.
  2. Fill the signup form with valid values.
  3. Submit once successfully.
  4. Submit again with the same email or username.
- Verify:
  - valid signup moves into the verification flow
  - duplicate email or username is blocked with a user-facing error

**Backend card:** `BE-P05-01 Signup enforces identity and duplicate rules`

- Session: unauthenticated
- Method and endpoint:
  - `POST {{apiBase}}/auth/signup.php`
- Body:
```json
{"email":"qa_signup_REPLACE@buffalo.edu","username":"qa_signup_REPLACE","password":"TestPass123!","first_name":"QA","last_name":"Signup","university":"University at Buffalo"}
```
- Verify:
  - first submission succeeds and creates an unverified account
  - duplicate email or username is rejected on a second submission

---

## P06. Login, Remember Me, and Reactivation

**Broader Feature:** `Auth`

**Frontend card:** `FE-P06-01 Login and remember-me behavior`

- Route: [Login](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/login)
- Session: Session B or a QA account
- Steps:
  1. Log in with `Remember me` enabled.
  2. Fully reload the browser.
  3. Close and reopen the tab if your browser allows session retention.
- Verify:
  - login succeeds
  - remembered session remains signed in according to current cookie policy

**Backend card:** `BE-P06-01 Login contract and optional soft-reactivation`

- Session: Postman
- Method and endpoint:
  - `POST {{apiBase}}/auth/login.php`
- Body:
```json
{"email":"adabolt@buffalo.edu","password":"team.random()","remember_me":true}
```
- Verify:
  - login succeeds and sets session state
  - if you have a soft-deactivated QA account, logging in revives it per current backend rules

---

## P07. Verify Email

**Broader Feature:** `Auth`

**Frontend card:** `FE-P07-01 Verify page accepts code and resend works`

- Route: [Verify](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/verify)
- Session: a newly signed-up unverified account
- Steps:
  1. Enter a valid verification code.
  2. Complete verification.
  3. If you still have an unverified QA account, trigger resend once and confirm the UI remains stable.
- Verify:
  - valid code completes verification
  - resend does not crash the page

**Backend card:** `BE-P07-01 Verify endpoint activates an account`

- Session: unverified QA account
- Method and endpoint:
  - `POST {{apiBase}}/auth/verify.php`
- Body:
```json
{"code":"REPLACE_VALID_CODE"}
```
- Verify:
  - verify succeeds with a real valid code
  - the account becomes verified
  - if the environment includes a stale verified account that requires annual re-verification, login should surface that branch instead of silently skipping it

---

## P08. Forgot and Reset Password

**Broader Feature:** `Auth`

**Frontend card:** `FE-P08-01 Forgot-password two-step flow uses the current code flow`

- Route: [Forgot Password](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/forgot-password)
- Session: logged out, use a QA account
- Steps:
  1. Submit the QA account email.
  2. Move to the code-and-new-password step.
  3. If you are using the current QA bypass path, enter code `696969`.
  4. Set a new strong password.
  5. Log in with the new password.
- Verify:
  - the flow is still code-based, not link-only
  - password reset succeeds
  - login works with the new password

**Backend card:** `BE-P08-01 Forgot-password is enumeration-safe and reset works`

- Session: unauthenticated
- Method and endpoints:
  - `POST {{apiBase}}/auth/forgot-password.php`
  - `POST {{apiBase}}/auth/reset-password.php`
- Bodies:
```json
{"email":"qa_reset_REPLACE@buffalo.edu"}
```
```json
{"email":"qa_reset_REPLACE@buffalo.edu","code":"696969","password":"NewPass123!"}
```
- Verify:
  - forgot-password returns the same generic success shape for known and unknown emails
  - reset-password accepts the current code flow and changes the password

---

## P09. First-Time Setup and Avatar Upload

**Broader Feature:** `Onboarding`

**Frontend card:** `FE-P09-01 New account onboarding and avatar upload`

- Routes:
  - [Onboarding](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/onboarding)
  - [Settings](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/settings)
- Session: a new account that has not finished onboarding
- Steps:
  1. Complete onboarding with required fields.
  2. Confirm the redirect away from `/onboarding`.
  3. Open settings and upload an avatar image.
  4. Refresh the page.
- Verify:
  - onboarding data persists
  - uploaded avatar persists and renders in the shell

**Backend card:** `BE-P09-01 Onboarding and avatar endpoints both persist state`

- Session: authenticated new QA account
- Method and endpoints:
  - `POST {{apiBase}}/users/onboarding.php`
  - `POST {{apiBase}}/users/upload-avatar.php`
- Body for onboarding:
```json
{"major":"Computer Science","year":"Junior","bio":"QA onboarding bio","wants_to_offer":true,"wants_to_find":true}
```
- Verify:
  - onboarding returns success and updates the user record
  - avatar upload succeeds with an allowed file and updates the current profile image field

---

## P10. School and Email-Domain Helpers

**Broader Feature:** `Identity`

**Frontend card:** `FE-P10-01 Supported `.edu` domain behavior stays aligned`

- Routes:
  - [Signup](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/signup)
  - [Settings](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/settings)
- Sessions: logged out and Session E
- Steps:
  1. On signup, try a supported university email.
  2. Try a clearly invalid non-supported domain.
  3. In settings security, try changing a QA account email to another supported `.edu` domain.
- Verify:
  - supported school identities are accepted
  - obviously invalid domains are rejected
  - change-email reruns domain rules instead of bypassing them

**Backend card:** `BE-P10-01 Signup and change-email share domain normalization`

- Session: unauthenticated for signup, Session E for change-email
- Method and endpoints:
  - `POST {{apiBase}}/auth/signup.php`
  - `POST {{apiBase}}/auth/change-email.php`
- Verify:
  - supported subdomains are accepted if they map to a known school
  - invalid domains are rejected consistently

---

## P11. Settings Basics

**Broader Feature:** `Settings`

**Frontend card:** `FE-P11-01 Account and notification settings persist`

- Route: [Settings](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/settings)
- Session: Session A
- Steps:
  1. Change one safe profile field like bio.
  2. Toggle one notification preference.
  3. Save.
  4. Refresh the page.
- Verify:
  - updated account fields persist
  - notification toggles persist
  - the page stays in sync with the current auth payload after save

**Backend card:** `BE-P11-01 User settings patch and auth payload stay aligned`

- Session: Session A
- Method and endpoints:
  - `PATCH {{apiBase}}/users/update.php`
  - `GET {{apiBase}}/auth/me.php`
- Body:
```json
{"bio":"QA settings update","notify_messages":false,"notify_orders":true}
```
- Verify:
  - update succeeds
  - the same fields are reflected by `auth/me.php`

---

## P12. Settings Security

**Broader Feature:** `Settings Security`

**Frontend card:** `FE-P12-01 Password, email, logout, and deactivation paths behave safely`

- Route: [Settings](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/settings)
- Session: Session E only for destructive actions
- Steps:
  1. Change the QA account password.
  2. Log out and log back in with the new password.
  3. If you are using a disposable QA account, test change-email and account deactivation there.
- Verify:
  - password change really takes effect
  - logout clears the session
  - destructive actions are password-confirmed and not triggerable by accident

**Backend card:** `BE-P12-01 Security endpoints enforce credential checks`

- Session: Session E
- Method and endpoints:
  - `POST {{apiBase}}/auth/change-password.php`
  - `POST {{apiBase}}/auth/change-email.php`
  - `DELETE {{apiBase}}/users/delete.php`
  - `POST {{apiBase}}/auth/logout.php`
- Verify:
  - password change requires the old password
  - change-email forces reverification
  - account delete is a soft-deactivation path, not a raw hard delete

---

## P13. My Profile Page

**Broader Feature:** `Profiles`

**Frontend card:** `FE-P13-01 Self profile shows current identity, stats, and reviews`

- Route: [My Profile](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/profile)
- Session: Session A or B
- Steps:
  1. Open `/profile`.
  2. Verify the header shows the logged-in account identity.
  3. Inspect stats and review history sections.
- Verify:
  - this is the self-profile route, not the public username route
  - stats and review blocks populate without crashing

**Backend card:** `BE-P13-01 Self profile data contracts are populated`

- Session: Session A
- Method and endpoints:
  - `GET {{apiBase}}/users/stats.php`
  - `GET {{apiBase}}/services/reviews.php?provider=me`
- Body: `N/A`
- Verify:
  - stats endpoint returns the summary data the self-profile needs
  - reviews endpoint returns provider review history for the logged-in user

---

## P13.1 Seller Tools on My Profile

**Broader Feature:** `Profiles + Seller Workspace`

**Frontend card:** `FE-P13.1-01 Seller tab lists owned services and owner-only controls`

- Route: [My Profile](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/profile)
- Session: Session B or C
- Steps:
  1. Open the seller-facing services area inside `/profile`.
  2. Verify owned listings appear with their current state.
  3. Use pause or reactivate on one reversible listing if safe.
- Verify:
  - owned-service cards load
  - owner-only actions appear only for the owner
  - state changes reflect in the UI

**Backend card:** `BE-P13.1-01 Mine, pause, and delete endpoints enforce ownership`

- Session: provider account
- Method and endpoints:
  - `GET {{apiBase}}/services/mine.php`
  - `PATCH {{apiBase}}/services/toggle-active.php?id=REPLACE_SERVICE_ID`
  - `DELETE {{apiBase}}/services/delete.php?id=REPLACE_SERVICE_ID`
- Verify:
  - `mine.php` returns only owned listings
  - pause or reactivate succeeds only for owned services
  - delete is blocked when active-order rules make it unsafe

---

## P14. Other People's Profile Page

**Broader Feature:** `Profiles`

**Frontend card:** `FE-P14-01 Username route shows another user correctly`

- Route pattern: `/#/<username>`
- Session: Session A
- Steps:
  1. Open a real non-admin username route.
  2. Inspect profile header, services, reviews, and cosmetics.
  3. Open one of the listed services.
- Verify:
  - other-user profile loads completely
  - services and reviews match the viewed provider, not the viewer

**Backend card:** `BE-P14-01 Public-facing profile read contract is stable`

- Session: Session A
- Method and endpoints:
  - `GET {{apiBase}}/users/profile.php?username=REPLACE_USERNAME`
  - `GET {{apiBase}}/services/list.php?provider=REPLACE_USERNAME`
- Verify:
  - the user profile payload contains the fields used by the page
  - listed services belong to the viewed provider

---

## P14.1 Report a User

**Broader Feature:** `Trust & Safety`

**Frontend card:** `FE-P14.1-01 Report-user entry checks pending state and submits correctly`

- Route: `/#/REPLACE_USERNAME`
- Session: Session A
- Steps:
  1. Open another user's profile.
  2. Launch the report flow.
  3. Confirm the current reason and description UI appears.
  4. Submit a report only if you are using a reversible QA target.
  5. Re-open the report flow.
- Verify:
  - duplicate submission is suppressed once a pending report exists
  - reporting UI lives on the user profile surface, not the admin dashboard

**Backend card:** `BE-P14.1-01 Report check and create endpoints enforce duplicate rules`

- Session: Session A
- Method and endpoints:
  - `GET {{apiBase}}/reports/check.php?user_id=REPLACE_TARGET_ID`
  - `POST {{apiBase}}/reports/create.php`
- Body:
```json
{"reported_user_id":REPLACE_TARGET_ID,"reason":"spam","description":"QA report entry test"}
```
- Verify:
  - `check.php` reflects existing pending report state
  - `create.php` creates one report and blocks careless duplicates

---

## P15. Home Page

**Broader Feature:** `Public Marketing`

**Frontend card:** `FE-P15-01 Landing page reflects current featured content and CTA wiring`

- Route: [Landing](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/)
- Session: logged out
- Steps:
  1. Open landing.
  2. Inspect featured services and counters.
  3. Click main CTAs.
- Verify:
  - landing is populated
  - CTAs route into the correct live pages

**Backend card:** `BE-P15-01 Landing payload matches the rendered marketing blocks`

- Session: unauthenticated
- Method and endpoint:
  - `GET {{apiBase}}/landing.php`
- Verify:
  - payload is non-empty
  - frontend-visible cards and counts match the response shape

---

## P16. Discover Page Layout and Tabs

**Broader Feature:** `Discover`

**Frontend card:** `FE-P16-01 Discover shell switches tabs and syncs the tab URL`

- Route: [Discover](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/discover)
- Session: Session A
- Steps:
  1. Open Discover.
  2. Switch between `Services` and `Requests`.
  3. Refresh on each tab.
- Verify:
  - the shell renders correctly on both tabs
  - tab state survives refresh through URL sync

**Backend card:** `BE-P16-01 Discover shell endpoints all respond on Aptitude`

- Session: authenticated
- Method and endpoints:
  - `GET {{apiBase}}/discover/sidebar.php`
  - `GET {{apiBase}}/services/list.php`
  - `GET {{apiBase}}/requests/list.php`
- Verify:
  - all three endpoints return `200`
  - shell dependencies are available for both marketplace tabs

---

## P17. Discover Search and Filters

**Broader Feature:** `Discover`

**Frontend card:** `FE-P17-01 Search, category, and sort controls actually change the feed`

- Route: [Discover](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/discover)
- Session: Session A
- Steps:
  1. Search for a concrete term that returns services.
  2. Change category.
  3. Change sort order.
  4. Compare sidebar counts and visible results.
- Verify:
  - feed and sidebar respond to search/filter state
  - empty state appears only when filters truly remove everything

**Backend card:** `BE-P17-01 Query params affect list results deterministically`

- Session: authenticated
- Method and endpoints:
  - `GET {{apiBase}}/services/list.php?category=Coding&sort=rating_desc&page=1`
  - `GET {{apiBase}}/requests/list.php?category=Coding&page=1`
- Verify:
  - filtered responses change with query params
  - pagination and sort fields are stable

---

## P18. Service Cards and Service List

**Broader Feature:** `Services Marketplace`

**Frontend card:** `FE-P18-01 Service cards show the current compact listing contract`

- Route: [Discover](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/discover)
- Session: Session A
- Steps:
  1. Stay on the Services tab.
  2. Inspect several service cards.
  3. Click one card into detail.
- Verify:
  - cards show title, provider, category, and price cleanly
  - clicking a card opens the correct service detail route

**Backend card:** `BE-P18-01 Services list endpoint returns display-ready listing data`

- Session: authenticated
- Method and endpoint:
  - `GET {{apiBase}}/services/list.php?category=Coding&sort=rating_desc&page=1`
- Verify:
  - services list returns visible listings only
  - payload contains the fields used by the card UI

---

## P19. Service Details Page

**Broader Feature:** `Services Marketplace`

**Frontend card:** `FE-P19-01 Service detail shows provider context, reviews, and launch points`

- Route pattern: `/#/service/<id>`
- Session: Session A
- Steps:
  1. Open a real service from Discover.
  2. Inspect provider identity, review block, and booking or message entry points.
  3. Confirm the page does not expose hidden inactive content if you are a non-owner.
- Verify:
  - service detail fully loads
  - booking and messaging launch points are present

**Backend card:** `BE-P19-01 Service get endpoint enforces visibility rules`

- Session: Session A for non-owner behavior
- Method and endpoint:
  - `GET {{apiBase}}/services/get.php?id=REPLACE_SERVICE_ID`
- Verify:
  - visible services resolve successfully
  - inactive or hidden services are not exposed to non-owners

---

## P20. Create a Service

**Broader Feature:** `Services Marketplace`

**Frontend card:** `FE-P20-01 Post-service flow ends at the publish confirmation page`

- Routes:
  - [Post Service](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/post-service)
  - [Service Published](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/service-published)
- Session: Session B or C
- Steps:
  1. Open post-service.
  2. Complete the form with a safe QA listing.
  3. Submit.
- Verify:
  - publish succeeds
  - the flow lands on the publish confirmation route
  - current CTA buttons on the confirmation page work

**Backend card:** `BE-P20-01 Create and price-hint endpoints support the posting flow`

- Session: provider account
- Method and endpoints:
  - `GET {{apiBase}}/services/price-hint.php?category=Coding`
  - `POST {{apiBase}}/services/create.php`
- Verify:
  - price hints load for the chosen category
  - create succeeds with valid listing data and media

---

## P21. Edit or Manage Your Service

**Broader Feature:** `Services Marketplace`

**Frontend card:** `FE-P21-01 Existing service edit and owner actions work from the right surfaces`

- Routes:
  - `/#/edit-service/REPLACE_SERVICE_ID`
  - [My Profile](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/profile)
- Session: service owner
- Steps:
  1. Edit an existing owned service.
  2. Save the update.
  3. From the seller workspace, pause or reactivate that listing.
- Verify:
  - edits persist
  - owner actions are available from the seller workspace, not only the edit page

**Backend card:** `BE-P21-01 Update, toggle, and delete enforce ownership and open-order rules`

- Session: service owner
- Method and endpoints:
  - `PATCH {{apiBase}}/services/update.php?id=REPLACE_SERVICE_ID`
  - `PATCH {{apiBase}}/services/toggle-active.php?id=REPLACE_SERVICE_ID`
  - `DELETE {{apiBase}}/services/delete.php?id=REPLACE_SERVICE_ID`
- Verify:
  - owner can update or toggle
  - delete is blocked when current order rules say removal is unsafe

---

## P22. Request Cards and Request List

**Broader Feature:** `Requests Marketplace`

**Frontend card:** `FE-P22-01 Requests tab shows request cards and CTA state`

- Route: [Discover](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/discover)
- Sessions: Session A and Session B
- Steps:
  1. In Session A, open the Requests tab and inspect request cards.
  2. In Session B, open the same request feed.
  3. If Session B submits a proposal later, come back here and check the card state change.
- Verify:
  - request cards render the current summary fields
  - CTA state reflects whether the viewer already submitted a proposal

**Backend card:** `BE-P22-01 Requests list returns summary state including proposal metadata`

- Session: Session B
- Method and endpoint:
  - `GET {{apiBase}}/requests/list.php`
- Verify:
  - open requests are listed
  - summary payload includes the fields the feed uses, including proposal-state hints like `user_proposed`

---

## P23. Request Details and Visibility Rules

**Broader Feature:** `Requests Marketplace`

**Frontend card:** `FE-P23-01 Request detail shows the right proposal visibility by role`

- Route pattern: `/#/request/<id>`
- Sessions: Session A, Session B, Session C
- Steps:
  1. Use a request with at least two proposals.
  2. Open the detail page as the owner in Session A.
  3. Open the same page as one provider in Session B.
  4. Open the same page as the other provider in Session C.
- Verify:
  - the owner sees every proposal
  - a provider sees only their own proposal
  - visibility follows role rules, not just frontend hiding

**Backend card:** `BE-P23-01 Request get endpoint enforces proposal scoping`

- Sessions: Session A and Session B
- Method and endpoint:
  - `GET {{apiBase}}/requests/get.php?id=REPLACE_REQUEST_ID`
- Verify:
  - owner payload contains all proposals
  - provider payload contains only the provider's own proposal
  - `proposal_count` remains correct

---

## P24. Send, Edit, Withdraw, and Respond to Proposals

**Broader Feature:** `Requests Marketplace`

**Frontend card:** `FE-P24-01 Full proposal lifecycle from submit to accept or withdraw`

- Routes:
  - [Discover](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/discover)
  - `/#/request/REPLACE_REQUEST_ID`
- Sessions: Session A, Session B, Session C
- Steps:
  1. Have Session A create or use an open request.
  2. Have Sessions B and C submit proposals.
  3. Edit or withdraw one proposal.
  4. Accept one remaining proposal from Session A.
- Verify:
  - submit, edit, withdraw, accept, and reject flows all behave as current Hive does
  - accepted request leaves the open requests feed
  - the accepted proposal drives order creation side effects

**Backend card:** `BE-P24-01 Proposal CRUD and response rules match the current API`

- Sessions: Session A, Session B, Session C
- Method and endpoints:
  - `POST {{apiBase}}/requests/proposals.php`
  - `PATCH {{apiBase}}/requests/proposals.php?id=REPLACE_PROPOSAL_ID`
  - `DELETE {{apiBase}}/requests/proposals.php?id=REPLACE_PROPOSAL_ID`
  - `PATCH {{apiBase}}/requests/proposals-respond.php?id=REPLACE_PROPOSAL_ID`
- Verify:
  - duplicate proposal submission is blocked
  - only the proposal owner can edit or withdraw
  - only the request owner can accept or reject
  - acceptance auto-rejects the other pending proposals and moves the request forward

---

## P25. Dashboard Home

**Broader Feature:** `User Workspace`

**Frontend card:** `FE-P25-01 Dashboard summary and quick links reflect live data`

- Route: [Dashboard](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/dashboard)
- Session: Session A
- Steps:
  1. Open dashboard.
  2. Inspect stats and quick links.
  3. Follow links into orders, requests, and wallet.
- Verify:
  - dashboard loads without empty-shell failure
  - quick links route into the current pages they claim to represent

**Backend card:** `BE-P25-01 Dashboard dependencies all return usable data`

- Session: Session A
- Method and endpoints:
  - `GET {{apiBase}}/users/stats.php`
  - `GET {{apiBase}}/orders/list.php`
  - `GET {{apiBase}}/requests/list.php?requester=me`
- Verify:
  - the combined dashboard dependencies return data without shape mismatch

---

## P26. Message List

**Broader Feature:** `Messaging`

**Frontend card:** `FE-P26-01 Conversation rail shows search, previews, unread state, and timestamps`

- Route: [Messages](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/messages)
- Sessions: Session A and Session B
- Steps:
  1. Open Messages in both sessions.
  2. Use the left rail search.
  3. Trigger or locate one unread conversation.
  4. Compare the preview text and timestamp formatting.
- Verify:
  - the conversation rail updates correctly
  - unread state is visible
  - timestamp formatting matches current behavior

**Backend card:** `BE-P26-01 Conversations endpoint returns rail metadata`

- Session: Session A
- Method and endpoint:
  - `GET {{apiBase}}/messages/conversations.php`
- Verify:
  - response includes unread state, preview text, timestamps, and context subtitle fields for the rail

---

## P27. Chat Thread and Message Box

**Broader Feature:** `Messaging`

**Frontend card:** `FE-P27-01 Thread send flow, read state, and Enter-to-send work`

- Route: [Messages](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/messages)
- Sessions: Session A and Session B
- Steps:
  1. In Session A, open a conversation with Session B.
  2. Send a message with Enter.
  3. Open the same conversation in Session B.
  4. Refresh both views.
- Verify:
  - sent message appears immediately
  - Session B receives the message
  - opening the thread marks incoming messages as read under the current contract

**Backend card:** `BE-P27-01 Thread read and send endpoints stay in sync`

- Sessions: Session A and Session B
- Method and endpoints:
  - `GET {{apiBase}}/messages/messages.php?conversation_id=REPLACE_CONVERSATION_ID`
  - `POST {{apiBase}}/messages/send.php`
- Verify:
  - thread read returns messages in the active conversation
  - send stores the outgoing message
  - read-state changes happen when the thread is fetched

---

## P28. Chat Context Banners

**Broader Feature:** `Messaging`

**Frontend card:** `FE-P28-01 Context banners come from launch context and dismissal persists`

- Routes:
  - [Service Detail](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/discover)
  - [Request Detail](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/discover)
  - [Messages](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/messages)
- Sessions: Session A and Session B
- Steps:
  1. Launch a conversation from a service, request, or order-linked action.
  2. Confirm the `Re:` banner appears with the correct context title.
  3. Close the banner.
  4. Wait for message polling or refresh the route.
- Verify:
  - banner matches the active context
  - dismissal survives refresh or polling until the context actually changes

**Backend card:** `BE-P28-01 Conversations and send endpoint carry context fields`

- Session: authenticated
- Method and endpoints:
  - `GET {{apiBase}}/messages/conversations.php`
  - `POST {{apiBase}}/messages/send.php`
- Verify:
  - conversation payload carries `context_type`, `context_id`, and `context_title`
  - context-bearing messages reuse the same conversation context instead of inventing a second one

---

## P29. Order Update Cards in Chat

**Broader Feature:** `Messaging + Orders`

**Frontend card:** `FE-P29-01 Order lifecycle changes show structured cards inside chat`

- Routes:
  - [Orders](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/orders)
  - [Messages](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/messages)
- Sessions: the two parties on an existing order
- Steps:
  1. Open an order-linked conversation.
  2. Trigger one order state change from the orders UI if safe.
  3. Re-open the related chat.
- Verify:
  - the update appears as a structured order event card, not plain raw JSON or broken text
  - if the payload is malformed, the UI falls back to a normal message bubble instead of crashing

**Backend card:** `BE-P29-01 Order mutations emit structured thread events`

- Sessions: matching buyer and seller
- Method and endpoints:
  - `PATCH {{apiBase}}/orders/update-status.php`
  - `POST {{apiBase}}/orders/adjustment.php`
  - `POST {{apiBase}}/orders/dispute.php`
  - `GET {{apiBase}}/messages/messages.php?conversation_id=REPLACE_CONVERSATION_ID`
- Verify:
  - order lifecycle writes show up in the message thread payload as structured event messages

---

## P30. Link Cards in Chat

**Broader Feature:** `Messaging`

**Frontend card:** `FE-P30-01 Same-origin service, request, and user links get previews while external links do not`

- Route: [Messages](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/messages)
- Sessions: Session A and Session B
- Steps:
  1. Send a message containing one same-origin service URL.
  2. Send another containing a same-origin request URL.
  3. Send another containing a same-origin user-profile URL.
  4. Send one external URL.
- Verify:
  - service, request, and user links get preview cards
  - the external link does not get a visual preview card
  - clicking an internal preview navigates in-app

**Backend card:** `BE-P30-01 Preview source endpoints return the fields the cards need`

- Session: authenticated
- Method and endpoints:
  - `GET {{apiBase}}/services/get.php?id=REPLACE_SERVICE_ID`
  - `GET {{apiBase}}/requests/get.php?id=REPLACE_REQUEST_ID`
  - `GET {{apiBase}}/users/profile.php?username=REPLACE_USERNAME`
- Verify:
  - each endpoint returns the summary fields the chat preview cards depend on

---

## P31. Chat File Uploads

**Broader Feature:** `Messaging`

**Frontend card:** `FE-P31-01 Attachment queue and thread cards follow the current compact rules`

- Route: [Messages](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/messages)
- Sessions: Session A and Session B
- Steps:
  1. Pick a mix of safe test files under the current limit.
  2. Add up to 5 files.
  3. Send the message.
  4. Open the same thread in the other session.
  5. Download one attachment.
- Verify:
  - compose-time queue uses compact thin cards
  - thread messages show thin download cards, not heavy inline previews
  - the client blocks more than 5 files or any file over 5 MB

**Backend card:** `BE-P31-01 Send, thread, and download endpoints enforce attachment rules`

- Session: Session A and Session B
- Method and endpoints:
  - `POST {{apiBase}}/messages/send.php`
  - `GET {{apiBase}}/messages/messages.php?conversation_id=REPLACE_CONVERSATION_ID`
  - `GET {{apiBase}}/messages/attachment.php?id=REPLACE_ATTACHMENT_ID`
- Verify:
  - attachment metadata is saved
  - thread payload returns attachment cards
  - download requires the viewer to belong to the conversation
  - current limits remain `5 files max` and `5 MB per file`

---

## P32. Notifications Page and Navbar Tray

**Broader Feature:** `Notifications`

**Frontend card:** `FE-P32-01 Bell tray, unread count, notifications page, and read-state sync`

- Routes:
  - [Notifications](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/notifications)
  - any route with the NavBar
- Sessions: Session A and Session B
- Steps:
  1. Trigger a notification-producing action, such as sending a message to the other session.
  2. In the recipient session, inspect the NavBar bell.
  3. Open the notifications page.
  4. Mark a notification read or delete one.
- Verify:
  - bell count updates
  - page and bell stay in sync
  - read and delete actions update the visible state

**Backend card:** `BE-P32-01 Notification inbox endpoints reflect emitted events`

- Session: recipient account
- Method and endpoints:
  - `GET {{apiBase}}/notifications/list.php`
  - `PATCH {{apiBase}}/notifications/read.php`
  - `DELETE {{apiBase}}/notifications/delete.php`
- Verify:
  - inbox returns the notification rows
  - read and delete mutations succeed and change unread state

---

## P33. Start an Order and Lock Payment

**Broader Feature:** `Orders`

**Frontend card:** `FE-P33-01 Booking flow creates a held-in-escrow pending order`

- Route pattern: `/#/book?serviceId=REPLACE_SERVICE_ID`
- Sessions: buyer and provider
- Steps:
  1. As the buyer, launch booking from a real service detail page.
  2. Fill schedule fields and optional notes.
  3. Submit the booking.
  4. Open `/orders`.
- Verify:
  - booking succeeds
  - a new order appears with status `pending`
  - the initial money is treated as held in escrow, not released immediately
  - the buyer cannot book their own service
  - the flow uses the current order create behavior, not a fake local success screen

**Backend card:** `BE-P33-01 Create order enforces future scheduling, self-booking, and escrow rules`

- Session: buyer
- Method and endpoint:
  - `POST {{apiBase}}/orders/create.php`
- Verify:
  - valid create returns `201`
  - order row is created with status `pending` and payment state held in escrow
  - a spending transaction is recorded for the buyer
  - insufficient balance is rejected
  - booking your own service is rejected
  - past `scheduled_utc` values are rejected

---

## P34. Orders List and Order Page Layout

**Broader Feature:** `Orders`

**Frontend card:** `FE-P34-01 Orders list separates active vs completed and the focused route resolves from list data`

- Routes:
  - [Orders list](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/orders)
  - `/#/orders/REPLACE_ORDER_ID`
- Session: Session A or B on an account with orders
- Steps:
  1. Open `/orders`.
  2. Switch between `Active` and `Completed`.
  2. Pick one order.
  3. Open the focused route directly.
- Verify:
  - orders list renders current and past orders
  - `Active` contains `pending`, `in_progress`, `awaiting_completion`, and `disputed`
  - `Completed` contains `completed` and `cancelled`
  - focused order shell loads from the list-backed contract
  - there is no broken dependency on a missing standalone order detail endpoint

**Backend card:** `BE-P34-01 Orders list payload is rich enough for both tabs and the focused shell`

- Session: account with orders
- Method and endpoint:
  - `GET {{apiBase}}/orders/list.php`
- Verify:
  - response includes enough data for both tabs and the focused `/orders/:orderId` view
  - payload includes `other_party`, review flags, and pending adjustment state used by the current UI
  - returned statuses stay within the current set: `pending`, `in_progress`, `awaiting_completion`, `completed`, `cancelled`, `disputed`

---

## P35. Main Order Status Actions

**Broader Feature:** `Orders`

**Frontend card:** `FE-P35-01 Order lifecycle follows pending -> in progress -> awaiting completion -> completed or cancelled`

- Route: [Orders](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/orders)
- Sessions: both parties on the same order
- Steps:
  1. Open the same order in both sessions.
  2. Move a `pending` order into `in_progress` if the current UI exposes that action.
  3. From `in_progress`, mark completion from one side.
  4. If the order is unit-priced, have the provider submit final `actual_units`.
  5. Complete from the other side.
- Verify:
  - transitions are role-aware
  - first completion confirmation moves the order into `awaiting_completion`
  - `awaiting_completion` shows the 48-hour confirmation or dispute behavior
  - final completion only happens when the current two-sided rule is satisfied
  - unit-priced orders show the final quantity submission path instead of the simpler fixed-price path

**Backend card:** `BE-P35-01 Update-status enforces allowed transitions, duplicate completion blocks, and actual-unit limits`

- Session: order participants
- Method and endpoint:
  - `PATCH {{apiBase}}/orders/update-status.php?id=REPLACE_ORDER_ID`
- Verify:
  - only `in_progress`, `completed`, and `cancelled` are accepted transition targets
  - invalid transitions are rejected
  - duplicate completion attempts from the same side are rejected
  - provider `actual_units` is accepted only in the supported unit-priced completion path
  - `actual_units` greater than authorized units is rejected
  - two-sided completion rules are enforced

---

## P36. Scope Changes and Disputes

**Broader Feature:** `Orders`

**Frontend card:** `FE-P36-01 Top-up adjustments and disputes behave like real multi-step negotiations`

- Route: [Orders](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/orders)
- Sessions: both parties on the same order
- Steps:
  1. On a unit-priced order, request a top-up adjustment from the provider side.
  2. Approve or decline that adjustment from the client side.
  3. On an order in `awaiting_completion`, open a dispute.
  4. While disputed, propose a split from one side.
  5. Accept the split from the other side or withdraw the dispute from the raising side.
- Verify:
  - adjustments are not just UI notes; they change money expectations and can clear final quantity state
  - disputes only begin from `awaiting_completion`
  - disputed orders show the current split proposal flow and 7-day auto-resolution messaging
  - disputes support the live branches `propose_split`, `accept_split`, and `withdraw_dispute`

**Backend card:** `BE-P36-01 Adjustment and dispute endpoints enforce role, status, and split rules`

- Sessions: both parties
- Method and endpoints:
  - `POST {{apiBase}}/orders/adjustment.php`
  - `POST {{apiBase}}/orders/dispute.php`
- Verify:
  - only order participants can mutate these flows
  - top-up adjustments support only the current `accept` and `decline` response actions
  - disputes can only be raised from `awaiting_completion`
  - only the non-proposing side can accept a split
  - only the side that raised the dispute can withdraw it
  - accepted adjustments and dispute resolutions update order state and money outcomes

---

## P37. Reviews, Ratings, and Tips

**Broader Feature:** `Orders`

**Frontend card:** `FE-P37-01 Completed orders unlock buyer review, provider client-review, and optional tipping`

- Route: [Orders](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/orders)
- Sessions: both parties on a completed order
- Steps:
  1. Open a completed order.
  2. Submit the buyer-to-provider review flow.
  3. Submit the provider-to-client review flow.
  4. Add a tip if the environment and balance allow it.
- Verify:
  - each side sees the correct post-completion action set
  - duplicate review submission is blocked after the first successful submit
  - tipping is available only on completed orders and only where current rules allow it

**Backend card:** `BE-P37-01 Review and tip endpoints enforce completed-order rules and duplicate protection`

- Sessions: completed-order participants
- Method and endpoints:
  - `POST {{apiBase}}/orders/review.php`
  - `POST {{apiBase}}/orders/client-review.php`
  - `POST {{apiBase}}/orders/tip.php`
- Verify:
  - buyer review and provider client review are stored separately
  - both review endpoints reject non-completed orders
  - duplicate review submission returns a conflict instead of silently overwriting
  - tips are rejected on non-completed orders
  - tipping creates the expected money and event side effects

---

## P38. Wallet View and Wallet Actions

**Broader Feature:** `Wallet`

**Frontend card:** `FE-P38-01 Wallet tab shows balance, ledger, and safe transfer actions`

- Route: [Settings](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/settings)
- Session: Session A or a QA account with balance
- Steps:
  1. Open the wallet tab inside settings.
  2. Inspect current balance and history.
  3. If safe, perform a tiny reversible transfer between QA accounts.
- Verify:
  - wallet lives inside settings, not a separate page
  - balance and ledger update after a successful action

**Backend card:** `BE-P38-01 Wallet endpoints support read, history, and transfer actions`

- Session: account with balance
- Method and endpoints:
  - `GET {{apiBase}}/wallet/balance.php`
  - `GET {{apiBase}}/wallet/transactions.php`
  - `POST {{apiBase}}/wallet/transfer.php`
- Verify:
  - balance and ledger endpoints agree
  - transfer endpoint enforces balance and participant rules

---

## P39. Shop Page and Buying Items

**Broader Feature:** `Shop`

**Frontend card:** `FE-P39-01 Shop catalog and purchase flow use live affordability rules`

- Route: [Shop](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/shop)
- Session: account with enough or not enough balance, depending on the item
- Steps:
  1. Open the shop.
  2. Inspect item cards and ownership state.
  3. Attempt one safe purchase if the account can afford it.
- Verify:
  - shop respects the current feature flag
  - affordability state depends on live wallet balance
  - purchased item moves into owned state

**Backend card:** `BE-P39-01 Shop items, inventory, and purchase endpoints stay aligned`

- Session: purchaser account
- Method and endpoints:
  - `GET {{apiBase}}/shop/items.php`
  - `GET {{apiBase}}/shop/inventory.php`
  - `POST {{apiBase}}/shop/purchase.php`
- Verify:
  - catalog, ownership, and purchase results remain consistent

---

## P40. Wear Cosmetics Across the App

**Broader Feature:** `Cosmetics`

**Frontend card:** `FE-P40-01 Equipped cosmetics propagate across the app`

- Routes:
  - [Shop](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/shop)
  - [My Profile](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/profile)
  - [Messages](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/messages)
  - [Orders](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/orders)
  - [Leaderboard](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/leaderboard)
- Session: account that owns at least one cosmetic
- Steps:
  1. Equip a frame, badge, or theme.
  2. Refresh the current route.
  3. Check the other routes listed above.
- Verify:
  - equipped cosmetics appear across profile, messages, orders, and leaderboard
  - cosmetics are not isolated to the shop page

**Backend card:** `BE-P40-01 Equip mutation and downstream read payloads stay consistent`

- Session: equipped account
- Method and endpoints:
  - `PATCH {{apiBase}}/users/update.php`
  - `GET {{apiBase}}/auth/me.php`
  - `GET {{apiBase}}/users/profile.php?username=REPLACE_USERNAME`
  - `GET {{apiBase}}/orders/list.php`
  - `GET {{apiBase}}/messages/conversations.php`
  - `GET {{apiBase}}/leaderboard.php`
- Verify:
  - the equipped IDs update once
  - downstream read payloads all reflect the same cosmetic state

---

## P41. Buzz Score and Leaderboard

**Broader Feature:** `Leaderboard`

**Frontend card:** `FE-P41-01 Leaderboard and Buzz explainer load under the current flag rules`

- Routes:
  - [Leaderboard](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/leaderboard)
  - [Buzz Score Info](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/buzz-score)
- Session: Session A
- Steps:
  1. Open the leaderboard.
  2. Inspect ranked rows, cosmetics, and current-user context.
  3. Open the Buzz explainer page.
- Verify:
  - leaderboard loads under the current feature-flag state
  - explainer route remains available and stable

**Backend card:** `BE-P41-01 Leaderboard endpoint returns a stable rank payload`

- Session: authenticated
- Method and endpoint:
  - `GET {{apiBase}}/leaderboard.php`
- Verify:
  - ranking payload is present
  - admins are not accidentally shown as public ranked users in the frontend result set

---

## P42. Admin Overview and Site Stats

**Broader Feature:** `Admin`

**Frontend card:** `FE-P42-01 Admin overview, revenue, and activity tabs load live data or clearly show preview fallback`

- Route: [Admin](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/admin)
- Session: Session D
- Steps:
  1. Open the admin console.
  2. Inspect the `Overview` tab stat cards, revenue chart, and recent activity feed.
  3. Switch to the `Revenue` tab and inspect the period switcher plus top items or categories.
  3. Watch the console and network panel.
- Verify:
  - analytics UI loads without crashing
  - current Aptitude responses are being used instead of a silent broken state
  - if backend analytics are unavailable, the admin preview banner is visible instead of silently pretending the data is real
  - stat-card jumps route into the expected admin tabs

**Backend card:** `BE-P42-01 Admin analytics endpoints return the contracts used by overview and revenue tabs`

- Session: Session D
- Method and endpoints:
  - `GET {{apiBase}}/admin/stats.php`
  - `GET {{apiBase}}/admin/revenue.php`
  - `GET {{apiBase}}/admin/activity.php`
- Verify:
  - all analytics endpoints return `200`
  - `stats.php` returns revenue totals, active users, open reports, orders this month, daily chart arrays, and orders-by-status data
  - `activity.php` returns recent activity events
  - `revenue.php` returns period-sensitive revenue series plus top items or categories

---

## P43. Admin Reports and User Actions

**Broader Feature:** `Admin`

**Frontend card:** `FE-P43-01 Reports and users tabs expose the current moderation actions, not just read-only tables`

- Route: [Admin](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/admin)
- Session: Session D
- Steps:
  1. Open the `Reports` tab and filter by one status if useful.
  2. Expand a report row and inspect the current moderation actions.
  3. Open the `Users` tab and search for a QA target.
  4. Test one reversible moderation action if allowed by the team.
- Verify:
  - reports queue loads
  - reports and users are separate admin tabs with separate actions
  - moderation controls are admin-only
  - dangerous actions like suspend, ban, restore, and delete are explicit and not misrouted into impersonation
  - report acknowledgment or action updates the row state in place

**Backend card:** `BE-P43-01 Moderation endpoints enforce admin-only queue actions, thresholds, and user-action rules`

- Session: Session D
- Method and endpoints:
  - `GET {{apiBase}}/admin/reports.php`
  - `PATCH {{apiBase}}/admin/reports.php`
  - `GET {{apiBase}}/admin/users.php`
  - `PATCH {{apiBase}}/admin/users.php`
- Verify:
  - report queue is readable to admins
  - moderation actions reject non-admin sessions
  - report status updates return explicit success or error payloads
  - user actions like 7-day suspend, 30-day suspend, unsuspend, ban, and unban return explicit success or error payloads
  - admin targets cannot be modified or deleted through the users endpoint

---

## P43.1 Admin View-As

**Broader Feature:** `Admin`

**Frontend card:** `FE-P43.1-01 View As starts impersonation from the current launch points and the global banner ends it`

- Routes:
  - [Admin](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/admin)
  - a target user profile or any protected route
- Session: Session D
- Steps:
  1. Launch `View As` from the admin `Users` tab.
  2. If available, also verify the same action from an admin viewing a user profile.
  2. Move to another protected route.
  3. Use the impersonation banner to stop impersonation.
- Verify:
  - impersonation state is visible globally
  - the borrowed session routes into normal user surfaces like `/discover`
  - returning from impersonation restores the admin context

**Backend card:** `BE-P43.1-01 Start, stop, and me contract reflect impersonation state and target restrictions`

- Session: Session D
- Method and endpoints:
  - `POST {{apiBase}}/admin/impersonate.php`
  - `POST {{apiBase}}/admin/stop-impersonate.php`
  - `GET {{apiBase}}/auth/me.php`
- Verify:
  - only valid targets can be impersonated
  - deactivated users are rejected
  - admin targets are rejected
  - `auth/me.php` reflects impersonation while it is active

---

## P44. Admin Order Lookup

**Broader Feature:** `Admin`

**Frontend card:** `FE-P44-01 Admin Orders tab supports search, status filters, and time-window filters independently of normal order tracking`

- Route: [Admin](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/admin)
- Session: Session D
- Steps:
  1. Open the `Orders` tab inside admin.
  2. Search by order or user text.
  3. Change status and period filters.
  3. Compare results to a known order from the normal `/orders` page if useful.
- Verify:
  - admin order explorer reads platform-wide data
  - filters actually change the result set
  - it is clearly distinct from the buyer or seller order-tracking page

**Backend card:** `BE-P44-01 Admin orders endpoint supports the current search, status, and period filters`

- Session: Session D
- Method and endpoint:
  - `GET {{apiBase}}/admin/orders.php`
- Verify:
  - results are admin-wide
  - status filter changes the result set correctly
  - period filter changes the result set correctly
  - text search can find known orders or parties

---

## P44.1 Admin Settings and Feature Flags

**Broader Feature:** `Admin + Flags`

**Frontend card:** `FE-P44.1-01 Admin Settings tab and public flags stay consistent, including docs visibility`

- Routes:
  - [Admin](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/admin)
  - [Docs](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/docs)
- Session: Session D for admin, logged-out or Session A for public flag read behavior
- Steps:
  1. Open the `Settings` tab inside admin.
  2. Inspect the current toggles for Requests, HiveShop, Messaging, Leaderboard, Docs Pages, mock data, and rate limiting.
  3. Compare the visible feature toggle state to what the public app is doing.
  4. Only if the team explicitly approves a shared-environment toggle test, flip a low-impact flag and revert it immediately.
- Verify:
  - admin settings UI loads
  - public behavior matches `settings/public.php`
  - the docs toggle matches whether `/docs` and `/sprints` are reachable
  - any shared-environment toggle test is rolled back immediately

**Backend card:** `BE-P44.1-01 Admin settings and public settings endpoints agree on booleans and numeric config`

- Sessions: Session D and unauthenticated
- Method and endpoints:
  - `GET {{apiBase}}/admin/settings.php`
  - `PATCH {{apiBase}}/admin/settings.php`
  - `GET {{apiBase}}/settings/public.php`
- Verify:
  - admin can read and write settings
  - allowed write keys include the current feature flags, `mock_data`, `rate_limit_enabled`, `bypass_code`, `rate_limit_max_attempts`, and `rate_limit_window_minutes`
  - public settings expose only the intended readable flags
  - invalid bypass codes or non-positive rate-limit values are rejected

---

## P45. Docs, Sprint Page, and Legal Pages

**Broader Feature:** `Docs & Legal`

**Frontend card:** `FE-P45-01 Docs workspace, /sprints redirect, and legal pages reflect current routing`

- Routes:
  - [Docs](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/docs)
  - [Sprints](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/sprints)
  - [Safety](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/safety)
  - [Terms](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/terms)
  - [Privacy](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/privacy)
- Sessions: logged out, Session A, and Session D for `/team`
- Steps:
  1. Open `/docs` while logged out and verify the current gated copy appears.
  2. Open `/sprints` and confirm it lands in the docs workspace.
  3. Open the legal pages.
  4. If testing admin content, open `/#/team` as Session D.
- Verify:
  - `/docs` is the single docs workspace
  - `/sprints` no longer behaves like a separate standalone sprint surface
  - legal pages render without auth weirdness

**Backend card:** `BE-P45-01 Docs availability still follows the public flag contract`

- Session: unauthenticated
- Method and endpoint:
  - `GET {{apiBase}}/settings/public.php`
- Verify:
  - public flags still include the docs visibility contract used by the frontend

---

## P46. Default Service Images

**Broader Feature:** `Service Media Library`

**Frontend card:** `FE-P46-01 Fallback service media still appears when uploaded media is missing`

- Routes:
  - [Discover](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/discover)
  - any service detail page with seeded media fallback
- Session: Session A
- Steps:
  1. Find seeded services that rely on stock imagery.
  2. Inspect their cards and detail pages.
- Verify:
  - fallback service imagery renders instead of broken media
  - discover and detail use the same fallback chain

**Backend card:** `BE-P46-01 Service media paths coming from list and get still resolve cleanly`

- Session: authenticated
- Method and endpoints:
  - `GET {{apiBase}}/services/list.php`
  - `GET {{apiBase}}/services/get.php?id=REPLACE_SERVICE_ID`
- Verify:
  - payload media fields line up with the frontend fallback logic
  - missing uploaded media still degrades gracefully to the static library

---

## P47. Built Files and Deploy Output

**Broader Feature:** `Build Output`

**Frontend card:** `FE-P47-01 Deployed build assets load without broken references`

- Route: [Landing](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/)
- Session: any
- Steps:
  1. Open the app.
  2. Check the browser Network tab.
  3. Refresh once with cache disabled.
- Verify:
  - hashed JS and CSS assets load with `200`
  - there are no missing build asset references

**Backend card:** `BE-P47-01 Deployed container still serves both frontend and PHP endpoints`

- Session: unauthenticated
- Method and endpoints:
  - `GET {{apiBase}}/landing.php`
  - direct frontend root request in the browser
- Verify:
  - frontend assets and PHP endpoints are both being served from the deployed build
  - no deployment regression causes API or static output to disappear

---

## P48. AI-Assisted Service Descriptions

**Broader Feature:** `AI Features`

**Frontend card:** `FE-P48-01 AI Polish button rewrites service description`

- Route: [Post Service](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/post-service)
- Session: authenticated provider
- Steps:
  1. Navigate to Post Service wizard.
  2. Reach the description step.
  3. Type a rough draft in the description textarea (e.g., "i do tutoring for math and stuff").
  4. Click the "AI Polish" button.
  5. Wait for the loading state to resolve.
- Verify:
  - the description textarea is replaced with a professionally rewritten version
  - the rewritten text stays relevant to the selected service category
  - a success toast appears
  - the button shows a loading spinner while processing

**Frontend card:** `FE-P48-02 AI Suggest generates included items`

- Route: [Post Service](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/post-service)
- Session: authenticated provider
- Steps:
  1. Navigate to Post Service wizard.
  2. Reach the description step.
  3. Ensure a category and title are set.
  4. Click the "AI Suggest" link for included items.
- Verify:
  - suggested items populate the included-items list
  - items are relevant to the service category and title

**Frontend card:** `FE-P48-03 AI Polish works identically in Edit Service`

- Route: [Edit Service](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/edit-service/:id)
- Session: authenticated owner of the service
- Steps:
  1. Navigate to Edit Service for an existing service.
  2. Modify the description.
  3. Click "AI Polish."
- Verify:
  - behavior is identical to the Post Service flow
  - the AI button uses brand honey styling (not purple/violet)

**Backend card:** `BE-P48-01 AI rewrite endpoint works with valid auth`

- Session: authenticated
- Method and endpoints:
  - `POST {{apiBase}}/services/ai-rewrite.php` with body `{ "title": "Math Tutoring", "category": "Tutoring", "description": "I help students understand algebra and calculus before exams, and I explain concepts in a simple way." }`
- Verify:
  - returns `200` with a `description` field containing professionally polished text
  - text stays on-topic for the given category

**Backend card:** `BE-P48-02 AI rewrite endpoint rejects unauthenticated requests`

- Session: unauthenticated
- Method and endpoints:
  - `POST {{apiBase}}/services/ai-rewrite.php`
- Verify:
  - returns `401`

**Backend card:** `BE-P48-03 AI suggest endpoint returns included items`

- Session: authenticated
- Method and endpoints:
  - `POST {{apiBase}}/services/ai-suggest-included.php` with body `{ "title": "Math Tutoring", "category": "Tutoring" }`
- Verify:
  - returns `200` with an `items` array
  - items are relevant to the service

**Backend card:** `BE-P48-04 AI endpoints gracefully handle missing config`

- Session: authenticated
- Precondition: `ai_config.php` does not exist on the server
- Method and endpoints:
  - `POST {{apiBase}}/services/ai-rewrite.php`
- Verify:
  - returns `503` with an error indicating AI features are not configured
  - does not crash with a `500`

---

## P49. Username Selection During Signup

**Broader Feature:** `Authentication`

**Frontend card:** `FE-P49-01 Username field appears on signup form`

- Route: [Signup](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/signup)
- Session: unauthenticated
- Steps:
  1. Navigate to the signup page.
  2. Observe the form fields.
- Verify:
  - a username input field is visible
  - it has appropriate labeling

**Frontend card:** `FE-P49-02 Username availability check runs in real time`

- Route: [Signup](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/signup)
- Session: unauthenticated
- Steps:
  1. Type a username into the username field.
  2. Wait for the debounce period.
  3. Observe the availability indicator.
- Verify:
  - availability feedback appears after a short debounce (not on every keystroke)
  - a taken username shows an unavailable indicator
  - an available username shows a success indicator

**Backend card:** `BE-P49-01 Username availability check endpoint works`

- Session: unauthenticated
- Method and endpoints:
  - `GET {{apiBase}}/auth/check-username.php?username=testuser123`
- Verify:
  - returns `200` with `{ "available": true }` or `{ "available": false }`

---

## P50. Onboarding

**Broader Feature:** `Onboarding & Identity`

**Frontend card:** `FE-P50-01 Onboarding page renders with all fields`

- Route: [Onboarding](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/onboarding)
- Session: authenticated, first-time user (onboarding_done = false)
- Steps:
  1. Log in as a user who has not completed onboarding.
  2. Observe the page that loads.
- Verify:
  - a minimal nav with just the HiveFive logo appears at the top (no full navigation bar)
  - the page heading reads "Tell us about yourself"
  - four fields are visible: Profile Photo (with an avatar preview and Upload Photo button), Bio (textarea), "What are you studying?" (text input), and Year (dropdown)
  - red asterisks appear next to the major and year labels
  - the Complete Setup button is visible but disabled

**Frontend card:** `FE-P50-02 Required field validation blocks submission`

- Route: [Onboarding](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/onboarding)
- Session: authenticated, first-time user
- Steps:
  1. Leave major and year fields empty.
  2. Observe the Complete Setup button.
  3. Fill in only the major (leave year empty).
  4. Observe the button again.
- Verify:
  - the Complete Setup button stays disabled until both major and year are filled
  - no API call fires while the button is disabled

**Frontend card:** `FE-P50-03 Successful onboarding redirects to Discover`

- Route: [Onboarding](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/onboarding)
- Session: authenticated, first-time user
- Steps:
  1. Fill in a major (e.g., "Computer Science").
  2. Select a year from the dropdown (e.g., "Junior").
  3. Optionally type a bio.
  4. Click Complete Setup.
- Verify:
  - a toast appears reading "Welcome to the hive!"
  - after roughly one second, the page redirects to Discover
  - returning to `/onboarding` now redirects back to Discover (onboarding is done)

**Frontend card:** `FE-P50-04 Photo upload works during onboarding`

- Route: [Onboarding](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/onboarding)
- Session: authenticated, first-time user
- Steps:
  1. Click the Upload Photo button.
  2. Select a valid image file under 5MB.
  3. Wait for the upload to complete.
- Verify:
  - the button text changes to "Uploading..." while in progress
  - a "Photo uploaded!" toast appears on success
  - the avatar preview updates to show the uploaded image

**Frontend card:** `FE-P50-05 Already-onboarded user is redirected away`

- Route: [Onboarding](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/onboarding)
- Session: authenticated, user who has already completed onboarding
- Steps:
  1. Navigate directly to `/onboarding`.
- Verify:
  - the page immediately redirects to Discover
  - the onboarding form is never shown

**Backend card:** `BE-P50-01 Onboarding endpoint accepts valid data and sets onboarding_done`

- Session: authenticated
- Method and endpoints:
  - `POST {{apiBase}}/users/onboarding.php` with body `{ "major": "Computer Science", "year": "Junior", "bio": "I like coding" }`
- Verify:
  - returns `200` with a `user` object
  - `user.major` is `"Computer Science"`, `user.year` is `"Junior"`, `user.bio` is `"I like coding"`
  - `user.onboarding_done` is `true`

**Backend card:** `BE-P50-02 Onboarding endpoint rejects empty major`

- Session: authenticated
- Method and endpoints:
  - `POST {{apiBase}}/users/onboarding.php` with body `{ "major": "", "year": "Sophomore", "bio": "" }`
- Verify:
  - returns `422` with `{ "error": "Please enter what you're studying" }`

**Backend card:** `BE-P50-03 Onboarding endpoint rejects invalid year`

- Session: authenticated
- Method and endpoints:
  - `POST {{apiBase}}/users/onboarding.php` with body `{ "major": "Computer Science", "year": "SuperSenior", "bio": "" }`
- Verify:
  - returns `422` with `{ "error": "Please select a valid academic year" }`

**Backend card:** `BE-P50-04 Onboarding endpoint rejects unauthenticated requests`

- Session: unauthenticated
- Method and endpoints:
  - `POST {{apiBase}}/users/onboarding.php`
- Verify:
  - returns `401`

---

## P51. Content Filter

**Broader Feature:** `Trust & Safety`

**Frontend card:** `FE-P51-01 Profanity is masked on rendered content surfaces`

- Routes:
  - [Service Detail](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/service/:id)
  - [Request Detail](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/request/:id)
  - [Messages](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/messages)
- Session: use any seeded record that already contains profanity, or create reversible QA data through the UI/API first
- Steps:
  1. Open a surface that renders user-generated text.
  2. Find a record whose text contains a profane term.
  3. Compare the rendered output against the stored raw value if needed.
- Verify:
  - the profane word is masked in the rendered UI instead of shown raw
  - the rest of the text still renders normally
  - the page does not crash when sanitized content is displayed

**Frontend card:** `FE-P51-02 External links render as placeholders while internal platform links survive`

- Routes:
  - [Service Detail](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/service/:id)
  - [Request Detail](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/request/:id)
- Session: use reversible QA data that includes one external URL and one Aptitude or Cattle URL
- Steps:
  1. Open a record whose text contains an external URL such as `https://example.com`.
  2. Confirm how the text is rendered.
  3. Open a record whose text contains an internal platform URL such as `https://aptitude.cse.buffalo.edu/...`.
  4. Confirm how that text is rendered.
- Verify:
  - the external URL is rendered as `[link removed]`
  - the internal platform URL passes through cleanly
  - no validation banner or submission blocker is involved because this packet is render-time sanitization

---

## P52. Supply-Demand Matching

**Broader Feature:** `Services Marketplace`

**Frontend card:** `FE-P52-01 Request owner sees matching providers`

- Route: [Request Detail](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/request/:id)
- Session: authenticated as the request owner
- Steps:
  1. Create a request in a category that has at least one service posted (e.g., "Tutoring").
  2. Navigate to that request's detail page.
- Verify:
  - a "Providers you can reach out to" section appears
  - the section lists services in the same category
  - each entry links to its service detail page

**Frontend card:** `FE-P52-02 Non-owner does not see matching providers on request`

- Route: [Request Detail](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/request/:id)
- Session: authenticated as a user who does NOT own the request
- Steps:
  1. Navigate to a request detail page you do not own.
- Verify:
  - the "Providers you can reach out to" section is NOT visible

**Frontend card:** `FE-P52-03 Service owner sees matching requests on their service`

- Route: [Service Detail](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/service/:id)
- Session: authenticated as the service owner
- Steps:
  1. Navigate to your own service detail page in a category with open requests.
- Verify:
  - a matching-requests section appears showing relevant open requests
  - the section uses brand honey styling

**Frontend card:** `FE-P52-04 Visitor does not see matching requests on service detail`

- Route: [Service Detail](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/service/:id)
- Session: authenticated as a user who does NOT own the service
- Steps:
  1. Navigate to someone else's service detail page.
- Verify:
  - the matching-requests section is NOT visible

---

## P53. Dark Mode

**Broader Feature:** `Appearance & Theming`

**Frontend card:** `FE-P53-01 Settings page shows Light, Dark, and System theme options`

- Route: [Settings](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/settings)
- Session: authenticated
- Steps:
  1. Log in and navigate to Settings.
  2. Scroll to the Appearance section.
- Verify:
  - three theme options are visible in a row: **Light**, **Dark**, **System**
  - each option shows a color preview swatch (Light shows cream/white tones, Dark shows near-black tones)
  - the currently active option has a honey-colored border
  - a status line below reads something like "Currently using light mode" or "Currently using dark mode (based on your system preference)"

**Frontend card:** `FE-P53-02 Switching to Dark mode inverts the color scheme`

- Route: [Settings](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/settings)
- Session: authenticated
- Steps:
  1. In the Appearance section, click **Dark**.
  2. Observe the page.
  3. Navigate to Discover, Dashboard, and Profile.
- Verify:
  - the page background changes from cream/white to near-black
  - text changes from dark charcoal to light grey
  - the honey accent color remains visible and legible against the dark background
  - cards, inputs, borders, and popover menus all use dark tones
  - no page has unreadable text, invisible elements, or broken contrast

**Frontend card:** `FE-P53-03 Switching to Light mode restores the default cream theme`

- Route: [Settings](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/settings)
- Session: authenticated
- Steps:
  1. While in Dark mode, click **Light** in the Appearance section.
  2. Observe the page.
- Verify:
  - the background returns to cream/white
  - text returns to dark charcoal
  - the page looks identical to the default appearance

**Frontend card:** `FE-P53-04 System option follows the OS preference`

- Route: [Settings](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/settings)
- Session: authenticated
- Steps:
  1. Click **System** in the Appearance section.
  2. In your OS settings, switch between light and dark mode (or use DevTools: Rendering > Emulate CSS media feature `prefers-color-scheme`).
- Verify:
  - the app follows your OS setting: dark OS = dark app, light OS = light app
  - the status line reads "Currently using dark/light mode (based on your system preference)"

**Frontend card:** `FE-P53-05 Theme preference persists across page reloads`

- Route: [Settings](https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/#/settings)
- Session: authenticated
- Steps:
  1. Select **Dark** in the Appearance section.
  2. Close the tab entirely.
  3. Open the app again in a new tab.
- Verify:
  - the app loads in dark mode without needing to visit Settings again
  - the preference survived the reload (stored in localStorage)

**Frontend card:** `FE-P53-06 Toasts render correctly in dark mode`

- Route: any page that triggers a toast (e.g., edit a service, toggle a setting)
- Session: authenticated, dark mode active
- Steps:
  1. Make sure the app is in dark mode.
  2. Trigger any action that shows a toast notification (e.g., save a setting, post a service).
- Verify:
  - the toast appears with dark-appropriate styling (not a bright white box on a dark background)
  - text inside the toast is legible
