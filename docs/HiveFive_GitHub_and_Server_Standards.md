# HiveFive — GitHub & Server Standards Guide

**Repo:** `https://github.com/cse442-software-engineering-ub/s26-hivefive`

This guide covers everything you need to know about Git workflow, branch rules, commit standards, pull requests, and deploying to the UB servers. Follow this exactly — the rubric is unforgiving and you **will** lose points for mistakes here.

---

## Part 0: Setting Up Git on Your Machine (Do This First)

If you've never used Git before, or you're not sure what account you're using, **start here**. Do not skip this. Do not assume it's fine. Check.

### 0.1 — Install Git

**Mac:**
Git comes pre-installed on most Macs. Open Terminal and type:
```bash
git --version
```
If it shows a version number, you're good. If it asks you to install developer tools, say yes and let it install.

**Windows:**
Download Git from https://git-scm.com/downloads and install it. Use all the default options. Once installed, open **Git Bash** (not Command Prompt, not PowerShell — Git Bash). That's your terminal for all Git commands.

**Linux:**
```bash
sudo apt update && sudo apt install git
```

### 0.2 — Check What Identity Git Is Using RIGHT NOW

This is the step people skip and then wonder why their commits show up as some random account. Open your terminal and run:

```bash
git config --global user.name
git config --global user.email
```

This will print the name and email that Git attaches to every commit you make. **This is how the professor, the PM, and the rubric know who did what.**

If it prints nothing, or prints the wrong name/email, or prints your personal email instead of your UB email, or prints your cat's name from when you were messing around in CSE 116 — fix it now:

```bash
git config --global user.name "Your Actual Name"
git config --global user.email "your_ubit@buffalo.edu"
```

Use your **real name** (the one the professor has on the roster) and your **UB email**. Not a nickname. Not a burner email. Not your gaming handle.

### 0.3 — Verify You Can Access the Repo

Go to https://github.com/cse442-software-engineering-ub/s26-hivefive in your browser.

Can you see it? If yes, great. If it says 404 or you get a permission error, you're either not logged in to the right GitHub account or you haven't been added to the organization. Message the PM or the professor.

**Check which GitHub account you're logged into.** Click your profile icon in the top-right corner of GitHub. Does the username match what you think it is? If you have multiple GitHub accounts (personal, school, etc.), make sure you're using the one that was added to the `cse442-software-engineering-ub` organization. Commits from an account that isn't part of the org won't be attributed to you — the professor will see contributions from a stranger and you'll get zero credit for your work.

### 0.4 — Set Up Authentication (So You Can Push)

GitHub no longer allows password authentication for Git operations. You need either SSH keys or a Personal Access Token.

**Option A: HTTPS + Personal Access Token (Easier for beginners)**

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like `CSE442`
4. Set expiration to the end of the semester
5. Check the `repo` scope (full control of private repositories)
6. Click "Generate token"
7. **COPY THE TOKEN IMMEDIATELY.** You will never see it again.

When you clone the repo or push for the first time, Git will ask for your username and password. Enter your **GitHub username** and paste the **token** as the password (not your GitHub password).

To avoid entering it every time:
```bash
git config --global credential.helper store
```
This saves your credentials after the first use. (On Mac, you can use `osxkeychain` instead of `store`.)

**Option B: SSH Key (Better long-term, slightly more setup)**

```bash
# Generate a key (press Enter for all defaults)
ssh-keygen -t ed25519 -C "your_ubit@buffalo.edu"

# Start the SSH agent
eval "$(ssh-agent -s)"

# Add your key
ssh-add ~/.ssh/id_ed25519

# Copy the public key
cat ~/.ssh/id_ed25519.pub
```

Copy the output, then go to GitHub → Settings → SSH and GPG keys → New SSH key. Paste it and save.

Test it:
```bash
ssh -T git@github.com
```
If it says "Hi [your_username]! You've successfully authenticated," you're golden.

### 0.5 — Clone the Repo

Now you can actually get the project onto your machine.

**If you used HTTPS (Option A):**
```bash
cd ~/Desktop    # or wherever you want the project folder
git clone https://github.com/cse442-software-engineering-ub/s26-hivefive.git
cd s26-hivefive
```

**If you used SSH (Option B):**
```bash
cd ~/Desktop
git clone git@github.com:cse442-software-engineering-ub/s26-hivefive.git
cd s26-hivefive
```

### 0.6 — Verify Everything Is Correct

Run this inside the cloned repo:

```bash
git config user.name
git config user.email
git remote -v
```

You should see:
- Your **real name**
- Your **UB email** (your_ubit@buffalo.edu)
- The remote pointing to `s26-hivefive`

If any of these are wrong, fix them before you write a single line of code:

```bash
# These set the identity ONLY for this repo (overrides global)
git config user.name "Your Actual Name"
git config user.email "your_ubit@buffalo.edu"
```

### 0.7 — Make Sure You're on Dev

```bash
git checkout dev
git pull origin dev
```

You should now have the latest version of the `dev` branch on your machine. **You are now ready to start working.** Go to Part 3 to learn how to create your task branch.

### 0.8 — The "Am I Good?" Checklist

Before you do anything else, confirm ALL of these:

- [ ] Git is installed and `git --version` works
- [ ] `git config --global user.name` shows your real name
- [ ] `git config --global user.email` shows your UB email
- [ ] You can see the repo at https://github.com/cse442-software-engineering-ub/s26-hivefive when logged in
- [ ] The GitHub account you're logged into is the one added to the cse442 organization
- [ ] You've cloned the repo to your local machine
- [ ] `git remote -v` inside the repo shows the correct URL
- [ ] `git checkout dev` works without errors
- [ ] You can `git pull origin dev` without authentication errors

If any of these fail, **stop and fix it before proceeding.** Do not start coding. Do not pass Go. Do not collect 200 HiveCoins.

---

## Part 1: The Golden Rules

Before anything else, internalize these. They're non-negotiable.

1. **NEVER commit directly to `main` or `dev`.** Not once. Not even a typo fix. Not even a README update. Never.
2. **Every task gets its own branch** created off of `dev`.
3. **Every branch merges back to `dev` via a pull request** — never by pushing directly.
4. **Only the PM merges `dev` into `main`** at the end of each sprint.
5. **Broken code on your branch is fine.** Commit early, commit often. Your branch is your sandbox.

---

## Part 2: Understanding the Branch Structure

Think of it like a highway system:

```
main          ← The "released" product. Updated ONLY at sprint end by the PM.
  │
  └── dev     ← All completed + tested work for the current sprint lives here.
       │
       ├── #12_create-login-page       ← Your task branch (you work here)
       ├── #13_setup-user-database     ← Another teammate's task branch
       └── #14_design-navbar           ← Another task branch
```

**`main`** = What the client/professor sees. This is what's on `cattle` (the production server). Only updated at sprint end.

**`dev`** = The integration branch. When you finish a task and it passes all tests, you merge your branch into `dev` via a pull request. This is what's on `aptitude` (the test server).

**Task branches** = Where you actually write code. One branch per task. Named with the task card number.

---

## Part 3: How to Work on a Task (Step by Step)

### 3.1 — Create Your Branch

When you're assigned a task and move it to "In Progress" on the Scrum board:

```bash
# Make sure you're on dev and it's up to date
git checkout dev
git pull origin dev

# Create your task branch
# Format: #<card_number>_<short-description>
git checkout -b "#12_create-login-page"
```

The branch name **must** contain the task's card number and a description. This is a rubric requirement — the professor and PM need to trace branches back to task cards.

**Good branch names:**
- `#12_create-login-page`
- `#25_setup-users-table`
- `#7_api-endpoint-fetch-services`

**Bad branch names:**
- `my-feature` (no card number)
- `fix` (meaningless)
- `johns-work` (what work?)

### 3.2 — Make Regular Commits

Don't write 500 lines and then make one giant commit. Commit as you go — every meaningful chunk of progress.

```bash
git add .
git commit -m "Add login form HTML structure"
```

**Commit message rules:**

The first line (the subject) should be **50 characters max** and describe *why* the commit matters. If you need more detail, leave a blank line and add a description body.

```
Add password validation to login form

Checks for minimum 8 characters and at least one
special character. Shows inline error if invalid.
```

**Good commit messages:**
- `Add user table schema with email column`
- `Fix navbar not rendering on mobile`
- `Connect login form to PHP backend`

**Bad commit messages:**
- `update` (update what?)
- `fix stuff` (what stuff?)
- `asdfasdf` (come on)
- `done` (done with what?)

If your commit breaks something or has side effects, say so in the description. This isn't shameful — it's expected. You're on your own branch, nobody else is affected.

### 3.3 — Push Your Branch

```bash
git push origin "#12_create-login-page"
```

Push frequently. If your laptop dies, your work is safe on GitHub. If you haven't pushed in 2 days, you're doing it wrong.

### 3.4 — Link the Branch to Your Task Card

On the Scrum board, add a link to your branch on your task card. This is a rubric requirement — every task that creates, updates, or deletes files must link to its branch.

### 3.5 — Create a Pull Request When Done

Once your task is complete and passes all task tests:

1. Go to the repo on GitHub
2. You'll likely see a banner saying your branch has recent pushes — click **"Compare & pull request"**
3. Make sure it says: `base: dev` ← `compare: #12_create-login-page`
4. Write a clear title and description:

**Title:** `#12 — Create login page with form validation`

**Description:**
```
## What this does
Adds the login page with email/password fields and client-side validation.

## How to test
1. Navigate to /login
2. Try submitting with empty fields — should show error
3. Enter valid credentials — should redirect to dashboard

## Task card
[Link to task card on Scrum board]
```

5. Submit the PR. Your PM or a teammate reviews and merges it into `dev`.
6. Add the PR link to your task card on the Scrum board.
7. Move the task card to "Completed."

### 3.6 — What If You Find a Bug After Merging?

Don't panic. Use the **same branch** to fix it:

```bash
git checkout "#12_create-login-page"
git pull origin dev          # get latest dev changes
# fix the bug
git add .
git commit -m "Fix login redirect failing on empty session"
git push origin "#12_create-login-page"
```

Then create a **second pull request** to merge the fix into `dev`. Move the task card back to "In Progress" until the fix is merged.

---

## Part 4: Branch Protection Rules

The PM needs to set up two rulesets in the repo's Settings → Rules → Rulesets. If this isn't done yet, ask your PM to do it immediately.

### Ruleset 1: "no-touchy"

Applies to: `main` and `dev`

Rules enabled:
- Restrict deletions (can't delete these branches)
- Require a pull request before merging (no direct pushes)
- Block force pushes (no rewriting history)

### Ruleset 2: "no-push-to-main"

Applies to: `main` only

Bypass list: Organization admin (the PM)

Rules enabled:
- Restrict updates (nobody but the PM can merge into main)

This means even if you accidentally try to push to `main`, GitHub will block you. That's the point.

---

## Part 5: The Two Servers — Aptitude & Cattle

The course uses two separate servers that mirror real-world dev/test and production environments. Both require UB VPN or campus network access.

### Aptitude (Test Server)

- **URL:** `https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/`
- **Purpose:** Integration testing during the sprint. This is your "staging" environment.
- **Maps to:** The `dev` branch in your repo.
- **When to update:** Whenever a PR is merged into `dev`. Keep this as current as possible.
- **Task tests** are written against and run on aptitude.

### Cattle (Production Server)

- **URL:** `https://cattle.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/`
- **Purpose:** The "released" version of your app. This is what the professor grades.
- **Maps to:** The `main` branch in your repo.
- **When to update:** ONLY at the end of a sprint, after the PM merges `dev` → `main`.
- **Acceptance tests** are written against and run on cattle.

### How to Deploy to the Servers

There's a single **interactive deploy script** in the repo root that handles everything — it asks you a few questions, then pulls the latest code, installs dependencies, builds, and uploads. You don't need to SSH into the servers manually. You just need to be on **VPN or campus network** for the upload.

Your team's files go in:
```
/data/web/CSE442/2026-Spring/cse-442j/
```

### Running the Deploy Script

**Mac/Linux:**
```bash
bash deploy.sh
```

**Windows:**
```
deploy.bat
```
(Or type `bash deploy.sh` in Git Bash)

The script will ask you:
1. **Your UBIT username** — so it knows who to authenticate as on the server
2. **Which server** — aptitude (test, default) or cattle (production, sprint end only)
3. **Which branch** — defaults to `dev` for aptitude, `main` for cattle, but you can pick any branch

It then shows you a summary of what it's about to do and asks for confirmation before proceeding. Every step prints what it's doing and why, so you always know what's happening.

You'll be prompted for your **UBIT password** (the SSH one, not your person number) during the upload step.

### When to Deploy Where

- **Aptitude (test):** After any PR is merged into `dev`. Deploy early, deploy often. This is where task tests run.
- **Cattle (production):** ONLY at sprint end, after the PM merges `dev` → `main`. This is what the professor grades. If you deploy to cattle mid-sprint, you will be hunted down.

### What the Deploy Script Does (Under the Hood)

```bash
git checkout <branch>        # Switch to the branch you picked
git pull origin <branch>     # Get the latest code from GitHub
npm install                  # Install/update dependencies
npm run build                # Build the Vite project into dist/
scp -r dist/* .htaccess \    # Upload built files to the server
  YOUR_UBIT@<server>.cse.buffalo.edu:/data/web/CSE442/2026-Spring/cse-442j/
# If an api/ folder exists, upload that too:
scp -r api \
  YOUR_UBIT@<server>.cse.buffalo.edu:/data/web/CSE442/2026-Spring/cse-442j/
```

The script uses `set -e`, which means if any step fails (pull fails, build fails, etc.) the whole script stops immediately. You won't accidentally upload a broken build.

### Project Structure on the Server

After a deploy, the server directory looks like this:

```
/data/web/CSE442/2026-Spring/cse-442j/
├── index.html          ← The React app entry point (from dist/)
├── assets/             ← JS, CSS bundles (from dist/)
├── favicon.svg         ← Site icon (from dist/)
├── .htaccess           ← Server config (from repo root)
└── api/                ← PHP backend (from repo root, if it exists)
    ├── config.php      ← DB connection settings
    ├── login.php       ← Example endpoint
    └── ...
```

The frontend (everything in `dist/`) is generated by the build step — you never edit these files directly. The `api/` folder is uploaded as-is from the repo, so PHP files you write locally are exactly what ends up on the server.

### Backend (PHP + MySQL)

The backend lives in an `api/` folder at the repo root. The deploy scripts automatically detect and upload this folder if it exists — no extra steps needed.

**Where to put PHP files:**
```
api/
├── config.php          ← DB connection (shared by all endpoints)
├── login.php           ← POST /api/login.php
├── register.php        ← POST /api/register.php
├── services.php        ← GET /api/services.php
└── ...
```

**Connecting to MySQL from PHP:**
```php
$host = "localhost";
$dbname = "cse442_2026_spring_team_j_db";
$username = "YOUR_UBIT";           // Use your own UBIT for local dev
$password = "YOUR_PERSON_NUMBER";  // 8-digit person number, NOT your UBIT password
```

The React frontend calls these endpoints via `fetch()`:
```js
const res = await fetch("/api/login.php", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
```

**Important:** The `config.php` with real credentials should be in `.gitignore` so passwords don't end up on GitHub. Each developer creates their own `config.php` locally, and the server gets one manually (this is the one exception where you SSH in — see Part 8).

### Important Notes

- **You must be on VPN or campus network** for the SCP upload to work.
- **Do NOT edit these scripts** to hardcode your UBIT. The whole point is that anyone on the team can run them.
- **The `.htaccess` file** is uploaded alongside the built files. It provides a fallback for server-side routing.
- **The `api/` folder** is automatically uploaded if it exists in the repo root. Backend devs just add PHP files there and the deploy script handles the rest.

### Database Reminder

Both servers have their own MySQL database. The credentials are different from SSH:

| | SSH | MySQL / phpMyAdmin |
|---|---|---|
| Username | UBIT username | UBIT username |
| Password | UBIT password | 8-digit person number |

phpMyAdmin URLs:
- **Aptitude:** `https://aptitude.cse.buffalo.edu/phpmyadmin/`
- **Cattle:** `https://cattle.cse.buffalo.edu/phpmyadmin/`

Database name on both: `cse442_2026_spring_team_j_db`

When your PHP code connects to the database, use `localhost` as the hostname — it connects to the MySQL on whichever server the code is running on.

---

## Part 6: What Will Get You Docked Points

The rubric is very specific. Here's what earns a 0 (Unsatisfactory) on the Git Repo section — any single one of these:

- **Any commit directly to `main`** — instant zero for the category
- **Any commit directly to `dev`** without a comment on GitHub acknowledging it was a mistake
- **Many commits to `dev`** (even with comments — a few mistakes are tolerated, a pattern is not)
- **A completed task whose branch wasn't merged via pull request** into dev
- **A branch merged into `dev` before its task was completed** (don't merge half-finished work)
- **Repo is disorganized** to the point a new developer couldn't find code, tests, or documents

To get the full "Exemplary" score you need ALL of these:

- Zero commits to `main`
- Zero (or very few, acknowledged) commits to `dev`
- Every completed task branch merged to `dev` via pull request
- No premature merges
- Repo is organized AND documented so a new developer could onboard

---

## Part 7: Quick Reference Cheat Sheet

### Starting a new task:
```bash
git checkout dev
git pull origin dev
git checkout -b "#<card_number>_<description>"
```

### Working on your task:
```bash
# Write some code...
git add .
git commit -m "Clear, concise message (50 chars max)"
git push origin "#<card_number>_<description>"
```

### Finishing a task:
```bash
# Make sure all task tests pass first!
git push origin "#<card_number>_<description>"
# Go to GitHub → Create Pull Request → base: dev
# Add PR link to task card
# Move card to Completed
```

### Deploy after a merge:
```bash
bash deploy.sh
# (Windows: deploy.bat)
# It will ask you for your UBIT, which server, and which branch.
```

### Sprint end (PM only):
```bash
# 1. On GitHub: Create PR from dev → main, merge it
# 2. Run the deploy script, select cattle + main when prompted
bash deploy.sh
```

---

## Part 8: DO NOT EDIT CODE ON APTITUDE OR CATTLE. EVER.

Read this section. Read it again. Tattoo it on your forearm if needed.

### The Question

"Can I just SSH into aptitude and edit the files there directly? It's faster than doing the whole branch/PR thing."

### The Answer

**No. Absolutely not. Under no circumstances. Do not do this.**

### Why People Think This Is Okay

When the repo gets cloned onto aptitude, it lives in a shared folder:
```
/data/web/CSE442/2026-Spring/cse-442j/
```

Every teammate can SSH into aptitude with their own UBIT credentials and access that exact same folder. You can open files, edit them with `nano`, and technically even run `git commit`. So it *feels* like you could just work there.

**This is a trap. Do not fall into it.**

### Why This Destroys Everything

**Problem 1: Git doesn't know who you are on aptitude.**

Git attributes commits based on the Git config in that environment — NOT based on who SSHed in. If teammate A cloned the repo on aptitude, Git is configured with A's identity (or possibly no identity at all). When teammate B SSHes in and makes a commit from that same clone, the commit gets attributed to teammate A. Or to `root`. Or to some random default. The professor sees commits from people who didn't make them, or ghost commits from nobody. This looks like academic dishonesty even if it's just ignorance.

**Problem 2: You're bypassing the entire workflow that gets graded.**

When you edit directly on aptitude, those changes are:
- NOT on a task branch (rubric violation)
- NOT going through a pull request (rubric violation)
- NOT linked to a task card (rubric violation)
- NOT visible on GitHub at all unless you push from the server (which creates more problems)
- Potentially overwritten the next time someone runs `git pull origin dev`

This means you did work that earns zero credit AND might break what everyone else deployed. One person doing this can tank the Git Repo score for the **entire team**.

**Problem 3: You can clobber your teammates' work.**

If you edit files directly on aptitude and then someone else runs `git pull origin dev` (which is the correct thing to do), Git will either overwrite your server edits with what's on GitHub, or create merge conflicts on a server where nobody should be resolving merge conflicts. Either way, work gets lost and things break in production-adjacent environments right before grading.

### What You Should Actually Do

There is exactly ONE correct workflow. Memorize it:

```
1. Write code on YOUR LAPTOP (in your task branch)
2. Commit and push to GitHub
3. Create a Pull Request into dev
4. After merge, someone runs: git pull origin dev ON APTITUDE
5. That's it. Aptitude is now updated.
```

**Aptitude is a deployment target.** You deploy TO it. You do not code ON it. It is a display case, not a workshop.

You don't even need to SSH into the servers to deploy. The deploy script handles everything from your local machine:

```bash
bash deploy.sh       # Mac/Linux
deploy.bat           # Windows
```

It walks you through everything interactively. There is no reason to SSH into aptitude or cattle and run commands. No `git add`. No `git commit`. No `nano`. No `vim`. No editing files. Nothing.

### "But What If I Need to Change a Config File on the Server?"

If there's a server-specific config (like a database password file that shouldn't be in the repo), that's the one narrow exception — and it should be a file listed in `.gitignore` so it doesn't get tracked or overwritten. Everything else goes through the normal branch → PR → pull workflow.

### Summary

| Action | On Your Laptop | On Aptitude | On Cattle |
|--------|---------------|-------------|-----------|
| Write code | YES | NO | NO |
| `git commit` | YES | NO | NO |
| `git push` | YES | NO | NO |
| `bash deploy.sh` | YES | — | — |
| Edit files directly | YES | NO | NO |
| SSH in and run commands | — | NO | NO |

---

## Part 9: Common Mistakes & How to Fix Them

**"I accidentally committed to dev"**
It happens. Go to that commit's page on GitHub and add a comment acknowledging it was a mistake. Then don't do it again. A few accidents are forgiven, a pattern is not.

**"I accidentally committed to main"**
This is worse. Same approach — add a comment acknowledging the mistake. Talk to your PM. This can drop the entire Git Repo score to 0 if it's more than a one-off.

**"I have merge conflicts"**
This usually means you haven't been pulling from `dev` recently. Before creating your PR:
```bash
git checkout dev
git pull origin dev
git checkout "#12_create-login-page"
git merge dev
# Resolve conflicts in your editor
git add .
git commit -m "Resolve merge conflicts with dev"
git push origin "#12_create-login-page"
```

**"My teammate and I edited the same file"**
This is normal. The person who merges second will get conflicts. Just resolve them in your branch before creating the PR — never in `dev` directly.

**"I need to start over on my branch"**
Don't delete and recreate. Just keep committing. The history of you figuring things out is actually valuable and expected.

**"I forgot to make a branch and committed to dev"**
Step 1: Panic briefly. Step 2: Add a comment to the commit on GitHub. Step 3: Create the branch you should have made and continue working there. Step 4: Never do this again.
