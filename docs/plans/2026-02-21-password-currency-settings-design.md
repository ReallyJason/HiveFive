# Password Max Length, CurrencyInput Mobile Fix & Admin System Settings

**Date:** 2026-02-21

## Issue 1: Password Max Length Indicator

Password fields use `maxLength={72}` but the strength meter hint only shows minimum requirements.

**Fix:** Update hint text from "At least 8 characters, one number, one uppercase" to "8–72 characters, one number, one uppercase" in Signup.tsx, ForgotPassword.tsx, and Settings.tsx.

## Issue 2: CurrencyInput Mobile Keyboard

`CurrencyInput.tsx` uses `readOnly` on the `<input>`, preventing mobile on-screen keyboards from opening.

**Fix:** Remove `readOnly`. Add an `onChange` handler to process mobile keyboard input (parse raw value, convert to cents, clamp to 999999, format). Desktop continues using `handleKeyDown`. `inputMode="decimal"` already present for numeric mobile keyboard.

## Issue 3: Admin System Settings & Feature Toggles

### Database

New `system_settings` table (key-value store):

```sql
CREATE TABLE system_settings (
    setting_key   VARCHAR(50)  PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL DEFAULT '1',
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Default rows: `feature_requests`, `feature_shop`, `feature_messaging`, `feature_leaderboard` — all `'1'`.

### Backend API

1. `GET /api/settings/public.php` — No auth. Returns feature flags as JSON.
2. `GET|PATCH /api/admin/settings.php` — Admin only. Read/update settings.
3. Helper `is_feature_enabled($key)` in `helpers.php` — checks DB, returns bool. Used by feature endpoints to return 403 when disabled.

### Frontend — Feature Flags Context

New `src/lib/features.ts`:
- `FeaturesProvider` wraps app, fetches `/api/settings/public.php` on mount.
- `useFeatures()` hook returns `{ requests, shop, messaging, leaderboard, loading }`.

### Frontend — Conditional Rendering

**NavBar.tsx:** Hide Messages, Shop/HiveCoin, Leaderboard links when their flag is off.

**Discover.tsx:** Hide Requests tab, Post Request buttons, Leaderboard sidebar link when flags are off.

**Routes:** `FeatureRoute` wrapper redirects to `/discover` when a feature is disabled. Applied to `/post-request`, `/request/:id`, `/shop`, `/messages`, `/leaderboard`.

### Admin Settings Tab (5th tab)

**Section 1 — Feature Toggles:** Card with toggle switches for each feature. Saves immediately via PATCH. Toast confirmation.

**Section 2 — Admin Account:** Change Email and Change Password forms using existing `/auth/change-email.php` and `/auth/change-password.php` endpoints. New password field includes strength meter.

### Disabled Feature UX

Users navigating to disabled feature URLs are silently redirected to `/discover`. Nav links and UI elements for disabled features are hidden entirely.
