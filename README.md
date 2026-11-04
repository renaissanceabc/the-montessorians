# The Montessorians

[The Montessorians](https://themontessorians.xyz) is the world's largest open source dataset of Montessori alumni who've gone on to do great things, and an open name authority for the trainers, practitioner-scholars, researchers, authors, and philosophers who shaped the Montessori field.

This is the public, open source home of both the **dataset** and the **website** that renders it. The dataset is fully community-driven and dedicated to the public domain under [CC0](./LICENSE.md), and the website's source code is open source under the [MIT license](./LICENSE-CODE.md). Contributions to both are welcome.

Created and maintained by [Renaissance](https://renaissance.education), an education startup studio.

---

## Structure

This repository holds both the **dataset** and the **website** that renders it ([themontessorians.xyz](https://themontessorians.xyz)).

- `data/` — the dataset (**CC0**, see [`LICENSE.md`](./LICENSE.md)):
  - `data/people/` — one YAML file per person
  - `data/organizations/` — schools, training centers, universities, and associations, one per file
  - `data/authority/` — the log of merged, withdrawn, and renamed records
- `images/` — profile photos (credited per profile; see [Photos](#photos))
- `apps/` and `packages/` — the Next.js website and its supporting packages (the application code; **MIT**, see [`LICENSE-CODE.md`](./LICENSE-CODE.md))

```
/data/                 # CC0 dataset
  people/
    - yo-yo-ma.yaml
  organizations/
    - association-montessori-internationale.yaml
  authority/           # merges, withdrawals, renames
    - changes.yaml
/images/               # profile photos
  - yo-yo-ma.jpg
/apps/app/             # the website
/packages/             # shared app packages
```

The site is fully static: it reads the YAML in `data/` at build time, so adding or editing a profile and merging it is all that's needed to update the live site.

---

## Development

```bash
bun install
bun dev          # run the website locally
bun run build    # production build (statically renders every profile)
bun run validate # validate the dataset (schemas, ids, references, tags, duplicates)
bun run check    # lint and format check (Ultracite: oxlint + oxfmt)
bun run verify:ui # smoke-test key pages at desktop and phone widths (needs a running dev server)
bun run id:next  # print the next unused person id (add `-- org` for organizations)
```

Branches follow git flow: open PRs against `develop` (the default branch), each with a changeset (`bunx changeset`) or the `skip-changeset` label. `main` is production and only receives promotion PRs. See [`docs/RELEASING.md`](./docs/RELEASING.md) and [`docs/CHANGESETS.md`](./docs/CHANGESETS.md).

See [`docs/authority.md`](./docs/authority.md) for permanent ids, linked data, and the reconciliation API, and [`docs/editorial-policy.md`](./docs/editorial-policy.md) for who we include and what counts as evidence.

---

## Contributing

We welcome contributions from the community! To add or update a profile, you have two options:

1. [Add a Montessorian on the website](https://themontessorians.xyz/contribute) (no account needed), or [open a profile request on GitHub](https://github.com/renaissanceabc/the-montessorians/issues/new?template=01_profile_request.yml)
2. [Submit a pull request by forking this repo](https://github.com/renaissanceabc/the-montessorians/fork) (slightly more advanced)

### Via Code (Advanced)

1. Fork this repo
2. Run `bun install` to install dependencies
3. Add a new `.yaml` file to the `data/people` folder (see the [example below](#example-profile)), with an `id` from `bun run id:next`
4. Optionally add a profile image (`.jpg`) to `/images`, using the same `slug` as the filename from step #3, and credit it in `image_credit`
5. Run `bun run data:lint` and confirm that it succeeds prior to opening up a pull request
6. Submit a pull request with your updates

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for more guidelines.

---

### Example Profile

```yaml
id: tm0000050
name: Yo-Yo Ma
slug: yo-yo-ma
name_authorized: Ma, Yo-Yo
birth_year: 1955
tagline: World-renowned cellist, United Nations Peace Ambassador, and winner of 19 Grammy Awards
bio: >-
  Yo-Yo Ma is an acclaimed American cellist known for his extraordinary technique and deep musicality. A cultural ambassador and humanitarian, he has performed around the world and founded the Silk Road Ensemble to foster cross-cultural collaboration through music.
tags:
  - musician
  - activist
education:
  - montessori
education_notes: >-
  Yo-Yo Ma attended a Montessori school as a young child, where his artistic sensibilities and self-motivation were nurtured through exploration.
notable_achievements:
  - 19-time Grammy Award winner
  - Founder of the Silk Road Ensemble
  - Presidential Medal of Freedom recipient
links:
  - type: wikipedia
    url: https://en.wikipedia.org/wiki/Yo-Yo_Ma
```

---

A contributor record adds `kind: contributor`, `roles` (`founder`, `trainer`, `practitioner-scholar`, `researcher`, `author`, `philosopher`), `affiliations`, and `contributions`. See [`data/people/angeline-stoll-lillard.yaml`](./data/people/angeline-stoll-lillard.yaml) and [`profile.schema.json`](./profile.schema.json) for every field.

---

### Submit a Suggestion

Know someone who should be featured? [Add them on the website](https://themontessorians.xyz/contribute), submit a pull request, or open an issue. Something wrong on a profile? Use [the correction form](https://github.com/renaissanceabc/the-montessorians/issues/new?template=04_correction.yml).

---

### Contribution License

By contributing, you agree that dataset additions (`data/`) are released under [CC0](./LICENSE.md), and that code contributions (`apps/` and `packages/`) are released under the [MIT license](./LICENSE-CODE.md).

---

## License

This repository is open source and dual-licensed:

- **Dataset** (`data/`) — [CC0 1.0 Universal](./LICENSE.md) (public domain dedication)
- **Application code** (`apps/`, `packages/`) — [MIT](./LICENSE-CODE.md)

### Photos

Profile photos in `images/` come from many places (Wikimedia Commons, press kits, and photos shared by the people themselves) and keep their original terms. Credits appear on each profile (`image_credit`) where we know them. If you took a photo and want it credited or removed, [let us know](https://github.com/renaissanceabc/the-montessorians/issues/new?template=04_correction.yml).

### Citing

Cite records by their permanent URI (`https://www.themontessorians.xyz/id/<id>`). To cite the dataset, see [`CITATION.cff`](./CITATION.cff).

---

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="12.5%"><a href="https://github.com/karelvuong"><img src="https://avatars.githubusercontent.com/u/95452264?v=4?s=100" width="100px;" alt="Karel Vuong"/><br /><sub><b>Karel Vuong</b></sub></a><br /><a href="#data-karelvuong" title="Profile contributions">📝</a></td>
      <td align="center" valign="top" width="12.5%"><a href="https://github.com/samjvuong"><img src="https://avatars.githubusercontent.com/u/89951683?v=4?s=100" width="100px;" alt="Sam Vuong"/><br /><sub><b>Sam Vuong</b></sub></a><br /><a href="#data-samjvuong" title="Profile contributions">📝</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->
