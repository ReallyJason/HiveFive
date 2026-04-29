#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

DEFAULT_ENV_FILE="${REPO_ROOT}/.local/notifier-dispatch.env"
ENV_FILE="${DISPATCH_ENV_FILE:-${DEFAULT_ENV_FILE}}"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "${ENV_FILE}"
  set +a
fi

: "${GITHUB_TOKEN:?Missing GITHUB_TOKEN. Set it in env or in ${ENV_FILE}.}"

GITHUB_API_BASE="${GITHUB_API_BASE:-https://api.github.com}"
GITHUB_OWNER="${GITHUB_OWNER:-intesarjawad}"
GITHUB_REPO="${GITHUB_REPO:-hive}"
GITHUB_WORKFLOW_FILE="${GITHUB_WORKFLOW_FILE:-notify-discord.yml}"
GITHUB_REF="${GITHUB_REF:-main}"

DISPATCH_URL="${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW_FILE}/dispatches"
TMP_RESPONSE="$(mktemp)"
trap 'rm -f "${TMP_RESPONSE}"' EXIT

HTTP_CODE="$(
  curl -sS -o "${TMP_RESPONSE}" -w "%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    "${DISPATCH_URL}" \
    -d "{\"ref\":\"${GITHUB_REF}\"}"
)"

if [[ "${HTTP_CODE}" != "204" ]]; then
  echo "Dispatch failed (HTTP ${HTTP_CODE}) for ${GITHUB_OWNER}/${GITHUB_REPO}:${GITHUB_REF}" >&2
  cat "${TMP_RESPONSE}" >&2
  exit 1
fi

echo "Dispatched ${GITHUB_WORKFLOW_FILE} for ${GITHUB_OWNER}/${GITHUB_REPO}@${GITHUB_REF} at $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
