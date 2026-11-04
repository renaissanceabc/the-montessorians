# 🙌 Contributing to The Montessorians

This repository serves as the open source dataset for [The Montessorians](https://themontessorians.xyz), a community-driven directory of extraordinary Montessori alumni and an open name authority for the people who shaped the Montessori field.

Thank you for contributing to The Montessorians! Before adding someone, read the [editorial policy](./docs/editorial-policy.md): it explains who we include and what counts as evidence.

---

## ✍️ How to Contribute

To add or update a profile, you have three options:

1. [Add a Montessorian on the website](https://themontessorians.xyz/contribute) (no account needed)
2. [Open a profile request on GitHub](https://github.com/renaissanceabc/the-montessorians/issues/new?template=01_profile_request.yml)
3. [Submit a pull request by forking this repo](https://github.com/renaissanceabc/the-montessorians/fork) (slightly more advanced)

Something wrong on an existing profile? Use the [correction form](https://github.com/renaissanceabc/the-montessorians/issues/new?template=04_correction.yml).

### Via Code (Advanced)

1. Fork this repo
2. Run `bun install` to install dependencies
3. Run `bun run id:next` to get the next permanent id
4. Add a new `.yaml` file to the `data/people` folder (see the format below)
5. Optionally add a profile image (`.jpg`) to `/images`, using the same `slug` as the filename, and credit it in `image_credit`
6. If the person attended or is affiliated with a school, university, training center, or association that isn't in `data/organizations` yet, add it there (`bun run id:next -- org`)
7. Run `bun run data:lint` and confirm that it succeeds before opening a pull request. If you changed the site's code, also run `bun run check`, then start `bun dev` and run `bun run verify:ui` to smoke-test the key pages at desktop and phone widths
8. Add a changeset (`bunx changeset`) describing who you added or what you changed ([how to write one](./docs/CHANGESETS.md))
9. Submit a pull request against the `develop` branch

**Never change or reuse an `id`.** To merge, withdraw, or rename a record, add an entry to [`data/authority/changes.yaml`](./data/authority/changes.yaml) in the same pull request (see [`docs/authority.md`](./docs/authority.md)).

---

## 🧾 Profile Format

An alum:

```yaml
id: tm0000073
name: Full Name
slug: lowercase-hyphenated-name
name_authorized: Name, Full
birth_year: 1970
tagline: A short description of the individual (max 100 characters, no period)
bio: >-
  A short paragraph describing the individual and their background. (max 1000 characters)
tags: # slugs from data/authority/tags.yaml
  - technology
  - entrepreneur
education:
  - montessori
education_notes: >-
  Brief notes about the person's Montessori experience and background
schools:
  - organization: okemos-montessori-school # a slug from /organizations
    level: primary
    from: 1975
    to: 1979
notable_achievements:
  - One-line achievement 1
sources:
  - type: article # wikipedia | article | social | publication | authority | personal-knowledge | other
    url: https://...
    note: What the source says about their Montessori connection
verification: verified # verified | reported | confirmed
identifiers:
  wikidata: Q4934
links:
  - type: wikipedia # wikipedia | website | linkedin | x | instagram | tiktok | article | youtube | imdb
    url: https://...
```

A contributor adds `kind`, `roles`, `affiliations`, and `contributions` (and uses `montessori_notes` instead of `education_notes`):

```yaml
kind: contributor
roles:
  - researcher # founder | trainer | practitioner-scholar | researcher | author | philosopher
affiliations:
  - organization: university-of-virginia
    role: Professor of Psychology
contributions:
  - title: Evaluating Montessori Education
    type: article # book | article | chapter | lecture | training-program | media | other
    year: 2006
    venue: Science
    doi: 10.1126/science.1132362
```

[`profile.schema.json`](./profile.schema.json) and [`organization.schema.json`](./organization.schema.json) list every field.

To find a contributor's Montessori-related works, run `bun run contributions:index -- <slug>` (or `-- --all`). It searches OpenAlex, Crossref, Open Library, and ERIC using the profile's names and identifiers, skips works already listed, and prints candidate `contributions` entries with where each came from. It doesn't change any files: check each candidate against its record, keep one entry per work (the first publication, not reprints or translations), and copy the ones that hold up into the profile. Set `INDEXER_CONTACT_EMAIL` if you want to send the APIs a contact address.

---

## 🏷 Tags

Tags come from a fixed list in [`data/authority/tags.yaml`](./data/authority/tags.yaml), and `bun run validate` rejects anything else. Each tag has a `slug`, a `label`, and `aliases`: retired tags whose `/tags/<alias>` pages redirect to the current one. Use up to a handful per profile; the first three show on the profile's card. To propose a new tag, add it to the vocabulary in the same pull request and explain why the existing ones don't fit.

---

## ✅ Contribution Tips

- Keep bios concise, factual, and neutral.
- Use respectful and inclusive language, and the person's own name and pronouns.
- Every claim about a Montessori connection needs a source. Unsourced "famous Montessori alumni" lists don't count.

---

## 🖼 Image Guidelines

- Images should be square (1:1 aspect ratio) and ideally 800x800 in size.
- Images must use the `.jpg` format.
- Prefer portraits from Wikimedia Commons or photos the person has shared, and say where it came from in `image_credit` (e.g. "Photo by Jane Doe, via Wikimedia Commons").
- File name should match the profile's `slug` (lowercase, hyphenated name) and be placed in the `/images` folder.

---

## 📄 License

By contributing, you agree that dataset additions (`data/`) are released under [CC0](./LICENSE.md), and that code contributions (`apps/` and `packages/`) are released under the [MIT license](./LICENSE-CODE.md). Photos keep their original terms and are credited per profile.
