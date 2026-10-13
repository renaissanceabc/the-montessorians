---
"app": minor
---

A redesigned directory, profiles, and contribute form, with organization logos and much fuller contribution records.

- **Directory**: one search-first page with All, Alumni, Contributors, and Organizations tabs, removable filter chips, and a floating filter and sort toolbar on phones. Organizations have their own directory and pages, with logos for 15 of them.
- **Profiles**: a compact header with the verification badge, a Cite button that copies the permanent link, and a menu for sharing and corrections. Breadcrumbs, related people, co-authors, and identifiers are on every profile, and previous/next links show each person's photo.
- **Contributions**: Montessori-related works for contributors are indexed from OpenAlex, Crossref, Open Library, ERIC, and Montessori's own publishing history. Maria Montessori now lists 39 works, dated to their first editions. `bun run contributions:index` suggests new ones for review.
- **Contribute form**: rebuilt with react-hook-form. Pick alum, contributor, or both; choose or add organizations as you type; add tags as chips; and see every problem at once, with clear messages when a submission can't be sent.
- **Editorial policy**: a new page explains who is included, what counts as evidence, and how verification works. Contributors are people whose research, scholarship, or published work shaped the field.
- **Photos**: new portraits for Maria and Mario Montessori, Angeline Stoll Lillard, Paula Polk Lillard, Patrick Frierson, and Ginni Sackett, each credited.
- **Tags**: 139 tags consolidated into a controlled vocabulary of 31 (`data/authority/tags.yaml`). The validator only accepts tags from it, and old tag pages redirect to their replacement.
- **Under the hood**: UI components moved to Base UI, the site URL comes from the Vercel or local environment automatically, Better Stack and Sentry run only when configured, CI now lints, typechecks, tests, and builds every pull request with turbo caching, and linting and formatting moved to Ultracite v8 (oxlint with the anti-slop plugin, and oxfmt), replacing Biome and Prettier.
