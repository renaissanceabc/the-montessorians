#!/usr/bin/env bash
# devkit@v1 managed. Edit in renaissanceabc/devkit.
# Title check plus the auto-merge gate. gh is required for the full run.
# `policy.sh title` checks TITLE and TITLE_MAX only.
set -euo pipefail

dir="$(cd "$(dirname "$0")" && pwd)"

check_title() {
  local pattern='^(feat|fix|perf|revert|refactor|docs|style|test|build|ci|chore)(\([a-z0-9-]+\))?!?: [^ ].+$'
  if ! [[ "${TITLE}" =~ $pattern ]]; then
    echo "PR title must be a Conventional Commit." >&2
    echo "Allowed types: feat, fix, perf, revert, refactor, docs, style, test, build, ci, chore." >&2
    return 1
  fi
  if [ "${TITLE_MAX:-0}" -gt 0 ] && [ "${#TITLE}" -gt "$TITLE_MAX" ]; then
    case "${HEAD_REF:-}" in
      dependabot/*) return 0 ;;
    esac
    echo "Title is ${#TITLE} characters. The cap is ${TITLE_MAX}." >&2
    return 1
  fi
}

if [ "${1:-}" = "title" ]; then
  check_title
  exit
fi

: "${GH_TOKEN:?GH_TOKEN is required}"
: "${GH_REPO:?GH_REPO is required}"
: "${PR:?PR is required}"
: "${TITLE:?TITLE is required}"
: "${BASE:?BASE is required}"
: "${ACTUAL_BASE:?ACTUAL_BASE is required}"

export GH_TOKEN

if [ "$ACTUAL_BASE" != "$BASE" ]; then
  echo "Base is $ACTUAL_BASE, gate is for $BASE."
  exit 0
fi

disable_auto() {
  gh pr merge "$PR" --repo "$GH_REPO" --disable-auto >/dev/null 2>&1 || true
}

if [ "${DRAFT:-false}" = "true" ]; then
  disable_auto
  echo "Draft. Auto-merge stays off."
  exit 0
fi

if ! check_title; then
  disable_auto
  exit 1
fi

if [ -z "${DIFF_FILE:-}" ]; then
  DIFF_FILE="$(mktemp)"
  err="$(mktemp)"
  if ! gh pr diff "$PR" --repo "$GH_REPO" >"$DIFF_FILE" 2>"$err"; then
    if grep -q 'maximum number of files' "$err"; then
      gh api --paginate "repos/$GH_REPO/pulls/$PR/files" --jq '.[] | "diff --git a/\(.filename) b/\(.filename)\n--- a/\(.filename)\n+++ b/\(.filename)\n\(.patch // "")"' >"$DIFF_FILE"
    else
      cat "$err" >&2
      exit 1
    fi
  fi
fi

if [ -z "${PR_LABELS+x}" ]; then
  PR_LABELS="$(gh pr view "$PR" --repo "$GH_REPO" --json labels --jq '.labels[].name')"
fi
export PR_LABELS
export EXTRA_PATHS="${EXTRA_PATHS:-}"

output="$(bash "$dir/guard.sh" "$DIFF_FILE")"
guard="$(printf '%s\n' "$output" | sed -n 's/^guard=//p' | head -1)"
reason="$(printf '%s\n' "$output" | sed -n 's/^reason=//p' | head -1)"
printf '%s\n' "$output"

if [ "$guard" = "skip" ]; then
  disable_auto
  case "$reason" in
    "guarded paths:"*)
      if ! printf '%s\n' "$PR_LABELS" | grep -Fxq 'needs-karel'; then
        if ! gh label list --repo "$GH_REPO" --json name --jq '.[].name' | grep -Fxq 'needs-karel'; then
          gh label create needs-karel --repo "$GH_REPO" \
            --description "Karel merges this. Auto-merge stays off." \
            --color B60205 >/dev/null || true
        fi
        gh pr edit "$PR" --repo "$GH_REPO" --add-label needs-karel >/dev/null
      fi
      ;;
  esac
  echo "Auto-merge stays off: $reason"
  exit 0
fi

if [ "${FORK:-false}" = "true" ]; then
  echo "Fork PR. Auto-merge stays off."
  exit 0
fi

if gh pr merge "$PR" --repo "$GH_REPO" --squash --auto; then
  echo "Auto-merge (squash) enabled on #$PR"
  exit 0
fi

echo "Could not enable auto-merge on #$PR (allow_auto_merge off, or not mergeable yet)."
exit 0
