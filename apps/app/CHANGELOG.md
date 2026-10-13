# app

## 0.3.0

### Minor Changes

- [#35](https://github.com/renaissanceabc/the-montessorians/pull/35) [`3f0fbfe`](https://github.com/renaissanceabc/the-montessorians/commit/3f0fbfe63e070ccc941e7e333b5af5b34bd53d11) Thanks [@karelvuong](https://github.com/karelvuong)! - A redesigned directory, profiles, and contribute form, with organization logos and much fuller contribution records.

  - **Directory**: one search-first page with All, Alumni, Contributors, and Organizations tabs, removable filter chips, and a floating filter and sort toolbar on phones. Organizations have their own directory and pages, with logos for 15 of them.
  - **Profiles**: a compact header with the verification badge, a Cite button that copies the permanent link, and a menu for sharing and corrections. Breadcrumbs, related people, co-authors, and identifiers are on every profile, and previous/next links show each person's photo.
  - **Contributions**: Montessori-related works for contributors are indexed from OpenAlex, Crossref, Open Library, ERIC, and Montessori's own publishing history. Maria Montessori now lists 39 works, dated to their first editions. `bun run contributions:index` suggests new ones for review.
  - **Contribute form**: rebuilt with react-hook-form. Pick alum, contributor, or both; choose or add organizations as you type; add tags as chips; and see every problem at once, with clear messages when a submission can't be sent.
  - **Editorial policy**: a new page explains who is included, what counts as evidence, and how verification works. Contributors are people whose research, scholarship, or published work shaped the field.
  - **Photos**: new portraits for Maria and Mario Montessori, Angeline Stoll Lillard, Paula Polk Lillard, Patrick Frierson, and Ginni Sackett, each credited.
  - **Tags**: 139 tags consolidated into a controlled vocabulary of 31 (`data/authority/tags.yaml`). The validator only accepts tags from it, and old tag pages redirect to their replacement.
  - **Under the hood**: UI components moved to Base UI, the site URL comes from the Vercel or local environment automatically, Better Stack and Sentry run only when configured, CI now lints, typechecks, tests, and builds every pull request with turbo caching, and linting and formatting moved to Ultracite v8 (oxlint with the anti-slop plugin, and oxfmt), replacing Biome and Prettier.

- [#35](https://github.com/renaissanceabc/the-montessorians/pull/35) [`3f0fbfe`](https://github.com/renaissanceabc/the-montessorians/commit/3f0fbfe63e070ccc941e7e333b5af5b34bd53d11) Thanks [@karelvuong](https://github.com/karelvuong)! - Redesigned pages on one layout, a safer submit flow, and fuller records.

  - **Layout**: one shared width and edge; card grids for people and organizations; a side column on profiles and organizations; shared text styles; dark mode removed.
  - **Pages**: a new home page; sources first on profiles and organizations, with a record block that folds away on phones; centered phone headers, floating share, and a blue verification seal.
  - **Safety**: rate limits and size caps on submit and reconciliation, a content security policy, and a privacy page.
  - **Discovery**: an Atom feed, more share images, cleaner linked data, and broader search.
  - **Data**: Lauremont School and Montessori Radmoor renames, identifiers and descriptions for most organizations, two new organizations, photo credits, and ISNI ids.
  - **Feel and speed**: press feedback, reduced-motion support, Sentry and PostHog loaded only when idle, and an unused font removed.

- [#35](https://github.com/renaissanceabc/the-montessorians/pull/35) [`3f0fbfe`](https://github.com/renaissanceabc/the-montessorians/commit/3f0fbfe63e070ccc941e7e333b5af5b34bd53d11) Thanks [@karelvuong](https://github.com/karelvuong)! - The Montessorians is now an open name authority, and it covers contributors to the Montessori field as well as alumni.

  - **Contributors**: trainers, teacher-scholars, researchers, authors, and philosophers have their own tab in the directory, with filters by role, affiliation, and number of documented contributions. The first six are Maria Montessori, Mario M. Montessori, Angeline Stoll Lillard, Paula Polk Lillard, Patrick Frierson, and Ginni Sackett.
  - **Permanent identifiers**: every person and organization has an id and a permanent link (`/id/<id>`) that keeps working through renames and merges, with links to the same person in the Library of Congress, VIAF, Wikidata, ORCID, ISNI, and SNAC.
  - **Sources**: profiles now show the evidence for each person's Montessori connection and whether it has been verified. Existing alumni were backfilled with sources, schools, and Wikidata links.
  - **Organizations**: Montessori schools, training centers, universities, and associations have their own pages.
  - **Data & API**: bulk downloads (JSON, JSON-LD, CSV) and a reconciliation API for matching name lists in OpenRefine.
  - **Add a Montessorian**: a new form for suggesting alumni or contributors, no GitHub account needed.

### Patch Changes

- Updated dependencies []:
  - @montessorians/next-config@0.3.0
  - @montessorians/observability@0.3.0
