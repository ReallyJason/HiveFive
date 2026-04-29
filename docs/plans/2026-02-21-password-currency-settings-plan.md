# Password Hint, CurrencyInput Fix & Admin Settings — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix password max-length visibility, fix CurrencyInput mobile keyboard, and add admin system settings with feature toggles.

**Architecture:** Three independent changes: (1) text-only updates in 3 password pages, (2) remove `readOnly` from CurrencyInput and add `onChange` handler, (3) new `system_settings` DB table + backend API + frontend context + admin Settings tab with feature toggles and admin account management.

**Tech Stack:** React 18, TypeScript, PHP 8 / PDO / MariaDB, Tailwind CSS, Sonner toasts, lucide-react icons.

---

### Task 1: Update password strength hint text

**Files:**
- Modify: `src/pages/Signup.tsx:261`
- Modify: `src/pages/ForgotPassword.tsx:301`
- Modify: `src/pages/Settings.tsx:980`

**Step 1: Update Signup.tsx**

In `src/pages/Signup.tsx`, line 261, change:
```
{strengthLabels[strength]} • At least 8 characters, one number, one uppercase
```
to:
```
{strengthLabels[strength]} • 8–72 characters, one number, one uppercase
```

**Step 2: Update ForgotPassword.tsx**

In `src/pages/ForgotPassword.tsx`, line 301, same change:
```
{strengthLabels[strength]} • At least 8 characters, one number, one uppercase
```
to:
```
{strengthLabels[strength]} • 8–72 characters, one number, one uppercase
```

**Step 3: Update Settings.tsx**

In `src/pages/Settings.tsx`, line 980, same change:
```
{labels[strength]} • At least 8 characters, one number, one uppercase
```
to:
```
{labels[strength]} • 8–72 characters, one number, one uppercase
```

Note: Settings.tsx uses `labels` instead of `strengthLabels` — match the existing variable name.

**Step 4: Commit**

```bash
git add src/pages/Signup.tsx src/pages/ForgotPassword.tsx src/pages/Settings.tsx
git commit -m "fix: Update password hint to show 8-72 character range"
```

---

### Task 2: Fix CurrencyInput mobile keyboard

**Files:**
- Modify: `src/components/CurrencyInput.tsx`

**Step 1: Remove `readOnly` and add `onChange` handler**

In `src/components/CurrencyInput.tsx`:

1. Remove `readOnly` from line 131 (the `<input>` element).

2. Add an `onChange` handler that processes mobile keyboard input. Mobile browsers fire `onChange` instead of individual `keyDown` events when using the on-screen keyboard. The handler should:
   - Extract only digits from the new input value
   - Convert to cents
   - Clamp to max 999999 (9999.99)
   - Format and call `onChange`

Add this function after `handlePaste` (after line 113):

```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // On mobile, the keyboard fires onChange instead of keyDown.
  // Extract digits from the raw value, convert to cents, format.
  const raw = e.target.value.replace(/[^0-9]/g, '');
  if (raw === '' || raw === '0') {
    setDisplayValue('0.00');
    onChange('0');
    return;
  }
  let cents = parseInt(raw, 10);
  if (cents > 999999) cents = 999999;
  const newValue = formatCents(cents);
  setDisplayValue(newValue);
  onChange(newValue);
};
```

3. Add `onChange={handleChange}` to the `<input>` element (alongside existing `onKeyDown`, `onFocus`, `onPaste`).

The final `<input>` should look like:
```tsx
<input
  ref={inputRef}
  type="text"
  inputMode="decimal"
  value={displayValue}
  onChange={handleChange}
  onKeyDown={handleKeyDown}
  onFocus={handleFocus}
  onPaste={handlePaste}
  placeholder={placeholder}
  disabled={disabled}
  className={`w-full h-14 pl-10 pr-4 bg-white border-2 border-charcoal-200 rounded-xl font-mono text-base text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-4 focus:ring-honey-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
/>
```

**Step 2: Commit**

```bash
git add src/components/CurrencyInput.tsx
git commit -m "fix: Remove readOnly from CurrencyInput so mobile keyboards open"
```

---

### Task 3: Create `system_settings` database table

**Files:**
- Modify: `sql/setup.sql` (append new table at end)

**Step 1: Add the table and default rows**

Append to the end of `sql/setup.sql`:

```sql
-- 18. system_settings (feature toggles & platform config)
CREATE TABLE system_settings (
    setting_key   VARCHAR(50)  PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL DEFAULT '1',
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default feature flags (all enabled)
INSERT INTO system_settings (setting_key, setting_value) VALUES
    ('feature_requests', '1'),
    ('feature_shop', '1'),
    ('feature_messaging', '1'),
    ('feature_leaderboard', '1');
```

**Step 2: Commit**

```bash
git add sql/setup.sql
git commit -m "feat: Add system_settings table for feature toggles"
```

---

### Task 4: Add `is_feature_enabled()` helper to backend

**Files:**
- Modify: `api/helpers.php`

**Step 1: Add the helper function**

Append this function to the end of `api/helpers.php`:

```php
/**
 * Check if a system feature is enabled.
 * Uses a static cache to avoid repeated DB queries within a single request.
 */
function is_feature_enabled(PDO $pdo, string $key): bool {
    static $cache = [];
    if (isset($cache[$key])) return $cache[$key];

    $stmt = $pdo->prepare('SELECT setting_value FROM system_settings WHERE setting_key = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $enabled = $row ? ($row['setting_value'] === '1') : true; // default enabled if not found
    $cache[$key] = $enabled;
    return $enabled;
}

/**
 * Abort with 403 if the named feature is disabled.
 */
function require_feature(PDO $pdo, string $key): void {
    if (!is_feature_enabled($pdo, $key)) {
        json_response(['error' => 'This feature is currently disabled'], 403);
    }
}
```

**Step 2: Commit**

```bash
git add api/helpers.php
git commit -m "feat: Add is_feature_enabled() and require_feature() helpers"
```

---

### Task 5: Create public settings endpoint

**Files:**
- Create: `api/settings/public.php`

**Step 1: Create the endpoint**

Create directory `api/settings/` and file `api/settings/public.php`:

```php
<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

// No auth required — these are public feature flags
$stmt = $pdo->query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE 'feature_%'");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$features = [];
foreach ($rows as $row) {
    // Strip 'feature_' prefix for cleaner frontend keys
    $key = str_replace('feature_', '', $row['setting_key']);
    $features[$key] = $row['setting_value'] === '1';
}

json_response(['features' => $features]);
```

**Step 2: Commit**

```bash
git add api/settings/public.php
git commit -m "feat: Add public feature flags endpoint"
```

---

### Task 6: Create admin settings endpoint

**Files:**
- Create: `api/admin/settings.php`

**Step 1: Create the endpoint**

Create `api/admin/settings.php`:

```php
<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query('SELECT setting_key, setting_value, updated_at FROM system_settings ORDER BY setting_key');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    json_response(['settings' => $rows]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $body = get_json_body();
    if (empty($body) || !is_array($body)) {
        json_response(['error' => 'Request body must be a JSON object of key-value pairs'], 400);
    }

    $allowed_keys = ['feature_requests', 'feature_shop', 'feature_messaging', 'feature_leaderboard'];
    $stmt = $pdo->prepare('UPDATE system_settings SET setting_value = ? WHERE setting_key = ?');

    foreach ($body as $key => $value) {
        if (!in_array($key, $allowed_keys, true)) continue;
        $val = $value ? '1' : '0';
        $stmt->execute([$val, $key]);
    }

    // Return updated settings
    $stmt2 = $pdo->query('SELECT setting_key, setting_value, updated_at FROM system_settings ORDER BY setting_key');
    $rows = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    json_response(['settings' => $rows]);
}

json_response(['error' => 'Method not allowed'], 405);
```

**Step 2: Commit**

```bash
git add api/admin/settings.php
git commit -m "feat: Add admin settings GET/PATCH endpoint"
```

---

### Task 7: Add backend feature guards to request endpoints

**Files:**
- Modify: `api/requests/list.php` (add guard at top after cors/auth)
- Modify: `api/requests/create.php`
- Modify: `api/requests/get.php`
- Modify: `api/requests/proposals.php`
- Modify: `api/requests/proposals-respond.php`
- Modify: `api/shop/items.php`
- Modify: `api/shop/purchase.php`
- Modify: `api/messages/conversations.php`
- Modify: `api/messages/messages.php`
- Modify: `api/messages/send.php`

**Step 1: Add feature guards**

For each request-related endpoint, add after the existing `cors();` and auth calls:

**Request endpoints** (`api/requests/list.php`, `create.php`, `get.php`, `proposals.php`, `proposals-respond.php`):
```php
require_feature($pdo, 'feature_requests');
```

**Shop endpoints** (`api/shop/items.php`, `purchase.php`):
```php
require_feature($pdo, 'feature_shop');
```

**Message endpoints** (`api/messages/conversations.php`, `messages.php`, `send.php`):
```php
require_feature($pdo, 'feature_messaging');
```

Note: Each of these files already has `require_once __DIR__ . '/../helpers.php';` and `require_once __DIR__ . '/../db_config.php';` so `$pdo` and `require_feature()` are already available. Add the `require_feature()` call right after the existing `cors()` / `require_auth()` lines.

Exception: `api/shop/purchases.php` and `api/shop/activate.php` should NOT be guarded — users need to keep using items they already purchased even if the shop is disabled.

**Step 2: Commit**

```bash
git add api/requests/ api/shop/items.php api/shop/purchase.php api/messages/
git commit -m "feat: Add feature guards to request, shop, and message endpoints"
```

---

### Task 8: Create FeaturesProvider context

**Files:**
- Create: `src/lib/features.ts`

**Step 1: Create the context**

Create `src/lib/features.ts`:

```typescript
import { createContext, useContext, useState, useEffect, useCallback, createElement } from 'react';
import type { ReactNode } from 'react';
import { apiGet } from './api';

interface FeaturesState {
  requests: boolean;
  shop: boolean;
  messaging: boolean;
  leaderboard: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const FeaturesContext = createContext<FeaturesState | null>(null);

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState({
    requests: true,
    shop: true,
    messaging: true,
    leaderboard: true,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet<{ features: Record<string, boolean> }>('/settings/public.php');
      setFeatures({
        requests: data.features.requests ?? true,
        shop: data.features.shop ?? true,
        messaging: data.features.messaging ?? true,
        leaderboard: data.features.leaderboard ?? true,
      });
    } catch {
      // Default to all enabled on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return createElement(
    FeaturesContext.Provider,
    { value: { ...features, loading, refresh } },
    children,
  );
}

export function useFeatures(): FeaturesState {
  const ctx = useContext(FeaturesContext);
  if (!ctx) throw new Error('useFeatures must be used within FeaturesProvider');
  return ctx;
}
```

**Step 2: Commit**

```bash
git add src/lib/features.ts
git commit -m "feat: Add FeaturesProvider context for feature flags"
```

---

### Task 9: Wire FeaturesProvider into App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add FeaturesProvider**

In `src/App.tsx`:

1. Add import: `import { FeaturesProvider } from './lib/features';`

2. Wrap the app inside `FeaturesProvider` (inside `AuthProvider`, outside `AccountStatusGate`):

```tsx
function App() {
  return (
    <AuthProvider>
      <FeaturesProvider>
        <AccountStatusGate>
          <RouterProvider router={router} />
        </AccountStatusGate>
        <Toaster />
      </FeaturesProvider>
    </AuthProvider>
  );
}
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: Wire FeaturesProvider into App component tree"
```

---

### Task 10: Create FeatureRoute wrapper component

**Files:**
- Create: `src/components/FeatureRoute.tsx`

**Step 1: Create the component**

Create `src/components/FeatureRoute.tsx`:

```tsx
import { Navigate } from 'react-router';
import { useFeatures } from '../lib/features';

interface FeatureRouteProps {
  feature: 'requests' | 'shop' | 'messaging' | 'leaderboard';
  children: React.ReactNode;
}

export function FeatureRoute({ feature, children }: FeatureRouteProps) {
  const features = useFeatures();

  if (features.loading) return null;
  if (!features[feature]) return <Navigate to="/discover" replace />;

  return <>{children}</>;
}
```

**Step 2: Commit**

```bash
git add src/components/FeatureRoute.tsx
git commit -m "feat: Add FeatureRoute wrapper for disabled feature redirect"
```

---

### Task 11: Guard routes with FeatureRoute

**Files:**
- Modify: `src/routes.tsx`

**Step 1: Add imports and wrap routes**

In `src/routes.tsx`:

1. Add import at top:
```typescript
import { FeatureRoute } from "./components/FeatureRoute";
```

2. Add a React import for `createElement`:
```typescript
import { createElement } from "react";
```

3. Wrap these route entries with FeatureRoute. Since `createBrowserRouter` uses `Component` or `element` props, wrap with `element` using `createElement`:

For `/post-request` (line 138-139):
```typescript
{
  path: "/post-request",
  element: createElement(FeatureRoute, { feature: 'requests' }, createElement(PostRequest)),
},
```

For `/request/:id` (line 122-123):
```typescript
{
  path: "/request/:id",
  element: createElement(FeatureRoute, { feature: 'requests' }, createElement(RequestDetail)),
},
```

For `/shop` (line 162-163):
```typescript
{
  path: "/shop",
  element: createElement(FeatureRoute, { feature: 'shop' }, createElement(HiveShop)),
},
```

For `/messages` (line 146-147):
```typescript
{
  path: "/messages",
  element: createElement(FeatureRoute, { feature: 'messaging' }, createElement(Messages)),
},
```

For `/leaderboard` (line 174-175):
```typescript
{
  path: "/leaderboard",
  element: createElement(FeatureRoute, { feature: 'leaderboard' }, createElement(Leaderboard)),
},
```

Note: Change from `Component: X` to `element: createElement(FeatureRoute, { feature: '...' }, createElement(X))` for each guarded route. Leave the other routes using `Component:` as-is.

**Step 2: Commit**

```bash
git add src/routes.tsx
git commit -m "feat: Guard feature routes with FeatureRoute redirects"
```

---

### Task 12: Add feature flag checks to NavBar

**Files:**
- Modify: `src/components/NavBar.tsx`

**Step 1: Import useFeatures**

Add to the imports at the top of `src/components/NavBar.tsx`:
```typescript
import { useFeatures } from '../lib/features';
```

**Step 2: Get features in the component**

Inside the `NavBar` component function, add after the existing `useAuth()` call:
```typescript
const features = useFeatures();
```

**Step 3: Wrap Messages desktop link (lines 201-213)**

The Messages link is inside `{!isAdmin && (<> ... </>)}`. Add `features.messaging &&` condition. Change the block containing the Messages `<Link>` so that Messages is individually wrapped:

Replace the block at lines 186-215 (the `{!isAdmin && (<> ... </>)}` block containing "Post Service" and "Messages") with:

```tsx
{!isAdmin && (
  <>
    <Link
      to="/post-service"
      className={`text-sm font-sans relative transition-colors whitespace-nowrap ${
        isActive('/post-service') || isActive('/post-request')
          ? 'font-bold text-charcoal-900'
          : 'font-normal text-charcoal-400 hover:text-charcoal-600'
      }`}
    >
      Post Service
      {(isActive('/post-service') || isActive('/post-request')) && (
        <div className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-honey-500" />
      )}
    </Link>
    {features.messaging && (
      <Link
        to="/messages"
        className={`text-sm font-sans relative transition-colors ${
          isActive('/messages')
            ? 'font-bold text-charcoal-900'
            : 'font-normal text-charcoal-400 hover:text-charcoal-600'
        }`}
      >
        Messages
        {isActive('/messages') && (
          <div className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-honey-500" />
        )}
      </Link>
    )}
  </>
)}
```

**Step 4: Wrap Leaderboard desktop link (lines 216-228)**

Wrap the Leaderboard `<Link>` in `{features.leaderboard && ( ... )}`.

**Step 5: Wrap notification bell (lines 234-308)**

The bell is inside `{!isAdmin && ( ... )}`. Add `features.messaging &&` so it becomes `{!isAdmin && features.messaging && ( ... )}`.

**Step 6: Wrap HiveCoin balance desktop button (lines 310-318)**

Change `{!isAdmin && (` to `{!isAdmin && features.shop && (`.

**Step 7: Wrap Shop links in avatar dropdown**

- Admin dropdown Shop button (lines 346-352): wrap in `{features.shop && ( ... )}`
- Non-admin dropdown Shop button (lines 457-466): wrap in `{features.shop && ( ... )}`

**Step 8: Wrap mobile menu links**

In the mobile menu section (lines 560+):

- Messages link (lines 590-607, inside `{!isAdmin && (<> ... </>)}`): Separate Messages into its own conditional: `{features.messaging && ( <Link to="/messages" ... /> )}`
- Leaderboard link (lines 611-628): wrap in `{features.leaderboard && ( ... )}`
- Shop link (lines 630-647): wrap in `{features.shop && ( ... )}`
- HiveCoin balance card (lines 650-680, inside `{!isAdmin && (<> ... </>)}`): Add `features.shop &&` so it becomes `{!isAdmin && features.shop && (<> ... </>)}`

**Step 9: Commit**

```bash
git add src/components/NavBar.tsx
git commit -m "feat: Hide nav links for disabled features"
```

---

### Task 13: Add feature flag checks to Discover page

**Files:**
- Modify: `src/pages/Discover.tsx`

**Step 1: Import useFeatures**

Add to imports:
```typescript
import { useFeatures } from '../lib/features';
```

**Step 2: Get features in the component**

Inside the `Discover` component function body, add:
```typescript
const features = useFeatures();
```

**Step 3: Auto-switch to services tab when requests disabled**

After the `features` declaration, add:
```typescript
useEffect(() => {
  if (!features.requests && activeTab === 'requests') {
    setActiveTab('services');
  }
}, [features.requests, activeTab]);
```

**Step 4: Conditionally render the tab toggle (lines 390-412)**

Wrap the entire Requests tab button in `{features.requests && ( ... )}`. If requests is disabled, only show the Services button (no toggle needed). Change the tab toggle section:

```tsx
{features.requests && (
  <div className="bg-charcoal-100 rounded-full p-1 w-fit mt-4">
    <button
      onClick={() => setActiveTab('services')}
      className={`px-5 py-2 text-sm font-sans rounded-full transition-all ${
        activeTab === 'services'
          ? 'bg-honey-500 text-charcoal-900 font-bold shadow-sm'
          : 'text-charcoal-500 hover:text-charcoal-700'
      }`}
    >
      Services
    </button>
    <button
      onClick={() => setActiveTab('requests')}
      className={`px-5 py-2 text-sm font-sans rounded-full transition-all ${
        activeTab === 'requests'
          ? 'bg-honey-500 text-charcoal-900 font-bold shadow-sm'
          : 'text-charcoal-500 hover:text-charcoal-700'
      }`}
    >
      Requests
    </button>
  </div>
)}
```

**Step 5: Conditionally render "Post a Request" CTA card (lines 741-756)**

Change `{!isAdmin && (` to `{!isAdmin && features.requests && (`.

**Step 6: Conditionally render FAB (lines 762-773)**

Change `{!isAdmin && (` to `{!isAdmin && features.requests && (`.

**Step 7: Conditionally render Leaderboard sidebar link (lines 732-737)**

Wrap the "View Full Leaderboard →" button in `{features.leaderboard && ( ... )}`.

**Step 8: Commit**

```bash
git add src/pages/Discover.tsx
git commit -m "feat: Hide requests tab and leaderboard link when features disabled"
```

---

### Task 14: Add Settings tab to Admin dashboard

**Files:**
- Modify: `src/pages/Admin.tsx`

This is the largest single change. The Admin.tsx file is 2321 lines. We need to:

1. Add `Settings2` icon import (from lucide-react) — renamed to avoid conflict with the Settings page import. Use `Settings2` from lucide-react.
2. Add new state variables for the settings tab.
3. Add 'settings' to the tab type and tabs array.
4. Add data fetching for settings.
5. Add the settings tab content section.

**Step 1: Add imports**

At the top of `src/pages/Admin.tsx`, add `Settings2` to the lucide-react import (line 10-14):
```typescript
import {
  BarChart3, Shield, Users as UsersIcon, DollarSign,
  AlertTriangle, CheckCircle, XCircle, Eye, Ban, Clock,
  Search, ChevronDown, ChevronRight, ChevronLeft, Flag, Activity,
  ShoppingBag, UserPlus, Package, Settings2, EyeOff, Loader2,
} from 'lucide-react';
```

Also add:
```typescript
import { useFeatures } from '../lib/features';
```

**Step 2: Add state variables**

After the existing orders state block (around line 468), add:

```typescript
// Settings state
const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
const [settingsLoading, setSettingsLoading] = useState(false);
const [settingsSaving, setSettingsSaving] = useState<string | null>(null);

// Admin account state
const [adminPasswordData, setAdminPasswordData] = useState({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const [adminPasswordSaving, setAdminPasswordSaving] = useState(false);
const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);
const [showAdminOldPassword, setShowAdminOldPassword] = useState(false);
const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);

const [adminEmailData, setAdminEmailData] = useState({ newEmail: '', password: '' });
const [adminEmailSaving, setAdminEmailSaving] = useState(false);
const [adminEmailError, setAdminEmailError] = useState<string | null>(null);
const [showAdminEmailPassword, setShowAdminEmailPassword] = useState(false);
```

**Step 3: Get features context**

Inside the component, after the existing `useAuth()` call (line 423):
```typescript
const { refresh: refreshFeatures } = useFeatures();
```

**Step 4: Update tab type and tabs array**

Change line 426:
```typescript
const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'users' | 'revenue' | 'orders' | 'settings'>('overview');
```

Change lines 476-482 to add the settings tab:
```typescript
const tabs = [
  { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
  { id: 'reports' as const, label: 'Reports', icon: Shield },
  { id: 'users' as const, label: 'Users', icon: UsersIcon },
  { id: 'revenue' as const, label: 'Revenue', icon: DollarSign },
  { id: 'orders' as const, label: 'Orders', icon: Package },
  { id: 'settings' as const, label: 'Settings', icon: Settings2 },
];
```

**Step 5: Add data fetching functions**

After the existing `fetchOrders` function, add:

```typescript
const fetchSettings = useCallback(async () => {
  setSettingsLoading(true);
  try {
    const data = await apiGet<{ settings: { setting_key: string; setting_value: string }[] }>('/admin/settings.php');
    const map: Record<string, string> = {};
    data.settings.forEach(s => { map[s.setting_key] = s.setting_value; });
    setSystemSettings(map);
  } catch {
    toast.error('Failed to load settings');
  } finally {
    setSettingsLoading(false);
  }
}, []);

const toggleFeature = async (key: string) => {
  const newValue = systemSettings[key] === '1' ? '0' : '1';
  setSettingsSaving(key);
  try {
    await apiPatch('/admin/settings.php', { [key]: newValue === '1' });
    setSystemSettings(prev => ({ ...prev, [key]: newValue }));
    refreshFeatures();
    toast.success(`${key.replace('feature_', '').replace(/_/g, ' ')} ${newValue === '1' ? 'enabled' : 'disabled'}`);
  } catch {
    toast.error('Failed to update setting');
  } finally {
    setSettingsSaving(null);
  }
};
```

**Step 6: Add useEffect for settings tab**

Add to the existing data fetching useEffect section:

```typescript
useEffect(() => {
  if (activeTab === 'settings') fetchSettings();
}, [activeTab, fetchSettings]);
```

**Step 7: Add password helper functions**

Add these functions for admin password management:

```typescript
const getAdminPasswordStrength = (password: string) => {
  if (!password) return 0;
  let s = 0;
  if (password.length >= 8) s++;
  if (/[A-Z]/.test(password)) s++;
  if (/[0-9]/.test(password)) s++;
  if (/[^A-Za-z0-9]/.test(password)) s++;
  return s;
};

const adminStrength = getAdminPasswordStrength(adminPasswordData.newPassword);
const adminStrengthColors = ['bg-charcoal-200', 'bg-red-500', 'bg-amber-500', 'bg-honey-500', 'bg-emerald-500'];
const adminStrengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

const handleAdminPasswordChange = async (e: React.FormEvent) => {
  e.preventDefault();
  if (adminPasswordData.newPassword.length < 8) {
    setAdminPasswordError('Password must be at least 8 characters');
    return;
  }
  if (!/[A-Z]/.test(adminPasswordData.newPassword)) {
    setAdminPasswordError('Password must contain at least one uppercase letter');
    return;
  }
  if (!/[0-9]/.test(adminPasswordData.newPassword)) {
    setAdminPasswordError('Password must contain at least one number');
    return;
  }
  if (adminPasswordData.newPassword !== adminPasswordData.confirmPassword) {
    setAdminPasswordError('Passwords do not match');
    return;
  }
  setAdminPasswordSaving(true);
  setAdminPasswordError(null);
  try {
    await apiPost('/auth/change-password.php', {
      old_password: adminPasswordData.oldPassword,
      new_password: adminPasswordData.newPassword,
    });
    toast.success('Password changed');
    setAdminPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
  } catch (err: any) {
    setAdminPasswordError(err?.message || 'Failed to change password');
  } finally {
    setAdminPasswordSaving(false);
  }
};

const handleAdminEmailChange = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!adminEmailData.newEmail || !adminEmailData.password) return;
  setAdminEmailSaving(true);
  setAdminEmailError(null);
  try {
    await apiPost('/auth/change-email.php', {
      new_email: adminEmailData.newEmail,
      password: adminEmailData.password,
    });
    toast.success('Email updated');
    setAdminEmailData({ newEmail: '', password: '' });
    refreshUser();
  } catch (err: any) {
    setAdminEmailError(err?.message || 'Failed to change email');
  } finally {
    setAdminEmailSaving(false);
  }
};
```

**Step 8: Add settings tab content**

Before the closing `</div>` of the content area (before line 2309 `</div>`), after the orders tab content block (`{activeTab === 'orders' && ( ... )}`), add:

```tsx
{activeTab === 'settings' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

    {/* Feature Toggles */}
    <div style={{ background: '#FDFCFA', border: '1px solid #E5E2DE', borderRadius: '12px', padding: '24px' }}>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', color: '#131210', marginBottom: '4px' }}>Feature Toggles</h2>
      <p style={{ fontSize: '13px', color: '#78716C', marginBottom: '20px' }}>Enable or disable platform features. Changes take effect immediately for all users.</p>

      {settingsLoading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#A8A29E' }}>Loading settings...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { key: 'feature_requests', label: 'Requests', description: 'Service requests & proposals — allows users to post requests and providers to submit proposals' },
            { key: 'feature_shop', label: 'HiveShop', description: 'Cosmetics store — users can browse and purchase frames, badges, and themes with HiveCoins' },
            { key: 'feature_messaging', label: 'Messaging', description: 'Direct messages — users can send and receive messages in conversations' },
            { key: 'feature_leaderboard', label: 'Leaderboard', description: 'Provider rankings — displays top providers based on ratings and activity' },
          ].map((feature, idx) => (
            <div key={feature.key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 0',
              borderBottom: idx < 3 ? '1px solid #E5E2DE' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: '#131210' }}>{feature.label}</div>
                <div style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px', maxWidth: '480px' }}>{feature.description}</div>
              </div>
              <button
                onClick={() => toggleFeature(feature.key)}
                disabled={settingsSaving === feature.key}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: systemSettings[feature.key] === '1' ? '#E9A020' : '#D6D3CE',
                  position: 'relative', transition: 'background 0.2s',
                  opacity: settingsSaving === feature.key ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '10px', background: '#FFFFFF',
                  position: 'absolute', top: '2px',
                  left: systemSettings[feature.key] === '1' ? '22px' : '2px',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Admin Account */}
    <div style={{ background: '#FDFCFA', border: '1px solid #E5E2DE', borderRadius: '12px', padding: '24px' }}>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', color: '#131210', marginBottom: '4px' }}>Admin Account</h2>
      <p style={{ fontSize: '13px', color: '#78716C', marginBottom: '20px' }}>Manage your admin email and password.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '24px' }}>

        {/* Change Email */}
        <form onSubmit={handleAdminEmailChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: '#131210' }}>Change Email</h3>
          <p style={{ fontSize: '12px', color: '#A8A29E' }}>Current: {user?.email}</p>
          {adminEmailError && (
            <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '13px', color: '#DC2626' }}>{adminEmailError}</div>
          )}
          <input
            type="email"
            value={adminEmailData.newEmail}
            onChange={e => setAdminEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
            placeholder="New email address"
            className="w-full h-11 px-3.5 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
          />
          <div className="relative">
            <input
              type={showAdminEmailPassword ? 'text' : 'password'}
              value={adminEmailData.password}
              onChange={e => setAdminEmailData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Current password"
              className="w-full h-11 px-3.5 pr-10 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
            />
            <button type="button" onClick={() => setShowAdminEmailPassword(!showAdminEmailPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
              {showAdminEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={adminEmailSaving || !adminEmailData.newEmail || !adminEmailData.password}
            className="h-10 px-5 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-fit"
          >
            {adminEmailSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Update Email'}
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={handleAdminPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: '#131210' }}>Change Password</h3>
          {adminPasswordError && (
            <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '13px', color: '#DC2626' }}>{adminPasswordError}</div>
          )}
          <div className="relative">
            <input
              type={showAdminOldPassword ? 'text' : 'password'}
              value={adminPasswordData.oldPassword}
              onChange={e => setAdminPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
              placeholder="Current password"
              maxLength={72}
              className="w-full h-11 px-3.5 pr-10 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
            />
            <button type="button" onClick={() => setShowAdminOldPassword(!showAdminOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
              {showAdminOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showAdminNewPassword ? 'text' : 'password'}
              value={adminPasswordData.newPassword}
              onChange={e => setAdminPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="New password"
              maxLength={72}
              className="w-full h-11 px-3.5 pr-10 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
            />
            <button type="button" onClick={() => setShowAdminNewPassword(!showAdminNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
              {showAdminNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {adminPasswordData.newPassword && (
            <div>
              <div className="flex gap-1 h-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`flex-1 rounded-full transition-all ${i <= adminStrength ? adminStrengthColors[adminStrength] : 'bg-charcoal-200'}`} />
                ))}
              </div>
              <p className="text-xs text-charcoal-500 mt-1">{adminStrengthLabels[adminStrength]} &bull; 8–72 characters, one number, one uppercase</p>
            </div>
          )}
          <div className="relative">
            <input
              type={showAdminConfirmPassword ? 'text' : 'password'}
              value={adminPasswordData.confirmPassword}
              onChange={e => setAdminPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
              maxLength={72}
              className="w-full h-11 px-3.5 pr-10 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
            />
            <button type="button" onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
              {showAdminConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={adminPasswordSaving || !adminPasswordData.oldPassword || !adminPasswordData.newPassword || !adminPasswordData.confirmPassword}
            className="h-10 px-5 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-fit"
          >
            {adminPasswordSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>

  </div>
)}
```

**Step 9: Commit**

```bash
git add src/pages/Admin.tsx
git commit -m "feat: Add Settings tab to admin dashboard with feature toggles and account management"
```

---

### Task 15: Final verification

**Step 1: Build check**

Run: `npm run build` (or the project's build command) from the project root to verify no TypeScript or build errors.

**Step 2: Manual verification checklist**

- [ ] Password strength hint shows "8–72 characters" on Signup, ForgotPassword, and Settings pages
- [ ] CurrencyInput opens mobile keyboard when tapped (test on mobile or Chrome DevTools mobile emulation)
- [ ] Admin Settings tab appears as 6th tab in admin dashboard
- [ ] Feature toggles render with correct on/off state
- [ ] Toggling a feature updates immediately and shows toast
- [ ] Disabled feature routes redirect to /discover
- [ ] NavBar hides links for disabled features
- [ ] Discover page hides Requests tab when requests disabled
- [ ] Admin change email form works
- [ ] Admin change password form works with strength meter
- [ ] Backend returns 403 for disabled feature API calls

**Step 3: Final commit**

If any fixes are needed after the build check, commit them separately.
