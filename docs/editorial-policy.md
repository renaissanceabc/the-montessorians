# Editorial policy

The Montessorians is an open directory and name authority for two kinds of people:

- **Alumni**: people who attended a Montessori school and went on to do great things, from famous figures to
  extraordinary everyday people.
- **Contributors**: people whose research, scholarship, or published work shaped Montessori pedagogy or the field:
  researchers, philosophers, authors, founders of the method and its organizations, and trainers of teachers (and
  practitioners or teacher-scholars who publish), whether or not they attended Montessori themselves.

This page explains who we include, what counts as evidence, and how records are corrected, merged, or removed.

## Who we include

**Alumni** need evidence that they attended a Montessori school or program, at any age or level (infant-toddler
through secondary). People who only sent their children to Montessori, taught at a Montessori school as adults, or
publicly support Montessori are not alumni; adults who trained or taught may qualify as contributors instead.

**Contributors** need at least one **documented contribution** to the field: a publication, research output,
training program, or comparable public work that can be verified. Teaching or guiding children alone, however
excellent, doesn't make someone a contributor; the bar is work that shaped how Montessori is understood or practiced. A contribution is documented when someone else can
find it: it has a DOI, an ISBN, a library catalog record, or a stable URL.

Self-nominations are welcome when they include evidence.

## What counts as evidence

Every record should list its `sources`. In rough order of strength:

1. **Authority records and publications**: library catalog records (LCNAF, VIAF), the person's own publications, and
   peer-reviewed work.
2. **Reliable published sources**: news articles, interviews, official biographies, and school or institutional pages.
3. **Wikipedia**, when the article itself mentions Montessori. A Wikipedia page that doesn't mention Montessori is not
   evidence of a Montessori connection.
4. **Social posts and self-published pages** by the person themselves.
5. **Personal knowledge**: "I was their classmate at …". Accepted, but recorded as such.

Unsourced "famous Montessori alumni" lists are not evidence on their own; many repeat each other and several have
confused parents, teachers, or supporters with alumni.

Each record's `verification` summarizes its evidence:

| Value       | Meaning                                                                |
| ----------- | ---------------------------------------------------------------------- |
| `verified`  | At least one reliable published source supports the Montessori connection |
| `reported`  | The only evidence is personal knowledge or self-published              |
| `confirmed` | Confirmed directly by the person, or by the maintainers (self-submitted and community-reported profiles) |
| `unverified` | Listed, often widely, but no reliable source yet; shown with an "Unverified" label until one is found |
| _(none)_    | Not yet sourced; the record is under review                            |

A record's `status` is `provisional` until a maintainer has reviewed it, then `reviewed`.

## Writing records

- Keep taglines and bios concise, factual, and neutral. No promotional language.
- Use the person's own name and pronouns. Record other forms of the name in `name_variants`, and the inverted
  authorized form (following the Library of Congress where a record exists) in `name_authorized`.
- Record birth and death **years** only, never full dates, and only for public figures or when the person has shared
  them. Never record a birth year for a minor.
- Link the same person in other authority files (`identifiers`) only when you have confirmed it is the same person.
- Schools, universities, training centers, and associations are their own records in `data/organizations/`; link to them
  rather than writing their names as text.

## Photos

The data is dedicated to the public domain under CC0, but profile photos come from many places (Wikimedia Commons,
press kits, and photos shared by the people themselves) and keep their original terms. Record who took a photo and
where it came from in `image_credit` when you know it. Photographers can ask for a credit to be added or for a photo to
be removed.

## Corrections, merges, and removals

Anyone can request a change with the
[correction form](https://github.com/renaissanceabc/the-montessorians/issues/new?template=04_correction.yml) or the
"Suggest a correction" link on any profile.

- **Corrections** are made directly in the record.
- **Duplicates** are merged: the surviving record keeps its id, and the duplicate's id is recorded as `merged` in
  [`data/authority/changes.yaml`](../data/authority/changes.yaml) so its links keep working.
- **Removal requests** from the person themselves (or their family, for people who have died recently) are honored.
  The record is withdrawn: its id is recorded as `withdrawn` with a short public reason, and it is never reused.
- Records whose Montessori connection turns out to be wrong are withdrawn, or converted to a contributor record if
  they qualify.

Identifiers are permanent. See [`docs/authority.md`](./authority.md) for how ids, merges, and withdrawals work.

## Who reviews

Maintainers review every new record and change before it is published. We welcome reviewers from Montessori
organizations and research groups, such as the Montessori Glossary Community Project, particularly for contributor
records; open an issue if you'd like to help.
