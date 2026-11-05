# Releasing

How a change gets from a feature branch to production. The repo follows git flow: `develop` is the default branch and the trunk; `main` is production.

## The model

```
feature/* ──PR──▶ develop ──promotion PR──▶ main
                     ▲       (merge commit)    │
                     │                         ▼
             release PR (release-please)   publish GitHub release
             tags vX.Y.Z, draft release    production deploy
                                           Zenodo DOI for the release
```

Cut every feature branch from `develop` and open every PR against it. Never commit to `main` directly and never point a feature PR at it. **Every commit on `main` arrives through a promotion PR**, so the two branches cannot diverge and there is never a back-merge.

## PR titles are the changelog

PRs are squash-merged, so each PR's title becomes its commit on `develop`, and [release-please](https://github.com/googleapis/release-please) builds the version bump and changelog from those commits. The title must be a [conventional commit](https://www.conventionalcommits.org/) (`pr-title.yml` checks it with the same commitlint rules as the `commit-msg` hook).

| Title type | Bump | In the changelog |
| --- | --- | --- |
| `feat:` | minor | Features |
| `fix:` | patch | Bug Fixes |
| `perf:` | patch | Performance Improvements |
| `feat!:` or a `BREAKING CHANGE:` footer | minor while below 1.0 | Features, marked breaking |
| `chore:`, `docs:`, `ci:`, `refactor:`, `test:`, `build:`, `style:` | none | hidden |

Adding or correcting profiles is user-facing: title it `feat:` for new people or organizations and `fix:` for corrections, so it bumps the version and shows in the changelog.

Write the title for someone skimming what changed in the dataset or on the site. Lead with the observable change, not the mechanism, and name the people for data changes: `feat: add profiles for Maria Montessori and Mario M. Montessori`, not `feat: add 2 yaml files`.

## Releasing

1. **Land your work on `develop`** with conventional PR titles.
2. **`release-please.yml` keeps a release PR open**, titled `chore(develop): release X.Y.Z` on `release-please--branches--develop--components--the-montessorians`, updating it as PRs land. Leave it open until you want to cut a release.
3. **Merge the release PR into `develop`.** It bumps the root, app, and `packages/*` versions together and writes `apps/app/CHANGELOG.md`. On that push, release-please tags `vX.Y.Z` on `develop` and creates a **draft** GitHub release with the notes.
4. **`promote.yml` opens the promotion PR**, `develop` → `main`, titled `chore: promote develop to main (vX.Y.Z)`. It fires because the release PR changes `apps/app/package.json` on `develop`.
5. **Merge it with a merge commit**, never a squash. Squashing rewrites the commits and permanently diverges the two branches.
6. **`release.yml` fires** on the push to `main` and publishes the draft release for the version in `apps/app/package.json`. Vercel deploys production, and Zenodo archives the published release and mints a DOI for that version of the dataset. If no draft exists, it tags `main` and writes the release from the changelog instead.

## What fires where

| Workflow | Trigger | Notes |
| --- | --- | --- |
| `validate.yml` | every PR | Schemas, permanent ids against the PR's base branch, references |
| `pr-title.yml` | PRs into `develop` | Conventional commit title, checked with commitlint |
| `release-please.yml` | push to `develop` | Opens/updates the release PR; tags and drafts the release when it merges |
| `promote.yml` | push to `develop` that changes `apps/app/package.json` | Opens/refreshes the `develop` → `main` promotion PR |
| `release.yml` | push to `main` | Publishes the draft release |
| `links.yml` | weekly | Keeps one issue listing broken links in the dataset and docs, closing it when all pass |

## Gotchas

- **Never squash a promotion PR.** It exists to keep two long-lived branches identical.
- **`promote.yml` does not merge.** Merging stays a human click so production deploys stay intentional.
- **Tags live on `develop`.** release-please finds the last release by walking `develop` back to its tag, so the tag has to be on a `develop` commit, which is why `release.yml` publishes a draft rather than tagging `main`. `v0.4.1` and earlier were tagged on `main`; `last-release-sha` in `release-please-config.json` marks the last Changesets release commit on `develop` (v0.4.1) so the first release-please changelog starts after it. It does nothing once the first release-please version is tagged and can be removed then.
- **A new package under `packages/` needs adding** to `extra-files` in `release-please-config.json`, or its version stops moving with the rest.
- **Git hooks are [lefthook](https://lefthook.dev)** (`lefthook.yml`), installed by `bun install`: Ultracite on staged files, oxfmt and validation for `data/`, and commitlint on commit messages.

## Branch protection

Two repository rulesets enforce the model (Settings → Rules → Rulesets):

| Ruleset | Merge method | Required checks | Other rules |
| --- | --- | --- | --- |
| `develop` | squash only | `Check`, `Format Data` (oxfmt on `data/`), `Validate`, `PR Title`, `Vercel` | No deletion, no force push, linear history, resolved threads |
| `main` | merge commit only | `Check`, `Format Data` (oxfmt on `data/`), `Validate`, `Vercel` (up to date) | No deletion, no force push |

Rebase merging is disabled for the repository, and merged branches are deleted automatically. Admins can bypass a ruleset only through a pull request, never by pushing directly.

The required check names match the workflow job `name:`. Job ids are kebab-case and names are Title Case (`check` named `Check`). Renaming a job in `validate.yml`, `pr-title.yml`, or `ci.yml` without updating the rulesets leaves every PR waiting on a check that never reports.

The release PR is opened with `GITHUB_TOKEN`, and GitHub does not run workflows for PRs opened that way, so its CI checks may not report until the PR is closed and reopened. Vercel builds a preview for it like any other PR, so its `Vercel` check reports on its own. If the CI checks still don't report, merge it with the admin bypass; it only touches versions and the changelog.

PRs no longer run `next build` in CI (Vercel builds every PR preview), so the required `Vercel` check is what stops a PR that breaks the build from merging.
