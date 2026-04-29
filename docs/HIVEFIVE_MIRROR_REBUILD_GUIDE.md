# HiveFive Mirror Rebuild Guide

## What changed in this version

The old guide was organized like departments. That is not how the mirror build will actually get done.

This version is organized as **small, shippable feature packets**:

- Each packet is something a junior dev can build as one focused branch.
- Each packet has its own `Frontend` and `Backend` subsections.
- Each packet repeats its support files on purpose.
- Each packet names the files that make it work in isolation, not just the obvious page or endpoint.
- Messaging is broken down into separate packets for chat list, thread/composer, context banners, order event cards, link previews, attachments, and notification/polling interactions.

If two packets both list the same support file, that is expected. The duplication is there so nobody has to read five earlier sections just to understand one assigned branch.

## Quick Access Links

- Reference repo: <https://github.com/intesarjawad/hive/>
- Mirror-build target repo: <https://github.com/cse442-software-engineering-ub/s26-hivefive/>
- Cattle frontend base: <https://cattle.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/>
- Cattle API base: <https://cattle.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/api>
- Aptitude phpMyAdmin: <https://aptitude.cse.buffalo.edu/phpmyadmin/>

## Current Repo Snapshot

Snapshot date: **March 11, 2026**

- Total tracked files: `595`
- Backend API files in `api/`: `77`
- Frontend source files in `src/`: `122`
- Public assets in `public/`: `355`
- Internal docs in `docs/`: `18`
- SQL files in `sql/`: `7`

Current-state notes that matter for the rebuild:

- Wallet is still embedded inside `src/pages/Settings.tsx`; it is not its own page.
- The order timeline is currently chat-backed through structured order event messages; there is no separate order-events timeline page.
- Message attachments now render as thin download cards only. No inline previews. Current limits are `5 files max` and `5 MB per file`.
- Feature flags currently gate `requests`, `shop`, `messaging`, `leaderboard`, `docs`, and `mock_data`.
- Message attachment storage depends on the backend folder `api/uploads/messages_private`. If that folder is not persistent in deployment, the DB rows survive and the files do not.
- Any internal-only team tooling layered onto the Hive docs page for packet assignment or delivery tracking is not part of the mirror-build contract and should be ignored in the rebuild.

## How to use this document

1. Assign work by packet, not by broad chapter.
2. When a dev takes a packet, they should copy or build **every file listed in that packet**, including support files.
3. Backend-first is still the safest merge order for most packets.
4. If a packet says it depends on another packet, merge the dependency first.
5. If you intentionally build packets out of order, do not improvise missing dependencies. Use the repeated dependency lists in the packet itself.
6. Use GitHub search, browser find, or the in-app docs search against the packet title, broader-feature tag, and search tags listed at the top of every packet.

## Router Warning: Do Not Blindly Copy Hive's `src/routes.tsx`

`src/routes.tsx` in the private Hive repo is **reference material**, not a drop-in file for HiveFive.

Do **not** copy Hive's router wholesale into HiveFive just because a packet mentions `src/routes.tsx`.

Why:

- Hive has extra routes that do not belong in HiveFive yet.
- Hive may include route guards, feature-flag wrappers, redirects, docs/internal pages, and other private-project behavior that the mirror build does not share.
- HiveFive routing should follow the HiveFive rebuild contract, not whatever happens to exist in Hive at the moment.

Safe rule:

- Only port the specific route entries needed for the packet you are building.
- Only wire routes for pages and dependencies that already exist in HiveFive.
- If Hive and HiveFive differ, HiveFive wins. Do not "fix" HiveFive by copying the private reference app's whole router.

If you copy Hive's entire router and then complain that navigation or auth is broken, that is user error, not a guide problem.

## Frontend Mock Data Rule: Use `src/lib/data.ts` Until Backend Routes Exist

If your frontend packet is blocked on missing backend routes, you are still expected to build the UI.

Use [`src/lib/data.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/data.ts) to visualize cards, lists, profile shells, detail panes, sidebars, and empty states until the real PHP endpoints are connected.

Do **not** do this:

- hardcode one-off fake arrays inside the page component
- invent different names, prices, ratings, or counts in every screen
- block frontend work entirely just because the backend packet is not merged yet

Do this instead:

- import the shared mock data from `src/lib/data.ts`
- keep the component props and state shaped like the eventual API response
- if the packet already supports both modes, follow the existing `mock_data` feature-flag pattern instead of writing a second fake-data path
- when backend routes are ready, swap the data source, not the whole component tree

Safe implementation pattern:

```ts
const data = features.mock_data
  ? services
  : await apiGet<ServicesResponse>('/services/list.php', params);
```

If the exact entity you need is missing from `src/lib/data.ts`, add it there once and reuse it everywhere. Do not create packet-specific mock objects scattered across the codebase.

## Assignment Rule: Use Packet IDs, Not Vague English Labels

Do not assign work with sloppy labels like:

- `post a service backend`
- `profile stuff`
- `messages frontend`
- `admin moderation thing`

Those labels are how junior devs convince themselves they only owned one tiny slice.

Always assign either:

- one exact packet side, like `P20 backend`
- multiple exact packet sides, like `P20 backend + P21 backend + P13.1 backend`
- or one named full-flow bundle from the section right below

If the PM wants the **full working flow**, the assignment must list **every packet needed for that full flow**. If the PM lists only one packet, the dev is only on the hook for that one packet.

Wrong:

- `You own post a service backend`

Right:

- `You own P20 backend`
- `You own the Full Provider Service Management bundle backend: P20 + P21 + P13.1`

## Common Full-Flow Bundles

Use these when you mean the whole thing, not one slice.

- `Full Settings Flow`: `P10 + P11 + P12 + P38`
- `Full Self/Profile Flow`: `P13 + P13.1 + P14 + P14.1`
- `Full Provider Service Management Flow`: `P19 + P20 + P21 + P13.1`
- `Full Requests and Proposals Flow`: `P22 + P23 + P24`
- `Full Messaging Flow`: `P26 + P27 + P28 + P29 + P30 + P31 + P32`
- `Full Admin Trust & Safety Flow`: `P14.1 + P43 + P43.1`
- `Full Admin Operations Flow`: `P42 + P44 + P44.1`

If you assign one of those bundles, write the exact packet IDs in the assignment anyway. Do not assume people will infer them from the English bundle name.

## Read This If Git Confuses You

This section exists for junior devs who are still shaky on git, GitHub, and merge workflow words.

### Plain-English Workflow

1. Pick **one packet**.
   A packet means one small feature assignment from this guide.
2. Read the whole packet before touching code.
   Do not stop at the page file. Read the `Frontend`, `Backend`, and `Storage, data, and behavior` parts.
3. Make a **branch** for your work.
   A branch means your own separate work lane so you do not break `main` while building.
4. Build **every file listed in that packet**.
   If the packet lists 1 main page and 6 support files, you need all 7. The support files are not optional.
5. Test your packet locally.
   Make sure the page loads, the API call works, and the feature does not immediately break when clicked.
6. Make a **commit**.
   A commit means a saved checkpoint with a message describing what you changed.
7. **Push** your branch.
   Push means upload your branch and commits from your computer to GitHub.
8. Open a **PR**.
   PR means pull request. It is a GitHub page asking the team to review your branch and merge it into `main`.
9. Wait for review and fix comments.
   If someone says a support file or backend file is missing, do not argue with the guide. Add the missing dependency and update the PR.
10. **Merge** only after approval.
   Merge means combining your finished branch into the team’s shared branch, usually `main`.

### Minimum Git Flow

If you do not know what to do after finishing a packet, the safe order is:

1. `git checkout -b packet-name`
2. Build the packet
3. `git status`
4. `git add` the files you changed
5. `git commit -m "Short description of the packet work"`
6. `git push -u origin packet-name`
7. Open a PR on GitHub
8. Get it reviewed
9. Merge the PR

If any of those words are unclear, read the glossary right below before touching the repo.

## Glossary For Noobs

- `Packet`: one small feature assignment from this guide. Treat one packet like one piece of work.
- `Primary file`: the main file doing the visible work for that packet.
- `Support file`: extra file the packet depends on. If you skip it, the packet may look half-built or silently broken.
- `Dependency`: something that must exist first, or something else that your packet needs in order to work.
- `Frontend`: the part users see and click in the browser.
- `Backend`: the PHP/API/database side that sends or saves data.
- `Branch`: your own separate line of work in git.
- `Commit`: a saved checkpoint of your work.
- `Push`: uploading your commits from your computer to GitHub.
- `PR` or `Pull Request`: a GitHub review page asking to merge your branch into the shared team branch.
- `Merge`: putting approved work into the shared branch, usually `main`.
- `main`: the team’s shared source-of-truth branch.
- `Backend-first`: build the API/database part before the page whenever the page depends on real saved data.
- `Feature flag`: an on/off switch controlled by the app, often from admin settings.
- `Route`: a page URL like `/discover` or `/messages`.
- `Route guard`: logic that blocks a page when the user is not allowed to open it.
- `Endpoint`: one backend URL like `api/messages/send.php`.
- `Payload`: the JSON data sent between frontend and backend.
- `Schema`: the database structure, meaning the tables and columns.
- `Migration`: an SQL file that changes an existing database structure.
- `Runtime`: what must exist when the app is actually running, not just what exists in git.
- `Persist`: keep something surviving restarts or redeploys instead of losing it.
- `Stub`: a temporary fake or placeholder implementation. If you use one, label it clearly so nobody mistakes it for the real feature.
- `Canonical`: the real source of truth. If the guide says a file is canonical, copy that behavior instead of inventing a second version somewhere else.
- `Build artifact`: generated output, not source code. Do not implement features inside generated files.

## Read This If Deploy Scripts Confuse You

Search tags: `deploy script`, `deploy.sh`, `deploy.bat`, `.local`, `.local/scripts`, `HiveFive-Deploy-Helper-Pack`, `Windows deploy`, `Mac deploy`, `Linux deploy`, `where do I put the scripts`, `how do I run the deploy script`

This section is here because some people do not know what folder to run the deploy helper from, what files belong in `.local/scripts`, or why Windows has both `.bat` and `.sh` files. Follow these instructions literally.

### What these scripts are

- [`/.local/scripts/deploy.sh`](https://github.com/intesarjawad/hive/blob/main/.local/scripts/deploy.sh): The real deploy helper. It shows a menu, asks where you want to run, can build the frontend, can upload to the UB server, can do backend-only selective uploads, and can also run the app locally for testing.
- [`/.local/scripts/git-helper.sh`](https://github.com/intesarjawad/hive/blob/main/.local/scripts/git-helper.sh): A separate beginner-safe Git helper. It is for branch, commit, push, pull, and PR help. It is not the deploy script.
- [`/.local/scripts/shell-ui.sh`](https://github.com/intesarjawad/hive/blob/main/.local/scripts/shell-ui.sh): Shared menu and terminal UI code used by the other two shell scripts. Do not run this file directly. It is a dependency file.
- [`/.local/scripts/HiveFive-Deploy-Helper-Pack/windows/deploy.bat`](https://github.com/intesarjawad/hive/blob/main/.local/scripts/HiveFive-Deploy-Helper-Pack/windows/deploy.bat): Windows launcher for `deploy.sh`. Use this on Windows if you are in Command Prompt, PowerShell, or double-clicking from File Explorer.
- [`/.local/scripts/HiveFive-Deploy-Helper-Pack/windows/git-helper.bat`](https://github.com/intesarjawad/hive/blob/main/.local/scripts/HiveFive-Deploy-Helper-Pack/windows/git-helper.bat): Windows launcher for `git-helper.sh`.
- [`/.local/scripts/HiveFive-Deploy-Helper-Pack/windows/README.txt`](https://github.com/intesarjawad/hive/blob/main/.local/scripts/HiveFive-Deploy-Helper-Pack/windows/README.txt): Windows-specific setup instructions.
- [`/.local/scripts/HiveFive-Deploy-Helper-Pack/mac/README.txt`](https://github.com/intesarjawad/hive/blob/main/.local/scripts/HiveFive-Deploy-Helper-Pack/mac/README.txt): Mac-specific setup instructions. Use the Mac folder, not the Linux folder, because the Mac scripts are patched for macOS terminal behavior.
- [`/.local/scripts/HiveFive-Deploy-Helper-Pack/linux/README.txt`](https://github.com/intesarjawad/hive/blob/main/.local/scripts/HiveFive-Deploy-Helper-Pack/linux/README.txt): Linux-specific setup instructions.

### Before you do anything

You need to know what the project root is.

Project root means:

- the folder you cloned from GitHub
- the folder that contains `package.json`
- the folder that contains `src/`, `api/`, and `docs/`

If you run the deploy helper from the wrong folder, it will fail with `package.json not found` or similar errors.

### Pick the correct helper-pack folder for your OS

Do not mix files from different OS folders.

- Windows users: use files from [`HiveFive-Deploy-Helper-Pack/windows`](https://github.com/intesarjawad/hive/tree/main/.local/scripts/HiveFive-Deploy-Helper-Pack/windows)
- Mac users: use files from [`HiveFive-Deploy-Helper-Pack/mac`](https://github.com/intesarjawad/hive/tree/main/.local/scripts/HiveFive-Deploy-Helper-Pack/mac)
- Linux users: use files from [`HiveFive-Deploy-Helper-Pack/linux`](https://github.com/intesarjawad/hive/tree/main/.local/scripts/HiveFive-Deploy-Helper-Pack/linux)

Do not use the Linux scripts on Mac. The Mac README explicitly says the Linux version causes terminal display bugs on macOS.

If that helper-pack folder is not already present in your local clone, open the linked GitHub folder for your OS and copy or download the files from there first.

### Where the files must go

The folder layout must look like this after setup.

Windows:

```text
HiveFive/
+-- package.json
+-- deploy.bat
+-- git-helper.bat
+-- .local/
    +-- scripts/
        +-- deploy.sh
        +-- git-helper.sh
        +-- shell-ui.sh
```

Mac and Linux:

```text
HiveFive/
+-- package.json
+-- .local/
    +-- scripts/
        +-- deploy.sh
        +-- git-helper.sh
        +-- shell-ui.sh
```

Important:

- `.local` is a hidden folder because its name starts with a dot.
- The `.sh` files belong inside `.local/scripts/`, not in the project root.
- On Windows, the `.bat` files belong in the project root, not inside `.local/scripts/`.
- Do not run scripts from inside the helper-pack folder. Copy them into your actual project first.
- If those files are already in the correct locations, stop there. Do not create a second `.local` inside `.local`, and do not make duplicate copies with names like `deploy (1).sh`.

### How to create `.local/scripts` if it does not exist

Mac or Linux terminal, from the project root:

```bash
mkdir -p .local/scripts
```

Windows PowerShell, from the project root:

```powershell
New-Item -ItemType Directory -Force .local/scripts
```

Windows Command Prompt, from the project root:

```bat
mkdir .local\scripts
```

If you cannot see `.local` after creating it:

- Windows File Explorer: `View` -> `Show` -> `Hidden items`
- Mac Finder: press `Cmd+Shift+.`
- Many Linux file managers: press `Ctrl+H`

### Exact setup steps by OS

#### Windows

1. Open the HiveFive project root in File Explorer.
2. Copy these two files from the Windows helper-pack folder into the project root:
   - `deploy.bat`
   - `git-helper.bat`
3. Create `.local/scripts` inside the project root if it does not already exist.
4. Copy these three files from the Windows helper-pack folder into `.local/scripts/`:
   - `deploy.sh`
   - `git-helper.sh`
   - `shell-ui.sh`
5. Stop and verify the folder tree matches the Windows example above before trying to run anything.

If you prefer terminal commands instead of File Explorer, run these from the project root in PowerShell:

```powershell
Copy-Item .local/scripts/HiveFive-Deploy-Helper-Pack/windows/deploy.bat ./deploy.bat
Copy-Item .local/scripts/HiveFive-Deploy-Helper-Pack/windows/git-helper.bat ./git-helper.bat
Copy-Item .local/scripts/HiveFive-Deploy-Helper-Pack/windows/deploy.sh .local/scripts/deploy.sh
Copy-Item .local/scripts/HiveFive-Deploy-Helper-Pack/windows/git-helper.sh .local/scripts/git-helper.sh
Copy-Item .local/scripts/HiveFive-Deploy-Helper-Pack/windows/shell-ui.sh .local/scripts/shell-ui.sh
```

#### Mac

1. Open Terminal.
2. `cd` into the HiveFive project root.
3. Run `mkdir -p .local/scripts`
4. Copy the three files from the Mac helper-pack folder into `.local/scripts/`:
   - `deploy.sh`
   - `git-helper.sh`
   - `shell-ui.sh`
5. Use the Mac versions only. Do not swap in the Linux versions.

Exact copy commands from the project root:

```bash
cp .local/scripts/HiveFive-Deploy-Helper-Pack/mac/deploy.sh .local/scripts/deploy.sh
cp .local/scripts/HiveFive-Deploy-Helper-Pack/mac/git-helper.sh .local/scripts/git-helper.sh
cp .local/scripts/HiveFive-Deploy-Helper-Pack/mac/shell-ui.sh .local/scripts/shell-ui.sh
```

#### Linux

1. Open Terminal.
2. `cd` into the HiveFive project root.
3. Run `mkdir -p .local/scripts`
4. Copy the three files from the Linux helper-pack folder into `.local/scripts/`:
   - `deploy.sh`
   - `git-helper.sh`
   - `shell-ui.sh`

Exact copy commands from the project root:

```bash
cp .local/scripts/HiveFive-Deploy-Helper-Pack/linux/deploy.sh .local/scripts/deploy.sh
cp .local/scripts/HiveFive-Deploy-Helper-Pack/linux/git-helper.sh .local/scripts/git-helper.sh
cp .local/scripts/HiveFive-Deploy-Helper-Pack/linux/shell-ui.sh .local/scripts/shell-ui.sh
```

### The exact folder you must run commands from

Run deploy commands from the project root only.

That means the terminal should currently be in the folder that contains:

- `package.json`
- `src/`
- `api/`
- `.local/`

Do not run the command from:

- inside `.local/scripts/`
- inside `HiveFive-Deploy-Helper-Pack/`
- some random Downloads/Desktop folder where you copied the helper pack

### Exact commands to run

#### Windows

From the project root in Command Prompt or PowerShell:

```bat
deploy.bat
```

For Git helper:

```bat
git-helper.bat
```

You can also double-click `deploy.bat` or `git-helper.bat` in File Explorer, but running from a terminal is better because you can read the error messages if something goes wrong.

If you are using Git Bash on Windows, this also works from the project root:

```bash
bash .local/scripts/deploy.sh
bash .local/scripts/git-helper.sh
```

#### Mac

From the project root:

```bash
bash .local/scripts/deploy.sh
bash .local/scripts/git-helper.sh
```

#### Linux

From the project root:

```bash
bash .local/scripts/deploy.sh
bash .local/scripts/git-helper.sh
```

Use `bash .local/scripts/deploy.sh`, not `./deploy.sh`, unless you already changed permissions with `chmod +x`.

### What the deploy helper actually does after you launch it

When you run the deploy helper, it is not just blindly uploading files. The script walks you through a menu.

In plain English, it can do these jobs:

- `Local run`: use your current code on your own machine for local testing.
- `Cattle deploy`: upload the app to the UB server when your team is actually ready.
- `Use current local files`: deploy exactly what is on your computer, including uncommitted local changes.
- `Selective file upload`: upload only chosen backend files from `api/`. This is only for backend/PHP changes. It skips frontend build/install steps.
- `Compose multiple branches/PRs`: make a temporary merged integration snapshot on top of `dev` so you can test several branches together without permanently merging them first.

If you choose a normal deploy path, the script can also:

- ask for your UBIT
- pull or use a chosen branch
- run `npm install` if needed
- run `npm run build`
- upload the built frontend and deployable backend files to the server

### What each helper script is for

- `deploy.sh`: the main deploy and local-run menu. Use this when you want to test locally or upload to the UB server.
- `deploy.bat`: Windows-only launcher that finds Git Bash and forwards into `.local/scripts/deploy.sh`. Windows users should usually run this instead of typing the `.sh` file directly in Command Prompt.
- `git-helper.sh`: the beginner-safe Git workflow helper. Use this when you need help creating a task branch, staging files, committing, pushing, pulling, or opening a PR.
- `git-helper.bat`: Windows-only launcher for `git-helper.sh`.
- `shell-ui.sh`: shared menu code used by both helpers. This is not a tool you launch by itself.

### Most common ways people mess this up

- They put `deploy.sh` in the project root instead of `.local/scripts/`.
- They put `deploy.bat` inside `.local/scripts/` instead of the project root.
- They run the script from the wrong folder, so the script cannot find `package.json`.
- They try to run the helper directly from the helper-pack folder instead of copying it into the actual HiveFive project.
- They use the Linux scripts on Mac.
- They use `./deploy.sh` and then panic about `Permission denied` instead of just running `bash .local/scripts/deploy.sh`.
- They try to deploy without UB VPN and then wonder why authentication/upload fails.
- They accidentally commit local helper files. `.local/` is ignored already, but the Windows root-level `.bat` files should also stay untracked.

### Safe habit before every commit

Run this from the project root:

```bash
git status
```

If you see local helper scripts in the commit list, stop and unstage them before committing.

## How To Avoid Shipping A Fake-Complete Feature

If you want to avoid submitting something that only looks done, do all of these before opening a PR:

1. Check that you built the packet’s primary files.
2. Check that you also built the packet’s support files.
3. Check that the page and API both work together.
4. Check that the packet still works after refresh, not just right after clicking around.
5. Check that any required folder, table, or migration also exists.
6. Check that you did not only build the frontend while leaving the backend missing.
7. Check that you did not only build the backend while leaving the UI disconnected.

If you skipped one of those, your packet is probably not actually complete.

## Suggested Build Waves

- `Wave 0`: `P00` to `P04`
- `Wave 1`: `P05` to `P10`
- `Wave 2`: `P11` to `P24`
- `Wave 3`: `P25` to `P40`
- `Wave 4`: `P41` to `P47`

## Global baseline files

These are the files that show up repeatedly because almost every real feature leans on them:

- [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
- [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
- [`src/lib/data.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/data.ts): Shared mock-data source frontend packets should use to render real-looking UI states before backend routes are live. Do not create ad hoc fake arrays in each page.
- [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Reference route map for navigation targets, query params, and guard behavior. Do not copy the whole file into HiveFive; port only the routes this packet actually needs.
- [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome that exposes entry points into this packet and carries the shared account and notification menus users expect.
- [`src/lib/features.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/features.ts): Feature-flag loader that keeps this packet aligned with backend toggles so hidden or disabled features behave like live Hive.
- [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
- [`api/db_config.example.php`](https://github.com/intesarjawad/hive/blob/main/api/db_config.example.php): Template PDO database config developers copy to db_config.php locally.
- [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

---

## P00. Start the App and Deploy It

**Broader Feature:** `Foundation & Deployment`
**Search Tags:** `runtime, deployment, app shell, vite, entrypoint, bootstrap`
**What This Feature Does:** Gets the app booting, the API basics working, and deployment set up so every later packet can run.

Build this first. Everything else sits on top of it.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/main.tsx`, `src/App.tsx`, and `src/routes.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **If the backend is not ready yet:** You can still build and show this screen. Use `src/lib/data.ts` or the existing `mock_data` path so the PM can see the UI before the real API is finished.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/lib/data.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`index.html`](https://github.com/intesarjawad/hive/blob/main/index.html): Vite HTML shell that mounts the React app in development.
  - [`src/main.tsx`](https://github.com/intesarjawad/hive/blob/main/src/main.tsx): Frontend bootstrap entry that renders App into root.
  - [`src/App.tsx`](https://github.com/intesarjawad/hive/blob/main/src/App.tsx): Application root with providers, route provider, and toaster.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Reference route contract for navigation targets, query params, and guard behavior. Build the HiveFive router from the needed packet routes; do not paste Hive's full router into HiveFive.
  - [`src/vite-env.d.ts`](https://github.com/intesarjawad/hive/blob/main/src/vite-env.d.ts): TypeScript ambient types for Vite and import.meta.env support.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/data.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/data.ts): Shared mock-data source frontend packet owners can use to visualize components and flows before the matching backend routes are connected.
  - [`src/index.css`](https://github.com/intesarjawad/hive/blob/main/src/index.css): App-wide CSS entry that layers typography, utility overrides, and global UI fixes needed before any route renders correctly.
  - [`src/styles/globals.css`](https://github.com/intesarjawad/hive/blob/main/src/styles/globals.css): Foundational design-token file defining the color, spacing, and theme variables that every page and shared component assumes already exist.
  - [`vite.config.ts`](https://github.com/intesarjawad/hive/blob/main/vite.config.ts): Vite config with React SWC plugin, aliases, build output, and API proxy.
  - [`package.json`](https://github.com/intesarjawad/hive/blob/main/package.json): Node package manifest, dependency graph, and npm scripts.
  - [`package-lock.json`](https://github.com/intesarjawad/hive/blob/main/package-lock.json): Exact dependency lockfile for reproducible frontend installs.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/index.php`, `api/helpers.php`, and `api/db_config.example.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **Extra runtime warning:** Files like `api/db_config.example.php`, `Dockerfile`, and startup scripts may be different in HiveFive for deployment reasons. Only copy the exact part this packet needs.
> - **What the other files mean:** `Dockerfile`, `docker-entrypoint.sh`, and `.dockerignore` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/index.php`](https://github.com/intesarjawad/hive/blob/main/api/index.php): API root entry used as the lightweight backend landing or sanity-check endpoint.
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`api/db_config.example.php`](https://github.com/intesarjawad/hive/blob/main/api/db_config.example.php): Template PDO database config developers copy to db_config.php locally.
  - [`api/mail.php`](https://github.com/intesarjawad/hive/blob/main/api/mail.php): Mail sender and template helper behind this flow; without it users never actually receive verification or reset emails.
- Required support files:
  - [`Dockerfile`](https://github.com/intesarjawad/hive/blob/main/Dockerfile): Deployment build recipe that compiles the frontend and assembles the PHP runtime exactly the way the current app is shipped.
  - [`docker-entrypoint.sh`](https://github.com/intesarjawad/hive/blob/main/docker-entrypoint.sh): Container startup script that writes runtime database config, prepares runtime directories, and starts the app server in deployed builds.
  - [`.dockerignore`](https://github.com/intesarjawad/hive/blob/main/.dockerignore): Excludes heavy and unneeded files from Docker build context.
  - [`.gitignore`](https://github.com/intesarjawad/hive/blob/main/.gitignore): Git ignore rules for secrets, dependencies, and build outputs.

### Storage, data, and behavior

- Upload roots expected by the app:
  - [`api/uploads/profiles`](https://github.com/intesarjawad/hive/tree/main/api/uploads/profiles): Runtime upload directory for processed avatar images used by onboarding and settings.
  - [`api/uploads/services`](https://github.com/intesarjawad/hive/tree/main/api/uploads/services): Runtime upload directory for service listing media uploaded by providers.
  - [`api/uploads/messages_private`](https://github.com/intesarjawad/hive/tree/main/api/uploads/messages_private): Runtime-only directory where private message attachments are stored outside the public web root.
- `api/uploads/messages_private` is part of the current runtime contract even though it is not tracked in git like the other two upload folders.
- Mirror builders should not start feature work until the app boots, routes load, and authenticated API calls include credentials correctly.

---

## P01. Database Setup and Upload Folders

**Broader Feature:** `Database & Storage`
**Search Tags:** `database, schema, migrations, seed, filesystem, uploads`
**What This Feature Does:** Sets up the database, follow-up migrations, seed data, and upload folders the app expects.

This packet is the data layer contract for the rest of the mirror build.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** This packet usually does **not** mean making a brand-new page. Your job is to make the small frontend pieces this packet needs work in HiveFive.
> - **Route note:** This packet usually does not need its own route. Do not create extra route code unless this packet clearly needs a new screen in HiveFive.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **If the backend is not ready yet:** You can still build and show this screen. Use `src/lib/data.ts` or the existing `mock_data` path so the PM can see the UI before the real API is finished.
> - **What the other files mean:** `src/lib/constants.ts` and `src/lib/data.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- There is no standalone page for this packet.
- Still-required frontend alignment files:
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Core enums plus date and format helpers shared across packets so frontend labels and parsed timestamps keep matching backend payloads.
  - [`src/lib/data.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/data.ts): Shared mock-data contract frontend packet owners should use to visualize Discover services, requests, sidebars, and other UI states until backend routes are wired.
- Why those matter:
  - categories, enums, and demo assumptions in the frontend need to match the SQL layer.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `sql/setup.sql`, `sql/seed.sql`, and `sql/migrate-system-settings.sql`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **Extra runtime warning:** Files like `api/db_config.example.php`, `Dockerfile`, and startup scripts may be different in HiveFive for deployment reasons. Only copy the exact part this packet needs.
> - **What the other files mean:** `api/db_config.example.php` and `api/helpers.php` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.
  - [`sql/seed.sql`](https://github.com/intesarjawad/hive/blob/main/sql/seed.sql): Large development dataset seeder for users, services, requests, and orders.
  - [`sql/migrate-system-settings.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-system-settings.sql): Migration script introducing system_settings feature-toggle table.
  - [`sql/migrate-profile-images.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-profile-images.sql): Migration that adds or normalizes profile-image storage fields on the users table.
  - [`sql/migrate-order-units-and-adjustments.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-order-units-and-adjustments.sql): Migration that adds unit-priced order fields and order-adjustment workflow support.
  - [`sql/migrate-order-tips.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-order-tips.sql): Migration that adds storage for post-completion tipping behavior in the order system.
  - [`sql/migrate-message-attachments.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-message-attachments.sql): Migration that adds tables or columns required for message attachment upload and retrieval.
- Required support files:
  - [`api/db_config.example.php`](https://github.com/intesarjawad/hive/blob/main/api/db_config.example.php): Template PDO database config developers copy to db_config.php locally.
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.

### Storage, data, and behavior

- Run `setup.sql` first.
- Then run the migrations.
- Then run `seed.sql` only where seeded/demo data is desired.
- If the mirror deployment needs messaging attachments to survive, create and persist `api/uploads/messages_private` from day one instead of waiting until the messaging packet.

---

## P02. Shared UI Pieces and Helper Code

**Broader Feature:** `Shared UI System`
**Search Tags:** `shared ui, design system, primitives, utility components, styling`
**What This Feature Does:** Gives the app its shared UI pieces, styling, and helper code so later packets do not rebuild them from scratch.

This is the “do not make every branch reinvent these” packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/styles/globals.css`, `src/index.css`, and `src/pages/DesignSystem.tsx`. Start there before touching anything else.
> - **Route note:** This packet usually does not need its own route. Do not create extra route code unless this packet clearly needs a new screen in HiveFive.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/constants.ts`, `src/lib/assetUrl.ts`, and `src/lib/fileUploads.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/styles/globals.css`](https://github.com/intesarjawad/hive/blob/main/src/styles/globals.css): Foundational design-token file defining the color, spacing, and theme variables that every page and shared component assumes already exist.
  - [`src/index.css`](https://github.com/intesarjawad/hive/blob/main/src/index.css): App-wide CSS entry that layers typography, utility overrides, and global UI fixes needed before any route renders correctly.
  - [`src/pages/DesignSystem.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/DesignSystem.tsx): Internal visual reference page showing the reusable primitives and patterns other packets are expected to copy consistently.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Core avatar renderer with image fallback, initials fallback, online-status dot, and cosmetic frame support.
  - [`src/components/CategoryBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CategoryBadge.tsx): Category badge component with optional discover-link behavior.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Text-limit helper that makes the current min or max rules visible before submit so this packet matches Hive's form UX.
  - [`src/components/CurrencyInput.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CurrencyInput.tsx): Numeric HiveCoin input that enforces money formatting and safe parsing before this packet submits prices, budgets, tips, or transfers.
  - [`src/components/CustomSelect.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CustomSelect.tsx): Reusable select and dropdown control used across onboarding, discover filters, and settings forms.
  - [`src/components/DatePicker.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/DatePicker.tsx): Calendar picker used for booking, proposal, and deadline workflows.
  - [`src/components/EmptyState.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/EmptyState.tsx): Standard no-results or error block that keeps this packet from turning into a blank broken-looking screen when API data is empty.
  - [`src/components/ProfileBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProfileBadge.tsx): Renders equipped badge cosmetics anywhere this packet shows user identity, headers, or summary cards.
  - [`src/components/ServiceCard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ServiceCard.tsx): Reusable service card with thumbnail/media fallback behavior on Discover services tab.
  - [`src/components/StatusBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/StatusBadge.tsx): Renders standardized status pills so this packet uses the same wording and color rules as the rest of the app.
  - [`src/components/TimePicker.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/TimePicker.tsx): 12-hour time picker component for scheduling workflows.
  - [`src/components/UniversitySearch.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/UniversitySearch.tsx): Searchable university picker used when this packet needs a normalized campus value instead of free-text school input.
  - [`src/components/ui/*`](https://github.com/intesarjawad/hive/tree/main/src/components/ui): Reusable ShadCN or Radix-style primitive component directory used across forms, menus, dialogs, and layout controls.
- Required support files:
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Core enums plus date and format helpers shared across packets so frontend labels and parsed timestamps keep matching backend payloads.
  - [`src/lib/assetUrl.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/assetUrl.ts): Resolves uploaded-versus-fallback asset paths so this packet can render media correctly across local, deployed, and proxy runtime environments.
  - [`src/lib/fileUploads.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/fileUploads.ts): Client-side upload rule enforcer for MIME checks, size limits, preview data URLs, and request payload preparation.
  - [`src/lib/inAppAlerts.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/inAppAlerts.ts): Browser-side alert helper that decides when to play sounds, suppress duplicate toasts, and refresh in-app attention state for this packet.
  - [`src/components/figma/ImageWithFallback.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/figma/ImageWithFallback.tsx): Image wrapper that swaps to safe fallback rendering when uploaded or static assets fail to load.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are the backend support files listed below. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **What the other files mean:** `api/helpers.php` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- There is no dedicated UI-kit endpoint.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
- Why this still matters:
  - many of these components expect specific response shapes, especially cosmetics, status values, uploaded media paths, and date/time formats.

### Storage, data, and behavior

- If a dev is only assigned one later feature packet, they still need the relevant shared components from this packet.
- `Avatar.tsx` is especially important because it now preserves the initials fallback until the image fully loads and it also respects cosmetic frames.

---

## P03. App Layout and Login State

**Broader Feature:** `Auth Foundation`
**Search Tags:** `app shell, session, auth provider, me endpoint, logout, refresh user`
**What This Feature Does:** Loads the signed-in user, keeps session state in sync, and handles basic login-state behavior for the whole app.

This packet defines the canonical logged-in user object for the whole app.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/App.tsx`, `src/lib/auth.ts`, and `src/lib/api.ts`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/routes.tsx`, `src/components/AccountStatusGate.tsx`, and `src/components/ProtectedRoute.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/App.tsx`](https://github.com/intesarjawad/hive/blob/main/src/App.tsx): Application root with providers, route provider, and toaster.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
- Required support files:
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.
  - [`src/components/AccountStatusGate.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/AccountStatusGate.tsx): Top-level gate blocking banned or suspended accounts across protected routes.
  - [`src/components/ProtectedRoute.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProtectedRoute.tsx): Authentication wrapper for private routes with not-found fallback.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/auth/me.php`, `api/auth/logout.php`, and `api/helpers.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/cron/auto-resolve.php`, `sql/setup.sql`, and `sql/migrate-system-settings.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php): Session-bootstrap endpoint the app shell calls to hydrate the current user, permissions, cosmetics, notification preferences, and impersonation state.
  - [`api/auth/logout.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/logout.php): Session-destroying logout endpoint this packet uses when the user signs out or is forced out of the current auth state.
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
- Required support files:
  - [`api/cron/auto-resolve.php`](https://github.com/intesarjawad/hive/blob/main/api/cron/auto-resolve.php): Backend maintenance job for timed auto-complete and dispute auto-resolution.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.
  - [`sql/migrate-system-settings.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-system-settings.sql): Migration script introducing system_settings feature-toggle table.

### Storage, data, and behavior

- Tables this packet relies on:
  - `users`
  - `shop_items`
  - `system_settings`
- Current behavior to preserve:
  - `me.php` returns role, cosmetics, notification preferences, and `impersonating`
  - `refreshUser()` is the normal way the frontend rehydrates current user state
  - `me.php` currently triggers `api/cron/auto-resolve.php` as a side effect

---

## P04. Route Guards, Nav, Feature Flags, and View-As

**Broader Feature:** `Global App Shell`
**Search Tags:** `protected routes, navbar, feature flags, impersonation, route guards`
**What This Feature Does:** Controls who can open each route, shows the signed-in app shell, and handles feature flags plus View As behavior.

This is the global protected-app chrome packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/routes.tsx`, `src/components/ProtectedRoute.tsx`, and `src/components/AccountStatusGate.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/auth.ts`, `src/lib/api.ts`, and `src/lib/constants.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map wiring protected pages, feature-gated routes, and not-found behavior; if this file is incomplete the app shell cannot reach this packet correctly.
  - [`src/components/ProtectedRoute.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProtectedRoute.tsx): Authentication wrapper for private routes with not-found fallback.
  - [`src/components/AccountStatusGate.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/AccountStatusGate.tsx): Top-level gate blocking banned or suspended accounts across protected routes.
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome that exposes entry points into this packet and carries the shared account and notification menus users expect.
  - [`src/components/FeatureRoute.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/FeatureRoute.tsx): Route-level feature gate that blocks access when the corresponding backend flag is turned off.
  - [`src/components/ImpersonationBanner.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ImpersonationBanner.tsx): Global banner shown during admin impersonation so the acting admin can always see and exit the borrowed session.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Core avatar renderer used across the signed-in shell for menus, identity chips, and cosmetic-aware fallback state.
  - [`src/pages/NotFound.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/NotFound.tsx): Catch-all 404 route component for unknown paths.
  - [`src/lib/features.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/features.ts): Feature-flag loader that keeps this packet aligned with backend toggles so hidden or disabled features behave like live Hive.
  - [`src/lib/inAppAlerts.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/inAppAlerts.ts): Browser-side alert helper that decides when to play sounds, suppress duplicate toasts, and refresh in-app attention state for this packet.
- Required support files:
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and date helpers this packet relies on so categories, statuses, prices, and timestamps stay aligned with backend payloads.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/settings/public.php`, `api/notifications/list.php`, and `api/notifications/read.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/migrate-system-settings.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/settings/public.php`](https://github.com/intesarjawad/hive/blob/main/api/settings/public.php): Public settings read endpoint that sends the feature flags the frontend uses to decide whether this packet should render at all.
  - [`api/notifications/list.php`](https://github.com/intesarjawad/hive/blob/main/api/notifications/list.php): Notification inbox read endpoint that supplies the bell dropdown and unread counter for this packet.
  - [`api/notifications/read.php`](https://github.com/intesarjawad/hive/blob/main/api/notifications/read.php): Notification mutation endpoint that clears unread state so bell counts and inbox state stay in sync.
  - [`api/admin/stop-impersonate.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/stop-impersonate.php): Admin endpoint that ends impersonation and restores admin context.
  - [`api/auth/logout.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/logout.php): Session-destroying logout endpoint this packet uses when the user signs out or is forced out of the current auth state.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/migrate-system-settings.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-system-settings.sql): Migration script introducing system_settings feature-toggle table.

### Storage, data, and behavior

- Feature flags currently gate:
  - `requests`
  - `shop`
  - `messaging`
  - `leaderboard`
  - `docs`
  - `mock_data`
- Current behavior to preserve:
  - protected routes show a 404-style shell instead of redirecting to `/login`
  - banned and suspended blocks are skipped for admins and impersonated sessions
  - the nav polls notifications every `15s`
  - the nav shifts down during impersonation because `ImpersonationBanner.tsx` is active

---

## P05. Sign Up

**Broader Feature:** `Authentication`
**Search Tags:** `signup, register, create account, edu email, verification handoff`
**What This Feature Does:** Lets a student create an account, checks the signup fields, and signs them in as unverified.

This is the create-account packet, not the whole auth system.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Signup.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/lib/universities.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Signup.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Signup.tsx): Registration form with validation and edu-email constraints.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/universities.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/universities.ts): Canonical frontend map of supported universities and domains used when this packet validates or auto-fills campus identity.
  - [`src/components/UniversitySearch.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/UniversitySearch.tsx): Searchable university picker used when this packet needs a normalized campus value instead of free-text school input.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Text-limit helper that makes the current min or max rules visible before submit so this packet matches Hive's form UX.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/auth/signup.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php`, `api/mail.php`, and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/auth/signup.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/signup.php): Auth endpoint that creates account, validates edu email, hashes password, and issues verify token.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`api/mail.php`](https://github.com/intesarjawad/hive/blob/main/api/mail.php): Mail sender and template helper behind this flow; without it users never actually receive verification or reset emails.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Tables this packet relies on:
  - `users`
  - `tokens`
  - `rate_limits`
- Current behavior to preserve:
  - signup derives username from the email local-part
  - signup splits full name into first/last
  - signup creates a logged-in but unverified session immediately
  - verification is a six-digit code flow, not a magic-link-only flow

---

## P06. Login, Remember Me, and Reactivation

**Broader Feature:** `Authentication`
**Search Tags:** `login, remember me, session, ban, suspension, reactivation`
**What This Feature Does:** Logs users in, handles remember me, checks account status, and revives soft-deactivated accounts when allowed.

This is the sign-in packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Login.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/lib/constants.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Login.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Login.tsx): Sign-in form and account access handling UI.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and date helpers this packet relies on so categories, statuses, prices, and timestamps stay aligned with backend payloads.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Text-limit helper that makes the current min or max rules visible before submit so this packet matches Hive's form UX.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/auth/login.php` and `api/auth/me.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/auth/login.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/login.php): Auth endpoint that authenticates user, enforces bans, and initializes session cookie.
  - [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php): Canonical session payload endpoint this packet uses to refresh current-user fields after backend changes.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Tables this packet relies on:
  - `users`
  - `tokens`
  - `rate_limits`
- Current behavior to preserve:
  - remember-me extends cookie lifetime
  - successful login routes to `/verify`, `/onboarding`, or `/discover` depending on state
  - deactivated accounts are reactivated on successful login by clearing `deactivated_at`
  - suspended users get a date-based message in the UI

---

## P07. Verify Email

**Broader Feature:** `Authentication`
**Search Tags:** `verify email, otp, resend code, annual reverification, welcome bonus`
**What This Feature Does:** Confirms email ownership, supports resend, and covers the yearly re-check path used at login.

Do not merge this into signup in the mirror plan. It has its own backend rules.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/EmailVerification.tsx` and `src/pages/Login.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/components/CharacterLimitHint.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/EmailVerification.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/EmailVerification.tsx): OTP verification flow after signup, email change, or reverification.
  - [`src/pages/Login.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Login.tsx): Sign-in form and account access handling UI.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Text-limit helper that makes the current min or max rules visible before submit so this packet matches Hive's form UX.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/auth/verify.php`, `api/auth/resend-verification.php`, and `api/auth/login.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/mail.php`, `api/helpers.php`, and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/auth/verify.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/verify.php): Auth endpoint that confirms email code and grants one-time welcome bonus.
  - [`api/auth/resend-verification.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/resend-verification.php): Auth endpoint that rotates and resends verification token for current user.
  - [`api/auth/login.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/login.php): Auth endpoint that authenticates user, enforces bans, and initializes session cookie.
- Required support files:
  - [`api/mail.php`](https://github.com/intesarjawad/hive/blob/main/api/mail.php): Mail sender and template helper behind this flow; without it users never actually receive verification or reset emails.
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Tables this packet relies on:
  - `tokens`
  - `users`
  - `transactions`
  - `system_settings`
- Current behavior to preserve:
  - verification is six-digit OTP style
  - login can force annual reverification
  - welcome bonus is `10 HiveCoin`
  - that bonus is granted once, not every time a user re-verifies

---

## P08. Forgot and Reset Password

**Broader Feature:** `Authentication`
**Search Tags:** `forgot password, reset password, reset code, password recovery`
**What This Feature Does:** Lets users ask for a reset code and set a new password without leaking whether an email exists.

This packet is intentionally independent from signup/login.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/ForgotPassword.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/components/CharacterLimitHint.tsx`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/ForgotPassword.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ForgotPassword.tsx): Two-step reset flow for requesting code and setting new password.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Text-limit helper that makes the current min or max rules visible before submit so this packet matches Hive's form UX.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/auth/forgot-password.php` and `api/auth/reset-password.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php`, `api/mail.php`, and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/auth/forgot-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/forgot-password.php): Auth endpoint that requests password-reset token with enumeration-safe response.
  - [`api/auth/reset-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/reset-password.php): Auth endpoint that verifies reset token or bypass code and sets new password.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`api/mail.php`](https://github.com/intesarjawad/hive/blob/main/api/mail.php): Mail sender and template helper behind this flow; without it users never actually receive verification or reset emails.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Tables this packet relies on:
  - `tokens`
  - `users`
  - `rate_limits`
  - `system_settings`
- Current behavior to preserve:
  - forgot-password always returns the same success message
  - reset-password accepts the code flow, not a direct link-only flow
  - there is a bypass-code path wired through `system_settings`

---

## P09. First-Time Setup and Avatar Upload

**Broader Feature:** `Onboarding & Identity`
**Search Tags:** `onboarding, avatar upload, first run, profile setup, major, year, bio`
**What This Feature Does:** Finishes the first-time profile setup flow and connects avatar upload.

This packet handles first-run profile completion and reusable profile photo upload.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Onboarding.tsx`, `src/components/Avatar.tsx`, and `src/components/CustomSelect.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Onboarding.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Onboarding.tsx): Post-signup profile completion wizard for avatar and profile fields.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Core avatar renderer with image fallback, initials fallback, online-status dot, and cosmetic frame support.
  - [`src/components/CustomSelect.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CustomSelect.tsx): Filter dropdown control used for both Discover tabs.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Text-limit helper that makes the current min or max rules visible before submit so this packet matches Hive's form UX.
  - [`src/lib/fileUploads.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/fileUploads.ts): Client-side upload rule enforcer for MIME checks, size limits, preview data URLs, and request payload preparation.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/users/onboarding.php`, `api/users/upload-avatar.php`, and `api/users/update.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/migrate-profile-images.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/users/onboarding.php`](https://github.com/intesarjawad/hive/blob/main/api/users/onboarding.php): First-run onboarding endpoint that saves initial profile fields and marks onboarding complete.
  - [`api/users/upload-avatar.php`](https://github.com/intesarjawad/hive/blob/main/api/users/upload-avatar.php): User endpoint that validates, crops, uploads avatar image, and stores the canonical profile-image path.
  - [`api/users/update.php`](https://github.com/intesarjawad/hive/blob/main/api/users/update.php): Primary user/profile mutation endpoint used for editable profile fields, notification settings, and cosmetic equip state.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Shared backend helper layer that also contains university and domain normalization reused across auth and profile endpoints.
  - [`sql/migrate-profile-images.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-profile-images.sql): Migration that adds or normalizes profile-image storage fields on the users table.

### Storage, data, and behavior

- Filesystem this packet relies on:
  - [`api/uploads/profiles`](https://github.com/intesarjawad/hive/tree/main/api/uploads/profiles): Runtime upload directory for processed avatar images used by onboarding and settings.
- Columns this packet relies on:
  - `users.profile_image`
  - `users.onboarding_done`
- Current behavior to preserve:
  - already-onboarded users are redirected away from `/onboarding`
  - uploaded avatars are normalized toward a square `400x400` result
  - replacing an avatar cleans up the old file

---

## P10. School and Email-Domain Helpers

**Broader Feature:** `Identity Helpers`
**Search Tags:** `university, edu domain, domain mapping, identity helper, campus inference`
**What This Feature Does:** Keeps school and email-domain data consistent across signup, login, onboarding, settings, and profiles.

This packet exists because university handling leaks into signup, login, settings, onboarding, and profiles.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/lib/universities.ts` and `src/components/UniversitySearch.tsx`. Start there before touching anything else.
> - **Route note:** This packet usually does not need its own route. Do not create extra route code unless this packet clearly needs a new screen in HiveFive.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/components/CharacterLimitHint.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/lib/universities.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/universities.ts): Canonical frontend map of supported universities and domains used when this packet validates or auto-fills campus identity.
  - [`src/components/UniversitySearch.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/UniversitySearch.tsx): Searchable university picker used when this packet needs a normalized campus value instead of free-text school input.
- Required support files:
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Reusable text-length helper available to any identity form that needs extra description or note fields.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/helpers.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **What the other files mean:** `api/auth/signup.php`, `api/auth/login.php`, and `api/auth/me.php` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Shared backend helper layer that also contains university and domain normalization reused across auth and profile endpoints.
- Required support consumers:
  - [`api/auth/signup.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/signup.php): Auth endpoint that creates account, validates edu email, hashes password, and issues verify token.
  - [`api/auth/login.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/login.php): Auth endpoint that authenticates user, enforces bans, and initializes session cookie.
  - [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php): Canonical session payload endpoint this packet uses to refresh current-user fields after backend changes.
  - [`api/auth/change-email.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/change-email.php): Settings security endpoint that changes the email address, re-runs domain checks, and forces reverification.
  - [`api/users/onboarding.php`](https://github.com/intesarjawad/hive/blob/main/api/users/onboarding.php): First-run onboarding endpoint that saves initial profile fields and marks onboarding complete.
  - [`api/users/update.php`](https://github.com/intesarjawad/hive/blob/main/api/users/update.php): Primary user/profile mutation endpoint used for editable profile fields, notification settings, and cosmetic equip state.
  - [`api/users/profile.php`](https://github.com/intesarjawad/hive/blob/main/api/users/profile.php): User profile read endpoint used by profile pages, chat headers, and internal link previews.

### Storage, data, and behavior

- Columns this packet relies on:
  - `users.email`
  - `users.university`
- Current behavior to preserve:
  - backend supports subdomains of known university domains
  - frontend helper is stricter and only matches exact domains
  - mirror builders should not accidentally “simplify” this mismatch away without deciding on it deliberately

---

## P11. Settings Basics

**Broader Feature:** `Settings & Profile`
**Search Tags:** `settings, account tab, notification preferences, profile basics, identity settings`
**What This Feature Does:** Handles the main settings page for profile basics and notification choices.
**Related Packets / Adjacent Work:** `P10` for onboarding identity carryover, `P12` for security actions, `P38` for the wallet that still lives inside the same page file.
**This Packet Does Not Mean The Full Settings Flow:** If someone says they own "settings", confirm whether they mean only `P11` or the full bundle `P10 + P11 + P12 + P38`.

This is the identity/settings shell packet. Do not mix wallet into it unless you mean to.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Settings.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/components/NavBar.tsx`, `src/components/Avatar.tsx`, and `src/components/UniversitySearch.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Settings.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Settings.tsx): Tabbed settings page that currently contains account basics, notification preferences, profile editing, and the still-embedded wallet UI.
- Required support files:
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome that exposes entry points into this packet and carries the shared account and notification menus users expect.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Shared avatar renderer used in settings for current-profile photo display, upload preview, and initials fallback.
  - [`src/components/UniversitySearch.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/UniversitySearch.tsx): Searchable university picker used when this packet needs a normalized campus value instead of free-text school input.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Inline text-limit helper for longer settings fields so users see remaining space without a noisy always-on counter.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/universities.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/universities.ts): Canonical frontend map of supported universities and domains used when this packet validates or auto-fills campus identity.
  - [`src/lib/fileUploads.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/fileUploads.ts): Client-side upload rule enforcer for MIME checks, size limits, preview data URLs, and request payload preparation.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/users/update.php`, `api/users/upload-avatar.php`, and `api/auth/me.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/migrate-profile-images.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/users/update.php`](https://github.com/intesarjawad/hive/blob/main/api/users/update.php): Primary profile/settings mutation endpoint for editable account basics, bio, university, and notification-preference fields.
  - [`api/users/upload-avatar.php`](https://github.com/intesarjawad/hive/blob/main/api/users/upload-avatar.php): User endpoint that validates, crops, uploads avatar image, and stores URL.
  - [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php): Canonical session payload endpoint this packet uses to refresh current-user fields after backend changes.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/migrate-profile-images.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-profile-images.sql): Migration that adds or normalizes profile-image storage fields on the users table.

### Storage, data, and behavior

- Current behavior to preserve:
  - admins who are not impersonating are redirected out of settings to `/admin`
  - notification preferences come from the canonical auth payload
  - if the mirror team is only implementing identity settings, they should explicitly hide or stub the wallet tab because wallet still lives in the same file

---

## P12. Settings Security

**Broader Feature:** `Settings & Security`
**Search Tags:** `change password, change email, deactivate account, logout, security settings`
**What This Feature Does:** Handles password or email changes, logout, and account deactivation inside settings.
**Related Packets / Adjacent Work:** `P10` for university/domain re-check behavior after email change, `P11` for the rest of the settings shell, `P38` for wallet actions that are visible in the same page file but are not part of this packet.
**This Packet Does Not Mean The Full Settings Flow:** If someone says they own "settings backend", that is ambiguous. Make them state whether they mean only `P12` or `P10 + P11 + P12 + P38`.

This is the credentials/deactivation packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Settings.tsx` and `src/lib/auth.ts`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/components/CharacterLimitHint.tsx`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Settings.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Settings.tsx): Tabbed settings page whose security section drives password change, email change, logout, and account deactivation actions.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Text-limit helper that makes the current min or max rules visible before submit so this packet matches Hive's form UX.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/auth/change-password.php`, `api/auth/change-email.php`, and `api/users/delete.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php`, `api/mail.php`, and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/auth/change-password.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/change-password.php): Settings security endpoint that verifies the current password and stores the new password hash.
  - [`api/auth/change-email.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/change-email.php): Settings security endpoint that changes the email address, re-runs domain checks, and forces reverification.
  - [`api/users/delete.php`](https://github.com/intesarjawad/hive/blob/main/api/users/delete.php): User endpoint that soft-deactivates account after password confirmation.
  - [`api/auth/logout.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/logout.php): Session-destroying logout endpoint this packet uses when the user signs out or is forced out of the current auth state.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`api/mail.php`](https://github.com/intesarjawad/hive/blob/main/api/mail.php): Mail sender and template helper behind this flow; without it users never actually receive verification or reset emails.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Tables this packet relies on:
  - `users`
  - `tokens`
- Current behavior to preserve:
  - change-email immediately marks the user unverified and routes them back to `/verify`
  - deactivate account sets `deactivated_at`; later login is what revives it
  - logout still flows through the shared auth provider contract

---

## P13. My Profile Page

**Broader Feature:** `Profiles`
**Search Tags:** `my profile, self profile, own profile, personal stats, self reviews, logged in profile`
**What This Feature Does:** Builds your own profile page, including your header, stats, and review history.
**Related Packets / Adjacent Work:** `P13.1` for seller controls living inside the same page file, `P14` for the other-user profile, `P14.1` for user reporting entry.
**This Packet Does Not Mean The Full Profile Flow:** If someone says they own "profile", confirm whether they mean only the self-profile shell or the broader bundle `P13 + P13.1 + P14 + P14.1`.

This is the self-profile packet only. Seller listing management is split out into `P13.1` on purpose.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/MyProfile.tsx`, `src/components/Avatar.tsx`, and `src/components/ProfileBadge.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/components/NavBar.tsx`, `src/lib/api.ts`, and `src/lib/auth.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/MyProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/MyProfile.tsx): Logged-in self-profile page shell that owns the header, stats area, and tab structure for the user's personal workspace.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Shared avatar renderer for the logged-in user's profile header and self-facing identity blocks.
  - [`src/components/ProfileBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProfileBadge.tsx): Renders equipped badge cosmetics anywhere this packet shows the current user's identity.
  - [`src/components/CategoryBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CategoryBadge.tsx): Category badge component reused where this packet renders service categories or review metadata.
  - [`src/components/StatusBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/StatusBadge.tsx): Shared status pill component reused by this packet for consistent labels and colors.
- Required support files:
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome that exposes entry points into this packet and keeps current-user identity visible.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for stats and review calls.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for owner identity, impersonation state, and refresh behavior.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and format helpers this packet uses for rating, counts, and timestamp display.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Route map this packet uses for navigation into settings, orders, and service flows.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/users/stats.php` and `api/services/reviews.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/users/stats.php`](https://github.com/intesarjawad/hive/blob/main/api/users/stats.php): User endpoint returning the self-profile stats block for earnings, spend, rating, and Buzz numbers.
  - [`api/services/reviews.php`](https://github.com/intesarjawad/hive/blob/main/api/services/reviews.php): Service endpoint that fills the self-profile reviews tab with provider review history.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base helper layer this packet depends on for session identity, response helpers, and shared profile rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the review, order, and transaction data this packet reads.

### Storage, data, and behavior

- Tables this packet relies on:
  - `reviews`
  - `orders`
  - `transactions`
  - `messages`
  - `shop_items`
- Current behavior to preserve:
  - this route is the logged-in self profile, not the public username route
  - admins are redirected to `/admin` unless they are impersonating
  - the same React page also hosts seller-workspace controls from `P13.1`, so if you are only building `P13` you must stub or hide seller controls instead of half-wiring them

---

## P13.1 Seller Tools on My Profile

**Broader Feature:** `Profiles`
**Search Tags:** `seller workspace, my listings, own services, pause listing, delete listing, seller controls`
**What This Feature Does:** Adds the seller tools on your own profile, including your listings and owner-only actions.
**Related Packets / Adjacent Work:** `P13` for the surrounding self-profile shell, `P20` for creating a new listing, `P21` for editing an existing listing.
**This Packet Does Not Mean Full Provider Service Management:** If someone says they own "my service management" or "seller backend", make them say whether they mean only `P13.1` or the full provider bundle `P19 + P20 + P21 + P13.1`.

This is not the same thing as the self-profile shell. It is the seller-management layer that currently lives inside the same page file.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/MyProfile.tsx`, `src/components/CategoryBadge.tsx`, and `src/components/StatusBadge.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/pages/EditService.tsx`, `src/pages/PostService.tsx`, and `src/lib/api.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/MyProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/MyProfile.tsx): Seller workspace UI inside the self-profile page, including owned-service cards and owner-only action buttons.
  - [`src/components/CategoryBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CategoryBadge.tsx): Category label renderer reused by owned-service cards in the seller tab.
  - [`src/components/StatusBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/StatusBadge.tsx): Status pill renderer used when owned listings show active, paused, or related state.
- Required support files:
  - [`src/pages/EditService.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/EditService.tsx): Edit target reached from seller-workspace listing actions; the full edit form belongs to `P21`, but this packet still depends on that route existing.
  - [`src/pages/PostService.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/PostService.tsx): Create-listing target the seller workspace links to when the user needs to add a new service.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Fetch wrapper this packet uses for owned-listing reads and management mutations.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet uses to enforce owner-only actions.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Route contract for the edit and create actions launched from this packet.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/services/mine.php`, `api/services/delete.php`, and `api/services/toggle-active.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/services/mine.php`](https://github.com/intesarjawad/hive/blob/main/api/services/mine.php): Service endpoint listing provider-owned services with counts and owner-specific metadata.
  - [`api/services/delete.php`](https://github.com/intesarjawad/hive/blob/main/api/services/delete.php): Service endpoint that removes a listing only when active-order rules allow it.
  - [`api/services/toggle-active.php`](https://github.com/intesarjawad/hive/blob/main/api/services/toggle-active.php): Service endpoint that pauses or unpauses owned listing visibility.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Shared backend helper layer this packet depends on for owner checks, order-block checks, and normalized responses.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the listing and order data this packet mutates.

### Storage, data, and behavior

- Tables this packet relies on:
  - `services`
  - `orders`
- Current behavior to preserve:
  - service pause and unpause happens inline from the self-profile seller tab
  - delete is blocked when active orders make removal unsafe
  - if the mirror team has not implemented edit or create flows yet, this packet should leave those entry buttons visibly disabled or explicitly stubbed instead of pretending the seller workspace is complete

---

## P14. Other People's Profile Page

**Broader Feature:** `Profiles`
**Search Tags:** `user profile, other user's profile, provider page, username route, public-facing profile`
**What This Feature Does:** Builds the page for viewing someone else's profile, services, reviews, and cosmetics.
**Related Packets / Adjacent Work:** `P14.1` for report-user entry, `P43.1` for admin impersonation launched from this surface, `P19` for service detail routes linked from the profile.
**This Packet Does Not Include Reporting Or Impersonation:** If those buttons exist, they are separate packets and cannot be used to claim this packet is already fully done.

This is the other-user profile packet only. Reporting is split into `P14.1`, and admin impersonation is split into `P43.1`.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/UserProfile.tsx`, `src/components/Avatar.tsx`, and `src/components/ProfileBadge.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/components/NavBar.tsx`, `src/lib/api.ts`, and `src/lib/auth.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/UserProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/UserProfile.tsx): Username-route profile page for browsing another user's header, listed services, review tabs, and public-facing identity details.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Shared avatar renderer for public-facing profile headers and user identity blocks.
  - [`src/components/ProfileBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProfileBadge.tsx): Renders equipped badge cosmetics on another user's profile header and identity rows.
  - [`src/components/CategoryBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CategoryBadge.tsx): Category badge component reused by listed services and service-summary elements on the profile.
  - [`src/components/CustomSelect.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CustomSelect.tsx): Filter dropdown control reused when this packet switches between tabs or filtered profile content.
- Required support files:
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome this packet depends on for identity menus and route entry points.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Fetch wrapper this packet uses for profile, services, and review reads.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet uses for viewer identity, role checks, and cosmetic payload hydration.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and format helpers this packet uses for categories, timestamps, and status text.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Route contract this packet uses for username routing and drill-down navigation.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/users/profile.php`, `api/services/list.php`, and `api/services/reviews.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/users/profile.php`](https://github.com/intesarjawad/hive/blob/main/api/users/profile.php): Username/profile read endpoint that powers the other-user profile header, visibility checks, and cosmetic data.
  - [`api/services/list.php`](https://github.com/intesarjawad/hive/blob/main/api/services/list.php): Service listing endpoint reused here for another user's visible services feed.
  - [`api/services/reviews.php`](https://github.com/intesarjawad/hive/blob/main/api/services/reviews.php): Review feed endpoint reused here for the viewed user's provider reviews.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base helper layer this packet depends on for username lookups, visibility rules, and normalized responses.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the users, services, and reviews data this packet reads.

### Storage, data, and behavior

- Current behavior to preserve:
  - this route is currently still behind `ProtectedRoute`, so it is not a truly public logged-out profile page
  - the frontend tries to hide admin profiles, but the current backend response is still imperfect for that guard
  - if reporting or impersonation is not implemented yet, those entry buttons should be hidden or stubbed because they are separate packets, not proof that the profile itself is done

---

## P14.1 Report a User

**Broader Feature:** `Trust & Safety`
**Search Tags:** `report user, report profile, report modal, pending report check, trust and safety`
**What This Feature Does:** Lets a user report another user from the profile page, including duplicate checks and the submit modal.
**Related Packets / Adjacent Work:** `P14` for the user profile surface that launches reporting, `P43` for the admin-side moderation queue that receives these reports.
**This Packet Is Only The User-Facing Report Entry:** This is just the user-side report button and modal. It does not include admin review, suspension, or View As.

This packet is only the report entry flow. Admin-side report review is handled later in `P43`.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/UserProfile.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/UserProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/UserProfile.tsx): Contains the report button, duplicate-report disabled state, reason picker, description modal, and submit flow for reporting another user.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Fetch wrapper this packet uses for pending-report checks and report submission.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet uses to know who is reporting and whether the action should be available.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Route contract this packet depends on because the report entry currently lives on the username-route profile page.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/reports/check.php` and `api/reports/create.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/reports/check.php`](https://github.com/intesarjawad/hive/blob/main/api/reports/check.php): Trust-and-safety endpoint that checks whether the viewer already has a pending report against the target user.
  - [`api/reports/create.php`](https://github.com/intesarjawad/hive/blob/main/api/reports/create.php): Trust-and-safety endpoint that submits a new user report for admin review.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Shared backend helper layer this packet depends on for identity checks, validation, and normalized response handling.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the reports table and user references this packet writes.

### Storage, data, and behavior

- Tables this packet relies on:
  - `reports`
  - `users`
- Current behavior to preserve:
  - the profile checks whether a pending report already exists before enabling repeat submission
  - report creation belongs to the user-facing profile entry surface, not the admin dashboard
  - the submit path should end in the admin reports queue from `P43`, but those admin review tools are a separate packet and should not be bundled back into this one

---

## P15. Home Page

**Broader Feature:** `Landing & Public Marketing`
**Search Tags:** `landing, homepage, featured services, public stats, marketing page`
**What This Feature Does:** Builds the public home page and its featured content blocks.

This is the marketing/unauthenticated home packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Landing.tsx` and `src/components/NavBar.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Landing.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Landing.tsx): Public homepage with featured services and platform counters.
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome that exposes entry points into this packet and carries the shared account and notification menus users expect.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/landing.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/landing.php`](https://github.com/intesarjawad/hive/blob/main/api/landing.php): Landing-page endpoint returning featured services, homepage counts, and other public marketing data blocks.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Current behavior to preserve:
  - landing is still stats-backed from the API
  - footer and CTA routes connect into `/signup`, `/login`, `/discover`, `/safety`, `/terms`, and `/privacy`

---

## P16. Discover Page Layout and Tabs

**Broader Feature:** `Discover Marketplace`
**Search Tags:** `discover shell, tabs, marketplace, services tab, requests tab`
**What This Feature Does:** Builds the main Discover page where users switch between services and requests.

This is the top-level marketplace container packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Discover.tsx`, `src/components/NavBar.tsx`, and `src/components/EmptyState.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/lib/features.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Discover.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Discover.tsx): Top-level marketplace page that owns the services and requests tab shell, URL tab sync, and responsive browse layout.
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome that exposes entry points into this packet and carries the shared account and notification menus users expect.
  - [`src/components/EmptyState.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/EmptyState.tsx): Standard no-results or error block that keeps this packet from turning into a blank broken-looking screen when API data is empty.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/features.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/features.ts): Feature-flag loader that keeps this packet aligned with backend toggles so hidden or disabled features behave like live Hive.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/discover/sidebar.php`, `api/services/list.php`, and `api/requests/list.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files this packet coordinates:
  - [`api/discover/sidebar.php`](https://github.com/intesarjawad/hive/blob/main/api/discover/sidebar.php): Discover-sidebar endpoint that returns top-provider preview rows and category summary counts for the marketplace rail.
  - [`api/services/list.php`](https://github.com/intesarjawad/hive/blob/main/api/services/list.php): Service endpoint for discover feed with filters, sort, and pagination.
  - [`api/requests/list.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/list.php): Request endpoint that browses request feed with filters and proposal counters.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Current behavior to preserve:
  - only `tab` is synced back to the URL
  - `category` is only read from the URL on initial load
  - the shell controls desktop sidebar vs mobile stacked layout

---

## P17. Discover Search and Filters

**Broader Feature:** `Discover Marketplace`
**Search Tags:** `discover filters, search, sort, sidebar, top providers, categories`
**What This Feature Does:** Makes Discover searchable and filterable.

This is the filtering/query mechanics packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Discover.tsx`, `src/components/CustomSelect.tsx`, and `src/components/Avatar.tsx`. Start there before touching anything else.
> - **Route note:** This packet usually does not need its own route. Do not create extra route code unless this packet clearly needs a new screen in HiveFive.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/lib/features.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Discover.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Discover.tsx): Discover browse page implementation for search, filter state, sorting, pagination, and sidebar-driven marketplace query UX.
  - [`src/components/CustomSelect.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CustomSelect.tsx): Reusable select control that powers Discover sort and filter dropdowns across the marketplace shell.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Shared avatar renderer used in the discover sidebar for top-provider identity, cosmetics, and image fallback state.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/features.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/features.ts): Feature-flag loader that keeps this packet aligned with backend toggles so hidden or disabled features behave like live Hive.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and date helpers this packet relies on so categories, statuses, prices, and timestamps stay aligned with backend payloads.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/services/list.php`, `api/requests/list.php`, and `api/discover/sidebar.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/services/list.php`](https://github.com/intesarjawad/hive/blob/main/api/services/list.php): Service endpoint for discover feed with filters, sort, and pagination.
  - [`api/requests/list.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/list.php): Request endpoint that browses request feed with filters and proposal counters.
  - [`api/discover/sidebar.php`](https://github.com/intesarjawad/hive/blob/main/api/discover/sidebar.php): Discover-sidebar endpoint that returns top-provider preview rows and category summary counts for the marketplace rail.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Current behavior to preserve:
  - the frontend fetches on filter/search changes and also on Search/Enter; there is no debounce
  - `school_scope=my_school` depends on the current session user
  - sidebar service categories and request categories are separate arrays
  - “Top Providers This Month” is actually computed from the last 30 days of completed orders

---

## P18. Service Cards and Service List

**Broader Feature:** `Services Marketplace`
**Search Tags:** `service cards, service list, discover services, listing grid`
**What This Feature Does:** Shows the service cards and service list, including empty states and links into service pages.

This is the services-tab feed packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Discover.tsx`, `src/components/ServiceCard.tsx`, and `src/components/EmptyState.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/assetUrl.ts`, `src/lib/api.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Discover.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Discover.tsx): Marketplace list page that renders the services tab grid and connects filters to service-card results.
  - [`src/components/ServiceCard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ServiceCard.tsx): Primary service-listing card used in marketplace grids to render media, pricing, provider info, and CTA state.
  - [`src/components/EmptyState.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/EmptyState.tsx): Standard no-results or error block that keeps this packet from turning into a blank broken-looking screen when API data is empty.
- Required support files:
  - [`src/lib/assetUrl.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/assetUrl.ts): Resolves uploaded-versus-fallback asset paths so this packet can render media correctly across local, deployed, and proxy runtime environments.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/services/list.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/services/list.php`](https://github.com/intesarjawad/hive/blob/main/api/services/list.php): Service endpoint for discover feed with filters, sort, and pagination.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Current behavior to preserve:
  - `ServiceCard.tsx` uses its own fallback chain through the service image library
  - price rendering was adjusted so the HiveCoin glyph does not break awkwardly
  - the backend already returns provider cosmetics, even though the card does not render much of them yet

---

## P19. Service Details Page

**Broader Feature:** `Services Marketplace`
**Search Tags:** `service detail, provider details, reviews, gallery, share service`
**What This Feature Does:** Builds one service page with provider info, media, reviews, and booking or message entry points.

This is the single-service read packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/ServiceDetail.tsx`, `src/components/NavBar.tsx`, and `src/components/Avatar.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/lib/assetUrl.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/ServiceDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ServiceDetail.tsx): Full service-detail page showing provider info, gallery or media, package details, reviews, and booking entry points.
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome that exposes entry points into this packet and carries the shared account and notification menus users expect.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Shared avatar renderer for the provider identity block on the single-service page.
  - [`src/components/CategoryBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CategoryBadge.tsx): Category badge component with optional discover-link behavior.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/assetUrl.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/assetUrl.ts): Resolves uploaded-versus-fallback asset paths so this packet can render media correctly across local, deployed, and proxy runtime environments.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and date helpers this packet relies on so categories, statuses, prices, and timestamps stay aligned with backend payloads.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/services/get.php` and `api/services/delete.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/services/get.php`](https://github.com/intesarjawad/hive/blob/main/api/services/get.php): Single-service read endpoint used by service detail, booking, editing, and internal link previews.
  - [`api/services/delete.php`](https://github.com/intesarjawad/hive/blob/main/api/services/delete.php): Service deletion endpoint that removes a listing only when active-order rules allow it.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Current behavior to preserve:
  - inactive services and services owned by deactivated providers are hidden from non-owners
  - the endpoint already returns images, latest reviews, provider verification freshness, average response time, and cosmetics
  - this page is one of the launch points into booking and messaging context

---

## P20. Create a Service

**Broader Feature:** `Services Marketplace`
**Search Tags:** `post service, create service, publish service, service published`
**What This Feature Does:** Lets a provider create a new service and land on the publish confirmation state.
**Related Packets / Adjacent Work:** `P19` for viewing the resulting listing, `P21` for editing or deleting an existing listing later, `P13.1` for the seller workspace that links into create and manage actions.
**This Packet Is Create Only:** This is only for making a new service. It does not include editing, hiding, reactivating, or deleting an existing one.

This is the seller create-service packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/PostService.tsx`, `src/pages/ServicePublished.tsx`, and `src/components/CustomSelect.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/lib/constants.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/PostService.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/PostService.tsx): Service publishing wizard for providers creating new listings.
  - [`src/pages/ServicePublished.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ServicePublished.tsx): Post-service success confirmation and next-action screen.
  - [`src/components/CustomSelect.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CustomSelect.tsx): Filter dropdown control used for both Discover tabs.
  - [`src/components/CurrencyInput.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CurrencyInput.tsx): Numeric HiveCoin input that enforces money formatting and safe parsing before this packet submits prices, budgets, tips, or transfers.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Inline text-limit helper for service title, description, and other long-form listing fields in the create flow.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and date helpers this packet relies on so categories, statuses, prices, and timestamps stay aligned with backend payloads.
  - [`src/lib/fileUploads.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/fileUploads.ts): Client-side upload rule enforcer for MIME checks, size limits, preview data URLs, and request payload preparation.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/services/create.php` and `api/services/price-hint.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/services/create.php`](https://github.com/intesarjawad/hive/blob/main/api/services/create.php): Service endpoint that creates listing with validation, pricing model, and image upload.
  - [`api/services/price-hint.php`](https://github.com/intesarjawad/hive/blob/main/api/services/price-hint.php): Posting-flow helper endpoint that returns category price guidance so service-create and service-edit forms show the same pricing hints as live Hive.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Filesystem this packet relies on:
  - [`api/uploads/services`](https://github.com/intesarjawad/hive/tree/main/api/uploads/services): Runtime upload directory for service listing media uploaded by providers.
- Current behavior to preserve:
  - service forms use the price-hint endpoint
  - create flow ends at `/service-published`

---

## P21. Edit or Manage Your Service

**Broader Feature:** `Services Marketplace`
**Search Tags:** `edit service, manage service, toggle active, delete service, owner tools`
**What This Feature Does:** Lets a provider edit, hide, reactivate, or delete an existing service.
**Related Packets / Adjacent Work:** `P19` for the public service detail surface, `P20` for creating new listings, `P13.1` for the seller workspace where several owner-management actions are actually launched.
**This Packet Is Existing-Service Management Only:** This is only for changing a service that already exists. It is not the full service-management flow by itself.

This is the “I already have a service and want to manage it” packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/EditService.tsx`, `src/pages/MyProfile.tsx`, and `src/components/StatusBadge.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/components/CustomSelect.tsx`, `src/components/CurrencyInput.tsx`, and `src/components/CharacterLimitHint.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/EditService.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/EditService.tsx): Provider edit flow for updating existing service listings.
  - [`src/pages/MyProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/MyProfile.tsx): Owner-facing profile workspace that exposes inline service-management actions like pause, reactivate, and delete.
  - [`src/components/StatusBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/StatusBadge.tsx): Renders standardized status pills so this packet uses the same wording and color rules as the rest of the app.
- Required support files:
  - [`src/components/CustomSelect.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CustomSelect.tsx): Filter dropdown control used for both Discover tabs.
  - [`src/components/CurrencyInput.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CurrencyInput.tsx): Numeric HiveCoin input that enforces money formatting and safe parsing before this packet submits prices, budgets, tips, or transfers.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Text-limit helper that makes the current min or max rules visible before submit so this packet matches Hive's form UX.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and date helpers this packet relies on so categories, statuses, prices, and timestamps stay aligned with backend payloads.
  - [`src/lib/fileUploads.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/fileUploads.ts): Client-side upload rule enforcer for MIME checks, size limits, preview data URLs, and request payload preparation.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/services/get.php`, `api/services/update.php`, and `api/services/toggle-active.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/services/get.php`](https://github.com/intesarjawad/hive/blob/main/api/services/get.php): Owned-service fetch endpoint used to preload existing listing data into the edit-service form.
  - [`api/services/update.php`](https://github.com/intesarjawad/hive/blob/main/api/services/update.php): Service endpoint that edits owned listing fields and cover image.
  - [`api/services/toggle-active.php`](https://github.com/intesarjawad/hive/blob/main/api/services/toggle-active.php): Service endpoint to pause or unpause owned listing visibility.
  - [`api/services/delete.php`](https://github.com/intesarjawad/hive/blob/main/api/services/delete.php): Service deletion endpoint that removes a listing only when active-order rules allow it.
  - [`api/services/price-hint.php`](https://github.com/intesarjawad/hive/blob/main/api/services/price-hint.php): Posting-flow helper endpoint that returns category price guidance so service-create and service-edit forms show the same pricing hints as live Hive.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Current behavior to preserve:
  - owners can edit, pause, reactivate, and delete services
  - service management is split across `EditService.tsx` and `MyProfile.tsx`

---

## P22. Request Cards and Request List

**Broader Feature:** `Requests Marketplace`
**Search Tags:** `request cards, request feed, discover requests, proposal cta state`
**What This Feature Does:** Shows the request cards and request list, including the basic proposal CTA state.
**Related Packets / Adjacent Work:** `P23` for the single-request read surface, `P24` for proposal submit/edit/withdraw/respond mutations.
**This Packet Is Feed State Only:** This is only the request list. It does not include the full request page or the proposal actions.

This is the requests-tab feed packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Discover.tsx`, `src/components/ProposalModal.tsx`, and `src/components/Avatar.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/lib/features.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Discover.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Discover.tsx): Discover requests-tab implementation that renders inline request cards, proposal CTA state, and request feed summary behavior.
  - [`src/components/ProposalModal.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProposalModal.tsx): Reusable proposal composer modal launched from request cards to submit an offer without leaving the feed.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Shared avatar renderer for requester identity blocks inside inline request cards.
  - [`src/components/EmptyState.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/EmptyState.tsx): Standard no-results or error block that keeps this packet from turning into a blank broken-looking screen when API data is empty.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/features.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/features.ts): Feature-flag loader that keeps this packet aligned with backend toggles so hidden or disabled features behave like live Hive.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/requests/list.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/requests/list.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/list.php): Request endpoint that browses request feed with filters and proposal counters.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Current behavior to preserve:
  - there is no standalone `RequestCard` component yet; the request card markup is still inline inside `Discover.tsx`
  - backend returns `user_proposed`
  - frontend also tracks a local `submittedProposals` set so the CTA flips immediately after modal submit
  - admins are blocked from submitting proposals from this surface

---

## P23. Request Details and Visibility Rules

**Broader Feature:** `Requests Marketplace`
**Search Tags:** `request detail, proposal visibility, owner view, provider view`
**What This Feature Does:** Builds the request details page and decides which proposals each viewer is allowed to see.
**Related Packets / Adjacent Work:** `P22` for the request feed that links here, `P24` for proposal submit/edit/withdraw/respond mutations.
**This Packet Is The Read Contract Only:** This is only the request details page and who can see what. It does not include proposal actions.

This is the read/visibility contract for a single request.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/RequestDetail.tsx`, `src/components/ProposalModal.tsx`, and `src/components/Avatar.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/components/NavBar.tsx`, `src/lib/api.ts`, and `src/lib/auth.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/RequestDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/RequestDetail.tsx): Single-request page that shows request details, role-based proposal visibility, and owner or provider-specific actions.
  - [`src/components/ProposalModal.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProposalModal.tsx): Reusable proposal form launched from the request-detail page when a viewer is allowed to submit an offer.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Shared avatar renderer for request owner and proposal author identity blocks on the request-detail page.
  - [`src/components/CurrencyInput.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CurrencyInput.tsx): Numeric HiveCoin input that enforces money formatting and safe parsing before this packet submits prices, budgets, tips, or transfers.
  - [`src/components/CustomSelect.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CustomSelect.tsx): Filter dropdown control used for both Discover tabs.
  - [`src/components/DatePicker.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/DatePicker.tsx): Calendar picker used for booking, proposal, and deadline workflows.
  - [`src/components/TimePicker.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/TimePicker.tsx): 12-hour time picker component for scheduling workflows.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Reusable text-length helper used for proposal, edit-request, and other longer request-detail text inputs.
- Required support files:
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome that exposes entry points into this packet and carries the shared account and notification menus users expect.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and date helpers this packet relies on so categories, statuses, prices, and timestamps stay aligned with backend payloads.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/requests/get.php`, `api/requests/update.php`, and `api/requests/delete.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/requests/get.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/get.php): Single-request read endpoint that returns request detail plus role-scoped proposal visibility data.
  - [`api/requests/update.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/update.php): Request endpoint that patches open request fields by owner.
  - [`api/requests/delete.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/delete.php): Request endpoint that deletes request and cascades related proposals.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Current behavior to preserve:
  - owners see all proposals
  - signed-in non-owners only see their own proposals
  - logged-out viewers see zero proposals but still get `proposal_count`
  - proposal payloads now include `scheduled_date` and `scheduled_time`

---

## P24. Send, Edit, Withdraw, and Respond to Proposals

**Broader Feature:** `Requests Marketplace`
**Search Tags:** `proposal modal, submit proposal, edit proposal, withdraw proposal, accept proposal`
**What This Feature Does:** Handles sending, editing, withdrawing, and responding to proposals, including creating an order on accept.
**Related Packets / Adjacent Work:** `P22` for feed-level proposal CTA state, `P23` for request-detail visibility rules, `P33` for the order-create side effects triggered by proposal accept.
**This Packet Is The Mutation Layer:** This is the proposal action layer. It works best once the request list and request page already exist.

This is the mutation-heavy request workflow packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/components/ProposalModal.tsx`, `src/pages/RequestDetail.tsx`, and `src/pages/Discover.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/lib/features.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/components/ProposalModal.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProposalModal.tsx): Reusable proposal form supporting submission from both the request feed and the request-detail page.
  - [`src/pages/RequestDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/RequestDetail.tsx): Request-detail mutation surface where owners respond to proposals and providers manage submitted offers.
  - [`src/pages/Discover.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Discover.tsx): Requests-feed surface that launches proposal creation and immediately reflects proposal submission state in the list UI.
  - [`src/components/CurrencyInput.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CurrencyInput.tsx): Numeric HiveCoin input that enforces money formatting and safe parsing before this packet submits prices, budgets, tips, or transfers.
  - [`src/components/DatePicker.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/DatePicker.tsx): Calendar picker used for booking, proposal, and deadline workflows.
  - [`src/components/TimePicker.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/TimePicker.tsx): 12-hour time picker component for scheduling workflows.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Reusable text-length helper that keeps the proposal composer and request-edit text fields within their current limits.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/features.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/features.ts): Feature-flag loader that keeps this packet aligned with backend toggles so hidden or disabled features behave like live Hive.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/requests/proposals.php` and `api/requests/proposals-respond.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php`, `api/orders/create.php`, and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/requests/proposals.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/proposals.php): Request endpoint providing proposal CRUD for providers and request owners.
  - [`api/requests/proposals-respond.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/proposals-respond.php): Request acceptance endpoint that creates order rows and payment flow handoff.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`api/orders/create.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/create.php): Order endpoint that books service, locks wallet balance, and creates escrow transaction.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Tables this packet relies on:
  - `proposals`
  - `requests`
  - `orders`
  - `transactions`
- Current behavior to preserve:
  - the frontend currently requires a scheduled date even though backend accepts nullable `scheduled_date`
  - proposal accept is backend-heavy: it locks rows, checks balance, creates an order with `service_id = NULL`, copies scheduled date/time, accepts one proposal, and rejects the rest

---

## P25. Dashboard Home

**Broader Feature:** `User Workspace`
**Search Tags:** `dashboard, logged in home, quick actions, user summary`
**What This Feature Does:** Builds the logged-in dashboard with quick stats, orders, requests, and next-step shortcuts.

This is the logged-in home/work summary packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Dashboard.tsx`, `src/components/NavBar.tsx`, and `src/components/StatusBadge.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/lib/constants.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Dashboard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Dashboard.tsx): Logged-in home workspace with quick links into orders, requests, posting, and wallet.
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome that exposes entry points into this packet and carries the shared account and notification menus users expect.
  - [`src/components/StatusBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/StatusBadge.tsx): Renders standardized status pills so this packet uses the same wording and color rules as the rest of the app.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and date helpers this packet relies on so categories, statuses, prices, and timestamps stay aligned with backend payloads.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/users/stats.php`, `api/orders/list.php`, and `api/requests/list.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/users/stats.php`](https://github.com/intesarjawad/hive/blob/main/api/users/stats.php): User endpoint returning aggregate earnings, spend, rating, and buzz metrics.
  - [`api/orders/list.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/list.php): Order endpoint listing buyer and seller orders with role-aware metadata.
  - [`api/requests/list.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/list.php): Request endpoint that browses request feed with filters and proposal counters.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Current behavior to preserve:
  - dashboard links into posting service, posting request, orders, and the wallet tab inside settings
  - order summaries here depend on the same list payload as the main orders page

---

## P26. Message List

**Broader Feature:** `Messaging`
**Search Tags:** `messages chat list, conversation rail, unread chats, chat search`
**What This Feature Does:** Builds the left-side message list with unread state, preview text, timestamps, and selection behavior.

This is just the left conversation rail packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Messages.tsx` and `src/components/Avatar.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/components/FeatureRoute.tsx`, `src/lib/features.ts`, and `src/lib/api.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Messages.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Messages.tsx): Shared messaging page file; this packet specifically uses its conversation rail, search box, unread state, and selection logic.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Shared avatar renderer for the conversation rail, chat header, online dot, and cosmetic frame display.
- Required support files:
  - [`src/components/FeatureRoute.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/FeatureRoute.tsx): Route-level feature gate that blocks access when the corresponding backend flag is turned off.
  - [`src/lib/features.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/features.ts): Feature-flag loader that keeps this packet aligned with backend toggles so hidden or disabled features behave like live Hive.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared date and formatting helpers used by the chat list for preview timestamps and relative display cleanup.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/messages/conversations.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/messages/conversations.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/conversations.php): Conversation-rail endpoint that supplies unread counts, preview text, context subtitles, timestamps, and other-user identity for the left chat list.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Tables this packet relies on:
  - `conversations`
  - `messages`
  - `users`
  - `shop_items`
- Current behavior to preserve:
  - chat list includes search box, unread state, preview text, timestamps, context subtitle, and mobile `showChat` switching
  - preview timestamps were tightened in recent work

---

## P27. Chat Thread and Message Box

**Broader Feature:** `Messaging`
**Search Tags:** `messages thread, composer, direct message, send message, read state`
**What This Feature Does:** Builds the active chat thread, message box, send flow, and read-state updates.

This is the active-chat packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Messages.tsx` and `src/components/CharacterLimitHint.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Messages.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Messages.tsx): Shared messaging page file; this packet specifically uses its thread pane, composer, send flow, and read-state updates.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Delayed composer character-limit helper used by the message input so the counter only appears when it is actually needed.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/messages/messages.php`, `api/messages/send.php`, and `api/users/profile.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/messages/messages.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/messages.php): Thread endpoint that returns message bodies, attachments, structured order events, and read-state changes for the active chat.
  - [`api/messages/send.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/send.php): Message-send endpoint that stores the outgoing message, attaches uploads, and creates the recipient notification side effects.
  - [`api/users/profile.php`](https://github.com/intesarjawad/hive/blob/main/api/users/profile.php): User profile read endpoint used by profile pages, chat headers, and internal link previews.
  - [`api/messages/conversations.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/conversations.php): Conversation data endpoint that returns other-user identity, unread counts, preview metadata, and context fields used across the chat rail and active thread header.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Current behavior to preserve:
  - `GET /messages/messages.php` also marks incoming messages as read
  - composer supports Enter-to-send
  - new-chat bootstrapping can start from `userId` and then promote into a real conversation
  - the delayed character hint behavior is intentional

---

## P28. Chat Context Banners

**Broader Feature:** `Messaging`
**Search Tags:** `message context banner, re banner, service context, request context, order context`
**What This Feature Does:** Shows the banner that tells the user what service, request, or order the chat is about.

This is the top `Re:` banner packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Messages.tsx`, `src/pages/ServiceDetail.tsx`, and `src/pages/RequestDetail.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/routes.tsx`, `src/lib/api.ts`, and `src/lib/auth.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Messages.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Messages.tsx): Shared messaging page file; this packet specifically uses the dismissible `Re:` context banner above the thread.
  - [`src/pages/ServiceDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ServiceDetail.tsx): Service page entry point that can open or continue a conversation with service-specific message context.
  - [`src/pages/RequestDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/RequestDetail.tsx): Request page entry point that seeds or resumes conversations tied to a specific request context.
  - [`src/pages/OrderTracking.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/OrderTracking.tsx): Order workspace entry point that links conversations back to a specific order context and status history.
  - [`src/pages/OrderBooking.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/OrderBooking.tsx): Booking flow that can hand off into messages with a service or order context already attached.
- Required support files:
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/messages/send.php` and `api/messages/conversations.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **What the other files mean:** `api/helpers.php` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/messages/send.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/send.php): Message-send endpoint that stores the outgoing message, attaches uploads, and creates the recipient notification side effects.
  - [`api/messages/conversations.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/conversations.php): Conversation data endpoint that returns other-user identity, unread counts, preview metadata, and context fields used across the chat rail and active thread header.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.

### Storage, data, and behavior

- Conversation fields this packet relies on:
  - `context_type`
  - `context_id`
  - `context_title`
- Current behavior to preserve:
  - dismissal is keyed by active context, not a single boolean
  - polling should not resurrect a dismissed banner unless the context itself changes

---

## P29. Order Update Cards in Chat

**Broader Feature:** `Messaging + Orders`
**Search Tags:** `order event card, order timeline in chat, structured order message`
**What This Feature Does:** Shows order updates inside chat as proper cards instead of plain text messages.

This is the structured order-update-in-chat packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/components/OrderEventMessageCard.tsx`, `src/pages/Messages.tsx`, and `src/components/StatusBadge.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/routes.tsx` and `src/lib/api.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/components/OrderEventMessageCard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/OrderEventMessageCard.tsx): Structured chat card component for machine-generated order updates inside conversations.
  - [`src/pages/Messages.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Messages.tsx): Shared messaging page file that hosts structured order-event cards inside the active chat thread.
  - [`src/components/StatusBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/StatusBadge.tsx): Renders standardized status pills so this packet uses the same wording and color rules as the rest of the app.
- Required support files:
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/helpers.php`, `api/orders/create.php`, and `api/orders/update-status.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **What the other files mean:** the extra backend files listed below are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`api/orders/create.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/create.php): Order endpoint that books service, locks wallet balance, and creates escrow transaction.
  - [`api/orders/update-status.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/update-status.php): Order endpoint handling state transitions, payouts, and refunds.
  - [`api/orders/dispute.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/dispute.php): Order endpoint for dispute lifecycle, split proposals, and negotiated resolution.
  - [`api/orders/adjustment.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/adjustment.php): Order endpoint for requesting, approving, declining, and resolving scope or budget adjustments.
  - [`api/orders/tip.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/tip.php): Order endpoint that applies a post-completion tip and emits the related notification or chat event.
  - [`api/messages/conversations.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/conversations.php): Conversation data endpoint that returns other-user identity, unread counts, preview metadata, and context fields used across the chat rail and active thread header.
  - [`api/messages/messages.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/messages.php): Thread endpoint that returns message bodies, attachments, structured order events, and read-state changes for the active chat.

### Storage, data, and behavior

- Current behavior to preserve:
  - the card only renders if the message body uses the exact structured prefix and JSON payload the parser expects
  - if the payload is wrong, the UI falls back to normal message rendering
  - this is the current order timeline mechanism; there is no separate timeline API

---

## P30. Link Cards in Chat

**Broader Feature:** `Messaging`
**Search Tags:** `chat link preview, markdown, internal links, same-origin preview`
**What This Feature Does:** Turns allowed internal Hive links into chat cards instead of plain text links.

This is the markdown-plus-preview packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Messages.tsx`, `src/components/LinkPreviewCard.tsx`, and `src/lib/assetUrl.ts`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts` and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Messages.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Messages.tsx): Shared messaging page file; this packet specifically uses markdown rendering and internal-link preview injection inside message bodies.
  - [`src/components/LinkPreviewCard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/LinkPreviewCard.tsx): Compact rich-preview card for allowed internal service, request, and user links embedded inside chat messages.
  - [`src/lib/assetUrl.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/assetUrl.ts): Resolves uploaded-versus-fallback asset paths so this packet can render media correctly across local, deployed, and proxy runtime environments.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are the backend support files listed below. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **What the other files mean:** `api/helpers.php` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files this packet reads from:
  - [`api/services/get.php`](https://github.com/intesarjawad/hive/blob/main/api/services/get.php): Single-service read endpoint used by service detail, booking, editing, and internal link previews.
  - [`api/requests/get.php`](https://github.com/intesarjawad/hive/blob/main/api/requests/get.php): Single-request read endpoint used by request detail and internal request previews.
  - [`api/users/profile.php`](https://github.com/intesarjawad/hive/blob/main/api/users/profile.php): User profile read endpoint used by profile pages, chat headers, and internal link previews.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.

### Storage, data, and behavior

- Current behavior to preserve:
  - only same-origin service/request/user links get preview cards
  - external links do not get visual preview cards
  - order links also do not get preview cards
  - internal links navigate in-app

---

## P31. Chat File Uploads

**Broader Feature:** `Messaging`
**Search Tags:** `message attachments, upload files, secure download, attachment cards`
**What This Feature Does:** Handles chat file upload, storage, download, and file-card rendering.

This is the file upload and secure download packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Messages.tsx`, `src/components/MessageAttachmentGrid.tsx`, and `src/lib/fileUploads.ts`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Messages.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Messages.tsx): Shared messaging page file; this packet specifically uses attachment picking, queueing, upload submission, and download-card rendering.
  - [`src/components/MessageAttachmentGrid.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/MessageAttachmentGrid.tsx): Compact attachment-card renderer used in message threads and compose-time attachment queues.
  - [`src/lib/fileUploads.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/fileUploads.ts): Client-side upload rule enforcer for MIME checks, size limits, preview data URLs, and request payload preparation.
  - [`src/lib/assetUrl.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/assetUrl.ts): Resolves attachment download URLs safely across local, deployed, and proxy-based environments.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/messages/send.php`, `api/messages/messages.php`, and `api/messages/attachment.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `sql/migrate-message-attachments.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/messages/send.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/send.php): Message-send endpoint that stores the outgoing message, attaches uploads, and creates the recipient notification side effects.
  - [`api/messages/messages.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/messages.php): Thread endpoint that returns message bodies, attachments, structured order events, and read-state changes for the active chat.
  - [`api/messages/attachment.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/attachment.php): Secure download endpoint that validates ownership and streams private message attachments.
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
- Required support files:
  - [`sql/migrate-message-attachments.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-message-attachments.sql): Migration that adds tables or columns required for message attachment upload and retrieval.

### Storage, data, and behavior

- Tables and filesystem this packet relies on:
  - `message_attachments`
  - [`api/uploads/messages_private`](https://github.com/intesarjawad/hive/tree/main/api/uploads/messages_private): Runtime-only directory where private message attachments are stored outside the public web root.
- Current behavior to preserve:
  - attachments render as compact thin cards
  - behavior is download-only, not preview-heavy
  - current limits are `5 files max` and `5 MB per file`
  - if `messages_private` is not persisted across deploys, old attachment metadata stays in the DB while the files disappear

---

## P32. Notifications Page and Navbar Tray

**Broader Feature:** `Notifications`
**Search Tags:** `notifications page, navbar bell, unread count, mark read, delete notifications`
**What This Feature Does:** Builds the notifications page, the bell tray in the navbar, and the refresh behavior behind them.

This is the bell and notifications page packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Notifications.tsx`, `src/components/NavBar.tsx`, and `src/lib/inAppAlerts.ts`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/lib/constants.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Notifications.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Notifications.tsx): Full notification center page with unread handling, deletion actions, and destination links.
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome that exposes entry points into this packet and carries the shared account and notification menus users expect.
  - [`src/lib/inAppAlerts.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/inAppAlerts.ts): Notification refresh and in-app alert helpers that keep the bell tray and notifications page synchronized.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and date helpers this packet relies on so categories, statuses, prices, and timestamps stay aligned with backend payloads.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/notifications/list.php`, `api/notifications/read.php`, and `api/notifications/delete.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **What the other files mean:** `api/helpers.php`, `api/messages/send.php`, and `api/orders/create.php` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/notifications/list.php`](https://github.com/intesarjawad/hive/blob/main/api/notifications/list.php): Notification inbox read endpoint that supplies the bell dropdown and unread counter for this packet.
  - [`api/notifications/read.php`](https://github.com/intesarjawad/hive/blob/main/api/notifications/read.php): Notification mutation endpoint that clears unread state so bell counts and inbox state stay in sync.
  - [`api/notifications/delete.php`](https://github.com/intesarjawad/hive/blob/main/api/notifications/delete.php): Notification endpoint that deletes one or more notifications from the user inbox.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`api/messages/send.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/send.php): Message-send endpoint included here because sending a message also creates notification rows that feed the bell tray and notifications page.
  - [`api/orders/create.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/create.php): Order-creation endpoint included here because successful bookings emit notification events consumed by this packet.
  - [`api/orders/update-status.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/update-status.php): Order-status mutation endpoint included here because lifecycle changes generate notification items visible in the bell tray and notifications center.
  - [`api/orders/adjustment.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/adjustment.php): Adjustment workflow endpoint included here because scope-change actions create notification records the frontend must display.
  - [`api/orders/dispute.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/dispute.php): Dispute endpoint included here because dispute opens, responses, withdrawals, and resolutions all emit notification activity.
  - [`api/orders/review.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/review.php): Buyer-review endpoint included here because review completion creates notification history and unread-state changes.
  - [`api/orders/client-review.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/client-review.php): Provider-review endpoint included here because client-review submission also feeds the notifications inbox.
  - [`api/orders/tip.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/tip.php): Tip endpoint included here because tipping creates both notification entries and chat-side order-event activity.

### Storage, data, and behavior

- Tables this packet relies on:
  - `notifications`
  - `messages`
  - `conversations`
- Current behavior to preserve:
  - navbar and page both poll every `15s`
  - chat unread state is not the same thing as bell unread state
  - alerts are suppressed when the target context is already open

---

## P33. Start an Order and Lock Payment

**Broader Feature:** `Orders`
**Search Tags:** `order booking, escrow create, schedule service, checkout`
**What This Feature Does:** Starts a new order from a service booking and locks in the first payment state.
**Related Packets / Adjacent Work:** `P19` for the service detail page that launches booking, `P34` for the order shell the user lands in next, `P29` and `P32` for chat or notification side effects emitted by successful create.
**This Packet Is Order Creation Only:** This is only for starting the order. It does not include later tracking, completion, disputes, reviews, or tips.

This is the service-to-order creation packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/OrderBooking.tsx`, `src/components/DatePicker.tsx`, and `src/components/TimePicker.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/lib/constants.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/OrderBooking.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/OrderBooking.tsx): Booking checkout flow for scheduling and confirming a service order.
  - [`src/components/DatePicker.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/DatePicker.tsx): Calendar picker used for booking, proposal, and deadline workflows.
  - [`src/components/TimePicker.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/TimePicker.tsx): 12-hour time picker component for scheduling workflows.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Booking-form helper that surfaces length feedback for notes or scope text without cluttering the form immediately.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Provider identity renderer used in the booking flow so buyers see the seller avatar, initials fallback, and cosmetics.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and date helpers this packet relies on so categories, statuses, prices, and timestamps stay aligned with backend payloads.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/orders/create.php` and `api/services/get.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/orders/create.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/create.php): Order endpoint that books service, locks wallet balance, and creates escrow transaction.
  - [`api/services/get.php`](https://github.com/intesarjawad/hive/blob/main/api/services/get.php): Service-detail endpoint that supplies the provider, pricing, media, and metadata needed to create a booking-backed order.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Tables this packet relies on:
  - `orders`
  - `transactions`
  - `services`
  - `users`
- Current behavior to preserve:
  - unit-priced orders are supported
  - successful create can emit an order-event chat message if messaging is enabled

---

## P34. Orders List and Order Page Layout

**Broader Feature:** `Orders`
**Search Tags:** `orders list, order detail shell, tracking, order summary`
**What This Feature Does:** Builds the orders list and the main order page layout for current and past orders.
**Related Packets / Adjacent Work:** `P33` for creating an order, `P35` for lifecycle actions inside the shell, `P36` for adjustments and disputes, `P37` for reviews and tipping.
**This Packet Is The Read Shell:** This is only the orders list and main order page layout. It is not the full order flow by itself.

This is the read-only orders shell packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/OrderTracking.tsx`, `src/pages/Dashboard.tsx`, and `src/components/StatusBadge.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/lib/constants.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/OrderTracking.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/OrderTracking.tsx): Order lifecycle workspace including completion, dispute, and review actions.
  - [`src/pages/Dashboard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Dashboard.tsx): Logged-in home workspace with quick links into orders, requests, posting, and wallet.
  - [`src/components/StatusBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/StatusBadge.tsx): Renders standardized status pills so this packet uses the same wording and color rules as the rest of the app.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Shared avatar renderer for buyer and seller identity blocks inside the orders list and focused order shell.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and date helpers this packet relies on so categories, statuses, prices, and timestamps stay aligned with backend payloads.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/orders/list.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/orders/list.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/list.php): Order endpoint listing buyer and seller orders with role-aware metadata.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Current behavior to preserve:
  - there is still no dedicated `GET /orders/:id`
  - the focused `/orders/:orderId` route is resolved from the list payload
  - list payload already includes `other_party`, cosmetics, pending adjustment state, and review flags

---

## P35. Main Order Status Actions

**Broader Feature:** `Orders`
**Search Tags:** `order lifecycle, update status, complete order, actual units`
**What This Feature Does:** Handles the normal order status moves, including completion and actual delivered units.
**Related Packets / Adjacent Work:** `P34` for the order shell that hosts these actions, `P36` for the dispute branch that can interrupt completion, `P37` for the post-completion actions unlocked afterward.
**This Packet Is Status Movement Only:** This is only the normal order status flow. It does not include disputes, reviews, tips, or order creation.

This is the status-transition packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/OrderTracking.tsx` and `src/components/StatusBadge.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/OrderTracking.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/OrderTracking.tsx): Order lifecycle workspace including completion, dispute, and review actions.
  - [`src/components/StatusBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/StatusBadge.tsx): Renders standardized status pills so this packet uses the same wording and color rules as the rest of the app.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/orders/update-status.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/migrate-order-units-and-adjustments.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/orders/update-status.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/update-status.php): Order endpoint handling state transitions, payouts, and refunds.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/migrate-order-units-and-adjustments.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-order-units-and-adjustments.sql): Migration that adds unit-priced order fields and order-adjustment workflow support.

### Storage, data, and behavior

- Current behavior to preserve:
  - completion is two-sided now, not one-click finalization
  - provider can submit `actual_units`
  - first completion confirmation moves the order into `awaiting_completion`

---

## P36. Scope Changes and Disputes

**Broader Feature:** `Orders`
**Search Tags:** `order adjustments, scope change, dispute, split resolution, top up`
**What This Feature Does:** Handles what happens when an order goes off the normal path, like disputes or price changes.
**Related Packets / Adjacent Work:** `P35` for the normal completion path these flows interrupt, `P34` for the order shell that hosts them, `P29` and `P32` for structured order-event and notification side effects.
**This Packet Is The Exception Path:** This is for when an order leaves the normal path, like disputes or price changes. It is not normal booking or normal completion.

This is the “something changed after order creation” packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/OrderTracking.tsx`, `src/components/CurrencyInput.tsx`, and `src/components/CharacterLimitHint.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/OrderTracking.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/OrderTracking.tsx): Order lifecycle workspace including completion, dispute, and review actions.
  - [`src/components/CurrencyInput.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CurrencyInput.tsx): Numeric HiveCoin input that enforces money formatting and safe parsing before this packet submits prices, budgets, tips, or transfers.
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Reusable text-length helper that keeps dispute notes and adjustment messages within their current limits.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/orders/adjustment.php` and `api/orders/dispute.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/migrate-order-units-and-adjustments.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/orders/adjustment.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/adjustment.php): Order endpoint for requesting, approving, declining, and resolving scope or budget adjustments.
  - [`api/orders/dispute.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/dispute.php): Order endpoint for dispute lifecycle, split proposals, and negotiated resolution.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/migrate-order-units-and-adjustments.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-order-units-and-adjustments.sql): Migration that adds unit-priced order fields and order-adjustment workflow support.

### Storage, data, and behavior

- Tables and fields this packet relies on:
  - `order_adjustments`
  - dispute-related columns on `orders`
- Current behavior to preserve:
  - adjustments are a real top-up workflow, not just a UI estimate
  - disputes support split resolution and withdrawal
  - both flows emit notifications and structured order-event messages

---

## P37. Reviews, Ratings, and Tips

**Broader Feature:** `Orders`
**Search Tags:** `reviews, client review, provider review, tip, post completion`
**What This Feature Does:** Handles reviews, ratings, and tips after an order is finished.
**Related Packets / Adjacent Work:** `P35` because these actions only unlock after completion, `P36` because disputed orders must resolve before these actions become valid, `P41` because reviews feed Buzz score logic.
**This Packet Is After-Completion Only:** This is only for what happens after an order is done. Reviews, ratings, and tips all belong here together.

This is the after-order packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/OrderTracking.tsx` and `src/components/CurrencyInput.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/OrderTracking.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/OrderTracking.tsx): Order lifecycle workspace including completion, dispute, and review actions.
  - [`src/components/CurrencyInput.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CurrencyInput.tsx): Tip amount input used after completion for entering a valid HiveCoin value before submission.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/orders/review.php`, `api/orders/client-review.php`, and `api/orders/tip.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/migrate-order-tips.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/orders/review.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/review.php): Order endpoint that stores buyer review and updates service rating stats.
  - [`api/orders/client-review.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/client-review.php): Order endpoint that stores provider review of client behavior.
  - [`api/orders/tip.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/tip.php): Order endpoint that applies a post-completion tip and emits the related notification or chat event.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/migrate-order-tips.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-order-tips.sql): Migration that adds storage for post-completion tipping behavior in the order system.

### Storage, data, and behavior

- Tables this packet relies on:
  - `reviews`
  - `client_reviews`
  - `transactions`
- Current behavior to preserve:
  - provider reviews and client reviews are separate first-class records
  - client reviews feed into Buzz score logic
  - tipping also emits structured order-event messages

---

## P38. Wallet View and Wallet Actions

**Broader Feature:** `Wallet`
**Search Tags:** `wallet, balance, transactions, transfer, deposit, withdraw`
**What This Feature Does:** Builds the wallet view and wallet actions used from settings and the dashboard.

This is the wallet subsystem packet even though the UI lives inside settings.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Settings.tsx` and `src/pages/Dashboard.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/components/CurrencyInput.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Settings.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Settings.tsx): Settings page that also hosts the wallet tab for balance, transfers, deposits, withdrawals, and history.
  - [`src/pages/Dashboard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Dashboard.tsx): Dashboard entry surface that links into the wallet tab and reflects wallet-backed balances in the logged-in workspace.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/components/CurrencyInput.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CurrencyInput.tsx): Numeric HiveCoin input that enforces money formatting and safe parsing before this packet submits prices, budgets, tips, or transfers.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/wallet/balance.php`, `api/wallet/transactions.php`, and `api/wallet/transfer.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/wallet/balance.php`](https://github.com/intesarjawad/hive/blob/main/api/wallet/balance.php): Wallet endpoint returning current HiveCoin balance.
  - [`api/wallet/transactions.php`](https://github.com/intesarjawad/hive/blob/main/api/wallet/transactions.php): Wallet endpoint returning paginated user transaction ledger.
  - [`api/wallet/transfer.php`](https://github.com/intesarjawad/hive/blob/main/api/wallet/transfer.php): Wallet endpoint for deposit, withdraw, and peer transfer with atomic checks.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Tables this packet relies on:
  - `transactions`
  - `users.hivecoin_balance`
- Current behavior to preserve:
  - wallet is embedded in the `wallet` tab of `Settings.tsx`
  - one endpoint currently multiplexes deposit, withdraw, and peer transfer
  - withdraw writes a negative spending row

---

## P39. Shop Page and Buying Items

**Broader Feature:** `Shop`
**Search Tags:** `shop, cosmetics store, purchase frame, purchase badge, purchase theme`
**What This Feature Does:** Builds the shop page and lets users buy items with wallet balance.

This is the shop catalog packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/HiveShop.tsx`, `src/components/FeatureRoute.tsx`, and `src/lib/features.ts`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/HiveShop.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/HiveShop.tsx): Cosmetics storefront with purchase and equip interactions.
  - [`src/components/FeatureRoute.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/FeatureRoute.tsx): Route-level feature gate that blocks access when the corresponding backend flag is turned off.
  - [`src/lib/features.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/features.ts): Feature-flag loader that keeps this packet aligned with backend toggles so hidden or disabled features behave like live Hive.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Preview avatar renderer used in the shop so users can see how purchased frames interact with their profile image.
  - [`src/components/ProfileBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProfileBadge.tsx): Renders equipped badge cosmetics anywhere this packet shows user identity, headers, or summary cards.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/shop/items.php`, `api/shop/inventory.php`, and `api/shop/purchase.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/shop/items.php`](https://github.com/intesarjawad/hive/blob/main/api/shop/items.php): Shop endpoint listing purchasable cosmetics with ownership metadata.
  - [`api/shop/inventory.php`](https://github.com/intesarjawad/hive/blob/main/api/shop/inventory.php): Shop endpoint returning purchased cosmetics and equipped state.
  - [`api/shop/purchase.php`](https://github.com/intesarjawad/hive/blob/main/api/shop/purchase.php): Shop endpoint performing atomic purchase and wallet deduction.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Tables this packet relies on:
  - `shop_items`
  - `shop_purchases`
- Current behavior to preserve:
  - shop is gated both client-side and server-side by `feature_shop`
  - affordability depends on live wallet balance

---

## P40. Wear Cosmetics Across the App

**Broader Feature:** `Shop + Cosmetics`
**Search Tags:** `equip cosmetics, avatar frame, badge, theme, cross surface cosmetics`
**What This Feature Does:** Lets users equip cosmetics and shows those cosmetics across the rest of the app.

This is the “shop is not isolated” packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/HiveShop.tsx`, `src/components/Avatar.tsx`, and `src/components/ProfileBadge.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/HiveShop.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/HiveShop.tsx): Cosmetics storefront with purchase and equip interactions.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Core cosmetic-aware avatar component that applies equipped frames, initials fallback, and image-loading behavior across the app.
  - [`src/components/ProfileBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProfileBadge.tsx): Renders equipped badge cosmetics anywhere this packet shows user identity, headers, or summary cards.
  - [`src/pages/OrderTracking.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/OrderTracking.tsx): Order UI surface that consumes equipped cosmetics when showing the buyer and seller throughout the order lifecycle.
  - [`src/pages/Messages.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Messages.tsx): Messaging surface that renders equipped cosmetics in the conversation rail, chat header, and active-thread identity UI.
  - [`src/pages/Leaderboard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Leaderboard.tsx): Leaderboard surface that displays equipped cosmetics alongside ranked user identity blocks.
  - [`src/pages/UserProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/UserProfile.tsx): Public profile page that shows the user's equipped cosmetics, profile identity, reviews, and listed services.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/users/update.php`, `api/auth/me.php`, and `api/users/profile.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **What the other files mean:** the extra backend files listed below are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/users/update.php`](https://github.com/intesarjawad/hive/blob/main/api/users/update.php): Primary user/profile mutation endpoint that also handles equipping and unequipping frame, badge, and theme fields.
  - [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php): Canonical session payload endpoint this packet uses to refresh current-user fields after backend changes.
  - [`api/users/profile.php`](https://github.com/intesarjawad/hive/blob/main/api/users/profile.php): Profile endpoint that returns equipped cosmetic data so profile pages, chat headers, and link previews render the same user identity.
  - [`api/orders/list.php`](https://github.com/intesarjawad/hive/blob/main/api/orders/list.php): Order-list endpoint that already includes the other party's equipped cosmetics for consistent rendering in order views.
  - [`api/messages/conversations.php`](https://github.com/intesarjawad/hive/blob/main/api/messages/conversations.php): Conversation-list endpoint that carries participant cosmetic data for the chat rail and active thread header.
  - [`api/leaderboard.php`](https://github.com/intesarjawad/hive/blob/main/api/leaderboard.php): Leaderboard endpoint computing normalized Buzz Score rankings.
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.

### Storage, data, and behavior

- Fields this packet relies on:
  - `users.active_frame_id`
  - `users.active_badge_id`
  - `users.active_theme_id`
- Current behavior to preserve:
  - cosmetics are already included in orders, messages, profiles, and leaderboard payloads
  - mirror builders should not treat cosmetics as a shop-only visual flourish

---

## P41. Buzz Score and Leaderboard

**Broader Feature:** `Leaderboard`
**Search Tags:** `buzz score, leaderboard, podium, rankings, buzz explainer`
**What This Feature Does:** Shows the leaderboard and explains what the Buzz Score means.

This is the ranking packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Leaderboard.tsx`, `src/pages/BuzzScoreInfo.tsx`, and `src/components/FeatureRoute.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/components/NavBar.tsx`, `src/components/Avatar.tsx`, and `src/components/ProfileBadge.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Leaderboard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Leaderboard.tsx): Competitive ranking view for top users by Buzz Score.
  - [`src/pages/BuzzScoreInfo.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/BuzzScoreInfo.tsx): Explainer page describing Buzz Score factors and ranking formula.
  - [`src/components/FeatureRoute.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/FeatureRoute.tsx): Route-level feature gate that blocks access when the corresponding backend flag is turned off.
- Required support files:
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome that exposes entry points into this packet and carries the shared account and notification menus users expect.
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Core avatar renderer used on the leaderboard for ranked user identity, cosmetics, and fallback state.
  - [`src/components/ProfileBadge.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProfileBadge.tsx): Renders equipped badge cosmetics anywhere this packet shows user identity, headers, or summary cards.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and date helpers this packet relies on so categories, statuses, prices, and timestamps stay aligned with backend payloads.
  - [`src/lib/features.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/features.ts): Feature-flag loader that keeps this packet aligned with backend toggles so hidden or disabled features behave like live Hive.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/leaderboard.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/leaderboard.php`](https://github.com/intesarjawad/hive/blob/main/api/leaderboard.php): Leaderboard endpoint computing normalized Buzz Score rankings.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Tables this packet relies on:
  - `orders`
  - `reviews`
  - `client_reviews`
  - `shop_items`
- Current behavior to preserve:
  - Buzz is action-based now
  - category view counts provider-side category actions
  - frontend still filters admin users client-side as a fallback

---

## P42. Admin Overview and Site Stats

**Broader Feature:** `Admin`
**Search Tags:** `admin overview, revenue analytics, activity analytics, admin stats`
**What This Feature Does:** Builds the admin overview pages for site stats, revenue, and activity.
**Related Packets / Adjacent Work:** `P43` for moderation queue and user actions, `P43.1` for impersonation, `P44` for admin order explorer, `P44.1` for admin system settings and feature flags.
**This Packet Is Analytics Read Surfaces Only:** This is only the admin stats side. It does not mean the whole admin area is done.

This is the read-heavy admin analytics packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Admin.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/components/NavBar.tsx`, `src/lib/api.ts`, and `src/lib/auth.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Admin.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Admin.tsx): Frontend admin console with analytics, moderation, users, orders, and settings.
- Required support files:
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome that exposes entry points into this packet and carries the shared account and notification menus users expect.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper this packet uses for PHP calls, query params, JSON bodies, and normalized ApiError handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet relies on for role checks, owner checks, refreshUser, and logout wiring.
  - [`src/lib/constants.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/constants.ts): Shared enums and date helpers this packet relies on so categories, statuses, prices, and timestamps stay aligned with backend payloads.
  - [`src/lib/features.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/features.ts): Feature-flag loader that keeps this packet aligned with backend toggles so hidden or disabled features behave like live Hive.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/admin/stats.php`, `api/admin/revenue.php`, and `api/admin/activity.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/admin/stats.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/stats.php): Admin endpoint for overview KPIs and revenue or order activity summaries.
  - [`api/admin/revenue.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/revenue.php): Admin endpoint for revenue analytics, chart series, and top categories.
  - [`api/admin/activity.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/activity.php): Admin endpoint for latest platform activity timeline.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the tables and columns this packet reads and writes; if it does not match, the feature will look built but fail at runtime.

### Storage, data, and behavior

- Current behavior to preserve:
  - current admin UI silently falls back to sample data if these endpoints are missing
  - analytics include order, report, and shop activity views

---

## P43. Admin Reports and User Actions

**Broader Feature:** `Admin`
**Search Tags:** `admin reports, moderation queue, suspend user, ban user, delete user, user moderation`
**What This Feature Does:** Gives admins the report queue and the user actions needed to suspend, ban, or remove users.
**Related Packets / Adjacent Work:** `P14.1` for the user-facing report-entry flow that feeds this queue, `P43.1` for impersonation, `P42` for admin analytics surfaces.
**This Packet Is Moderation Only:** This is only the report queue and user-control actions. It does not include View As, analytics, order lookup, or feature flags.

This is the admin moderation packet. Impersonation is intentionally split into `P43.1`.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Admin.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Admin.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Admin.tsx): Admin console tab set that contains the reports queue, report actions, and user moderation controls.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Fetch wrapper this packet uses for moderation queue reads and admin mutations.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet uses to enforce admin-only access and refresh after moderation actions.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Route contract this packet depends on for the admin console shell.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/admin/reports.php` and `api/admin/users.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/admin/reports.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/reports.php): Admin endpoint for moderation queue reads and report status or action updates.
  - [`api/admin/users.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/users.php): Admin endpoint for user search plus suspend, ban, restore, and delete controls.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Shared backend helper layer this packet depends on for admin guards, threshold logic, and normalized responses.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the reports, users, and related moderation data this packet touches.

### Storage, data, and behavior

- Tables and subsystems this packet touches:
  - `reports`
  - `users`
  - `orders`
  - `messages`
  - `reviews`
  - `transactions`
  - `shop_purchases`
- Current behavior to preserve:
  - report acknowledgment and action can auto-suspend users based on thresholds
  - deletion has broad cascade implications and should never be treated like a harmless row delete
  - `View As` impersonation buttons belong to a separate admin packet and should not be used to pretend moderation is already complete

---

## P43.1 Admin View-As

**Broader Feature:** `Admin`
**Search Tags:** `impersonation, view as user, stop impersonation, impersonation banner, admin view as`
**What This Feature Does:** Lets an admin view the app as another user and then return to the admin account.
**Related Packets / Adjacent Work:** `P14` because user profiles can launch impersonation, `P43` because moderation surfaces also expose `View As`, `P03` and `P04` because auth/session and route-shell behavior must respect impersonation.
**This Packet Is Not General Moderation:** This is only View As. It does not mean the full admin moderation work is done.

This packet is only the impersonation subsystem. It is intentionally separated from report review and from the user profile read surface.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Admin.tsx`, `src/pages/UserProfile.tsx`, and `src/components/ImpersonationBanner.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/components/NavBar.tsx`, `src/lib/api.ts`, and `src/lib/auth.ts` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Admin.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Admin.tsx): Admin console surface that already exposes a `View As` impersonation action from the users table.
  - [`src/pages/UserProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/UserProfile.tsx): Other-user profile surface that also exposes `View As` for admins as a contextual launch point.
  - [`src/components/ImpersonationBanner.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ImpersonationBanner.tsx): Global banner shown while impersonation is active so the acting admin can always see and exit the borrowed session.
- Required support files:
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): App shell that mounts the global impersonation banner everywhere once the borrowed session is active.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Fetch wrapper this packet uses for start and stop impersonation mutations.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet depends on so the frontend can detect `impersonating`, refresh the borrowed user, and restore admin context.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Route contract this packet relies on when the banner returns the user back to `/admin`.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/admin/impersonate.php`, `api/admin/stop-impersonate.php`, and `api/auth/me.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/admin/impersonate.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/impersonate.php): Admin endpoint that starts impersonation for a target user if that target is eligible.
  - [`api/admin/stop-impersonate.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/stop-impersonate.php): Admin endpoint that exits impersonation and restores the real admin session.
  - [`api/auth/me.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/me.php): Canonical session payload endpoint that carries the `impersonating` state the frontend banner depends on.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Shared backend helper layer this packet depends on for session switching, admin guards, and canonical auth payload shape.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the users table this packet impersonates against.

### Storage, data, and behavior

- Session and user rules this packet relies on:
  - admin session state
  - `users`
- Current behavior to preserve:
  - admins can currently start impersonation from both the admin users table and the other-user profile page
  - impersonation cannot target deactivated users or other admin users
  - the impersonation state must be visible globally through the banner, not just inside the admin page that launched it

---

## P44. Admin Order Lookup

**Broader Feature:** `Admin`
**Search Tags:** `admin orders, order explorer, admin order search, order filters`
**What This Feature Does:** Lets admins search all orders from one place and inspect them.
**Related Packets / Adjacent Work:** `P42` for the rest of the analytics console, `P44.1` for admin settings and feature flags, `P35` to `P37` for the non-admin order lifecycle surfaces this explorer is observing.
**This Packet Is The Admin-Wide Read Surface Only:** This is only the admin order lookup page. It is not the normal orders flow or admin settings.

This packet is only the admin order explorer. System settings and feature flags are split into `P44.1`.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Admin.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Admin.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Admin.tsx): Admin console tab set that contains the platform-wide orders explorer.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Fetch wrapper this packet uses for order-search and filter requests.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet uses for admin access enforcement and refresh behavior.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Route contract this packet depends on for the admin console shell.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/admin/orders.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/setup.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/admin/orders.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/orders.php): Admin endpoint for platform-wide order explorer results and filters.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Shared backend helper layer this packet depends on for admin guards, filter normalization, and normalized responses.
  - [`sql/setup.sql`](https://github.com/intesarjawad/hive/blob/main/sql/setup.sql): Base schema file that creates the orders data this packet queries.

### Storage, data, and behavior

- Tables this packet relies on:
  - `orders`
- Current behavior to preserve:
  - this is the admin-wide order search surface, not the buyer or seller order tracking UI
  - if system settings or feature flags are not built yet, the order explorer should still remain independently buildable

---

## P44.1 Admin Settings and Feature Flags

**Broader Feature:** `Admin + Feature Flags`
**Search Tags:** `admin settings, feature flags, public settings, docs flag, system settings`
**What This Feature Does:** Lets admins change site settings and feature flags, and exposes the public settings the frontend reads.
**Related Packets / Adjacent Work:** `P04` for route gates and impersonation-aware shell behavior, `P16` to `P18` for discover-feature gating, `P26` to `P32` for messaging feature gating, `P42` and `P44` for the rest of the admin console.
**This Packet Is Settings And Flags Only:** This is only the admin settings and flag work. It is not the whole admin backend by itself.

This is the settings-and-flags packet. It is intentionally separate from order search.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Admin.tsx`, `src/lib/features.ts`, and `src/components/FeatureRoute.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/lib/api.ts`, `src/lib/auth.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Admin.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Admin.tsx): Admin console tab set that contains the settings and feature-toggle controls.
  - [`src/lib/features.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/features.ts): Feature-flag loader that keeps gated frontend routes and pages aligned with backend settings.
  - [`src/components/FeatureRoute.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/FeatureRoute.tsx): Route-level feature gate that consumes the public settings payload this packet defines.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Fetch wrapper this packet uses for admin settings writes and public settings reads.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): Current-user session store this packet uses for admin access and feature refresh behavior.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Route contract this packet depends on because feature flags control route visibility.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/admin/settings.php` and `api/settings/public.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/migrate-system-settings.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/admin/settings.php`](https://github.com/intesarjawad/hive/blob/main/api/admin/settings.php): Admin endpoint for system settings writes and feature-toggle management.
  - [`api/settings/public.php`](https://github.com/intesarjawad/hive/blob/main/api/settings/public.php): Public settings endpoint that exposes the approved frontend-readable feature flag contract.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Shared backend helper layer this packet depends on for admin guards, settings normalization, and public-flag filtering.
  - [`sql/migrate-system-settings.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-system-settings.sql): Migration script introducing the `system_settings` table this packet writes and reads.

### Storage, data, and behavior

- Tables this packet relies on:
  - `system_settings`
- Current behavior to preserve:
  - public feature flags are sourced from admin settings rather than being hardcoded in the frontend
  - the `docs` feature flag is what allows this internal docs workspace to appear at all
  - current public flags do not gate orders, wallet, notifications, or admin itself

---

## P45. Docs, Sprint Page, and Legal Pages

**Broader Feature:** `Docs & Legal`
**Search Tags:** `docs page, sprints page, safety, terms, privacy, team agreement`
**What This Feature Does:** Covers the docs pages, sprint pages, and legal or policy pages.

This is the informational-content packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/Docs.tsx`, `src/pages/Sprints.tsx`, and `src/pages/Safety.tsx`. Start there before touching anything else.
> - **If the page is not showing yet:** Open HiveFive's `src/routes.tsx`. Add only the route line and import for this packet, or uncomment the line that is already there. Do **not** replace the whole routes file with Hive's version.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/components/NavBar.tsx`, `src/lib/features.ts`, and `src/routes.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/pages/Docs.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Docs.tsx): In-app markdown documentation portal loading files from docs folder. Mirror builders only need the actual docs reader/search experience here, not any Hive-only internal team tracking add-ons that may exist in the reference repo.
  - [`src/pages/Sprints.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Sprints.tsx): Sprint dashboard page rendering work-distribution markdown docs.
  - [`src/pages/Safety.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Safety.tsx): Static safety guidelines page for platform trust rules.
  - [`src/pages/Terms.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Terms.tsx): Static terms-of-service page rendered in app shell.
  - [`src/pages/Privacy.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Privacy.tsx): Static privacy policy page rendered within app shell.
  - [`src/pages/TeamAgreement.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/TeamAgreement.tsx): Internal team agreement page restricted to admin role.
  - [`src/pages/NotFound.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/NotFound.tsx): Catch-all 404 route component for unknown paths.
- Required support files:
  - [`src/components/NavBar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/NavBar.tsx): Signed-in app chrome that exposes entry points into this packet and carries the shared account and notification menus users expect.
  - [`src/lib/features.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/features.ts): Feature-flag loader that keeps this packet aligned with backend toggles so hidden or disabled features behave like live Hive.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Central route map and redirect contract this packet relies on for navigation targets, query params, and guard behavior.
  - [`docs/*.md`](https://github.com/intesarjawad/hive/tree/main/docs): Markdown documentation source files rendered or referenced by the in-app docs and sprint views.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/settings/public.php`. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **If SQL is listed:** Add only the table, column, index, or seed lines this packet needs. Do **not** replace HiveFive's whole schema with Hive's schema.
> - **What the other files mean:** `api/helpers.php` and `sql/migrate-system-settings.sql` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- Primary files:
  - [`api/settings/public.php`](https://github.com/intesarjawad/hive/blob/main/api/settings/public.php): Public settings read endpoint that sends the feature flags the frontend uses to decide whether this packet should render at all.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.
  - [`sql/migrate-system-settings.sql`](https://github.com/intesarjawad/hive/blob/main/sql/migrate-system-settings.sql): Migration script introducing system_settings feature-toggle table.

### Storage, data, and behavior

- Current behavior to preserve:
  - docs availability is tied to the `docs` feature flag
  - `src/pages/Sprints.tsx` links directly into `/docs/mirror-rebuild-guide`
  - this packet also depends on the markdown files under `docs/`, not just the React pages
  - any private Hive-only docs assignment tracker or delivery-board layer is explicitly out of scope for the rebuild and should not be mirrored

---

## P46. Default Service Images

**Broader Feature:** `Service Media Library`
**Search Tags:** `service image library, fallback images, seeded assets, marketplace media`
**What This Feature Does:** Provides the default service images used when real uploaded images are missing.

This is the fallback-image packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/lib/assetUrl.ts`, `src/components/ServiceCard.tsx`, and `src/pages/ServiceDetail.tsx`. Start there before touching anything else.
> - **Route note:** This packet usually does not need its own route. Do not create extra route code unless this packet clearly needs a new screen in HiveFive.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** `src/pages/Discover.tsx`, `src/pages/SearchResults.tsx`, and `src/pages/UserProfile.tsx` are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`src/lib/assetUrl.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/assetUrl.ts): Resolves uploaded-versus-fallback asset paths so this packet can render media correctly across local, deployed, and proxy runtime environments.
  - [`src/components/ServiceCard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ServiceCard.tsx): Reusable service card with thumbnail/media fallback behavior on Discover services tab.
  - [`src/pages/ServiceDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ServiceDetail.tsx): Booking CTA entry point into order creation flow.
- Required support files:
  - [`src/pages/Discover.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Discover.tsx): Marketplace surface that consumes the static service-image library whenever uploaded listing media is missing.
  - [`src/pages/SearchResults.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/SearchResults.tsx): Unified search-results page that also falls back to the shared service-media library for listing imagery.
  - [`src/pages/UserProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/UserProfile.tsx): Public profile page that surfaces listed services whose cards may depend on fallback media from the service library.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are the backend support files listed below. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **If `api/helpers.php` is listed:** Be extra careful. That file is shared by many features. Add only the helper/check/validation this packet needs. Do **not** paste over the whole helper file.
> - **What the other files mean:** `api/helpers.php` are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- There is no dedicated API endpoint for the library itself.
- Backend consumers:
  - [`api/services/list.php`](https://github.com/intesarjawad/hive/blob/main/api/services/list.php): Service endpoint for discover feed with filters, sort, and pagination.
  - [`api/services/get.php`](https://github.com/intesarjawad/hive/blob/main/api/services/get.php): Single-service read endpoint whose media paths rely on the same uploaded-versus-fallback asset rules as the listing views.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Base PHP helper file every listed endpoint depends on for session guards, validation, JSON responses, feature checks, upload paths, and shared business rules.

### Storage, data, and behavior

- Directories this packet relies on:
  - [`public/services/png`](https://github.com/intesarjawad/hive/tree/main/public/services/png): PNG fallback image library for seeded or demo services when uploaded media is unavailable.
  - [`public/services/webp`](https://github.com/intesarjawad/hive/tree/main/public/services/webp): WEBP service image library used by seeded listings and frontend fallback logic.
- Current behavior to preserve:
  - the UI uses this library as a fallback chain when uploaded service media is missing
  - if the mirror build wants visual parity, do not skip this library

---

## P47. Built Files and Deploy Output

**Broader Feature:** `Build Output`
**Search Tags:** `build artifacts, production output, compiled assets, build index`
**What This Feature Does:** Explains the built output files and makes clear that they are not the real source files.

This is the generated-output packet. It is not the source-of-truth packet.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** This packet usually does **not** mean making a brand-new page. Your job is to make the small frontend pieces this packet needs work in HiveFive.
> - **Route note:** This packet usually does not need its own route. Do not create extra route code unless this packet clearly needs a new screen in HiveFive.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small missing part for this packet. Do **not** overwrite the whole file, because HiveFive may already have teammate fixes or project-specific changes.
> - **What the other files mean:** the extra files listed below are helper files this packet uses. Check that the needed piece exists and works, but do **not** assume you are supposed to rewrite all of them.

- Primary files:
  - [`build/index.html`](https://github.com/intesarjawad/hive/blob/main/build/index.html): Generated deployment entry produced by the build pipeline; inspect it only to understand output shape, not to implement features.
  - [`build/assets/*`](https://github.com/intesarjawad/hive/tree/main/build/assets): Compiled JS and CSS bundles emitted from source; they show what ships, but they are not the place to build or review feature logic.
- Required support files:
  - output copied from `public/services/*`
  - output copied from the Vite build pipeline

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are the backend support files listed below. Start there before touching anything else.
> - **If HiveFive already has that backend file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the small packet-specific part you need. Do **not** replace the whole file.
> - **Extra runtime warning:** Files like `api/db_config.example.php`, `Dockerfile`, and startup scripts may be different in HiveFive for deployment reasons. Only copy the exact part this packet needs.
> - **What the other files mean:** the extra backend files listed below are support files this packet depends on. Make sure the needed piece exists, but do **not** assume you own rewriting those files.

- There are no feature endpoints here.
- Deployment still depends on:
  - [`Dockerfile`](https://github.com/intesarjawad/hive/blob/main/Dockerfile): Multi-stage image that builds Vite frontend and serves with PHP plus Apache.
  - [`docker-entrypoint.sh`](https://github.com/intesarjawad/hive/blob/main/docker-entrypoint.sh): Container startup script that writes runtime db_config.php and starts Apache.

### Storage, data, and behavior

- `build/` is generated output.
- Mirror builders should treat source files in `src/`, `api/`, `sql/`, `public/`, and `docs/` as canonical.
- Do not assign `build/` as a primary implementation branch. Rebuild it from source with the normal frontend build process.
- If the mirror deployment later needs Apache rewrite rules outside Docker, add that as a deployment concern deliberately; there is no tracked repo `.htaccess` file in the current codebase.

---

## P48. AI-Assisted Service Descriptions

**Broader Feature:** `AI Features`
**Search Tags:** `ai rewrite, ai polish, ai suggest, openrouter, service description, included items`
**What This Feature Does:** Gives providers an AI-powered polish button inside the service description editor that rewrites their draft into professional copy, plus an AI-suggest button that auto-generates what's-included items based on the service category and title.

This is the AI writing assist packet. It covers both the rewrite and suggest flows.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file(s) you should work in first are `src/pages/PostService.tsx` and `src/pages/EditService.tsx`. The AI features are embedded inside the description step of the service wizard, not on a separate page.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side in VS Code. Copy only the AI-specific parts (the polish button, suggest link, loading states, and API calls). Do **not** overwrite the whole file.

- Primary files:
  - [`src/pages/PostService.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/PostService.tsx): Service posting wizard — the description step contains the AI Polish button and AI Suggest link.
  - [`src/pages/EditService.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/EditService.tsx): Service editing wizard — mirrors the same AI Polish and AI Suggest features from the post flow.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Cookie-aware fetch wrapper used for the AI endpoint calls.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file(s) you should work in first are `api/services/ai-rewrite.php` and `api/services/ai-suggest-included.php`.
> - **Environment config:** This feature requires an OpenRouter API key configured at deploy time. See `api/ai_config.example.php` for the expected shape. The `docker-entrypoint.sh` generates `api/ai_config.php` from the `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` environment variables.

- Primary files:
  - [`api/services/ai-rewrite.php`](https://github.com/intesarjawad/hive/blob/main/api/services/ai-rewrite.php): Authenticated endpoint that rewrites a user-provided service description draft via OpenRouter, scoped to the service category and title. Guardrailed to reject off-topic abuse.
  - [`api/services/ai-suggest-included.php`](https://github.com/intesarjawad/hive/blob/main/api/services/ai-suggest-included.php): Authenticated endpoint that generates suggested what's-included items based on service category and title.
  - [`api/ai_config.example.php`](https://github.com/intesarjawad/hive/blob/main/api/ai_config.example.php): Example config file showing the `$OPENROUTER_API_KEY` and `$OPENROUTER_MODEL` variables needed by the AI endpoints.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Shared helper layer for session guards, JSON responses, and validation.
  - [`docker-entrypoint.sh`](https://github.com/intesarjawad/hive/blob/main/docker-entrypoint.sh): Container startup script — now also generates `api/ai_config.php` from environment variables.

### Storage, data, and behavior

- No new tables. AI features are stateless request/response flows.
- Current behavior to preserve:
  - AI endpoints require authentication
  - AI endpoints return graceful fallback when `ai_config.php` is missing (feature disabled message, not a crash)
  - The rewrite prompt is guardrailed to prevent off-topic abuse (math homework, essay writing, etc.)
  - Both PostService and EditService have identical AI button styling using brand honey tones, not purple/violet

---

## P49. Username Selection During Signup

**Broader Feature:** `Authentication`
**Search Tags:** `username, signup username, username availability, username check`
**What This Feature Does:** Adds a username chooser to the signup form with real-time availability checking against the backend.

This is an enhancement to the existing P05 signup packet.

### Frontend

- Primary files:
  - [`src/pages/Signup.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Signup.tsx): Registration form — now includes a username input field with debounced availability checking.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Used for the username availability check call.

### Backend

- Primary files:
  - [`api/auth/signup.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/signup.php): Signup endpoint — now accepts and validates an explicit `username` field instead of always deriving it from the email local-part.
  - [`api/auth/check-username.php`](https://github.com/intesarjawad/hive/blob/main/api/auth/check-username.php): Unauthenticated endpoint that checks whether a username is available, used for real-time validation in the signup form.

### Storage, data, and behavior

- Tables: `users` (existing `username` column)
- Current behavior to preserve:
  - Username must be unique
  - Availability check is debounced on the frontend (not called on every keystroke)
  - Username must match `^[a-zA-Z0-9_.-]+$` and stay at or under 50 characters
  - Signup now requires an explicit username; the backend does not fall back to the email local-part if the field is missing

---

## P50. Onboarding

**Broader Feature:** `Onboarding & Identity`
**Search Tags:** `onboarding, profile setup, major, year, bio, avatar upload, first-time user, onboarding_done`
**What This Feature Does:** First-time setup flow that new users land on after signup. Collects profile photo, bio, major, and academic year before releasing the user into the app. The page redirects already-onboarded users to Discover automatically.

This is the full onboarding packet. It covers the page, the backend endpoint, the avatar upload during onboarding, and the field validation that prevents users from skipping required info.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The main file is `src/pages/Onboarding.tsx`. It is a standalone page with its own minimal nav (just the HiveFive logo, no full NavBar).
> - **Route note:** The route already exists at `/onboarding`. Authenticated users with `onboarding_done === false` are redirected here by the auth layer.
> - **If HiveFive already has this file:** Open the Hive file and the HiveFive file side by side. Copy only the missing pieces. Do not overwrite the whole file.

- Primary files:
  - [`src/pages/Onboarding.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Onboarding.tsx): The onboarding page. Contains a card with four fields: profile photo upload (optional), bio textarea with 200-char limit (optional), major text input (required, red asterisk), and academic year dropdown (required, red asterisk). The Complete Setup button is disabled until both required fields are filled. Client-side validation shows inline error messages. On success, shows a "Welcome to the hive!" toast and redirects to Discover after a 1-second delay. Redirects to Discover if the user has already completed onboarding.
- Required support files:
  - [`src/components/Avatar.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/Avatar.tsx): Renders the user's avatar preview during photo upload.
  - [`src/components/CustomSelect.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CustomSelect.tsx): Styled dropdown used for the year selector (Freshman through Graduate).
  - [`src/components/CharacterLimitHint.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/CharacterLimitHint.tsx): Shows remaining character count below the bio and major fields.
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): `apiPost` for the onboarding submission and avatar upload. `ApiError` class for error handling.
  - [`src/lib/auth.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/auth.ts): `useAuth` hook providing `user`, `loading`, and `refreshUser`. The `onboarding_done` flag drives the redirect logic.
  - [`src/lib/fileUploads.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/fileUploads.ts): `isSupportedImageFile`, `readFileAsDataUrl`, `resolveUploadMimeType`, and `SERVICE_IMAGE_ACCEPT` for the photo upload flow.
  - [`src/routes.tsx`](https://github.com/intesarjawad/hive/blob/main/src/routes.tsx): Route entry at `/onboarding`.

### Backend

> [!WARNING]
> **Before you touch the backend for this packet**
> - **Start here:** The main backend file is `api/users/onboarding.php`.
> - **Avatar upload:** The photo upload button calls `api/users/upload-avatar.php`, which is shared with the profile settings page. Make sure that endpoint exists.

- Primary files:
  - [`api/users/onboarding.php`](https://github.com/intesarjawad/hive/blob/main/api/users/onboarding.php): Authenticated POST endpoint. Accepts `major`, `year`, and `bio`. Validates that `major` is non-empty and `year` is one of the five allowed values (Freshman, Sophomore, Junior, Senior, Graduate). Sets `onboarding_done = 1` on the user row. Returns the full updated user object. Returns `422` with user-friendly messages on validation failure.
  - [`api/users/upload-avatar.php`](https://github.com/intesarjawad/hive/blob/main/api/users/upload-avatar.php): Authenticated POST endpoint for base64 image upload. Shared with profile settings. Used here to upload the optional profile photo during onboarding.
- Required support files:
  - [`api/helpers.php`](https://github.com/intesarjawad/hive/blob/main/api/helpers.php): Shared helper layer for `cors()`, `require_method()`, `require_auth()`, `get_json_body()`, `json_response()`, and `university_from_email()`.

### Storage, data, and behavior

- Tables: `users` (columns: `major`, `year`, `bio`, `onboarding_done`, `profile_image`)
- Current behavior to preserve:
  - `onboarding_done` is a boolean flag. When `0`, the auth layer redirects the user to `/onboarding`. When `1`, the onboarding page itself redirects to `/discover`.
  - `major` must not be empty (server returns 422)
  - `year` must be one of the five allowed academic year values (server returns 422)
  - `bio` is optional, max 200 characters
  - Profile photo is optional, max 5MB, validated client-side for file type
  - The generic API error message is user-friendly ("Something went wrong — please try again"), not a raw internal path
  - On successful onboarding, the user object is refreshed via `refreshUser()` so the auth context picks up `onboarding_done = true` and stops redirecting

---

## P51. Content Filter

**Broader Feature:** `Trust & Safety`
**Search Tags:** `profanity filter, content filter, external links, spam links, url filter`
**What This Feature Does:** Client-side render-time sanitizer for user-generated text. It masks profanity and replaces external URLs with `[link removed]`, while allowing internal HiveFive platform links to display normally.

### Frontend

- Primary files:
  - [`src/lib/contentFilter.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/contentFilter.ts): Content sanitization utility with profanity masking and external URL suppression. Whitelists internal hosts such as `aptitude.cse.buffalo.edu`, `cattle.cse.buffalo.edu`, and `hivefive.app`.
- Surfaces that use it:
  - [`src/pages/ServiceDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ServiceDetail.tsx): Sanitizes service titles, descriptions, included-item text, review comments, and provider bio before rendering.
  - [`src/pages/RequestDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/RequestDetail.tsx): Sanitizes request titles, descriptions, and proposal messages before rendering.
  - [`src/pages/MyProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/MyProfile.tsx): Sanitizes the signed-in user's profile bio, services, and review text.
  - [`src/pages/UserProfile.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/UserProfile.tsx): Sanitizes public profile bio, services, and reviews.
  - [`src/pages/Discover.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Discover.tsx): Sanitizes request cards in discovery lists.
  - [`src/pages/Dashboard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Dashboard.tsx): Sanitizes request summaries in dashboard views.
  - [`src/pages/Messages.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Messages.tsx): Sanitizes conversation preview text.
  - [`src/components/ServiceCard.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ServiceCard.tsx): Sanitizes card title and provider text.
  - [`src/components/ProposalModal.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ProposalModal.tsx): Sanitizes request title and description in the booking modal.

### Backend

- No backend component. This is a client-side-only filter.

### Storage, data, and behavior

- Current behavior to preserve:
  - Profanity list covers common offensive terms and masks them in displayed text
  - External URLs are replaced with `[link removed]` in displayed text
  - Internal platform URLs pass through cleanly for allowed hosts
  - This packet does not block submission and does not return validation errors; it only sanitizes what the UI renders

---

## P52. Supply-Demand Matching

**Broader Feature:** `Services Marketplace`
**Search Tags:** `matching, supply demand, matching requests, matching providers, request detail providers`
**What This Feature Does:** Connects requesters with relevant service providers, and service owners with matching open requests. Requesters see potential providers on their request detail page. Service owners see matching requests on their own service detail page.

### Frontend

- Primary files:
  - [`src/pages/RequestDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/RequestDetail.tsx): Request detail page — now shows a "Providers you can reach out to" section visible only to the request owner, listing services in the same category with links to their detail pages.
  - [`src/pages/ServiceDetail.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ServiceDetail.tsx): Service detail page — the matching-requests section is now only visible to the service owner (not to visitors).
  - [`src/pages/ServicePublished.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/ServicePublished.tsx): Post-publish confirmation page — shows matching requests to the newly published service owner.
- Required support files:
  - [`src/lib/api.ts`](https://github.com/intesarjawad/hive/blob/main/src/lib/api.ts): Used to fetch matching services/requests by category.

### Backend

- No new endpoints. The matching uses existing `services/list.php?category=...` and `requests/list.php?category=...` endpoints filtered by category.

### Storage, data, and behavior

- Current behavior to preserve:
  - On RequestDetail: matching providers are only visible to the request owner
  - On ServiceDetail: matching requests are only visible to the service owner
  - Matching is done by category (same category = potential match)
  - Styling uses brand honey tones, not purple/violet

---

## P53. Dark Mode

**Broader Feature:** `Appearance & Theming`
**Search Tags:** `dark mode, theme toggle, light mode, system theme, next-themes, color scheme`
**What This Feature Does:** Full dark mode support with a three-way toggle (Light, Dark, System) in Settings. The entire color system inverts cleanly: backgrounds go from cream to near-black, text flips from charcoal to light grey, and the honey accent palette shifts to warmer tones that read well on dark surfaces.

This is the theming packet. It touches the design system root, the app shell, the settings page, and the toast system.

### Frontend

> [!IMPORTANT]
> **Before you touch the frontend for this packet**
> - **Start here:** The theming infrastructure lives in three places: the CSS custom properties in `globals.css`, the `ThemeProvider` wrapper in `App.tsx`, and the toggle UI in `Settings.tsx`. All three must be present for dark mode to work.
> - **If HiveFive already has these files:** Open the Hive file and the HiveFive file side by side. Copy only the dark-mode-specific parts (the `.dark` block in CSS, the `ThemeProvider` wrapper, the appearance section in Settings). Do not overwrite the whole file.

- Primary files:
  - [`src/styles/globals.css`](https://github.com/intesarjawad/hive/blob/main/src/styles/globals.css): Design system root. Contains the `:root` light-mode tokens and the `@custom-variant dark` directive that Tailwind v4 uses to scope dark styles. The `.dark` class block in the compiled `index.css` inverts every color token (honey, charcoal, cream, semantic colors, and all ShadCN mappings like `--background`, `--foreground`, `--card`, `--border`, etc.).
  - [`src/App.tsx`](https://github.com/intesarjawad/hive/blob/main/src/App.tsx): Wraps the entire app in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` from `next-themes`. This adds or removes the `.dark` class on the `<html>` element based on the user's preference.
  - [`src/pages/Settings.tsx`](https://github.com/intesarjawad/hive/blob/main/src/pages/Settings.tsx): Appearance section with a three-option grid (Light, Dark, System). Each option shows a mini color preview swatch. The active choice gets a honey border. A status line below reads "Currently using dark/light mode (based on your system preference)" when System is selected.
- Required support files:
  - [`src/components/ui/sonner.tsx`](https://github.com/intesarjawad/hive/blob/main/src/components/ui/sonner.tsx): Toast component that reads `resolvedTheme` from `next-themes` to render toasts with the correct color scheme.
  - `next-themes` package in `package.json`

### Backend

- No backend component. Dark mode is entirely client-side.

### Storage, data, and behavior

- Theme preference is persisted in `localStorage` by `next-themes` (key: `theme`). No database column needed.
- Current behavior to preserve:
  - Three options: Light, Dark, System. System follows the OS `prefers-color-scheme` media query.
  - The `.dark` class is applied to the `<html>` element, not `<body>`.
  - Every page must render correctly in both modes. The token inversion in CSS handles most of it automatically, but any component using hardcoded hex values instead of CSS variables will break.
  - The honey accent (`--honey-500`) stays amber in both modes, but its surrounding tones shift (lighter tones get darker, darker tones get lighter) so contrast ratios hold.
  - Toasts (sonner) respect the resolved theme

---

## Recommended Packet Ownership

If you are splitting work across very junior devs, use packets like this instead of handing them giant verticals:

- Dev 1: `P00` to `P10`
- Dev 2: `P11` to `P25`
- Dev 3: `P26` to `P37`
- Dev 4: `P38` to `P44`
- Dev 5: `P45` to `P47` plus testing/integration glue
- Dev 6: `P48` to `P53` (April 2 enhancements)

## Final reminder

If a dev says “the guide is wrong because this one file does not work by itself,” the answer should usually be:

- they did not bring the support files listed in that packet, or
- they took the page but skipped the backend contract, or
- they took the UI but skipped the shared payload/cosmetics/feature-flag/session dependencies.

That is exactly why this document now repeats files so aggressively.
