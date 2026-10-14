---
"app": minor
---

Records work better as linked data and are easier to cite.

- **Permanent ids**: `/id/<id>` returns the record's JSON-LD to clients that ask for it, and record pages advertise their JSON-LD in a `Link` header.
- **JSON-LD**: each record now carries typed identifiers, SKOS labels for its authorized and variant names, and a record node with its created and modified dates, licence, sources, and verification level. The dataset itself is described on `/data` and in the bulk download.
- **Citations**: profiles and organizations show a citation with a copy button, and pages carry Dublin Core tags for citation managers.
- **Wikidata proposal**: tighter id format, current counts, and AMI's Wikidata item.
