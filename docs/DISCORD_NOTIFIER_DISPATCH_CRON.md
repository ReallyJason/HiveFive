# Discord Notifier Dispatch Cron

This is the primary trigger path. The workflow uses `workflow_dispatch` only, and this cron job dispatches it every 5 minutes.

## 1) Create env file

Create `.local/notifier-dispatch.env` in this repo with:

```bash
GITHUB_TOKEN=YOUR_NEW_CLASSIC_PAT
GITHUB_OWNER=intesarjawad
GITHUB_REPO=hive
GITHUB_WORKFLOW_FILE=notify-discord.yml
GITHUB_REF=main
```

Notes:
- Rotate old exposed tokens first.
- Keep this file out of git. `.local/` is already ignored.
- Keep only one trigger source. Do not also enable GitHub `on.schedule` for this workflow.

## 2) Test once manually

```bash
./scripts/dispatch-notifier.sh
```

Expected output:

```text
Dispatched notify-discord.yml for intesarjawad/hive@main at <timestamp>
```

## 3) Add cron entry

Run `crontab -e` and add:

```cron
*/5 * * * * /usr/bin/env bash -lc 'cd "/sector_D/The Foundation/IJ03-School/IJ302-UB/26-Spring/CSE442/Hive" && ./scripts/dispatch-notifier.sh >> ./.local/notifier-dispatch.log 2>&1'
```

## 4) Verify

- Check `.local/notifier-dispatch.log` for recurring dispatch lines.
- In GitHub Actions, `Repo events to Discord` should show recurring `workflow_dispatch` runs every 5 minutes.
- Runs should no longer overlap because the workflow now has `timeout-minutes: 4` and `cancel-in-progress: true`.
