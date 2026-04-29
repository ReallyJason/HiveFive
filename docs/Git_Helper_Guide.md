# Git Helper Script

An interactive command-line tool that streamlines common Git workflows for the team. Instead of remembering Git commands, just run `bash git-helper.sh` and pick what you want to do from the menu.

## Quick Start

```bash
# Mac/Linux
bash git-helper.sh

# Windows (Git Bash, or double-click the .bat file)
git-helper.bat
```

## Main Menu

When you run the script, you'll see your current branch and status, then a menu of actions. Use the arrow keys to pick one and press Enter.

| Action | What it does |
|--------|-------------|
| **Start a new task** | Creates a properly named branch off `dev` for your task card |
| **Save my work** | Stages, commits, and pushes your changes in one step |
| **I'm done with my task** | Creates a pull request to `dev` with the right format |
| **Get latest changes** | Pulls updates from GitHub (your branch or dev) |
| **Switch tasks** | Jumps to a different branch with a visual branch picker |
| **Undo a mistake** | Safely undo commits, unstage files, or discard changes |
| **Check my status** | Shows your current branch, changed files, and sync status |

## Workflow Details

### Start a new task

The script asks for your **card number** and a **short description**, then creates a branch following the team naming convention (`#<card>_<description>`). It automatically pulls the latest `dev` branch first so you start from current code.

### Save my work

Shows you which files have changed, lets you pick all or specific files, asks for a commit message, then commits and pushes to GitHub. The script will not allow commits directly to `main` or `dev` — use a task branch instead.

### I'm done with my task

Creates a pull request targeting `dev` with the title auto-filled from your branch name. If you have unsaved changes, the script offers to save them first. Requires the [GitHub CLI](https://cli.github.com/) (`gh`) to be installed.

### Get latest changes

Two options:
- **Latest from my branch** — pulls any commits your teammates pushed to this branch
- **Latest from dev** — syncs your branch with the latest `dev` (merges dev into your branch)

If there's a merge conflict, the script explains which files are affected and offers to abort the merge so nothing gets messed up.

### Switch tasks

Shows a list of all branches (local and remote) sorted by most recent activity. Pick one with the arrow keys. If you have unsaved changes, the script offers to stash them first.

### Undo a mistake

| Option | Safety | What it does |
|--------|--------|-------------|
| Undo last commit | Safe | Removes the commit but keeps your changes as uncommitted files |
| Unstage files | Safe | Removes files from staging (before commit) |
| Discard all changes | Destructive | Throws away all uncommitted changes — requires confirmation |
| Reset branch to dev | Destructive | Resets your branch to match dev — requires confirmation |

Destructive actions require you to type a confirmation word to prevent accidents.

### Check my status

Displays:
- Current branch name
- How many commits you are ahead of or behind `dev`
- List of modified, new, and deleted files
- Whether your branch has been pushed to GitHub

## Shared Components

The script shares its interactive UI components (arrow-key menus, branch picker, color system) with `deploy.sh` via a shared file `shell-ui.sh` in the project root. Both scripts source this file automatically.
