#!/usr/bin/env bash
# Vercel's Ignored Build Step (apps/app/vercel.json). Exit 0 skips the build,
# exit 1 builds. A skipped build still reports a passing "Vercel" status, so
# the required check doesn't hold up the PR.
#
# Builds only when `turbo query affected` says the app's build task changed:
# the app, a workspace package it uses, the lockfile, or a build input from
# turbo.json (data/, images/, the schemas). Docs, CI, and repo tooling skip.
# When in doubt, it builds.
set -uo pipefail
export GIT_TERMINAL_PROMPT=0

build() {
  echo "Building: $1"
  exit 1
}

skip() {
  echo "Skipping: $1"
  exit 0
}

cd "$(dirname "$0")/../../.." || build "repo root not found"

head="${VERCEL_GIT_COMMIT_SHA:-}"
base="${VERCEL_GIT_PREVIOUS_SHA:-}"
branch="${VERCEL_GIT_COMMIT_REF:-}"

[[ -n "$head" ]] || build "not a git deployment"
# Same commit as the last good deployment means a redeploy, which is on
# purpose (for example to pick up new env values).
[[ "$base" != "$head" ]] || build "redeploy of ${head:0:7}"

if [[ -z "$base" ]]; then
  # First deployment of this branch: compare with where it left develop.
  [[ "$branch" != "main" && "$branch" != "develop" ]] || build "first deployment of $branch"
  repo="https://github.com/${VERCEL_GIT_REPO_OWNER:-}/${VERCEL_GIT_REPO_SLUG:-}.git"
  git fetch --quiet --no-tags --depth=100 "$repo" develop 2>/dev/null || build "couldn't fetch develop"
  base="$(git merge-base FETCH_HEAD HEAD 2>/dev/null)" || build "no merge base with develop"
fi

git cat-file -e "${base}^{commit}" 2>/dev/null || build "${base:0:7} isn't in the clone"

turbo="$(node -p "require('./package.json').workspaces.catalog.turbo" 2>/dev/null)" || build "turbo version not found"
# Dependencies aren't installed yet. npx runs from outside the repo because npm
# can't read this repo's bun catalog.
root="$PWD"
(cd "${TMPDIR:-/tmp}" && npx --yes "turbo@${turbo}" query affected --tasks build --packages app \
  --base "$base" --head "$head" --exit-code --cwd "$root" >/dev/null)
case $? in
  0) ;;
  1) build "the app's build inputs changed since ${base:0:7}" ;;
  *) build "turbo couldn't tell what changed" ;;
esac

# Turbo leaves out root files that change how Vercel installs and builds.
git diff --quiet "$base" "$head" -- bunfig.toml || build "bunfig.toml changed"
# Root package.json: packageManager, engines, overrides, and so on. Dev
# dependencies and the catalog are left to turbo, which reads the lockfile.
node -e '
  const { execFileSync } = require("node:child_process");
  const read = (ref) => JSON.parse(execFileSync("git", ["show", `${ref}:package.json`], { encoding: "utf8" }));
  const strip = ({ devDependencies, version, workspaces: { catalog, ...workspaces } = {}, ...rest }) => ({ ...rest, workspaces });
  const [before, after] = process.argv.slice(1).map((ref) => JSON.stringify(strip(read(ref))));
  process.exit(before === after ? 0 : 1);
' "$base" "$head" || build "root package.json changed"

skip "nothing the app builds from changed since ${base:0:7}"
