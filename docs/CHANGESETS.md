# Changesets

Every PR into `develop` with a user-facing change carries a changeset. Add one with:

```bash
bunx changeset
```

or create `.changeset/<name>.md` by hand. Skip it for `chore:`, `docs:`, `refactor:`, and CI-only changes by adding the `skip-changeset` label to the PR; `changeset-check.yml` blocks the merge otherwise.

```md
---
"app": minor
---

Contributors now have their own section of the directory.
```

The app and `packages/*` (`@montessorians/*`) are versioned together (a `fixed` group), so naming `app` is enough.

## Bump types

- **`minor`**: a user-facing feature, or a batch of new profiles.
- **`patch`**: a bug fix, a correction to existing profiles, or an internal change that ships with a feature.

## Writing the summary

This is a **changelog entry, not a commit message.** The reader is someone skimming what changed in the dataset or on the site. The first sentence is the changelog line and must stand on its own.

- **Lead with the observable change, not the mechanism.** Say what someone can now do or find, or what no longer breaks.
- **Keep internals out of the lead.** No file paths, component names, or framework details in the first sentence.
- **For data changes, name the people.** "Added profiles for Maria Montessori and Mario M. Montessori." reads better than "Added 2 profiles."
- **Bug fixes describe the symptom.** "Profile pages without a photo no longer show a broken image."
- One tight paragraph for most changes; bullets only for genuinely multi-part releases.
