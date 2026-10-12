# The Montessorians as a name authority

The Montessorians gives every person and organization a permanent identifier, links them to other authority files,
and publishes everything as linked open data under CC0. This page is the technical reference; the
[editorial policy](./editorial-policy.md) covers what goes in.

## Identifiers

| Record       | Pattern     | Example     | Permanent URI                                     |
| ------------ | ----------- | ----------- | ------------------------------------------------- |
| Person       | `tm` + 7    | `tm0000067` | `https://www.themontessorians.xyz/id/tm0000067`   |
| Organization | `tmo` + 6   | `tmo000001` | `https://www.themontessorians.xyz/id/tmo000001`   |

- The `id` is assigned once, when a record is accepted (`bun run id:next`, or `bun run id:next -- org`), and never
  changes, even if the person's name or the record's `slug` changes.
- An id is never deleted or reused. `bun run validate` fails if an id that exists on the base branch disappears without an
  entry in [`data/authority/changes.yaml`](../data/authority/changes.yaml) (CI sets `BASE_REF` to check this on every pull
  request).
- `/id/<id>` redirects permanently to the record's current page. Cite the `/id/` URI, not the page address.

### Merges, withdrawals, and renames

Record these in `data/authority/changes.yaml` in the same pull request that makes them:

| Action      | What the site does                                                                 |
| ----------- | ---------------------------------------------------------------------------------- |
| `merged`    | `/id/<old id>` and the old `/<slug>` redirect permanently to the surviving record |
| `withdrawn` | `/id/<id>` shows a short notice with the date and reason instead of a 404           |
| `renamed`   | The old `/<slug>` redirects permanently to the record's current slug                |

The full log is published at `/data/changes.json` so mirrors can follow along.

## Record fields

The schemas are the source of truth: [`profile.schema.json`](../profile.schema.json) for people and
[`organization.schema.json`](../organization.schema.json) for organizations. Fields that make a record work as an
authority entry:

- `kind` (`alum` or `contributor`) and, for contributors, `roles`
- `name_authorized` (inverted, following LCNAF where a record exists) and `name_variants`
- `birth_year`, `death_year` (years only) to tell people with the same name apart
- `schools` (alumni) and `affiliations` (anyone), which reference organizations by slug
- `contributions` with a DOI, ISBN, or URL
- `sources`, `verification`, and `status` (see the editorial policy)
- `identifiers`: `lcnaf`, `viaf`, `wikidata`, `orcid`, `isni`, `snac` (organizations: `ror` instead of `orcid`/`snac`)
- `glossary_citations`: Montessori Glossary terms whose notes cite the person

`bun run validate` checks the schemas and the cross-record rules: unique ids and slugs, references that resolve, the
changes log, and likely duplicates (identical names fail; very similar names warn unless listed in
[`data/authority/distinct.yaml`](../data/authority/distinct.yaml)).

## Linked data

| URL                         | Contents                                                       |
| --------------------------- | -------------------------------------------------------------- |
| `/data/<id>`                | One record as schema.org JSON-LD                               |
| `/data/people.jsonld`       | Every person and organization as one JSON-LD graph             |
| `/data/people.json`         | Every person, every field, with its URI                        |
| `/data/people.csv`          | One row per person                                             |
| `/data/organizations.json`  | Every organization                                             |
| `/data/changes.json`        | Merges, withdrawals, and renames                               |

Every profile page also embeds its JSON-LD. Person records use `@id` = the permanent URI and `sameAs` links to the
same person in LCNAF (`http://id.loc.gov/authorities/names/…`), VIAF, Wikidata, ORCID, ISNI, and SNAC.

### Using it from a SKOS vocabulary

To reference a person from a SKOS concept (for example, in a Montessori Glossary term note), use their permanent URI:

```turtle
<https://example.org/glossary/normalization>
    skos:note "Described in Montessori's later writing; see the work of …"@en ;
    dct:contributor <https://www.themontessorians.xyz/id/tm0000067> .
```

## Reconciliation API

`/api/reconcile` implements the
[W3C Reconciliation Service API v0.2](https://www.w3.org/community/reports/reconciliation/CG-FINAL-specs-0.2-20230410/),
so a list of names can be matched against the dataset in OpenRefine:

1. In OpenRefine, choose a column → **Reconcile** → **Start reconciling** → **Add standard service**.
2. Enter `https://www.themontessorians.xyz/api/reconcile`.
3. Pick the `Person` or `Organization` type. Optionally pass a `birth_year` column as a property to separate people
   with the same name.

Matches link to the `/id/` URI. A candidate is auto-matched only when it scores 95 or more and no other candidate
scores 90 or more.

## Wikidata

The goal is a Wikidata external-identifier property, "The Montessorians ID", so that Wikidata items link here and
the link flows on to VIAF and library catalogs. The proposal text is in
[`docs/wikidata-property-proposal.md`](./wikidata-property-proposal.md). Until the property exists, records link to
Wikidata through `identifiers.wikidata`.

## Releases and citation

Tagged GitHub releases are archived by Zenodo (configured in [`.zenodo.json`](../.zenodo.json)), which gives every
release of the dataset a DOI. [`CITATION.cff`](../CITATION.cff) tells GitHub how to cite the repository.
