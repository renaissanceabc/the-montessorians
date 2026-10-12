# Releasing

How a change gets from a feature branch to production. The repo follows git flow: `develop` is the default branch and
the trunk; `main` is production.

## The model

```
feature/* ──PR──▶ develop ──promotion PR──▶ main
                     ▲       (merge commit)    │
                     │                         ▼
          Version Packages PR          tag + GitHub release
        (changeset-release/develop)    production deploy
                                       Zenodo DOI for the release
```

Cut every feature branch from `develop` and open every PR against it. Never commit to `main` directly and never point a
feature PR at it. **Every commit on `main` arrives through a promotion PR**, so the two branches cannot diverge and
there is never a back-merge.

## Releasing

1. **Land your work on `develop`**, each PR carrying a changeset (or the `skip-changeset` label). Adding or updating
   profiles is user-facing: it takes a changeset.
2. **`version.yml` keeps a Version Packages PR open** on `changeset-release/develop`, updating it as changesets
   accumulate. Leave it open until you want to cut a release.
3. **Merge the Version Packages PR into `develop`.** This consumes every pending `.changeset/*.md`, bumps the versions
   (the app and `packages/*` are versioned together), and writes the `CHANGELOG.md` files.
4. **`promote.yml` opens the promotion PR**, `develop` → `main`, titled `chore: promote develop to main (vX.Y.Z)`. It
   fires because the Version Packages merge changes `apps/app/package.json` on `develop`.
5. **Merge it with a merge commit**, never a squash. Squashing rewrites the commits and permanently diverges the two
   branches.
6. **`release.yml` fires** on the push to `main`: it tags `v<version>` from `apps/app/package.json` and creates a GitHub
   release with notes from `apps/app/CHANGELOG.md`. Vercel deploys production, and Zenodo archives the release and
   mints a DOI for that version of the dataset (once the repository is enabled in Zenodo).

## What fires where

| Workflow              | Trigger                                                 | Notes                                                             |
| --------------------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| `validate.yml`        | every PR                                                | Schemas, permanent ids against the PR's base branch, references   |
| `changeset-check.yml` | PRs into `develop`                                      | Bypass with the `skip-changeset` label or the title `Version Packages` |
| `version.yml`         | push to `develop`                                       | Opens/updates the Version Packages PR                             |
| `promote.yml`         | push to `develop` that changes `apps/app/package.json` | Opens/refreshes the `develop` → `main` promotion PR               |
| `release.yml`         | push to `main`                                          | Tag + GitHub release only                                         |
| `links.yml`           | weekly                                                  | Opens an issue listing broken links in the dataset                |

## Gotchas

- **Never squash a promotion PR.** It exists to keep two long-lived branches identical.
- **`promote.yml` does not merge.** Merging stays a human click so production deploys stay intentional.
- **`changeset-release/develop` is load-bearing.** `apps/app/vercel.json` skips deployments for it; keep the name if
  you touch either.
- **`.changeset/config.json` `baseBranch` is `develop`**, matching where `version.yml` runs.

## Branch protection

Two repository rulesets enforce the model (Settings → Rules → Rulesets):

| Ruleset   | Merge method      | Required checks                                                         | Other rules                                         |
| --------- | ----------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| `develop` | squash only       | `Run yamllint`, `Validate schema + image rules`, `Require changeset`    | No deletion, no force push, linear history, resolved threads |
| `main`    | merge commit only | `Run yamllint`, `Validate schema + image rules`, `Vercel` (up to date)  | No deletion, no force push                          |

Rebase merging is disabled for the repository, and merged branches are deleted automatically. Admins can bypass a
ruleset only through a pull request, never by pushing directly.

The required check names match the workflow **job** names. Renaming a job in `validate.yml` or `changeset-check.yml`
without updating the rulesets leaves every PR waiting on a check that never reports.

The Version Packages PR is opened with `GITHUB_TOKEN`, and GitHub does not run workflows for PRs opened that way, so its
required checks never report. Merge it with the admin bypass; it only touches versions and changelogs.
