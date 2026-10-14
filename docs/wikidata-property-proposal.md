# Wikidata property proposal: The Montessorians ID

A draft for [Wikidata:Property proposal/Authority control](https://www.wikidata.org/wiki/Wikidata:Property_proposal/Authority_control). Submit it from a Wikidata account once the site has been live with permanent ids for a little while; reviewers look for stable URLs and a clear scope.

---

**Label**: The Montessorians ID

**Description**: identifier for a person or organization in The Montessorians, an open directory and name authority for Montessori alumni and contributors to the Montessori field

**Data type**: External identifier

**Domain**: human (Q5); organization (Q43229)

**Allowed values**: `tmo?\d{6,7}` (people: `tm` + 7 digits; organizations: `tmo` + 6 digits)

**Example 1**: Maria Montessori (Q131117) → `tm0000067`

**Example 2**: Angeline Stoll Lillard (Q28458519) → `tm0000069`

**Example 3**: Association Montessori Internationale → `tmo000001`

**Source**: https://www.themontessorians.xyz/data

**Formatter URL**: `https://www.themontessorians.xyz/id/$1`

**Formatter URI for RDF resource**: `https://www.themontessorians.xyz/id/$1`

**Expected completeness**: eventually complete (every record in the dataset that has a Wikidata item)

**Number of IDs in source**: about 72 people and 18 organizations at the time of writing, growing

**Robot and gadget jobs**: a Mix'n'match catalog can be created from `https://www.themontessorians.xyz/data/people.csv` (columns `id`, `name`, `tagline`, `wikidata`). Records that already list a Wikidata QID can be added directly.

**Motivation**: The Montessori field has no name authority for its contributors. Library authority files cover people who have published books, but not most trainers, practitioners, and school founders, and SNAC lists only Maria and Mario Montessori. The Montessorians assigns permanent, never-reused identifiers to Montessori alumni and to trainers, practitioner-scholars, researchers, authors, and philosophers with documented contributions, links them to LCNAF, VIAF, ORCID, ISNI, and SNAC, and publishes everything under CC0 with a W3C reconciliation endpoint. It is being used as the agent authority for the Montessori Glossary Community Project, an open SKOS thesaurus of Montessori terms incubated at the Center for Montessori Studies at the University of Hartford.
